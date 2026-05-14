import apiClient from './apiClient';

export const booksApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        if (Array.isArray(value)) {
          value.forEach(v => query.append(key, v));
        } else {
          query.append(key, value);
        }
      }
    });
    return apiClient.get(`/books/?${query.toString()}`);
  },

  getById: (id) => apiClient.get(`/books/${id}`),

  create: (bookData) => apiClient.post('/books/', bookData),

  uploadImage: (bookId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload(`/books/${bookId}/upload-image`, formData);
  },

  addComment: (bookId, comment) => apiClient.post(`/books/${bookId}/comments`, comment),

  update: (id, bookData) => apiClient.put(`/books/${id}`, bookData),

  delete: (id) => apiClient.delete(`/books/${id}`),
};
