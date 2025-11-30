import { useState } from 'react';
import axios from 'axios';

type Props = { t: Record<string, string>; onLogin: () => void };

export default function LoginPage({ t, onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        '/api/auth/login',
        { email, password },
        { withCredentials: true }
      );
      onLogin();
    } catch (err) {
      console.error(err);
      setError('Login failed');
    }
  };

  return (
    <div className="card">
      <h2>{t.login}</h2>
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
        <button type="submit">{t.login}</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}
