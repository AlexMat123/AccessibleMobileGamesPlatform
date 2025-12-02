import { useEffect } from 'react';
import './App.css';
import './theme.css';
import Home from "./pages/Home";
import Search from "./pages/Search";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Game from "./pages/Game.jsx";
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ToastHost from './components/ToastHost.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import ReportsPage from './pages/Reports.jsx';
import { loadSettings } from './settings';

const applyThemeFromSettings = (settings) => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const isHighContrast = settings?.theme === 'high-contrast' || !!settings?.highContrastMode;
  const theme = settings?.theme === 'dark' ? 'dark' : isHighContrast ? 'dark' : 'light';
  const textSize = ['small', 'large', 'medium'].includes(settings?.textSize) ? settings.textSize : 'medium';
  const spacing = ['snug', 'roomy', 'airy'].includes(settings?.spacing) ? settings.spacing : 'roomy';
  const buttonSize = ['normal', 'large', 'xlarge'].includes(settings?.buttonSize) ? settings.buttonSize : 'normal';
  body.dataset.theme = theme;
  body.dataset.hc = isHighContrast ? 'true' : 'false';
  body.dataset.textSize = textSize;
  body.dataset.spacing = spacing;
  body.dataset.buttonSize = buttonSize;
  // Helps form controls and scrollbars pick the right default colors.
  body.style.colorScheme = (theme === 'dark' || isHighContrast) ? 'dark' : 'light';
  body.style.fontSize = textSize === 'small' ? '14px' : textSize === 'large' ? '18px' : '16px';
};

// Apply theme immediately on first load to avoid white flash before React mounts.
if (typeof window !== 'undefined') {
  applyThemeFromSettings(loadSettings());
}

function App() {
  useEffect(() => {
    const apply = (detail) => applyThemeFromSettings(detail || loadSettings());
    apply();
    const onSettings = (e) => apply(e.detail);
    const onStorage = () => apply();
    // Support both legacy and current event names.
    window.addEventListener('settings-changed', onSettings);
    window.addEventListener('settings:changed', onSettings);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('settings-changed', onSettings);
      window.removeEventListener('settings:changed', onSettings);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <Router>
      <a href="#page-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <div id="page-content" tabIndex="-1" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/games/:id" element={<Game />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/admin"
          element={<AdminRedirect />}
        />
      </Routes>
      <ToastHost />
    </Router>
  );
}

function AdminRedirect() {
  useEffect(() => {
    pushToast('You are not allowed to access /admin. Redirected to home.');
  }, []);
  return <Home />;
}

export default App;
