import json
import logging
import os
import smtplib
import ssl
import sys
import time
from email.message import EmailMessage
from typing import List, Optional

import httpx
from fastapi import FastAPI, Header, HTTPException, status
from prometheus_client import Counter, Histogram, make_asgi_app

from app.database import supabase
from app.models import (
    ChannelResult,
    ContactMessageIn,
    ContactMessageResponse,
    NotificationSendRequest,
    NotificationSendResponse,
)

"""
Notification Service (Email + WhatsApp + Auditoría).

Objetivo:
- Centralizar notificaciones salientes del sistema (confirmación de compra, despacho, contacto).
- Ofrecer un endpoint público para el formulario de contacto del frontend.

Decisiones:
- Se registra en PostgreSQL (tabla notifications / contact_messages) como auditoría y fallback cuando un canal falla.
- Email se integra por SMTP (stdlib) para evitar dependencias externas obligatorias.
- WhatsApp se integra por API HTTP (Twilio) para mantener el servicio liviano y controlable por .env.
"""

app = FastAPI(title="Lectura Viva - Notification Service", version="1.0")


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": int(time.time() * 1000),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JsonFormatter())
root_logger = logging.getLogger()
root_logger.handlers = [handler]
root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("notification_service")


REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["service", "method", "path", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency in seconds", ["service", "method", "path"])
app.mount("/metrics", make_asgi_app())


@app.middleware("http")
async def metrics_middleware(request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
    finally:
        duration = time.time() - start
        status_code = getattr(locals().get("response", None), "status_code", 500)
        REQUEST_COUNT.labels("notification_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("notification_service", request.method, request.url.path).observe(duration)
    return response


INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "")

NOTIFY_SUPPORT_EMAIL = os.getenv("NOTIFY_SUPPORT_EMAIL", "")
SUPPORT_WHATSAPP_TO = os.getenv("SUPPORT_WHATSAPP_TO", "")


def _require_internal(internal_token: str):
    if not INTERNAL_SERVICE_TOKEN or internal_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(status_code=403, detail="No autorizado.")


def _insert_contact_message(data: ContactMessageIn) -> int:
    payload = {
        "nombre": data.nombre,
        "email": str(data.email),
        "telefono": data.telefono,
        "asunto": data.asunto,
        "mensaje": data.mensaje,
        "status": "received",
    }
    inserted = supabase.table("contact_messages").insert(payload).execute()
    if not inserted.data:
        raise HTTPException(status_code=500, detail="No se pudo guardar el mensaje de contacto.")
    return int(inserted.data[0]["id"])


def _log_notification(tipo: str, canal: str, subject: str, body: str, to_email: Optional[str], to_whatsapp: Optional[str], status_value: str, error: Optional[str]) -> int:
    payload = {
        "tipo": tipo,
        "canal": canal,
        "to_email": to_email,
        "to_whatsapp": to_whatsapp,
        "subject": subject,
        "body": body,
        "status": status_value,
        "error": error,
    }
    inserted = supabase.table("notifications").insert(payload).execute()
    if not inserted.data:
        raise HTTPException(status_code=500, detail="No se pudo guardar la notificación.")
    return int(inserted.data[0]["id"])


def _send_email(to_email: str, subject: str, body: str) -> None:
    if not SMTP_HOST or not SMTP_FROM:
        raise RuntimeError("smtp_not_configured")
    if not to_email:
        raise RuntimeError("missing_to_email")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(body)

    if SMTP_USE_TLS:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls(context=context)
            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        return

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)


def _format_whatsapp(value: str) -> str:
    v = value.strip()
    return v if v.startswith("whatsapp:") else f"whatsapp:{v}"


def _send_whatsapp(to_whatsapp: str, body: str) -> None:
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM):
        raise RuntimeError("whatsapp_not_configured")
    if not to_whatsapp:
        raise RuntimeError("missing_to_whatsapp")

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    data = {
        "From": _format_whatsapp(TWILIO_WHATSAPP_FROM),
        "To": _format_whatsapp(to_whatsapp),
        "Body": body,
    }
    resp = httpx.post(url, data=data, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN), timeout=10)
    if resp.status_code >= 300:
        raise RuntimeError(f"twilio_error:{resp.status_code}")


@app.get("/notifications/health")
def health():
    return {"status": "ok"}


