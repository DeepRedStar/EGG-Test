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

type Event = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export default function MapPage({ t }: Props) {
  const [position, setPosition] = useState<Location | null>(null);
  const [caches, setCaches] = useState<Cache[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventError, setEventError] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await api.get('/api/player/events');
        setEvents(response.data.events);
        const stored = localStorage.getItem('selectedEventId');
        const validStored = response.data.events.find((event: Event) => event.id === stored);
        if (validStored) {
          setSelectedEventId(validStored.id);
        } else if (response.data.events.length === 1) {
          setSelectedEventId(response.data.events[0].id);
          localStorage.setItem('selectedEventId', response.data.events[0].id);
        }
      } catch (err) {
        console.error('Failed to load events', err);
        setEventError('Unable to load events');
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation || !selectedEventId) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setPosition(coords);
      loadCaches(coords, selectedEventId);
    });
  }, [selectedEventId]);

  const loadCaches = async (coords: Location, eventId: string) => {
    const response = await api.post('/api/player/caches/nearby', { ...coords, eventId });
    setCaches(response.data.caches);
  };

  const selectEvent = (eventId: string) => {
    setCaches([]);
    setSelectedEventId(eventId);
    localStorage.setItem('selectedEventId', eventId);
  };

  return (
    <div className="card">
      <h2>{t.findCache}</h2>
      {!selectedEventId && (
        <div>
          <p>{events.length === 0 ? t.noEventsAvailable || 'No active events' : t.chooseEvent || 'Choose an event'}:</p>
          {events.map((event) => (
            <button key={event.id} className="secondary" onClick={() => selectEvent(event.id)}>
              {event.name} {event.description ? `- ${event.description}` : ''}
            </button>
          ))}
          {eventError && <p>{eventError}</p>}
        </div>
      )}
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
