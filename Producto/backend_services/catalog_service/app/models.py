from pydantic import BaseModel
from typing import Optional, List

# --- DTO BASE PARA LOS LIBROS (Casos de Uso 7 y 11: Publicar y Modificar) ---
# Al heredar de 'BaseModel', Pydantic se encarga de interceptar los JSON de las peticiones HTTP
# y validar que los tipos de datos coincidan (por ejemplo, que los precios sean números decimales).
class LibroBase(BaseModel):
    isbn: str
    titulo: str
    autor: str
    editorial: str
    anio_publicacion: int
    idioma: str
    num_paginas: int
    categoria_id: int
    sinopsis: str
    precio_fisico: float
    precio_digital: float
    imagenes: List[str] = []
    calificacion_promedio: float = 0
    stock_fisico: int
    peso_gramos: float
    dimensiones: str
    ubicacion_bodega: str
    disponible_prestamo: bool = True
    url_digital_preview: Optional[str] = None
    url_libro_completo: Optional[str] = None
    es_audiolibro: bool = False
    duracion_minutos: Optional[int] = None

# --- DTO DE RESPUESTA DE LA API (Response DTO) ---
# Al heredar de 'LibroBase', esta clase hereda automáticamente todos los atributos de arriba
# pero le añadimos el campo 'id' en formato String para representar la llave primaria única
# que genera PostgreSQL/Supabase de forma automática.
class LibroResponse(LibroBase):
    id: int

# --- DTO PARA OPERACIONES DE NEGOCIO (Caso de Uso 5: Compras y Préstamos) ---
# Mapea los datos del cliente cuando un socio intenta pedir prestado o comprar un libro físico/digital.
class OperacionLibro(BaseModel):
    usuario_id: str       # UUID del usuario que viene desde el auth_service
    tipo_operacion: str   # Regla de negocio. Puede tomar los valores: "compra_digital", "compra_fisica" o "prestamo"
    cantidad: int = 1


class CategoriaBase(BaseModel):
    nombre: str
    parent_id: Optional[int] = None


class CategoriaResponse(CategoriaBase):
    id: int


class LibroUpdate(BaseModel):
    isbn: Optional[str] = None
    titulo: Optional[str] = None
    autor: Optional[str] = None
    editorial: Optional[str] = None
    anio_publicacion: Optional[int] = None
    idioma: Optional[str] = None
    num_paginas: Optional[int] = None
    categoria_id: Optional[int] = None
    sinopsis: Optional[str] = None
    precio_fisico: Optional[float] = None
    precio_digital: Optional[float] = None
    imagenes: Optional[List[str]] = None
    calificacion_promedio: Optional[float] = None
    stock_fisico: Optional[int] = None
    peso_gramos: Optional[float] = None
    dimensiones: Optional[str] = None
    ubicacion_bodega: Optional[str] = None
    disponible_prestamo: Optional[bool] = None
    url_digital_preview: Optional[str] = None
    url_libro_completo: Optional[str] = None
    es_audiolibro: Optional[bool] = None
    duracion_minutos: Optional[int] = None


class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    parent_id: Optional[int] = None
