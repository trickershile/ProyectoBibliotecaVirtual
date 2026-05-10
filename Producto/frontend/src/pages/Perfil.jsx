import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { deleteCurrentUserAccount, getCurrentUser, updateCurrentUser } from '../api/auth';

const Perfil = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const isDemo = useMemo(() => localStorage.getItem('token') === 'demo', []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const current = await getCurrentUser();
        if (!active) return;
        setUser(current);
        setFormData({
          first_name: current?.first_name || '',
          last_name: current?.last_name || '',
          username: current?.username || '',
          email: current?.email || '',
          phone_number: current?.phone_number || '',
          address: current?.address || '',
        });
      } catch (e) {
        if (active) setError(e?.message || 'No se pudo cargar el perfil.');
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateCurrentUser(formData);
      setUser(updated);
      setSuccess('Cambios guardados (modo demo).');
    } catch (e) {
      setError(e?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const canDelete =
    (user?.username && deleteConfirm.trim() === user.username) || deleteConfirm.trim() === 'ELIMINAR';

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteCurrentUserAccount();
      navigate('/', { replace: true });
    } catch (e) {
      setError(e?.message || 'No se pudo eliminar la cuenta.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-end justify-between gap-4 mb-10 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-4xl font-bold text-white font-mono tracking-tighter uppercase">// MI PERFIL</h1>
          <p className="text-gray-500 text-xs font-mono mt-2">
            {isDemo ? '[MODO_DEMO]' : '[MODO_BACKEND]'} {user?.username ? `usuario=${user.username}` : ''}
          </p>
        </div>
        <Button
          variant="outline"
          className="px-4 py-2 text-xs"
          onClick={() => {
            localStorage.removeItem('token');
            navigate('/', { replace: true });
          }}
        >
          ./cerrar_sesion
        </Button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 space-y-8">
        {loading && (
          <div className="text-gray-400 font-mono text-sm">./cargando_perfil...</div>
        )}

        {!loading && !user && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 p-4 rounded-lg text-xs font-mono">
            [AVISO]: No hay datos de usuario disponibles. Para probar la interfaz sin backend, entra con MODO_DEMO desde el login.
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg text-xs font-mono">
            [ERROR]: {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-lg text-xs font-mono">
            [OK]: {success}
          </div>
        )}

        {!loading && user && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  required
                />
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
                  required
                />
              </div>

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
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="submit"
                variant="primary"
                className={`px-6 py-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? './guardando...' : './guardar_cambios'}
              </Button>
            </div>
          </form>
        )}

        {!loading && user && (
          <div className="border-t border-gray-800 pt-8 space-y-4">
            <h2 className="text-white font-mono tracking-tighter uppercase text-lg">ZONA_PELIGRO</h2>
            <p className="text-gray-400 text-sm">
              Eliminar tu cuenta borrará tus datos del modo demo (en este navegador) y cerrará tu sesión.
            </p>

            <div className="bg-red-600/5 border border-red-600/30 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-gray-500 text-[10px] font-bold mb-1 font-mono uppercase tracking-widest" htmlFor="delete_confirm">
                  CONFIRMA_ESCRIBIENDO "ELIMINAR" O TU USUARIO
                </label>
                <input
                  type="text"
                  id="delete_confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                  placeholder={user?.username || 'ELIMINAR'}
                />
              </div>
              <Button
                type="button"
                variant="danger"
                className={`w-full py-3 text-sm ${(!canDelete || deleting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleDelete}
              >
                {deleting ? './eliminando_cuenta...' : './eliminar_mi_cuenta'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;