@app.post("/notifications/contact", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
def contact(data: ContactMessageIn):
    message_id = _insert_contact_message(data)

    subject = f"[Contacto] {data.asunto}"
    base_body = f"Nombre: {data.nombre}\nEmail: {data.email}\nTeléfono: {data.telefono or ''}\n\nMensaje:\n{data.mensaje}"

    results: List[ChannelResult] = []

    notif_id = _log_notification(
        tipo="contact",
        canal="db",
        subject=subject,
        body=base_body,
        to_email=NOTIFY_SUPPORT_EMAIL or None,
        to_whatsapp=SUPPORT_WHATSAPP_TO or None,
        status_value="logged",
        error=None,
    )
    results.append(ChannelResult(canal="db", status="ok", detalle=f"notification_id={notif_id}"))

    try:
        if NOTIFY_SUPPORT_EMAIL:
            _send_email(NOTIFY_SUPPORT_EMAIL, subject, base_body)
            notif_id = _log_notification("contact", "email", subject, base_body, NOTIFY_SUPPORT_EMAIL, None, "sent", None)
            results.append(ChannelResult(canal="email", status="sent", detalle=f"notification_id={notif_id}"))
        else:
            results.append(ChannelResult(canal="email", status="skipped", detalle="NOTIFY_SUPPORT_EMAIL no configurado"))
    except Exception as e:
        notif_id = _log_notification("contact", "email", subject, base_body, NOTIFY_SUPPORT_EMAIL or None, None, "failed", str(e))
        results.append(ChannelResult(canal="email", status="failed", detalle=f"notification_id={notif_id}"))

    try:
        if SUPPORT_WHATSAPP_TO:
            _send_whatsapp(SUPPORT_WHATSAPP_TO, f"{subject}\n\n{base_body}")
            notif_id = _log_notification("contact", "whatsapp", subject, base_body, None, SUPPORT_WHATSAPP_TO, "sent", None)
            results.append(ChannelResult(canal="whatsapp", status="sent", detalle=f"notification_id={notif_id}"))
        else:
            results.append(ChannelResult(canal="whatsapp", status="skipped", detalle="SUPPORT_WHATSAPP_TO no configurado"))
    except Exception as e:
        notif_id = _log_notification("contact", "whatsapp", subject, base_body, None, SUPPORT_WHATSAPP_TO or None, "failed", str(e))
        results.append(ChannelResult(canal="whatsapp", status="failed", detalle=f"notification_id={notif_id}"))

    supabase.table("contact_messages").update({"status": "processed"}).eq("id", message_id).execute()

    return {"status": "ok", "message_id": message_id, "canales": results}


@app.post("/notifications/send", response_model=NotificationSendResponse)
def send_notification(
    data: NotificationSendRequest,
    internal_token: str = Header(default="", alias="X-Internal-Token"),
):
    _require_internal(internal_token)

    results: List[ChannelResult] = []
    notification_id = _log_notification(data.tipo, "db", data.subject, data.body, str(data.to_email) if data.to_email else None, data.to_whatsapp, "logged", None)
    results.append(ChannelResult(canal="db", status="ok", detalle=f"notification_id={notification_id}"))

    try:
        if data.to_email:
            _send_email(str(data.to_email), data.subject, data.body)
            notif_id = _log_notification(data.tipo, "email", data.subject, data.body, str(data.to_email), None, "sent", None)
            results.append(ChannelResult(canal="email", status="sent", detalle=f"notification_id={notif_id}"))
        else:
            results.append(ChannelResult(canal="email", status="skipped", detalle="to_email no provisto"))
    except Exception as e:
        notif_id = _log_notification(data.tipo, "email", data.subject, data.body, str(data.to_email) if data.to_email else None, None, "failed", str(e))
        results.append(ChannelResult(canal="email", status="failed", detalle=f"notification_id={notif_id}"))

    try:
        if data.to_whatsapp:
            _send_whatsapp(data.to_whatsapp, f"{data.subject}\n\n{data.body}")
            notif_id = _log_notification(data.tipo, "whatsapp", data.subject, data.body, None, data.to_whatsapp, "sent", None)
            results.append(ChannelResult(canal="whatsapp", status="sent", detalle=f"notification_id={notif_id}"))
        else:
            results.append(ChannelResult(canal="whatsapp", status="skipped", detalle="to_whatsapp no provisto"))
    except Exception as e:
        notif_id = _log_notification(data.tipo, "whatsapp", data.subject, data.body, None, data.to_whatsapp, "failed", str(e))
        results.append(ChannelResult(canal="whatsapp", status="failed", detalle=f"notification_id={notif_id}"))

    return {"status": "ok", "notification_id": notification_id, "canales": results}


@app.get("/notifications/contact-messages")
def list_contact_messages(internal_token: str = Header(default="", alias="X-Internal-Token")):
    _require_internal(internal_token)
    response = supabase.table("contact_messages").select("*").order("id", desc=True).limit(100).execute()
    return response.data or []

