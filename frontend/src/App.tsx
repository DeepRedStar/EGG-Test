import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import de from './i18n/de.json';
import en from './i18n/en.json';
import AdminDashboard from './pages/AdminDashboard';
import InviteRegister from './pages/InviteRegister';
import LoginPage from './pages/LoginPage';
import MapPage from './pages/MapPage';
import SetupPage from './pages/SetupPage';
import api from './services/api';

const translations = { de, en } as const;

type Locale = keyof typeof translations;

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [locale, setLocale] = useState<Locale>('de');
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved && (saved === 'de' || saved === 'en')) setLocale(saved);
  }, []);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await api.get('/setup/status');
        const needsSetup = !response.data.setupComplete;
        setSetupRequired(needsSetup);
        if (needsSetup && location.pathname !== '/setup') {
          navigate('/setup', { replace: true });
        }
        if (!needsSetup && location.pathname === '/setup') {
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Failed to check setup status', err);
        setSetupRequired(false);
      }
    };
    checkSetup();
  }, [location.pathname, navigate]);

  const handleSetupComplete = () => {
    setSetupRequired(false);
    navigate('/admin');
  };

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
      {setupRequired === null ? (
        <div className="card">Loading setup state...</div>
      ) : (
        <Routes>
          {setupRequired ? (
            <>
              <Route path="/setup" element={<SetupPage t={t} onComplete={handleSetupComplete} />} />
              <Route path="*" element={<Navigate to="/setup" replace />} />
            </>
          ) : (
            <>
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
            </>
          )}
        </Routes>
      )}
    </div>
  );
}
