const DEFAULT_API_BASE_URL = 'http://localhost:8080';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

const ACCESS_TOKEN_KEY = 'sb_access_token';
const REFRESH_TOKEN_KEY = 'sb_refresh_token';
const USER_KEY = 'sb_user';
const PROFILE_KEY = 'sb_profile';
let pendingSession = null;

const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:');

const splitFullName = (fullName = '') => {
  const normalized = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { first_name: '', last_name: '' };
  }

  const parts = normalized.split(' ');
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' };
  }

  return {
    first_name: parts.slice(0, -1).join(' '),
    last_name: parts.slice(-1).join(' '),
  };
};

const joinFullName = (firstName = '', lastName = '') =>
  `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();

const getStoredAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('token');

const parseJsonResponse = async (response) => {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Error ${response.status}`);
  }

  return data;
};

const authFetch = async (endpoint, options = {}) => {
  const fallbackToken = pendingSession?.access_token || pendingSession?.token || null;
  const token = getStoredAccessToken() || fallbackToken;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return parseJsonResponse(response);
};

const normalizeProfile = (profile = {}, fallbackUser = null) => {
  const fullName = profile.nombre_completo || fallbackUser?.nombre_completo || fallbackUser?.full_name || '';
  const nameParts = splitFullName(fullName);
  const email = profile.email || fallbackUser?.email || '';

  return {
    ...profile,
    id: profile.id || fallbackUser?.id || null,
    email,
    nombre_completo: fullName,
    first_name: profile.first_name || nameParts.first_name,
    last_name: profile.last_name || nameParts.last_name,
    username: profile.username || email.split('@')[0] || '',
    phone_number: profile.phone_number || profile.telefono || '',
    telefono: profile.telefono || profile.phone_number || '',
    address: profile.address || '',
    role: profile.role || fallbackUser?.role || 'socio',
    created_at: profile.created_at || fallbackUser?.created_at || null,
  };
};

export const withApiOrigin = (value) => {
  if (!value) {
    return value;
  }

  if (isAbsoluteUrl(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`;
  }

  return `${API_BASE_URL}/${value}`;
};

export const clearAuthStorage = () => {
  pendingSession = null;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('supabase_token');
  localStorage.removeItem('token');
};

export const setAuthStorage = ({ user, session, profile }) => {
  pendingSession = null;
  const normalizedUser = normalizeProfile(user, user);
  const normalizedProfile = normalizeProfile(profile || user, normalizedUser);
  const accessToken = session?.access_token || session?.token || null;
  const refreshToken = session?.refresh_token || null;

  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedProfile));

  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem('token', accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  globalThis.dispatchEvent(new Event('sb_user_updated'));
  globalThis.dispatchEvent(new Event('storage'));
};

export const signIn = async (email, password) => {
  const data = await authFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const normalizedUser = normalizeProfile(data?.user || {}, data?.user || {});

  const result = {
    ...data,
    user: normalizedUser,
    session: {
      access_token: data?.access_token || null,
      refresh_token: data?.refresh_token || null,
      expires_at: data?.expires_at || null,
    },
  };

  pendingSession = result.session;
  return result;
};

export const signUp = async (email, password, metadata = {}) => {
  const nombreCompleto =
    joinFullName(metadata.first_name, metadata.last_name) ||
    metadata.nombre_completo ||
    metadata.username ||
    email.split('@')[0];

  const body = { email, password, nombre_completo: nombreCompleto };
  if (metadata.address) {
    body.direccion = metadata.address;
  }

  const data = await authFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return normalizeProfile(data, data);
};

export const getProfile = async () => {
  const data = await authFetch('/auth/profile', {
    method: 'GET',
  });

  let storedUser = null;
  // eslint-disable-next-line no-empty
  try { storedUser = JSON.parse(localStorage.getItem(USER_KEY)); } catch {}
  return normalizeProfile(data, storedUser);
};

export const updateProfile = async (_userId, updates = {}) => {
  let currentProfile = null, currentUser = null;
  // eslint-disable-next-line no-empty
  try { currentProfile = JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch {}
  // eslint-disable-next-line no-empty
  try { currentUser = JSON.parse(localStorage.getItem(USER_KEY)); } catch {}

  const fullName =
    joinFullName(updates.first_name, updates.last_name) ||
    updates.nombre_completo ||
    currentProfile?.nombre_completo ||
    currentUser?.nombre_completo ||
    '';

  const payload = {};
  if (fullName) {
    payload.nombre_completo = fullName;
  }
  if (updates.phone_number || updates.telefono) {
    payload.telefono = updates.phone_number || updates.telefono;
  }
  if (updates.address) {
    payload.direccion = updates.address;
  }

  const data = await authFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const normalized = normalizeProfile(
    {
      ...currentProfile,
      ...updates,
      ...data,
      nombre_completo: data?.nombre_completo || fullName,
      telefono: data?.telefono || updates.phone_number || updates.telefono || currentProfile?.telefono || '',
      address: updates.address ?? currentProfile?.address ?? '',
    },
    currentUser
  );

  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
  globalThis.dispatchEvent(new Event('sb_user_updated'));
  return normalized;
};

export const signOut = async () => {
  try {
    await authFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  } catch (error) {
    console.warn('No se pudo cerrar sesión en el backend:', error);
  } finally {
    clearAuthStorage();
    globalThis.dispatchEvent(new Event('sb_user_updated'));
  }
};
