import apiClient from './apiClient';

export const wishlistApi = {
  getMy: () => apiClient.get('/wishlist/me'),
  get: (userId) => apiClient.get(`/wishlist/${userId}`),
  
  addMy: (bookId) => apiClient.post(`/wishlist/me/add/${bookId}`),
  add: (userId, bookId) => apiClient.post(`/wishlist/${userId}/add/${bookId}`),
  
  removeMy: (bookId) => apiClient.delete(`/wishlist/me/remove/${bookId}`),
  remove: (userId, bookId) => apiClient.delete(`/wishlist/${userId}/remove/${bookId}`),
};
