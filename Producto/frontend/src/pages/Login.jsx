import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { getProfile, setAuthStorage, signIn } from '../lib/supabase';
import { theme } from '../lib/theme';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
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
      const data = await signIn(formData.email, formData.password);
      
      const profile = await getProfile(data.user.id);
      setAuthStorage({ user: data.user, session: data.session, profile });
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Has iniciado sesión.' }
      }));
      
      const redirectTo = location.state?.from?.pathname || '/perfil';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Error en el inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${theme.pageShell} flex items-center justify-center`}>
      <div className={`relative w-full max-w-md space-y-8 overflow-hidden ${theme.sectionCard} p-6 sm:p-8`}>
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#d8bb9e]/50 blur-3xl transition-all duration-500"></div>

        <div className="text-center relative z-10">
          <h1 className="text-3xl font-bold font-mono tracking-tighter uppercase text-[#5a3f2b]">
            Iniciar sesión
          </h1>
          <p className="mt-2 font-sans text-[#6f523c]">Inicia sesión en la Biblioteca Virtual</p>
        </div>

        {successMessage && (
          <div className="relative z-10 rounded-xl border-2 border-[#9faf92] bg-[#eef4e8] p-3 text-xs font-mono text-[#566b4a]">
            Éxito: {successMessage}
          </div>
        )}

        {error && (
          <div className="relative z-10 animate-pulse rounded-xl border-2 border-[#d7a59d] bg-[#f5dfd8] p-3 text-xs font-mono text-[#8a3f34]">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className={theme.label} htmlFor="email">
              Correo electrónico
            </label>
            <input 
              type="email" 
              id="email"
              value={formData.email}
              onChange={handleChange}
              className={theme.input}
              placeholder="usuario@correo.cl"
              required
            />
          </div>
          <div>
            <label className={theme.label} htmlFor="password">
              Contraseña
            </label>
            <input 
              type="password" 
              id="password"
              value={formData.password}
              onChange={handleChange}
              className={theme.input}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <a href="#" className="text-xs font-mono text-[#7f5c40] transition-colors hover:text-[#5a3f2b] hover:underline">Olvidé mi clave</a>
          </div>
          <div>
            <Button 
              type="submit" 
              variant="primary" 
              className={`w-full py-3 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Entrar'}
            </Button>
          </div>
        </form>

        <div className="relative z-10 border-t-2 border-[#d2b08f] pt-4 text-center">
          <p className="text-xs text-[#7f5c40]">
            ¿No tienes cuenta? {' '}
            <Link to="/register" className="font-mono text-[#5a3f2b] transition-colors hover:text-[#3f2b1d]">
              Crear una cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
