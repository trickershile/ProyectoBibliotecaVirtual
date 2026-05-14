import apiClient from './apiClient';

export const wishlistApi = {
  get: (userId) => apiClient.get(`/wishlist/${userId}`),
  
  add: (userId, bookId) => apiClient.post(`/wishlist/${userId}/add/${bookId}`),
  
  remove: (userId, bookId) => apiClient.delete(`/wishlist/${userId}/remove/${bookId}`),
};
