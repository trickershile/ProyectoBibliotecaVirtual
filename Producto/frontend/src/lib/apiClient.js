import rawApiClient from '../api/apiClient';

const TOKEN_STORAGE_KEYS = ['sb_access_token', 'token'];

const decodeJwtPayload = (token) => {
  try {
    const [, payload] = String(token || '').split('.');
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const getStoredToken = () =>
  TOKEN_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) || null;

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('sb_access_token', token);
    localStorage.setItem('token', token);
    return;
  }

  TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const isTokenValid = (token) => {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 > Date.now();
};

const wrap = async (executor) => ({ data: await executor() });

export const api = {
  get: (endpoint, options = {}) => wrap(() => rawApiClient.get(endpoint, options)),
  post: (endpoint, body = {}, options = {}) => wrap(() => rawApiClient.post(endpoint, body, options)),
  put: (endpoint, body = {}, options = {}) => wrap(() => rawApiClient.put(endpoint, body, options)),
  patch: (endpoint, body = {}, options = {}) => wrap(() => rawApiClient.patch(endpoint, body, options)),
  delete: (endpoint, options = {}) => wrap(() => rawApiClient.delete(endpoint, options)),
};

export default api;
