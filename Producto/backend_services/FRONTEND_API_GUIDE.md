# Frontend API Guide

## Base URL

- HTTP: `http://localhost:8080`
- WebSocket IA: `ws://localhost:8080`

## Headers

- Endpoints autenticados:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

- Endpoints internos:

```http
X-Internal-Token: <INTERNAL_SERVICE_TOKEN>
```

## Auth

### `POST /auth/register`

```json
{
  "email": "victor@mail.com",
  "password": "12345678",
  "nombre_completo": "Victor Perez"
}
```

Respuesta:

```json
{
  "id": "uuid-del-usuario",
  "email": "victor@mail.com",
  "nombre_completo": "Victor Perez",
  "telefono": null,
  "role": "socio",
  "created_at": "2026-06-04T12:00:00+00:00"
}
```

### `POST /auth/login`

```json
{
  "email": "victor@mail.com",
  "password": "12345678"
}
```

Respuesta:

```json
{
  "access_token": "jwt_token",
  "token_type": "bearer",
  "user": {
    "id": "uuid-del-usuario",
    "email": "victor@mail.com",
    "nombre_completo": "Victor Perez",
    "telefono": null,
    "role": "socio"
  }
}
```

### `GET /auth/profile`

- Requiere JWT.

### `PATCH /auth/profile`

```json
{
  "nombre_completo": "Victor P.",
  "telefono": "+56912345678"
}
```

## Catalogo

### `GET /catalog/books`

Respuesta:

```json
[
  {
    "id": 1,
    "isbn": "978000000001",
    "titulo": "Cien anos de soledad",
    "autor": "Gabriel Garcia Marquez",
    "editorial": "Sudamericana",
    "anio_publicacion": 1967,
    "idioma": "es",
    "num_paginas": 432,
    "categoria_id": 2,
    "categoria": "Novela",
    "sinopsis": "Una novela latinoamericana...",
    "precio_fisico": 19990,
    "precio_digital": 9990,
    "imagenes": ["books/1-cover.jpg"],
    "calificacion_promedio": 4.5,
    "stock_fisico": 8,
    "disponible_prestamo": true,
    "url_digital_preview": "books/1-preview.pdf",
    "url_libro_completo": "books/1-full.pdf"
  }
]
```

### `GET /catalog/books/{book_id}`

- Publico.

### `POST /catalog/books`

- Solo admin.

```json
{
  "isbn": "978000000001",
  "titulo": "Nuevo Libro",
  "autor": "Autor Demo",
  "editorial": "Editorial Demo",
  "anio_publicacion": 2024,
  "idioma": "es",
  "num_paginas": 250,
  "categoria_id": 1,
  "sinopsis": "Descripcion del libro",
  "precio_fisico": 15990,
  "precio_digital": 7990,
  "imagenes": ["books/demo-cover.jpg"],
  "stock_fisico": 10,
  "peso_gramos": 300,
  "dimensiones": "23x15x2 cm",
  "ubicacion_bodega": "A-01",
  "disponible_prestamo": true,
  "url_digital_preview": "books/demo-preview.pdf",
  "url_libro_completo": "books/demo-full.pdf",
  "es_audiolibro": false,
  "duracion_minutos": null
}
```

### `PATCH /catalog/books/{book_id}`

- Solo admin.

### `DELETE /catalog/books/{book_id}`

- Solo admin.

### `POST /catalog/books/{book_id}/action`

- `compra_fisica`
- `compra_digital`
- `prestamo`
- `reabastecimiento` (admin o interno)

```json
{
  "usuario_id": "uuid-del-usuario",
  "tipo_operacion": "compra_fisica",
  "cantidad": 1
}
```

## Categorias

### `GET /catalog/categories`

- Publico.

### `GET /catalog/categories/{category_id}`

- Publico.

### `POST /catalog/categories`

- Solo admin.

### `PATCH /catalog/categories/{category_id}`

- Solo admin.

### `DELETE /catalog/categories/{category_id}`

- Solo admin.

## Search

### `GET /search/books?q=soledad&limit=10&offset=0`

- Publico.

### `GET /search/suggest?q=garc&limit=10`

- Publico.

## Cart

### `GET /cart/{usuario_id}/items`

- Requiere JWT.

### `POST /cart/{usuario_id}/items`

```json
{
  "libro_id": 1,
  "cantidad": 2,
  "precio_unitario": 15990,
  "tipo_item": "fisico"
}
```

### `PUT /cart/{usuario_id}/items/{item_id}`

```json
{
  "cantidad": 3
}
```

### `DELETE /cart/{usuario_id}/items/{item_id}`

### `DELETE /cart/{usuario_id}/clear`

### `POST /cart/{usuario_id}/checkout`

```json
{
  "metodo_entrega": "despacho_domicilio"
}
```

## Orders

### `POST /orders/checkout`

```json
{
  "usuario_id": "uuid-del-usuario",
  "metodo_entrega": "digital",
  "items": [
    {
      "libro_id": "1",
      "cantidad": 1,
      "precio_unitario": 7990,
      "tipo_item": "digital"
    }
  ]
}
```

Respuesta:

```json
{
  "status": "success",
  "message": "Orden de e-commerce procesada y stock sincronizado.",
  "orden_id": 25,
  "total_pagado": 7990
}
```

### `GET /orders/{orden_id}`

- Requiere JWT.

### `GET /orders/user/{usuario_id}`

- Requiere JWT.

### `GET /orders`

- Solo admin.

