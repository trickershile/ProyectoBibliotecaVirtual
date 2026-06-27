// src/api/supabase.js
import { createClient } from '@supabase/supabase-js';

<<<<<<< HEAD
// Inicialización estándar (Asegúrate de tener tus variables de entorno o strings de conexión aquí)
=======
// Reemplaza con tus credenciales reales de Supabase
>>>>>>> d92f6350cb9d40ed38561f8ea49b8482c32fc335
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1Ni...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
<<<<<<< HEAD
 * 🛠️ AGREGA ESTA FUNCIÓN (Es la que te está pidiendo la Navbar)
 * Purga las credenciales y perfiles locales guardados en el navegador
=======
 * Limpia los datos de sesión almacenados en el navegador (LocalStorage).
>>>>>>> d92f6350cb9d40ed38561f8ea49b8482c32fc335
 */
export const clearAuthStorage = () => {
  localStorage.removeItem('sb_user');
  localStorage.removeItem('sb_profile');
<<<<<<< HEAD
  localStorage.removeItem('supabase_token'); // O el token que use tu API Gateway
};

/**
 * 🛠️ AGREGA ESTA FUNCIÓN TAMBIÉN (Requerida para el botón de Logout)
 * Cierra la sesión nativa en Supabase Auth y limpia el cliente
=======
  localStorage.removeItem('supabase_token'); 
};

/**
 * Cierra la sesión en el servicio de autenticación de Supabase.
>>>>>>> d92f6350cb9d40ed38561f8ea49b8482c32fc335
 */
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
<<<<<<< HEAD
    console.error('Error directo en SDK Supabase SignOut:', error);
  } finally {
    clearAuthStorage();
    // Despacha un evento global para que la Navbar se entere y se redibuje
    globalThis.dispatchEvent(new Event('sb_user_updated'));
=======
    console.error('Error al cerrar sesión en Supabase:', error);
  } finally {
    clearAuthStorage();
    // Gatilla un evento global para actualizar los componentes reactivos
    window.dispatchEvent(new Event('sb_user_updated'));
>>>>>>> d92f6350cb9d40ed38561f8ea49b8482c32fc335
  }
};