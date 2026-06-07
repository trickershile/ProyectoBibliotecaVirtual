import { API_BASE_URL, api, setStoredToken } from './apiClient';

export { API_BASE_URL };

export const withApiOrigin = (value) => {
  if (!value) return value;
  const str = String(value);
  if (/^https?:\/\//i.test(str)) return str;
  if (!str.startsWith('/')) return `${API_BASE_URL}/${str}`;
  return `${API_BASE_URL}${str}`;
};

export const setAuthStorage = ({ user, session, profile }) => {
  const token = session?.access_token || session?.token || null;
  if (token) setStoredToken(token);

  if (user) {
    localStorage.setItem('sb_user', JSON.stringify(user));
    window.dispatchEvent(new Event('sb_user_updated'));
  }

  if (profile) {
    localStorage.setItem('sb_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('sb_user_updated'));
  }
};

export const clearAuthStorage = () => {
  localStorage.removeItem('sb_user');
  localStorage.removeItem('sb_profile');
  localStorage.removeItem('sb_access_token');
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('sb_user_updated'));
};

export const signIn = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  const session = { access_token: data?.access_token, token_type: data?.token_type };
  const user = data?.user ? { ...data.user, id: data.user.id } : null;
  return { user, session };
};

export const signUp = async (email, password, metadata = {}) => {
  const nombre_completo =
    metadata?.nombre_completo ||
    `${metadata?.first_name || ''} ${metadata?.last_name || ''}`.trim() ||
    metadata?.username ||
    email;

  const { data } = await api.post('/auth/register', { email, password, nombre_completo });
  return { user: data };
};

export const signOut = async () => {
  clearAuthStorage();
  return true;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const updateProfile = async (_, updates) => {
  const { data } = await api.patch('/auth/profile', updates);
  return data;
};

