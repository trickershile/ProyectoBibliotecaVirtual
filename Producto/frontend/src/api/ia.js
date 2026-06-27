import { API_BASE_URL } from '../lib/supabase';

export const buildIaWebSocketUrl = (userId, params = {}) => {
  const base = API_BASE_URL.replace(/^http/i, 'ws');
  const url = new URL(`${base}/ia/chat/${userId}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};