### `PATCH /orders/{orden_id}/status`

- Solo admin.

### `PATCH /orders/{orden_id}/cancel`

- Dueño o admin.

### `POST /orders/{orden_id}/refund`

- Solo admin.

### `DELETE /orders/{orden_id}`

- Solo admin.

## Payments

### `POST /payments/intents`

```json
{
  "usuario_id": "uuid-del-usuario",
  "orden_id": 25,
  "monto": 7990,
  "metodo_pago": "tarjeta"
}
```

### `GET /payments/intents`

- Con `usuario_id` para dueño o admin.
- Sin `usuario_id`, solo admin.

### `GET /payments/intents/{pago_id}`

- Dueño o admin.

### `POST /payments/intents/{pago_id}/confirm`

- Requiere JWT.

### `POST /payments/intents/{pago_id}/refund`

- Solo admin.

### `DELETE /payments/intents/{pago_id}`

- Solo admin.

## Shipping

### `GET /shipping/libraries-locations`

- Publico.

### `POST /shipping/tracking`

- Solo admin.

```json
{
  "orden_id": 25,
  "direccion_destino": "Av. Siempre Viva 123, Santiago",
  "sucursal_retiro_id": null
}
```

### `GET /shipping/tracking/{codigo}`

- Publico.

### `PATCH /shipping/tracking/{codigo}`

- Solo admin.

### `GET /shipping/trackings`

- Solo admin.

### `DELETE /shipping/tracking/{codigo}`

- Solo admin.

## Inventory

### `POST /inventory/restock`

- Solo admin.

### `POST /inventory/bulk-upload`

- Solo admin.

### `GET /inventory/logs`

- Solo admin.

## IA

### `GET /ia/health`

### `WS /ia/chat/{usuario_id}?sesion_id=sesion-1&token=<JWT>`

- Requiere JWT.
- Mensaje enviado:

```json
"recomiendame novelas latinoamericanas"
```

- Respuesta esperada:

```json
"Te recomiendo Cien anos de soledad, La casa de los espiritus y Rayuela..."
```

## Notifications

### `GET /notifications/health`

### `POST /notifications/contact`

- Publico.

```json
{
  "nombre": "Victor",
  "email": "victor@mail.com",
  "telefono": "+56912345678",
  "asunto": "Consulta de pedido",
  "mensaje": "Necesito ayuda con mi compra."
}
```

Respuesta:

```json
{
  "status": "ok",
  "message_id": 1,
  "canales": [
    {
      "canal": "db",
      "status": "ok",
      "detalle": "notification_id=10"
    },
    {
      "canal": "email",
      "status": "sent",
      "detalle": "notification_id=11"
    },
    {
      "canal": "whatsapp",
      "status": "sent",
      "detalle": "notification_id=12"
    }
  ]
}
```

### `POST /notifications/send`

- Interno.

### `GET /notifications/contact-messages`

- Interno.

## Digital Delivery

### `GET /delivery/health`

### `GET /delivery/books/{book_id}/signed-url?kind=full&expires_in=600`

- Requiere JWT.

Respuesta:

```json
{
  "signed_url": "https://...supabase.co/storage/v1/object/sign/digital-books/books/1-full.pdf?...",
  "expires_in": 600,
  "book_id": 1,
  "kind": "full"
}
```

## Reviews

### `GET /reviews/health`

### `GET /reviews/books/{book_id}`

- Publico, solo reseñas aprobadas.

### `POST /reviews/books/{book_id}`

- Requiere JWT.

```json
{
  "rating": 5,
  "comentario": "Excelente libro, muy recomendado."
}
```

### `PATCH /reviews/{review_id}`

- Dueño o admin.

### `DELETE /reviews/{review_id}`

- Dueño o admin.

### `GET /reviews/moderation/pending`

- Solo admin.

### `PATCH /reviews/{review_id}/moderate`

- Solo admin.

```json
{
  "estado": "approved",
  "motivo": "Cumple normas de comunidad"
}
```

## Flujos Recomendados

### Login / Registro

1. `POST /auth/register`
2. `POST /auth/login`
3. Guardar `access_token`

### Home / Catalogo

1. `GET /catalog/books`
2. `GET /search/suggest?q=...`

### Detalle de Libro

1. `GET /catalog/books/{book_id}`
2. `GET /reviews/books/{book_id}`

### Carrito

1. `POST /cart/{usuario_id}/items`
2. `GET /cart/{usuario_id}/items`

### Checkout

1. `POST /cart/{usuario_id}/checkout`
2. `POST /payments/intents`
3. `POST /payments/intents/{pago_id}/confirm`

### Libro Digital

1. `GET /delivery/books/{book_id}/signed-url?kind=full`
2. Abrir `signed_url` en nueva pestaña o descargar

### Contacto

1. `POST /notifications/contact`

### IA

1. Abrir `WS /ia/chat/{usuario_id}?sesion_id=...&token=<JWT>`
2. Enviar mensajes de texto

## Checklist Antes de Conectar Frontend

- Ejecutar:
  - `db_scripts/001_tables.sql`
  - `db_scripts/002_rls_policies.sql`
  - `db_scripts/003_search.sql`
  - `db_scripts/005_reviews.sql`
- Configurar bucket de Supabase Storage: `digital-books`
- Guardar paths válidos en:
  - `books.url_digital_preview`
  - `books.url_libro_completo`
- Configurar variables reales en `.env`
- Levantar el clúster con `docker-compose up --build`
