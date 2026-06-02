import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api, isTokenValid, setStoredToken } from '../lib/apiClient';

const initialState = {
  token: null,
  user_id: null,
  name: null,
  email: null,
  role: 'cliente',
  permissions: [],
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      isAuthenticated: () => {
        const token = get().token;
        if (!isTokenValid(token)) {
          get().clear();
          return false;
        }
        return true;
      },
      isAdmin: () => get().role === 'admin',
      setToken: (token) => {
        const nextToken = isTokenValid(token) ? token : null;
        setStoredToken(nextToken);
        set({ token: nextToken });
      },
      setUser: (user) => {
        set({
          user_id: user?.id || user?.user_id || null,
          name: user?.name || user?.full_name || null,
          email: user?.email || null,
          role: user?.role || 'cliente',
          permissions: user?.permissions || [],
        });
      },
      clear: () => {
        setStoredToken(null);
        set({ ...initialState });
      },
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        const token = data?.access_token;
        get().setToken(token);
        await get().fetchMe();
        return data;
      },
      register: async ({ email, password, name }) => {
        await api.post('/auth/register', { email, password, name });
        return get().login(email, password);
      },
      fetchMe: async () => {
        const { data } = await api.get('/auth/me');
        get().setUser({
          id: data?.id,
          email: data?.email,
          role: data?.role,
          is_active: data?.is_active,
        });
        return data;
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        token: state.token,
        user_id: state.user_id,
        name: state.name,
        email: state.email,
        role: state.role,
        permissions: state.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && !isTokenValid(state.token)) {
          state.clear?.();
        }
      },
    }
  )
);
