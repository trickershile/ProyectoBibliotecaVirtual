import json
import logging
import os
import sys
import time

from fastapi import FastAPI, HTTPException, status, Header  # Núcleo del framework web para rutas y excepciones
from app.database import supabase, cache_client  # Importamos los conectores que configuramos en database.py
from app.models import LibroBase, LibroResponse, OperacionLibro, CategoriaBase, CategoriaResponse, LibroUpdate, CategoriaUpdate
import httpx
from prometheus_client import Counter, Histogram, make_asgi_app

"""
Catalog Service (Producto + Categorías).

Decisiones arquitectónicas:
- Persistencia en PostgreSQL vía Supabase (mismo stack que el resto del backend) para unificar RLS/policies y auditoría.
- Caché Redis (Cache-Aside): acelera el listado de catálogo y reduce costo/latencia de consultas repetitivas.
- Autorización por rol:
  - Lecturas del catálogo pueden ser públicas.
  - Escrituras (CRUD) y reabastecimiento exigen rol admin.

Reglas de negocio destacadas:
- compra_fisica: decrementa stock_fisico y evita stock negativo.
- reabastecimiento: incrementa stock_fisico (solo admin) y deja trazabilidad en logs_inventario desde otro servicio.
- prestamo: solo permitido si disponible_prestamo=True.
"""

app = FastAPI(title="Lectura Viva - Catalog Service", version="1.0")

