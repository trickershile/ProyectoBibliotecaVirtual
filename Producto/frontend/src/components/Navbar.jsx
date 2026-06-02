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
    
    const updateCartCount = () => {
      setCartCount(getCartCount());
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    };
    
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cart-updated', updateCartCount);
    
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
      const updatedProfile = JSON.parse(localStorage.getItem('sb_profile') || 'null');
      setSbUser(updatedUser);
      setSbProfile(updatedProfile);
    };
    window.addEventListener('sb_user_updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cart-updated', updateCartCount);
      window.removeEventListener('sb_user_updated', handleStorageChange);
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
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <Link to="/" className="text-xl font-bold text-white font-mono tracking-tighter hover:text-blue-400 transition-colors">
              BIBLIOTECA_VIRTUAL<span className="animate-pulse">_</span>
            </Link>
          </div>
          
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

            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="text-blue-500 font-mono text-xs font-bold hover:text-blue-400 transition-colors"
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
