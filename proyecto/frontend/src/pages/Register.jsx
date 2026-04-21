import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { registerUser } from '../api/auth';

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
      await registerUser(formData);
      // Éxito: Redirigir al login
      navigate('/login', { state: { message: 'Registro completado. Por favor inicia sesión.' } });
    } catch (err) {
      setError(err.message || 'Error al procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans">
      <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 relative overflow-hidden group">
        {/* Efecto de luz de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-500"></div>
        
        <div className="text-center relative z-10">
          <h1 className="text-3xl font-bold text-white font-mono tracking-tighter uppercase">
            {'>'} REGISTRAR_NUEVO_USUARIO
          </h1>
          <p className="text-gray-400 mt-2">Crea tu credencial de socio para acceder al sistema</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-xs font-mono relative z-10 animate-pulse">
            [ERROR]: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 font-mono uppercase tracking-widest" htmlFor="first_name">
                NOMBRE
              </label>
              <input 
                type="text" 
                id="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                placeholder="Juan"
                required
              />
            </div>
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 font-mono uppercase tracking-widest" htmlFor="last_name">
                APELLIDO
              </label>
              <input 
                type="text" 
                id="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                placeholder="Pérez"
                required
              />
            </div>
          </div>

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
              placeholder="jperez_dev"
              required
            />
          </div>

          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-1 font-mono uppercase tracking-widest" htmlFor="email">
              CORREO_ELECTRÓNICO
            </label>
            <input 
              type="email" 
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
              placeholder="usuario@sistema.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 font-mono uppercase tracking-widest" htmlFor="phone_number">
                TELÉFONO
              </label>
              <input 
                type="tel" 
                id="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 font-mono uppercase tracking-widest" htmlFor="address">
                DIRECCIÓN_HOGAR
              </label>
              <input 
                type="text" 
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                placeholder="Calle 123, Maipú"
              />
            </div>
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

          <div className="pt-4">
            <Button 
              type="submit" 
              variant="primary" 
              className={`w-full py-3 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? './procesando...' : './ejecutar_registro'}
            </Button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-gray-800/50 relative z-10">
          <p className="text-gray-500 text-xs">
            ¿Ya tienes una credencial? {' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400 font-mono transition-colors">
              ./volver_al_inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
