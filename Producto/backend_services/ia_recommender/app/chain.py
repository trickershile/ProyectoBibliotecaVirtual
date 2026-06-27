import os
import asyncio
import time
from pathlib import Path
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from groq import AsyncGroq  # ← corregido: AsyncGroq, no Groq
import httpx

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://127.0.0.1:8001")

circuit_breaker = {"failures": 0, "open_until": 0}

def _circuit_allow() -> bool:
    return time.time() >= circuit_breaker["open_until"]

def _circuit_on_success():
    circuit_breaker["failures"] = 0
    circuit_breaker["open_until"] = 0

def _circuit_on_failure(threshold: int = 3, cooldown: int = 30):
    circuit_breaker["failures"] += 1
    if circuit_breaker["failures"] >= threshold:
        circuit_breaker["open_until"] = time.time() + cooldown

async def _retry_async(fn, attempts: int = 3, base_delay: float = 0.5):
    last_exc = None
    for i in range(attempts):
        try:
            return await fn()
        except Exception as e:
            last_exc = e
            await asyncio.sleep(min(base_delay * (2 ** i), 5))
    raise last_exc

async def obtener_contexto_libros() -> str:
    try:
        async def _fetch():
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
                response = await client.get(f"{CATALOG_SERVICE_URL}/catalog/books")
                if response.status_code != 200:
                    raise RuntimeError("catalog_unavailable")
                return response.json()

        libros = await _retry_async(_fetch, attempts=3, base_delay=0.5)
        if isinstance(libros, list):
            libros = libros[:10]
        else:
            libros = []

        if not libros:
            return "No hay libros registrados en el catálogo de la biblioteca actualmente."

        contexto = ""
        for l in libros:
            categoria = l.get("categoria") or str(l.get("categoria_id") or "")
            contexto += f"- Título: {l.get('titulo')}, Autor: {l.get('autor')}, Categoría: {categoria}, Sinopsis: {l.get('sinopsis')}\n"
        return contexto
    except Exception:
        return "Error temporal al conectar con el catálogo de libros."

async def consultar_asesor_literario(historial_contexto: str, mensaje_usuario: str) -> str:
    catalogo_real = await obtener_contexto_libros()

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """Eres el Asesor Literario oficial de la biblioteca virtual 'Lectura Viva'.
        Tu objetivo es guiar a los socios y recomendarles libros basándote estrictamente en nuestro catálogo real.
        
        CATÁLOGO REAL DE LA BIBLIOTECA:
        {catalogo}
        
        HISTORIAL DE LA CONVERSACIÓN:
        {historial}
        
        REGLAS DE ORO:
        1. Usa el CATÁLOGO REAL para hacer recomendaciones al usuario.
        2. Si te piden un libro o temática que no está en el catálogo, explícales amablemente que no contamos con ese título por el momento.
        3. Sé sumamente educado, entusiasta y fomenta el hábito de la lectura."""),
        ("human", "{pregunta}")
    ])

    prompt_formateado = prompt_template.format_messages(
        catalogo=catalogo_real,
        historial=historial_contexto,
        pregunta=mensaje_usuario
    )

    system_prompt = prompt_formateado[0].content
    user_prompt = prompt_formateado[1].content

    # ↓ indentación corregida: todo el cuerpo dentro de la función
    async def _call_groq():
        if not _circuit_allow():
            raise RuntimeError("groq_circuit_open")
        try:
            completion = await groq_client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1024
            )
            _circuit_on_success()
            return completion
        except Exception:
            _circuit_on_failure()
            raise

    completion = await _retry_async(_call_groq, attempts=3, base_delay=0.5)
    return completion.choices[0].message.content