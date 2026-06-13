import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthStorage, signOut } from '../lib/supabase';
import { getCartCount } from '../lib/cart';

const Navbar = () => {
  const navigate = useNavigate();
  const [sbUser, setSbUser] = useState(null);
  const [sbProfile, setSbProfile] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('sb_user') || 'null');
    const profile = JSON.parse(localStorage.getItem('sb_profile') || 'null');
    setSbUser(user);
    setSbProfile(profile);
    
    const updateCartCount = async () => {
      const count = await getCartCount();
      setCartCount(count);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    };
    
    updateCartCount();
    globalThis.addEventListener('storage', updateCartCount);
    globalThis.addEventListener('cart-updated', updateCartCount);
    
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
      const updatedProfile = JSON.parse(localStorage.getItem('sb_profile') || 'null');
      setSbUser(updatedUser);
      setSbProfile(updatedProfile);
      updateCartCount();
    };
    globalThis.addEventListener('sb_user_updated', handleStorageChange);
    
    return () => {
      globalThis.removeEventListener('storage', updateCartCount);
      globalThis.removeEventListener('cart-updated', updateCartCount);
      globalThis.removeEventListener('sb_user_updated', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    clearAuthStorage();
    navigate('/');
  };

  const isLoggedIn = Boolean(sbUser);
  const isAdmin = sbProfile?.role === 'admin';

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* SECCIÓN DEL LOGOTIPO DIGITAL */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2 mr-4">
              
            </div>
            
            <Link to="/" className="flex items-center space-x-3 text-xl font-bold text-white font-mono tracking-tighter hover:text-blue-400 transition-colors group">
              {/* Icono SVG de Libro Ciberpunk */}
              <svg 
                className="w-12 h-12 text-blue-500 group-hover:text-cyan-400 transition-colors duration-300 transform group-hover:rotate-6" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M9 6h6" strokeDasharray="2 2" />
                <circle cx="10" cy="11" r="1" fill="currentColor" />
                <path d="M10 11h4" />
                <circle cx="14" cy="15" r="1" fill="currentColor" />
                <path d="M11 15h3" />
              </svg>
              <span>
                BIBLIOTECA_VIRTUAL<span className="text-blue-500 animate-pulse">_</span>
              </span>
            </Link>
          </div>
          
          {/* MENÚ DE NAVEGACIÓN */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/" 
              className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-mono font-bold hover:bg-red-500 hover:text-white transition-all duration-300"
            >
              ./inicio
            </Link>

            {isLoggedIn && (
              <Link 
                to="/perfil" 
                className="px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/50 text-green-500 text-sm font-mono font-bold hover:bg-green-500 hover:text-black transition-all duration-300"
              >
                ./perfil
              </Link>
            )}

            {isLoggedIn && (
              <Link
                to="/asistente"
                className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/50 text-blue-400 text-sm font-mono font-bold hover:bg-blue-500 hover:text-white transition-all duration-300"
              >
                ./asistente
              </Link>
            )}

            <Link 
              to="/catalogo" 
              className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-500 text-sm font-mono font-bold hover:bg-cyan-500 hover:text-black transition-all duration-300"
            >
              ./catálogo
            </Link>

            <Link 
              to="/resenas" 
              className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/50 text-purple-500 text-sm font-mono font-bold hover:bg-purple-500 hover:text-white transition-all duration-300"
            >
              ./reseñas
            </Link>

            <Link
              to="/tracking"
              className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/50 text-blue-300 text-sm font-mono font-bold hover:bg-blue-500 hover:text-white transition-all duration-300"
            >
              ./tracking
            </Link>

            <Link 
              to="/contacto" 
              className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/50 text-orange-500 text-sm font-mono font-bold hover:bg-orange-500 hover:text-white transition-all duration-300"
            >
              ./contacto
            </Link>

            {isLoggedIn && isAdmin && (
              <Link 
                to="/vender" 
                className="px-4 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-sm font-mono font-bold hover:bg-white hover:text-black transition-all duration-300"
              >
                ./gestión
              </Link>
            )}

            {/* CARRITO DE COMPRAS */}
            <Link 
              to="/carrito" 
              className={`relative p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-300 ${isAnimating ? 'scale-125 text-blue-400' : 'scale-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg border border-gray-900 transition-transform duration-300 ${isAnimating ? 'scale-150' : 'scale-100'}`}>
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="h-6 w-[1px] bg-gray-700 mx-2"></div>

            {/* CONTROL DE FLUJO DE SESIÓN */}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="text-blue-500 font-mono text-xs font-bold hover:text-blue-400 transition-colors cursor-pointer"
              >
                CERRAR_SESIÓN
              </button>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-blue-500 font-mono text-xs font-bold hover:text-blue-400 transition-colors"
                >
                  INICIAR_SESIÓN
                </Link>

                <Link 
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-mono text-xs font-bold hover:bg-blue-700 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
                >
                  REGISTRARSE
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
