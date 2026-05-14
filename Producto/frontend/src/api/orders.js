import apiClient from './apiClient';

export const ordersApi = {
  create: (orderData) => apiClient.post('/orders/', orderData),
  getByUser: (userId) => apiClient.get(`/orders/${userId}`),
};
