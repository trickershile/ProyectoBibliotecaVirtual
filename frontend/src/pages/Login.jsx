import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { loginUser } from '../api/auth';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(formData);
      // Guardar token y redirigir
      localStorage.setItem('token', data.access_token);
      navigate('/perfil');
    } catch (err) {
      setError(err.message || 'Error en el inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 relative overflow-hidden group">
        {/* Efecto de luz de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-500"></div>

        <div className="text-center relative z-10">
          <h1 className="text-3xl font-bold text-white font-mono tracking-tighter uppercase">
            {'>'} INICIO_SESIÓN
          </h1>
          <p className="text-gray-400 mt-2 font-sans">Inicia sesión en la Biblioteca Virtual</p>
        </div>

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg text-xs font-mono relative z-10">
            [ÉXITO]: {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-xs font-mono relative z-10 animate-pulse">
            [ERROR]: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-1 font-mono uppercase tracking-widest" htmlFor="username">
              NOMBRE_USUARIO
            </label>
            <input 
              type="text" 
              id="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
              placeholder="jdoe_dev"
              required
            />
          </div>
          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-1 font-mono uppercase tracking-widest" htmlFor="password">
              CLAVE_ACCESO
            </label>
            <input 
              type="password" 
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <a href="#" className="text-xs text-blue-500 hover:underline font-mono">./olvide_mi_clave</a>
          </div>
          <div>
            <Button 
              type="submit" 
              variant="primary" 
              className={`w-full py-3 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? './autenticando...' : './ejecutar_autenticacion'}
            </Button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-gray-800/50 relative z-10">
          <p className="text-gray-500 text-xs">
            ¿No tienes cuenta? {' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-400 font-mono transition-colors">
              ./crear_nueva_cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
