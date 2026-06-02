import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { api } from '../lib/apiClient';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER = [-33.5167, -70.7667];

const DraggableMarker = ({ position, onChange }) => {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  return (
    <Marker
      draggable={true}
      icon={DefaultIcon}
      position={[position.lat, position.lng]}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          onChange({ lat: latlng.lat, lng: latlng.lng });
        },
      }}
    >
      <Popup>Arrastra o haz click en el mapa para fijar tu ubicación.</Popup>
    </Marker>
  );
};

const MapsModule = ({ mode, pickupBranch, onPickupBranchChange, shippingCoords, onShippingCoordsChange }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const center = useMemo(() => {
    if (mode === 'delivery' && shippingCoords?.lat && shippingCoords?.lng) {
      return [shippingCoords.lat, shippingCoords.lng];
    }
    if (pickupBranch?.lat && pickupBranch?.lng) {
      return [pickupBranch.lat, pickupBranch.lng];
    }
    return DEFAULT_CENTER;
  }, [mode, pickupBranch, shippingCoords]);

  useEffect(() => {
    const loadBranches = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/orders/branches');
        setBranches(Array.isArray(data) ? data : data?.branches || []);
      } catch {
        setBranches([
          { id: 'maipu', name: 'Sede Maipú', lat: -33.5167, lng: -70.7667 },
          { id: 'centro', name: 'Sede Centro', lat: -33.4378, lng: -70.6505 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadBranches();
  }, []);

  useEffect(() => {
    if (mode === 'delivery' && (!shippingCoords?.lat || !shippingCoords?.lng)) {
      onShippingCoordsChange({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
    }
  }, [mode]);

  return (
    <div className="bg-black/30 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
          {mode === 'pickup' ? 'SUCURSALES' : 'UBICACIÓN_ENVÍO'}
        </div>
        <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
          {loading ? 'CARGANDO...' : mode === 'pickup' ? `${branches.length} sedes` : 'Arrastra el pin'}
        </div>
      </div>

      <div className="h-64">
        <MapContainer center={center} zoom={12} className="h-full w-full">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mode === 'pickup' && branches.map((b) => (
            <Marker
              key={b.id || b.name}
              icon={DefaultIcon}
              position={[b.lat, b.lng]}
              eventHandlers={{
                click: () => onPickupBranchChange(b),
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold">{b.name}</div>
                  <button
                    type="button"
                    onClick={() => onPickupBranchChange(b)}
                    className="mt-2 px-3 py-1 rounded bg-blue-600 text-white text-xs font-bold"
                  >
                    Seleccionar
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {mode === 'delivery' && shippingCoords?.lat && shippingCoords?.lng && (
            <DraggableMarker position={shippingCoords} onChange={onShippingCoordsChange} />
          )}
        </MapContainer>
      </div>

      <div className="p-3 border-t border-gray-800 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
        {mode === 'pickup'
          ? pickupBranch
            ? `SEDE_SELECCIONADA: ${pickupBranch.name}`
            : 'SELECCIONA_UNA_SEDE'
          : shippingCoords
            ? `COORDS: ${shippingCoords.lat.toFixed(5)}, ${shippingCoords.lng.toFixed(5)}`
            : 'DEFINE_TU_UBICACIÓN'}
      </div>
    </div>
  );
};

export default MapsModule;
