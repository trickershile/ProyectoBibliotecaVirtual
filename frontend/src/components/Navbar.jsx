import { Link } from 'react-router-dom';

const Navbar = () => {
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
            {/* Inicio - Botón Rojo */}
            <Link 
              to="/" 
              className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-mono font-bold hover:bg-red-500 hover:text-white transition-all duration-300"
            >
              ./inicio
            </Link>
            
            {/* Vender - Botón Amarillo */}
            <Link 
              to="/vender" 
              className="px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 text-sm font-mono font-bold hover:bg-yellow-500 hover:text-black transition-all duration-300"
            >
              ./vender
            </Link>
            
            {/* Perfil - Botón Verde */}
            <Link 
              to="/perfil" 
              className="px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/50 text-green-500 text-sm font-mono font-bold hover:bg-green-500 hover:text-black transition-all duration-300"
            >
              ./perfil
            </Link>

            {/* Catálogo - Botón Púrpura/Cyan */}
            <Link 
              to="/catalogo" 
              className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-500 text-sm font-mono font-bold hover:bg-cyan-500 hover:text-black transition-all duration-300"
            >
              ./catalogo
            </Link>

            <div className="h-6 w-[1px] bg-gray-700 mx-2"></div>

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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
