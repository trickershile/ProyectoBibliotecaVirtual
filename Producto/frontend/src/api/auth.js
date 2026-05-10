const API_URL = 'http://localhost:8000/api/v1/auth';

const DEMO_TOKEN = 'demo';
const DEMO_USER_KEY = 'demo:user';

const nowIso = () => new Date().toISOString();

const readJson = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const defaultDemoUser = () => ({
  id: 'demo-user',
  first_name: 'Juan',
  last_name: 'Pérez',
  username: 'demo_user',
  email: 'demo@biblioteca.local',
  phone_number: '+56 9 0000 0000',
  address: 'Santiago, Chile',
  created_at: nowIso(),
  updated_at: nowIso(),
});

export const startDemoSession = () => {
  localStorage.setItem('token', DEMO_TOKEN);
  const existing = readJson(DEMO_USER_KEY, null);
  if (!existing) {
    writeJson(DEMO_USER_KEY, defaultDemoUser());
  }
  return readJson(DEMO_USER_KEY, null);
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (token === DEMO_TOKEN) {
    const existing = readJson(DEMO_USER_KEY, null);
    if (existing) return existing;
    return startDemoSession();
  }
  return null;
};

export const updateCurrentUser = async (updates) => {
  const token = localStorage.getItem('token');
  if (token !== DEMO_TOKEN) {
    throw new Error('Función no disponible sin backend. Usa modo demo.');
  }

  const current = readJson(DEMO_USER_KEY, null) || startDemoSession();
  const next = {
    ...current,
    ...updates,
    updated_at: nowIso(),
  };
  writeJson(DEMO_USER_KEY, next);
  window.dispatchEvent(new Event('storage'));
  return next;
};

export const deleteCurrentUserAccount = async () => {
  const token = localStorage.getItem('token');
  if (token !== DEMO_TOKEN) {
    throw new Error('Función no disponible sin backend. Usa modo demo.');
  }

  localStorage.removeItem(DEMO_USER_KEY);
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('storage'));
  return true;
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error en el registro');
  }

  return response.json();
};

export const loginUser = async (credentials) => {
  const formData = new FormData();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error en el inicio de sesión');
  }

  return response.json();
};
