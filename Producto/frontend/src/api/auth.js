import apiClient from './apiClient';

export const registerUser = async (userData) => {
  return apiClient.post('/auth/register', userData);
};

export const loginUser = async (credentials) => {
  const formData = new FormData();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  // Usamos el método upload de apiClient porque envía FormData sin setear Content-Type manual
  return apiClient.upload('/auth/login', formData);
};

export const getUser = async (userId) => {
  return apiClient.get(`/auth/${userId}`);
};

export const updateUser = async (userId, userData) => {
  return apiClient.put(`/auth/${userId}`, userData);
};

