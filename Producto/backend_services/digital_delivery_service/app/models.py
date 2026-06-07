from pydantic import BaseModel, Field


class SignedUrlResponse(BaseModel):
    """
    Respuesta estándar para entrega digital.

    El frontend recibe un enlace temporal (signed URL) y descarga el archivo directamente desde Supabase Storage.
    """

    signed_url: str
    expires_in: int = Field(ge=60, le=86400)
    book_id: int
    kind: str
