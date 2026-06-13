# Backend Endpoints

## Base URL

Usar el API Gateway:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Modulos preparados en frontend

- `src/api/endpoints.js`: registro central de rutas.
- `src/api/apiClient.js`: cliente HTTP con soporte para `GET`, `POST`, `PUT`, `PATCH`, `DELETE` y respuestas `204`.
- `src/api/books.js`: adaptador entre el frontend (`title`, `author`, `price`) y el backend (`titulo`, `autor`, `precio_fisico`).
- `src/api/orders.js`: adaptador de checkout y lectura de ordenes.
- `src/api/cart.js`: cliente del carrito backend.
- `src/api/reviews.js`: cliente de reseñas.
- `src/api/notifications.js`: cliente de contacto/notificaciones.
- `src/api/search.js`: cliente de busqueda.
- `src/api/shipping.js`: cliente de tracking y sucursales.
- `src/api/delivery.js`: cliente de entrega digital.
- `src/api/wishlist.js`: cliente de favoritos.
- `src/lib/supabase.js`: auth con `refresh` y `logout`.

## Rutas del Gateway alineadas

- `GET|POST|PATCH|DELETE /orders/*`
- `GET|POST|PATCH|DELETE /shipping/*`
- `GET|POST|DELETE /payments/*`
- `GET|POST|PUT|PATCH|DELETE /catalog/*`
- `GET|POST|PUT|DELETE /cart/*`
- `GET|POST|PATCH|DELETE /reviews/*`
- `GET|POST /notifications/*`
- `GET /search/*`
- `GET /delivery/*`
- `GET|POST|DELETE /wishlist/*`

## Notas importantes

- `catalog` ahora expone `POST /catalog/books/{book_id}/image` para subir portadas al bucket `book-covers`.
- El frontend original usaba rutas antiguas como `/books` y `/orders/me`; ya quedaron preparadas contra el gateway real.
- El backend de catalogo no filtra por query params en servidor. `booksApi.getAll()` ahora normaliza y filtra del lado frontend para mantener compatibilidad con las pantallas actuales.
- `wishlist` se resolvio dentro de `catalog_service` con una tabla relacional simple (`wishlist_items`) y proxy dedicado en el gateway.
- Para aplicar los extras de backend se debe ejecutar `backend_services/db_scripts/006_extras.sql`.
