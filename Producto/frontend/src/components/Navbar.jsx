import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthStorage, signOut } from '../lib/supabase';
import { getCartCount } from '../lib/cart';
import iconoNavbar from '../public/icono-navbar.png';

const getFromStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const [sbUser, setSbUser] = useState(null);
  const [sbProfile, setSbProfile] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const animTimerRef = useRef(null);

  useEffect(() => {
    const user = getFromStorage('sb_user');
    const profile = getFromStorage('sb_profile');
    setSbUser(user);
    setSbProfile(profile);
    
    const updateCartCount = async () => {
      try {
        const count = await getCartCount();
        setCartCount(count);
        setIsAnimating(true);
        if (animTimerRef.current) clearTimeout(animTimerRef.current);
        animTimerRef.current = setTimeout(() => setIsAnimating(false), 300);
      } catch (err) {
        console.error('Error al actualizar contador del carrito:', err);
      }
    };
    
    updateCartCount();
    globalThis.addEventListener('storage', updateCartCount);
    globalThis.addEventListener('cart-updated', updateCartCount);
    
    const handleStorageChange = () => {
      const updatedUser = getFromStorage('sb_user');
      const updatedProfile = getFromStorage('sb_profile');
      setSbUser(updatedUser);
      setSbProfile(updatedProfile);
      updateCartCount();
    };
    globalThis.addEventListener('sb_user_updated', handleStorageChange);
    
    return () => {
      globalThis.removeEventListener('storage', updateCartCount);
      globalThis.removeEventListener('cart-updated', updateCartCount);
      globalThis.removeEventListener('sb_user_updated', handleStorageChange);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (globalThis.innerWidth >= 1280) {
        setIsMobileMenuOpen(false);
      }
    };

    globalThis.addEventListener('resize', handleResize);

    return () => {
      globalThis.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    clearAuthStorage();
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: 'Has cerrado sesión.' }
    }));
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const isLoggedIn = Boolean(sbUser);
  const isAdmin = sbProfile?.role === 'admin';
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((current) => !current);
  const navPillBase =
    'inline-flex items-center justify-center rounded-full border-2 px-4 py-1.5 text-sm font-mono font-bold transition-all duration-300 whitespace-nowrap';
  const navPillTone =
    'border-[#aa7f5d] bg-[#fff7ee] text-[#5a3f2b] hover:border-[#7f5c40] hover:bg-[#e5ccb4] hover:text-[#3f2b1d]';
  const navPillAccent =
    'border-[#8f6443] bg-[#f3dfca] text-[#4b3525] hover:border-[#6f4e36] hover:bg-[#d8bb9e] hover:text-[#2f2118]';

  return (
    <nav className="sticky top-0 z-50 select-none border-b-2 border-[#aa7f5d] bg-[#263445]/95 text-[#f6efe6] shadow-[0_10px_28px_rgba(15,23,36,0.22)] backdrop-blur-sm">
      <div className="relative w-full px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
            {/* SECCIÓN DEL LOGOTIPO DIGITAL */}
            <div className="min-w-0 flex items-center">
              <div className="flex items-center space-x-2 mr-4">
                
              </div>
              
              <Link to="/" className="group flex min-w-0 items-center space-x-3 font-mono text-xl font-bold tracking-tighter text-[#f6efe6] transition-colors hover:text-[#eadccf]">
                <img
                  src={iconoNavbar}
                  alt="Icono Biblioteca Virtual"
                  className="h-10 w-10 shrink-0 object-contain transition-transform duration-300 group-hover:rotate-6 sm:h-12 sm:w-12"
                />
                <span className="truncate text-base sm:text-xl">BIBLIOTECA VIRTUAL</span>
              </Link>
            </div>

            <div className="flex items-center justify-end gap-3">
              <div className="hidden xl:flex xl:items-center xl:gap-4">
                <Link
                  to="/"
                  className={`${navPillBase} ${navPillAccent}`}
                >
                  Inicio
                </Link>

                {isLoggedIn && (
                  <Link
                    to="/perfil"
                    className={`${navPillBase} ${navPillTone}`}
                  >
                    Perfil
                  </Link>
                )}

                {isLoggedIn && (
                  <Link
                    to="/asistente"
                    className={`${navPillBase} ${navPillTone}`}
                  >
                    Asistente
                  </Link>
                )}

                <Link
                  to="/catalogo"
                  className={`${navPillBase} ${navPillTone}`}
                >
                  Catálogo
                </Link>

                <Link
                  to="/resenas"
                  className={`${navPillBase} ${navPillTone}`}
                >
                  Reseñas
                </Link>

                <Link
                  to="/tracking"
                  className={`${navPillBase} ${navPillTone}`}
                >
                  Tracking
                </Link>

                <Link
                  to="/contacto"
                  className={`${navPillBase} ${navPillTone}`}
                >
                  Contacto
                </Link>

                {isLoggedIn && isAdmin && (
                  <Link
                    to="/vender"
                    className={`${navPillBase} ${navPillAccent}`}
                  >
                    Gestión
                  </Link>
                )}

                <Link 
                  to="/carrito"
                  className={`relative shrink-0 rounded-full border-2 border-yellow-500 bg-black p-2 text-yellow-400 transition-all duration-300 hover:border-yellow-400 hover:bg-[#111111] hover:text-yellow-300 ${isAnimating ? 'scale-125 text-yellow-300' : 'scale-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[18px] rounded-full border border-[#fff7ee] bg-[#8f6443] px-1.5 py-0.5 text-center text-[10px] font-bold text-[#fffaf5] shadow-lg transition-transform duration-300 ${isAnimating ? 'scale-150' : 'scale-100'}`}>
                      {cartCount}
                    </span>
                  )}
                </Link>

                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border-2 border-[#a62f2f] bg-[#c43c3c] px-4 py-2 font-mono text-xs font-bold text-white transition-colors hover:border-[#8d2424] hover:bg-[#a92f2f] hover:text-white"
                  >
                    Cerrar sesión
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center rounded-lg border-2 border-[#2f5f9a] bg-[#2f5f9a] px-4 py-2 font-mono text-xs font-bold text-white transition-colors hover:border-[#244a79] hover:bg-[#244a79] hover:text-white"
                    >
                      Iniciar sesión
                    </Link>

                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center rounded-lg border-2 border-[#5d8a45] bg-[#5d8a45] px-4 py-2 font-mono text-xs font-bold text-[#fffaf5] transition-all hover:border-[#486c36] hover:bg-[#486c36]"
                    >
                      Registrarse
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 xl:hidden">
              <Link 
                to="/carrito" 
                onClick={closeMobileMenu}
                className={`relative shrink-0 rounded-full border-2 border-yellow-500 bg-black p-2 text-yellow-400 transition-all duration-300 hover:border-yellow-400 hover:bg-[#111111] hover:text-yellow-300 ${isAnimating ? 'scale-125 text-yellow-300' : 'scale-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[18px] rounded-full border border-[#fff7ee] bg-[#8f6443] px-1.5 py-0.5 text-center text-[10px] font-bold text-[#fffaf5] shadow-lg transition-transform duration-300 ${isAnimating ? 'scale-150' : 'scale-100'}`}>
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={toggleMobileMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#aa7f5d] bg-[#fff7ee] text-[#5a3f2b] transition-colors duration-300 hover:border-[#7f5c40] hover:bg-[#ead4bd] hover:text-[#3f2b1d]"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              >
                <span className="relative block h-5 w-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`absolute inset-0 h-5 w-5 transform transition-all duration-300 ease-out ${
                      isMobileMenuOpen ? 'rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`absolute inset-0 h-5 w-5 transform transition-all duration-300 ease-out ${
                      isMobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-75 opacity-0'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </button>
              </div>
            </div>
        </div>

        <div
          className={`absolute right-4 top-full z-50 mt-3 w-full max-w-[calc(100%-2rem)] origin-top-right rounded-2xl border-2 border-[#aa7f5d] bg-[#2b3a4a]/95 p-4 text-[#f6efe6] shadow-[0_18px_42px_rgba(15,23,36,0.28)] transition-all duration-300 ease-out sm:right-6 sm:w-80 sm:max-w-none md:w-96 lg:right-8 xl:w-[25vw] ${
            isMobileMenuOpen
              ? 'visible translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none invisible -translate-y-2 scale-95 opacity-0'
          }`}
        >
          <div
            className={`transition-all duration-300 ease-out ${
              isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
            }`}
          >
            <div className="flex flex-col gap-3">
              <Link 
                to="/" 
                onClick={closeMobileMenu}
                className={`${navPillBase} ${navPillAccent} w-full`}
              >
                Inicio
              </Link>

              {isLoggedIn && (
                <Link 
                  to="/perfil" 
                  onClick={closeMobileMenu}
                  className={`${navPillBase} ${navPillTone} w-full`}
                >
                  Perfil
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  to="/asistente"
                  onClick={closeMobileMenu}
                  className={`${navPillBase} ${navPillTone} w-full`}
                >
                  Asistente
                </Link>
              )}

              <Link 
                to="/catalogo" 
                onClick={closeMobileMenu}
                className={`${navPillBase} ${navPillTone} w-full`}
              >
                Catálogo
              </Link>

              <Link 
                to="/resenas" 
                onClick={closeMobileMenu}
                className={`${navPillBase} ${navPillTone} w-full`}
              >
                Reseñas
              </Link>

              <Link
                to="/tracking"
                onClick={closeMobileMenu}
                className={`${navPillBase} ${navPillTone} w-full`}
              >
                Tracking
              </Link>

              <Link 
                to="/contacto" 
                onClick={closeMobileMenu}
                className={`${navPillBase} ${navPillTone} w-full`}
              >
                Contacto
              </Link>

              {isLoggedIn && isAdmin && (
                <Link 
                  to="/vender" 
                  onClick={closeMobileMenu}
                  className={`${navPillBase} ${navPillAccent} w-full`}
                >
                  Gestión
                </Link>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t-2 border-[#d2b08f] pt-4">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-lg border-2 border-[#a62f2f] bg-[#c43c3c] px-4 py-2 font-mono text-xs font-bold text-white transition-colors hover:border-[#8d2424] hover:bg-[#a92f2f] hover:text-white"
                >
                  Cerrar sesión
                </button>
              ) : (
                <div className="flex w-full flex-col gap-3">
                  <Link 
                    to="/login"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center justify-center rounded-lg border-2 border-[#2f5f9a] bg-[#2f5f9a] px-4 py-2 font-mono text-xs font-bold text-white transition-colors hover:border-[#244a79] hover:bg-[#244a79] hover:text-white"
                  >
                    Iniciar sesión
                  </Link>

                  <Link 
                    to="/register"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center justify-center rounded-lg border-2 border-[#5d8a45] bg-[#5d8a45] px-4 py-2 font-mono text-xs font-bold text-[#fffaf5] transition-all hover:border-[#486c36] hover:bg-[#486c36]"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
