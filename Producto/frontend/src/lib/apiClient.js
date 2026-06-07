const resolveApiBaseUrl = () => {
  const fromEnv = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined;
  const base = (fromEnv || 'http://localhost:8000').toString().trim();
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const setStoredToken = (token) => {
  if (!token) {
    localStorage.removeItem('token');
    localStorage.removeItem('sb_access_token');
    return;
  }
  localStorage.setItem('token', token);
  localStorage.setItem('sb_access_token', token);
};

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  try {
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const isTokenValid = (token) => {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 > Date.now() + 5000;
};

const request = async (method, endpoint, body, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token') || localStorage.getItem('sb_access_token');
  const headers = {
    ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    method,
    headers,
  };
  if (body !== undefined) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const response = await fetch(url, config);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = data?.detail || data?.message || 'Algo salió mal';
    throw new Error(detail);
  }
  return { data };
};

export const api = {
  get: (endpoint, options) => request('GET', endpoint, undefined, options),
  post: (endpoint, body, options) => request('POST', endpoint, body, options),
  put: (endpoint, body, options) => request('PUT', endpoint, body, options),
  patch: (endpoint, body, options) => request('PATCH', endpoint, body, options),
  delete: (endpoint, options) => request('DELETE', endpoint, undefined, options),
};

