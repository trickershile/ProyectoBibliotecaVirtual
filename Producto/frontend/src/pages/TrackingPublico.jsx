import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, Search, Truck } from 'lucide-react';
import { shippingApi } from '../api/shipping';

const TrackingPublico = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('codigo') || '';
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState('');

  const fetchTracking = useCallback(async (rawCode, persistSearch = false) => {
    const trimmedCode = rawCode.trim().toUpperCase();
    if (!trimmedCode) {
      setTracking(null);
      setError('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      if (persistSearch) {
        setSearchParams({ codigo: trimmedCode });
      }
      const response = await shippingApi.getTracking(trimmedCode);
      setTracking(response);
    } catch (err) {
      console.error('Error al consultar tracking:', err);
      setTracking(null);
      setError('No se encontró un envío con ese código.');
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    const normalizedCode = initialCode.trim().toUpperCase();
    setCode(normalizedCode);
    if (normalizedCode) {
      fetchTracking(normalizedCode);
    } else {
      setTracking(null);
      setError('');
    }
  }, [initialCode, fetchTracking]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchTracking(code, true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-blue-500 flex items-center gap-3">
            <Truck className="w-8 h-8" /> SEGUIMIENTO_DE_ENVÍO
          </h1>
          <p className="text-gray-500 mt-2">Consulta el estado de tu despacho usando el código de seguimiento_</p>
        </div>

        <form onSubmit={handleSearch} className="rounded-3xl border border-gray-800 bg-gray-900/20 p-6 space-y-4">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">CÓDIGO_DE_TRACKING</label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: LV-1A2B3C4D"
                className="w-full bg-black/40 border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-100 outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              CONSULTAR
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-[11px] text-red-300 uppercase tracking-widest">
            {error}
          </div>
        )}

        {tracking && (
          <div className="rounded-3xl border border-gray-800 bg-gray-900/20 overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">CÓDIGO</p>
                <p className="text-xl font-black text-white uppercase">{tracking.codigo_seguimiento}</p>
              </div>
              <span className="px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase tracking-widest">
                {tracking.estado_envio}
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">ORDEN_ASOCIADA</p>
                <p className="text-sm text-white font-bold">#{tracking.orden_id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">DESTINO</p>
                <p className="text-sm text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  {tracking.direccion_destino || 'Retiro en biblioteca'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link to="/catalogo" className="text-blue-400 hover:text-blue-300 text-[10px] font-black uppercase tracking-widest">
            VOLVER_AL_CATÁLOGO
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackingPublico;
