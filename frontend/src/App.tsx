import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import de from './i18n/de.json';
import en from './i18n/en.json';
import AdminDashboard from './pages/AdminDashboard';
import InviteRegister from './pages/InviteRegister';
import LoginPage from './pages/LoginPage';
import MapPage from './pages/MapPage';

const translations = { de, en } as const;

type Locale = keyof typeof translations;

export default function App() {
  const navigate = useNavigate();
  const [locale, setLocale] = useState<Locale>('de');

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved && (saved === 'de' || saved === 'en')) setLocale(saved);
  }, []);

  const t = useMemo(() => translations[locale], [locale]);

  return (
    <div className="layout">
      <header className="navbar">
        <div>{t.appTitle}</div>
        <div className="lang-switcher">
          <button className="secondary" onClick={() => setLocale('de')} aria-label="Deutsch">
            DE
          </button>
          <button className="secondary" onClick={() => setLocale('en')} aria-label="English">
            EN
          </button>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<LoginPage t={t} onLogin={() => navigate('/map')} />} />
        <Route path="/invite" element={<InviteRegister t={t} onRegister={() => navigate('/map')} />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/map" element={<MapPage t={t} />} />
        <Route
          path="*"
          element={
            <div className="card">
              <p>Not found</p>
              <Link to="/">Back to login</Link>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
