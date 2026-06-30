import { API_BASE_URL } from '../lib/supabase';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_TIMEOUT = 30000;

const getAccessToken = () => {
  try {
    return localStorage.getItem('sb_access_token') || localStorage.getItem('token');
  } catch {
    return null;
  }
};

const apiFetch = async (url, config) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, { ...config, signal: controller.signal });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new ApiError(response.status, data?.detail || data?.message || 'Algo salió mal');
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};

const apiClient = {
  async fetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = getAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const config = { ...options, headers };

    try {
      return await apiFetch(url, config);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'La solicitud tardó demasiado en responder.');
      }
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

  async patch(endpoint, body, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async delete(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  },

  async upload(endpoint, formData, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = getAccessToken();
    const headers = { ...options.headers };
    if (accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const config = {
      ...options,
      method: 'POST',
      body: formData,
      headers,
    };

    try {
      return await apiFetch(url, config);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'La subida tardó demasiado.');
      }
      console.error('Upload Error:', error);
      throw error;
    }
  }
};

export default apiClient;
