import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { shippingApi } from '../api/shipping';

const ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER = [-33.5167, -70.7667];
const DEFAULT_ZOOM = 11;

const FALLBACK = [
  { id: 1, nombre: 'Sede Maipú', direccion: 'Maipú, Santiago', lat: -33.5167, lng: -70.7667 },
  { id: 2, nombre: 'Sede Centro', direccion: 'Santiago Centro', lat: -33.4378, lng: -70.6505 },
];

const BibliotecaMap = () => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await shippingApi.getLibraryLocations();
        setLibraries(Array.isArray(data) ? data : []);
      } catch {
        setLibraries(FALLBACK);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="px-4">
      <h2 className="mx-auto mb-10 max-w-md border-b-2 border-[#b9926d] pb-4 text-center font-mono text-3xl font-bold uppercase tracking-tighter text-[#6a4a33]">
        NUESTRAS BIBLIOTECAS
      </h2>

      <div className="relative overflow-hidden rounded-2xl border-2 border-[#b9926d] bg-[#fffaf4] shadow-[0_16px_36px_rgba(95,69,47,0.16)]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#fffaf4]/80">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#6a4a33]">Cargando...</span>
          </div>
        )}

        <div className="h-[400px] w-full">
          <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full" scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {libraries.map((lib) => {
              const lat = parseFloat(lib.lat);
              const lng = parseFloat(lib.lng);
              if (isNaN(lat) || isNaN(lng)) return null;
              return (
                <Marker key={lib.id || lib.nombre} icon={ICON} position={[lat, lng]}>
                  <Popup>
                    <div className="font-sans text-sm leading-tight">
                      <p className="font-bold text-[#4b3525]">{lib.nombre}</p>
                      {lib.direccion && (
                        <p className="mt-1 text-xs text-[#6f523c]">{lib.direccion}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className="border-t border-[#d2b08f] px-6 py-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#6f523c]">
            <span>{libraries.length} biblioteca{libraries.length !== 1 ? 's' : ''} registrada{libraries.length !== 1 ? 's' : ''}</span>
            <span className="text-[#d2b08f]">|</span>
            <span>Haz clic en cada marcador para ver detalles</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BibliotecaMap;
