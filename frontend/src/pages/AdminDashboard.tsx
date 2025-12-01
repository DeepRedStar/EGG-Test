import { useEffect, useState } from 'react';
import api from '../services/api';

type Cache = {
  id: string;
  name: string;
  description: string;
};

type Invite = {
  id: string;
  token: string;
  maxUses: number;
  usedCount: number;
};

type Setting = { key: string; value: string };

export default function AdminDashboard() {
  const [caches, setCaches] = useState<Cache[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);

  useEffect(() => {
    api.get('/api/admin/caches').then((res) => setCaches(res.data.caches));
    api.get('/api/admin/invites').then((res) => setInvites(res.data.invites));
    api.get('/api/admin/settings').then((res) => setSettings(res.data.settings));
  }, []);

  return (
    <div className="card">
      <h2>Admin dashboard</h2>
      <section>
        <h3>Caches</h3>
        <ul>
          {caches.map((cache) => (
            <li key={cache.id}>
              <strong>{cache.name}</strong> - {cache.description}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Invites</h3>
        <ul>
          {invites.map((invite) => (
            <li key={invite.id}>
              {invite.token} ({invite.usedCount}/{invite.maxUses})
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Settings</h3>
        <ul>
          {settings.map((setting) => (
            <li key={setting.key}>
              {setting.key}: {setting.value}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
