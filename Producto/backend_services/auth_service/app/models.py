from pydantic import BaseModel, EmailStr  # Herramientas de Pydantic para validar estructuras y correos
from typing import Optional  # Equivalente al 'Optional<T>' de Java para manejar valores que pueden ser nulos

# --- MODELO DE REGISTRO (Mapea el Caso de Uso 2: Registrarse) ---
# En Spring Boot esto sería tu 'UserRegisterDTO'. Al heredar de 'BaseModel',
# FastAPI intercepta el JSON entrante y verifica que cumpla con estas tres propiedades obligatorias.
class UserRegister(BaseModel):
    email: EmailStr          # Valida de forma nativa que el texto sea un correo real (ej: usuario@correo.com). Equivale a @Email en Java.
    password: str            # Tipo cadena de texto (String). Al no tener 'Optional', es obligatorio.
    nombre_completo: str     # Tipo cadena de texto. Obligatorio para registrar el perfil del socio.
    direccion: Optional[str] = None

# --- MODELO DE LOGIN (Mapea el Caso de Uso 1: Iniciar sesión) ---
# Este DTO recibe únicamente las credenciales necesarias para autenticar al usuario contra Supabase.
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# --- MODELO DE EDICIÓN (Mapea el Caso de Uso 3: Modificar datos de cuenta) ---
# En Spring, a veces usas una clase separada o validas campos manuales para actualizaciones parciales.
class UserUpdate(BaseModel):
    # 'Optional[str] = None' significa que el campo NO es obligatorio en el JSON.
    # Si el cliente no lo envía, Python le asigna por defecto el valor 'None' (que es el 'null' de Java).
    nombre_completo: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
# --- MODELO DE RESPUESTA SEGURA (Response DTO) ---
# Esta es una de las mejores prácticas que tu profesor buscará. Por seguridad, JAMÁS debes devolver
# la contraseña en las respuestas HTTP de tu API.
# Esta clase define la estructura exacta del JSON que el microservicio le enviará de vuelta al Frontend.
class UserResponse(BaseModel):
    id: str                  # El UUID generado automáticamente por el sistema de autenticación
    email: EmailStr
    nombre_completo: str
    role: str                # Almacena si el usuario es 'socio' o 'admin' según la regla de negocio
    created_at: str  
    direccion: Optional[str] = None
            # Fecha de creación formateada como texto
