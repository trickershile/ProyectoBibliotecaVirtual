import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, Search, Truck } from 'lucide-react';
import { shippingApi } from '../api/shipping';
import { formatTrackingStatus } from '../lib/labels';
import { statusStyles, theme } from '../lib/theme';

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
    <div className={theme.pageShell}>
      <div className={theme.narrowContainer}>
        <div className={theme.pageHeader}>
          <h1 className={theme.pageTitleRow}>
            <Truck className="w-8 h-8" /> Seguimiento de envío
          </h1>
          <p className={theme.pageSubtitle}>Consulta el estado de tu despacho usando el código de seguimiento.</p>
        </div>

        <form onSubmit={handleSearch} className={`${theme.sectionCard} space-y-4`}>
          <label className={theme.label}>Código de tracking</label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: LV-1A2B3C4D"
                className={`${theme.input} pl-11`}
              />
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9d7553]" />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className={`${theme.primaryButton} flex items-center justify-center gap-2 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              Consultar
            </button>
          </div>
        </form>

        {error && (
          <div className={`rounded-2xl p-5 text-[11px] uppercase tracking-widest ${theme.sectionCardCompact} ${statusStyles.danger}`}>
            {error}
          </div>
        )}

        {tracking && (
          <div className={`${theme.sectionCard} overflow-hidden p-0`}>
            <div className="flex flex-col justify-between gap-4 border-b-2 border-[#d2b08f] p-5 md:flex-row md:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7f5c40]">Código</p>
                <p className="text-xl font-black uppercase text-[#5a3f2b]">{tracking.codigo_seguimiento}</p>
              </div>
              <span className={`${theme.statusBadge} ${statusStyles.info}`}>
                {formatTrackingStatus(tracking.estado_envio)}
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7f5c40]">Orden asociada</p>
                <p className="text-sm font-bold text-[#5a3f2b]">#{tracking.orden_id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7f5c40]">Destino</p>
                <p className="flex items-center gap-2 text-sm text-[#6f523c]">
                  <MapPin className="h-4 w-4 text-[#8f6443]" />
                  {tracking.direccion_destino || 'Retiro en biblioteca'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link to="/catalogo" className="text-[10px] font-black uppercase tracking-widest text-[#7f5c40] transition-colors hover:text-[#5a3f2b]">
            Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackingPublico;
