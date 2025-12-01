import { useState } from 'react';
import api from '../services/api';

type Props = { t: Record<string, string>; onRegister: () => void };

export default function InviteRegister({ t, onRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', { email, password, token });
      onRegister();
    } catch (err) {
      console.error(err);
      setError('Registration failed');
    }
  };

  return (
    <div className="card">
      <h2>{t.register}</h2>
      <form onSubmit={submit}>
        <label>
          {t.email}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t.password}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
          />
        </label>
        <label>
          {t.invitePlaceholder}
          <input value={token} onChange={(e) => setToken(e.target.value)} required />
        </label>
        <button type="submit">{t.register}</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}
