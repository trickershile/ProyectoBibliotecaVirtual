// src/api/supabase.js
import { createClient } from '@supabase/supabase-js';

// Inicialización estándar (Asegúrate de tener tus variables de entorno o strings de conexión aquí)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1Ni...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🛠️ AGREGA ESTA FUNCIÓN (Es la que te está pidiendo la Navbar)
 * Purga las credenciales y perfiles locales guardados en el navegador
 */
export const clearAuthStorage = () => {
  localStorage.removeItem('sb_user');
  localStorage.removeItem('sb_profile');
  localStorage.removeItem('supabase_token'); // O el token que use tu API Gateway
};

/**
 * 🛠️ AGREGA ESTA FUNCIÓN TAMBIÉN (Requerida para el botón de Logout)
 * Cierra la sesión nativa en Supabase Auth y limpia el cliente
 */
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error directo en SDK Supabase SignOut:', error);
  } finally {
    clearAuthStorage();
    // Despacha un evento global para que la Navbar se entere y se redibuje
    globalThis.dispatchEvent(new Event('sb_user_updated'));
  }
};