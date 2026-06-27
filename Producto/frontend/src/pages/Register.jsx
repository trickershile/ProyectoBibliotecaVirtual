import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { signUp } from '../lib/supabase';
import { theme } from '../lib/theme';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    address: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      await signUp(formData.email, formData.password, {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        address: formData.address
      });
      
      navigate('/login', { state: { message: 'Registro completado. Por favor verifica tu correo electrónico.' } });
    } catch (err) {
      setError(err.message || 'Error al procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${theme.pageShell} flex items-center justify-center font-sans`}>
      <div className={`relative w-full max-w-md space-y-8 overflow-hidden ${theme.sectionCard} p-6 sm:p-8`}>
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#d8bb9e]/50 blur-3xl transition-all duration-500"></div>
        
        <div className="text-center relative z-10">
          <h1 className="text-3xl font-bold font-mono tracking-tighter uppercase text-[#5a3f2b]">
            Crear cuenta
          </h1>
          <p className="mt-2 text-[#6f523c]">Crea tu credencial de socio para acceder al sistema</p>
        </div>

        {error && (
          <div className="relative z-10 animate-pulse rounded-xl border-2 border-[#d7a59d] bg-[#f5dfd8] p-3 text-xs font-mono text-[#8a3f34]">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={theme.label} htmlFor="first_name">
                Nombre
              </label>
              <input 
                type="text" 
                id="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={theme.input}
                placeholder="Juan"
                required
              />
            </div>
            <div>
              <label className={theme.label} htmlFor="last_name">
                Apellido
              </label>
              <input 
                type="text" 
                id="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={theme.input}
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          <div>
            <label className={theme.label} htmlFor="username">
              Nombre de usuario
            </label>
            <input 
              type="text" 
              id="username"
              value={formData.username}
              onChange={handleChange}
              className={theme.input}
              placeholder="jperez"
              required
            />
          </div>

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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={theme.label} htmlFor="phone_number">
                Teléfono
              </label>
              <input 
                type="tel" 
                id="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className={theme.input}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div>
              <label className={theme.label} htmlFor="address">
                Dirección
              </label>
              <input 
                type="text" 
                id="address"
                value={formData.address}
                onChange={handleChange}
                className={theme.input}
                placeholder="Calle 123, Maipú"
              />
            </div>
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
              minLength={6}
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              variant="primary" 
              className={`w-full py-3 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </Button>
          </div>
        </form>

        <div className="relative z-10 border-t-2 border-[#d2b08f] pt-4 text-center">
          <p className="text-xs text-[#7f5c40]">
            ¿Ya tienes una credencial? {' '}
            <Link to="/login" className="font-mono text-[#5a3f2b] transition-colors hover:text-[#3f2b1d]">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
