import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const defaultPosition: [number, number] = [52.52, 13.405];

type Props = { t: Record<string, string> };

type Cache = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  foundBy: Array<{ userId: string }>;
};

type Location = { latitude: number; longitude: number };

export default function MapPage({ t }: Props) {
  const [position, setPosition] = useState<Location | null>(null);
  const [caches, setCaches] = useState<Cache[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setPosition(coords);
      loadCaches(coords);
    });
  }, []);

  const loadCaches = async (coords: Location) => {
    const response = await api.post('/api/player/caches/nearby', coords);
    setCaches(response.data.caches);
  };

  return (
    <div className="card">
      <h2>{t.findCache}</h2>
      <div style={{ height: '60vh' }}>
        <MapContainer center={position ? [position.latitude, position.longitude] : defaultPosition} zoom={14} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          {position && (
            <Marker position={[position.latitude, position.longitude]}>
              <Popup>Du bist hier</Popup>
            </Marker>
          )}
          {caches.map((cache) => (
            <Marker key={cache.id} position={[cache.latitude, cache.longitude]}>
              <Popup>
                <strong>{cache.name}</strong>
                <p>{cache.description}</p>
                {cache.foundBy.length > 0 ? <span>{t.found}</span> : null}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