class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": int(time.time() * 1000),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage()
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JsonFormatter())
root_logger = logging.getLogger()
root_logger.handlers = [handler]
root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("catalog_service")

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["service", "method", "path", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency in seconds", ["service", "method", "path"])
app.mount("/metrics", make_asgi_app())

@app.middleware("http")
async def metrics_middleware(request, call_next):
    """
    Middleware de métricas (Prometheus).

    Permite auditar:
    - tiempos de respuesta del catálogo
    - picos de tráfico en lecturas/escrituras
    - errores por RLS/autorización
    """
    start = time.time()
    try:
        response = await call_next(request)
    finally:
        duration = time.time() - start
        status_code = getattr(locals().get("response", None), "status_code", 500)
        REQUEST_COUNT.labels("catalog_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("catalog_service", request.method, request.url.path).observe(duration)
    return response

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8000")
http_client = httpx.Client(timeout=5)

def _verify_token(authorization: str):
    """
    Verifica JWT consultando auth_service.

    Nota arquitectónica:
    - Se hace por HTTP para mantener los servicios desacoplados del SDK de Supabase Auth
      (un solo lugar implementa la lógica de verify).
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Falta el token de autorización.")
    try:
        response = http_client.get(f"{AUTH_SERVICE_URL}/auth/verify", headers={"Authorization": authorization})
    except Exception:
        raise HTTPException(status_code=503, detail="Auth service no disponible.")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
    return response.json()


def _verify_admin(authorization: str):
    """
    Regla de negocio: solo un usuario con role=admin puede ejecutar operaciones administrativas del catálogo.
    """
    data = _verify_token(authorization)
    if data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    return data


def _book_id_to_int(book_id: str) -> int:
    try:
        return int(book_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de libro inválido.")


def _cargar_categorias_map():
    """
    Carga un mapa {categoria_id -> nombre}.

    Motivo:
    - Evita joins complejos en el código y simplifica el payload de salida agregando "categoria" textual.
    """
    response = supabase.table("categories").select("id,nombre").execute()
    categorias = response.data or []
    return {c["id"]: c["nombre"] for c in categorias if "id" in c and "nombre" in c}


# --- CASO DE USO 7: PUBLICAR LIBRO (SOLO ADMINISTRADOR) ---
# Equivale a un @PostMapping en Spring Boot. Registra un nuevo documento JSON en la base NoSQL[cite: 36].
@app.post("/catalog/books", response_model=LibroResponse, status_code=status.HTTP_201_CREATED)
def create_book(book: LibroBase, authorization: str = Header(default="")):
    """
    Caso de uso (Admin): publicar/crear un libro (Producto).

    Recibe:
    - LibroBase con metadatos editoriales, e-commerce y logística.

    Devuelve:
    - Registro creado (incluye id).
    """
    _verify_admin(authorization)
    try:
        book_dict = book.model_dump()
        response = supabase.table("books").insert(book_dict).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="No se pudo crear el libro.")

        cache_client.delete("all_books")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- CASO DE USO 10: BUSCAR Y VISUALIZAR LIBROS (CON FAST LOOKUP EN REDIS) ---
# Equivale a un @GetMapping en Spring Boot. Implementa el patrón Cache-Aside que dibujaste en tu PDF[cite: 31, 37].
@app.get("/catalog/books")
def get_all_books():
    """
    Caso de uso: listar catálogo.

    Implementa Cache-Aside:
    - Si Redis tiene all_books => responde inmediato.
    - Si no => consulta PostgreSQL y repuebla Redis.

    Devuelve:
    - lista de libros (enriquecida con nombre de categoría cuando es posible).
    """
    # 1. PASO DE ACCESO RÁPIDO: Consultamos primero a la base de datos en memoria Redis (FastLookup) [cite: 31, 37]
    cached_books = cache_client.get("all_books")
    
    if cached_books:
        # Si el catálogo está en la caché de Redis (Cache Hit), transformamos el texto JSON a lista nativa y lo devolvemos inmediatamente.
        # ¡Ahorramos tiempo y dinero evitando hacer una petición de red completa hacia PostgreSQL/Supabase!
        return json.loads(cached_books)
    
    response = supabase.table("books").select("*").execute()
    books_list = response.data or []

    try:
        categorias_map = _cargar_categorias_map()
        for b in books_list:
            if "categoria_id" in b:
                b["categoria"] = categorias_map.get(b["categoria_id"])
    except Exception:
        pass
    
    # 3. REPOBLACIÓN DE CACHÉ: Guardamos la lista completa en Redis serializándola a texto plano mediante json.dumps().
    # Le asignamos un tiempo de expiración (TTL) de 3600 segundos (1 hora) para que se autolimpie sola[cite: 37].
    cache_client.setex("all_books", 3600, json.dumps(books_list))
    
    return books_list


@app.get("/catalog/books/{book_id}")
def get_book(book_id: str):
    """
    Obtiene un libro por id (lectura pública).

    Devuelve:
    - libro con campo "categoria" (texto) cuando existe categories.
    """
    book_id_int = _book_id_to_int(book_id)
    try:
        book_response = supabase.table("books").select("*").eq("id", book_id_int).single().execute()
        book = book_response.data
        if not book:
            raise HTTPException(status_code=404, detail="El libro solicitado no existe en la biblioteca virtual.")

        try:
            categorias_map = _cargar_categorias_map()
            book["categoria"] = categorias_map.get(book.get("categoria_id"))
        except Exception:
            pass

        return book
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="El libro solicitado no existe en la biblioteca virtual.")


# --- CASO DE USO 5 & COMPRAS: PEDIR LIBROS / COMPRAR FÍSICOS Y DIGITALES ---
@app.post("/catalog/books/{book_id}/action")
def process_book_action(
    book_id: str,
    operacion: OperacionLibro,
    authorization: str = Header(default=""),
    internal_token: str = Header(default="", alias="X-Internal-Token")
):
    """
    Aplica una operación de negocio sobre un libro.

    Operaciones soportadas:
    - compra_fisica: resta stock_fisico por cantidad (no permite stock negativo).
    - prestamo / compra_digital: valida reglas de préstamo y concede acceso digital.
    - reabastecimiento: suma stock_fisico por cantidad (solo admin).

    Seguridad:
    - Si no es admin, el usuario del token debe coincidir con operacion.usuario_id.
    """
    verification = _verify_token(authorization)
    is_admin = verification.get("role") == "admin"
    if not is_admin and verification.get("id") != operacion.usuario_id:
        raise HTTPException(status_code=403, detail="No autorizado.")

    if operacion.tipo_operacion == "reabastecimiento" and not is_admin:
        expected = os.getenv("INTERNAL_SERVICE_TOKEN", "")
        if not expected or internal_token != expected:
            raise HTTPException(status_code=403, detail="No autorizado.")

    book_id_int = _book_id_to_int(book_id)
    book_response = supabase.table("books").select("*").eq("id", book_id_int).single().execute()
    book = book_response.data
    
    if not book:
        raise HTTPException(status_code=404, detail="El libro solicitado no existe en la biblioteca virtual.")
        
    # --- Regla de Negocio: Compra de Libro Físico ---
    if operacion.tipo_operacion == "compra_fisica":
        if operacion.cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0.")

        if book["stock_fisico"] < operacion.cantidad:
            raise HTTPException(status_code=400, detail="No queda inventario físico disponible para despacho de este libro.")
        
        nuevo_stock = book["stock_fisico"] - operacion.cantidad
        supabase.table("books").update({"stock_fisico": nuevo_stock}).eq("id", book_id_int).execute()
        cache_client.delete("all_books")
        return {"status": "success", "message": f"Compra física procesada con éxito. Despacho autorizado al ID: {operacion.usuario_id}."}
        
    # --- Regla de Negocio: Préstamo o Compra Digital ---
    elif operacion.tipo_operacion == "prestamo" or operacion.tipo_operacion == "compra_digital":
        if operacion.tipo_operacion == "prestamo" and not book["disponible_prestamo"]:
            raise HTTPException(status_code=400, detail="Este ejemplar digital no se encuentra habilitado para préstamos gratuitos.")
            
        return {"status": "success", "message": f"Acceso digital concedido de manera inmediata al usuario {operacion.usuario_id}."}

    elif operacion.tipo_operacion == "reabastecimiento":
        if operacion.cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0.")

        nuevo_stock = book["stock_fisico"] + operacion.cantidad
        supabase.table("books").update({"stock_fisico": nuevo_stock}).eq("id", book_id_int).execute()
        cache_client.delete("all_books")
        return {"status": "success", "message": f"Stock actualizado (+{operacion.cantidad}) para el libro {book_id}."}

    raise HTTPException(status_code=400, detail="Tipo de operación no soportado por el sistema.")


@app.patch("/catalog/books/{book_id}", response_model=LibroResponse)
def update_book(book_id: str, data: LibroUpdate, authorization: str = Header(default="")):
    """
    CRUD (Admin): actualizar parcialmente un libro.

    Recibe:
    - LibroUpdate con campos opcionales (PATCH semántico).
    """
    _verify_admin(authorization)
    book_id_int = _book_id_to_int(book_id)
    payload = data.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar.")
    try:
        response = supabase.table("books").update(payload).eq("id", book_id_int).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Libro no encontrado.")
        cache_client.delete("all_books")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/catalog/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: str, authorization: str = Header(default="")):
    """
    CRUD (Admin): eliminar un libro.

    Nota:
    - En producción suele preferirse borrado lógico, pero aquí se deja delete físico para simplicidad.
    """
    _verify_admin(authorization)
    book_id_int = _book_id_to_int(book_id)
    try:
        existing = supabase.table("books").select("id").eq("id", book_id_int).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Libro no encontrado.")
        supabase.table("books").delete().eq("id", book_id_int).execute()
        cache_client.delete("all_books")
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/catalog/categories", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoriaBase, authorization: str = Header(default="")):
    """
    CRUD (Admin): crear categoría.

    Soporta jerarquía simple mediante parent_id.
    """
    _verify_admin(authorization)
    try:
        payload = category.model_dump()
        response = supabase.table("categories").insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="No se pudo crear la categoría.")
        cache_client.delete("all_books")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/catalog/categories")
def get_all_categories():
    """
    Lista categorías (lectura pública).
    """
    response = supabase.table("categories").select("*").execute()
    return response.data or []


@app.get("/catalog/categories/{category_id}")
def get_category(category_id: str):
    """
    Obtiene una categoría por id.
    """
    try:
        category_id_int = int(category_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de categoría inválido.")

    try:
        response = supabase.table("categories").select("*").eq("id", category_id_int).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Categoría no encontrada.")
        return response.data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")


@app.patch("/catalog/categories/{category_id}", response_model=CategoriaResponse)
def update_category(category_id: str, data: CategoriaUpdate, authorization: str = Header(default="")):
    """
    CRUD (Admin): actualizar parcialmente una categoría.
    """
    _verify_admin(authorization)
    try:
        category_id_int = int(category_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de categoría inválido.")

    payload = data.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar.")

    try:
        response = supabase.table("categories").update(payload).eq("id", category_id_int).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Categoría no encontrada.")
        cache_client.delete("all_books")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/catalog/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: str, authorization: str = Header(default="")):
    """
    CRUD (Admin): eliminar categoría.

    Nota:
    - Si existen libros que referencian categoria_id, PostgreSQL impedirá el borrado (FK).
      Eso es deseable para consistencia del catálogo.
    """
    _verify_admin(authorization)
    try:
        category_id_int = int(category_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de categoría inválido.")

    try:
        existing = supabase.table("categories").select("id").eq("id", category_id_int).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Categoría no encontrada.")
        supabase.table("categories").delete().eq("id", category_id_int).execute()
        cache_client.delete("all_books")
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- CONDICIONAL DE ARRANQUE EXCLUSIVO PARA WINDOWS ---
if __name__ == "__main__":
    import uvicorn
    # Levantamos este microservicio en el PUERTO 8001. El Auth service corre en el 8000. 
    # Esto simula de manera perfecta el aislamiento de puertos que ocurriría dentro de Docker[cite: 13, 14].
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
