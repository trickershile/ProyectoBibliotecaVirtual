import apiClient from './apiClient';
import { endpoints } from './endpoints';

export const wishlistApi = {
  getMy: () => apiClient.get(endpoints.wishlist.mine),
  get: (userId) => apiClient.get(endpoints.wishlist.byUser(userId)),
  
  addMy: (bookId) => apiClient.post(endpoints.wishlist.addMine(bookId)),
  add: (userId, bookId) => apiClient.post(endpoints.wishlist.addByUser(userId, bookId)),
  
  removeMy: (bookId) => apiClient.delete(endpoints.wishlist.removeMine(bookId)),
  remove: (userId, bookId) => apiClient.delete(endpoints.wishlist.removeByUser(userId, bookId)),
};
