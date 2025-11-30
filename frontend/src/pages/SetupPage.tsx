import { useState } from 'react';
import api from '../services/api';

type Props = { t: Record<string, string>; onComplete: () => void };

export default function SetupPage({ t, onComplete }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [instanceName, setInstanceName] = useState(import.meta.env.VITE_INSTANCE_NAME || 'Egg Hunt');
  const [defaultLocale, setDefaultLocale] = useState('de');
  const [enabledLocales, setEnabledLocales] = useState('de,en');
  const [impressumUrl, setImpressumUrl] = useState('');
  const [privacyUrl, setPrivacyUrl] = useState('');
  const [supportEmail, setSupportEmail] = useState('support@example.com');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/setup/initialize', {
        email,
        password,
        passwordConfirm,
        instanceName,
        defaultLocale,
        enabledLocales,
        impressumUrl,
        privacyUrl,
        supportEmail,
      });
      onComplete();
    } catch (err) {
      console.error(err);
      setError(t.setupError || 'Setup failed');
    }
  };

  return (
    <div className="card">
      <h2>{t.setupTitle}</h2>
      <p>{t.setupIntro}</p>
      <form onSubmit={submit}>
        <label>
          {t.adminEmail}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t.password}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} />
        </label>
        <label>
          {t.passwordConfirm}
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={10}
          />
        </label>
        <label>
          {t.instanceName}
          <input value={instanceName} onChange={(e) => setInstanceName(e.target.value)} required />
        </label>
        <label>
          {t.defaultLocale}
          <input value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)} required />
        </label>
        <label>
          {t.enabledLocales}
          <input value={enabledLocales} onChange={(e) => setEnabledLocales(e.target.value)} required />
        </label>
        <label>
          {t.impressumUrl}
          <input value={impressumUrl} onChange={(e) => setImpressumUrl(e.target.value)} />
        </label>
        <label>
          {t.privacyUrl}
          <input value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)} />
        </label>
        <label>
          {t.supportEmail}
          <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required />
        </label>
        <button type="submit">{t.completeSetup}</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}
