import { useEffect, useState } from 'react';
import api from '../services/api';

type Cache = {
  id: string;
  name: string;
  description: string;
  eventId: string;
};

type Invite = {
  id: string;
  token: string;
  maxUses: number;
  usedCount: number;
  eventId: string;
};

type Setting = { key: string; value: string };

type Event = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
};

const editableSettings = [
  'INSTANCE_NAME',
  'DEFAULT_LOCALE',
  'ENABLED_LOCALES',
  'CACHE_VISIBILITY_RADIUS_METERS',
  'CACHE_FOUND_RADIUS_METERS',
  'IMPRESSUM_URL',
  'PRIVACY_URL',
  'SUPPORT_EMAIL',
  'INFO_TEXT_HOME',
];

export default function AdminDashboard() {
  const [caches, setCaches] = useState<Cache[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [cacheForm, setCacheForm] = useState({ name: '', description: '', latitude: '', longitude: '', eventId: '' });
  const [inviteForm, setInviteForm] = useState({ eventId: '', maxUses: 1, expiresAt: '' });
  const [eventForm, setEventForm] = useState({ name: '', slug: '', description: '', isActive: true });
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});

  const loadAll = async () => {
    const [cacheRes, inviteRes, settingsRes, eventRes] = await Promise.all([
      api.get('/api/admin/caches'),
      api.get('/api/admin/invites'),
      api.get('/api/admin/settings'),
      api.get('/api/admin/events'),
    ]);
    setCaches(cacheRes.data.caches);
    setInvites(inviteRes.data.invites);
    setEvents(eventRes.data.events);
    const settingsMap: Record<string, string> = {};
    settingsRes.data.settings.forEach((s: Setting) => {
      settingsMap[s.key] = s.value;
    });
    const defaultEvent = eventRes.data.events[0]?.id ?? '';
    setCacheForm((prev) => ({ ...prev, eventId: prev.eventId || defaultEvent }));
    setInviteForm((prev) => ({ ...prev, eventId: prev.eventId || defaultEvent }));
    setSettingsDraft((draft) => ({ ...draft, ...settingsMap }));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createCache = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/admin/caches', {
      ...cacheForm,
      latitude: Number(cacheForm.latitude),
      longitude: Number(cacheForm.longitude),
    });
    setCacheForm({ name: '', description: '', latitude: '', longitude: '', eventId: cacheForm.eventId });
    loadAll();
  };

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/admin/invites', {
      ...inviteForm,
      maxUses: Number(inviteForm.maxUses),
      expiresAt: inviteForm.expiresAt || undefined,
    });
    setInviteForm({ eventId: inviteForm.eventId, maxUses: 1, expiresAt: '' });
    loadAll();
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/admin/events', eventForm);
    setEventForm({ name: '', slug: '', description: '', isActive: true });
    loadAll();
  };

  const toggleEventActive = async (event: Event) => {
    await api.put(`/api/admin/events/${event.id}`, { isActive: !event.isActive });
    loadAll();
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates = editableSettings.map((key) =>
      api.post('/api/admin/settings', { key, value: settingsDraft[key] ?? '' })
    );
    await Promise.all(updates);
    loadAll();
  };

  return (
    <div className="card">
      <h2>Admin dashboard</h2>

      <section>
        <h3>Events</h3>
        <form onSubmit={createEvent} className="stack">
          <input
            placeholder="Event name"
            value={eventForm.name}
            onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
            required
          />
          <input
            placeholder="Slug (url-friendly)"
            value={eventForm.slug}
            onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={eventForm.description}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
          />
          <label>
            <input
              type="checkbox"
              checked={eventForm.isActive}
              onChange={(e) => setEventForm({ ...eventForm, isActive: e.target.checked })}
            />
            Active
          </label>
          <button type="submit">Create event</button>
        </form>
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <strong>{event.name}</strong> ({event.slug}) - {event.description || 'no description'}{' '}
              <button className="secondary" onClick={() => toggleEventActive(event)}>
                {event.isActive ? 'Disable' : 'Activate'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Create cache</h3>
        <form onSubmit={createCache} className="stack">
          <input
            placeholder="Name"
            value={cacheForm.name}
            onChange={(e) => setCacheForm({ ...cacheForm, name: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={cacheForm.description}
            onChange={(e) => setCacheForm({ ...cacheForm, description: e.target.value })}
            required
          />
          <input
            placeholder="Latitude"
            value={cacheForm.latitude}
            onChange={(e) => setCacheForm({ ...cacheForm, latitude: e.target.value })}
            required
          />
          <input
            placeholder="Longitude"
            value={cacheForm.longitude}
            onChange={(e) => setCacheForm({ ...cacheForm, longitude: e.target.value })}
            required
          />
          <label>
            Event
            <select
              value={cacheForm.eventId}
              onChange={(e) => setCacheForm({ ...cacheForm, eventId: e.target.value })}
              required
            >
              <option value="" disabled>
                Choose event
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Create cache</button>
        </form>
        <ul>
          {caches.map((cache) => (
            <li key={cache.id}>
              <strong>{cache.name}</strong> - {cache.description} (event {cache.eventId})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Invites</h3>
        <form onSubmit={createInvite} className="stack">
          <label>
            Event
            <select
              value={inviteForm.eventId}
              onChange={(e) => setInviteForm({ ...inviteForm, eventId: e.target.value })}
              required
            >
              <option value="" disabled>
                Choose event
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Max uses
            <input
              type="number"
              value={inviteForm.maxUses}
              min={1}
              onChange={(e) => setInviteForm({ ...inviteForm, maxUses: Number(e.target.value) })}
            />
          </label>
          <label>
            Expires at (ISO date)
            <input
              placeholder="2026-12-31T23:59:59Z"
              value={inviteForm.expiresAt}
              onChange={(e) => setInviteForm({ ...inviteForm, expiresAt: e.target.value })}
            />
          </label>
          <button type="submit">Create invite</button>
        </form>
        <ul>
          {invites.map((invite) => (
            <li key={invite.id}>
              {invite.token} ({invite.usedCount}/{invite.maxUses}) – event {invite.eventId}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Settings</h3>
        <form onSubmit={saveSettings} className="stack">
          {editableSettings.map((key) => (
            <label key={key}>
              {key}
              {key === 'INFO_TEXT_HOME' ? (
                <textarea
                  value={settingsDraft[key] || ''}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, [key]: e.target.value })}
                />
              ) : (
                <input
                  value={settingsDraft[key] || ''}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, [key]: e.target.value })}
                />
              )}
            </label>
          ))}
          <button type="submit">Save settings</button>
        </form>
      </section>
    </div>
  );
}
