import apiClient from './apiClient';
import { buildQueryString, endpoints } from './endpoints';

export const reviewsApi = {
  getByBook(bookId, params = {}) {
    return apiClient.get(`${endpoints.reviews.byBook(bookId)}${buildQueryString(params)}`);
  },

  create(bookId, payload) {
    return apiClient.post(endpoints.reviews.byBook(bookId), {
      rating: Number(payload.rating),
      comentario: payload.comentario || payload.comment || '',
    });
  },

  update(reviewId, payload) {
    return apiClient.patch(endpoints.reviews.byId(reviewId), {
      ...(payload.rating ? { rating: Number(payload.rating) } : {}),
      ...(payload.comentario || payload.comment
        ? { comentario: payload.comentario || payload.comment }
        : {}),
    });
  },

  delete(reviewId) {
    return apiClient.delete(endpoints.reviews.byId(reviewId));
  },

  getPendingModeration() {
    return apiClient.get(endpoints.reviews.moderationPending);
  },

  moderate(reviewId, estado, motivo = null) {
    return apiClient.patch(endpoints.reviews.moderate(reviewId), { estado, motivo });
  },
};
