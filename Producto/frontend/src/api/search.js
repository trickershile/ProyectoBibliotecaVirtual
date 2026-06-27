import apiClient from './apiClient';
import { buildQueryString, endpoints } from './endpoints';

const normalizeSearchBook = (book = {}) => ({
  ...book,
  _id: book._id || book.id,
  id: book.id || book._id,
  title: book.title || book.titulo || '',
  author: book.author || book.autor || '',
  description: book.description || book.sinopsis || '',
  image_url:
    book.image_url ||
    book.url_digital_preview ||
    book.url_libro_completo ||
    book.imagenes?.[0] ||
    null,
  pickup_location: book.pickup_location || book.ubicacion_bodega || 'Plaza de Maipu',
  categories: book.categories || (book.categoria ? [book.categoria] : ['General']),
  category_id: book.category_id || book.categoria_id || null,
  price:
    typeof book.price === 'number'
      ? book.price
      : typeof book.precio_fisico === 'number'
        ? book.precio_fisico
        : 0,
  price_physical:
    typeof book.price_physical === 'number'
      ? book.price_physical
      : typeof book.precio_fisico === 'number'
        ? book.precio_fisico
        : 0,
  price_digital:
    typeof book.price_digital === 'number'
      ? book.price_digital
      : typeof book.precio_digital === 'number'
        ? book.precio_digital
        : 0,
  stock: typeof book.stock === 'number' ? book.stock : book.stock_fisico ?? 0,
  status: book.status || ((book.stock_fisico ?? 0) > 0 ? 'available' : 'unavailable'),
  educational_level: book.educational_level || 'general',
  is_new: book.is_new ?? true,
  rating: book.rating ?? book.calificacion_promedio ?? 0,
  created_at: book.created_at || null,
});

export const searchApi = {
  async searchBooks(params) {
    const results = await apiClient.get(`${endpoints.search.books}${buildQueryString(params)}`);
    return Array.isArray(results) ? results.map(normalizeSearchBook) : [];
  },

  async suggest(params) {
    const results = await apiClient.get(`${endpoints.search.suggest}${buildQueryString(params)}`);
    return Array.isArray(results) ? results.map(normalizeSearchBook) : [];
  },
};
