import apiClient from './apiClient';

export const ordersApi = {
  create: (orderData) => apiClient.post('/orders/', orderData),
  getMy: () => apiClient.get('/orders/me'),
  getByUser: (userId) => apiClient.get(`/orders/${userId}`),
};
