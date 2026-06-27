from pydantic import BaseModel


class PaymentIntentCreate(BaseModel):
    usuario_id: str
    orden_id: str
    monto: float
    metodo_pago: str


class PaymentIntentResponse(BaseModel):
    id: str
    usuario_id: str
    orden_id: str
    monto: float
    metodo_pago: str
    estado: str
