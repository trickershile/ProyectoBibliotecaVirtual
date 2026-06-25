// src/api/supabase.js
import { createClient } from '@supabase/supabase-js';

// Reemplaza con tus credenciales reales de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1Ni...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Limpia los datos de sesión almacenados en el navegador (LocalStorage).
 */
export const clearAuthStorage = () => {
  localStorage.removeItem('sb_user');
  localStorage.removeItem('sb_profile');
  localStorage.removeItem('supabase_token'); 
};

/**
 * Cierra la sesión en el servicio de autenticación de Supabase.
 */
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error al cerrar sesión en Supabase:', error);
  } finally {
    clearAuthStorage();
    // Gatilla un evento global para actualizar los componentes reactivos
    window.dispatchEvent(new Event('sb_user_updated'));
  }
};