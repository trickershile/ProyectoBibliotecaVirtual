import { API_BASE_URL } from '../lib/supabase';

const apiClient = {
  async fetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = localStorage.getItem('sb_access_token') || localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Algo salió mal');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async get(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  },

  async post(endpoint, body, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async put(endpoint, body, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async delete(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  },

  async upload(endpoint, formData, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = localStorage.getItem('sb_access_token') || localStorage.getItem('token');
    const headers = { ...options.headers };
    if (accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const config = {
      ...options,
      method: 'POST',
      body: formData,
      headers,
      // No seteamos Content-Type para que el navegador ponga el boundary correcto
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al subir archivo');
      }
      return await response.json();
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
};

export default apiClient;
