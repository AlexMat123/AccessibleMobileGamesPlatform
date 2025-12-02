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
import { loadSettings } from './settings';

const applyThemeFromSettings = (settings) => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const theme = settings?.theme === 'dark' ? 'dark' : 'light';
  const highContrast = !!settings?.highContrastMode;
  body.dataset.theme = theme;
  body.dataset.hc = highContrast ? 'true' : 'false';
  // Helps form controls and scrollbars pick the right default colors.
  body.style.colorScheme = (theme === 'dark' || highContrast) ? 'dark' : 'light';
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
    window.addEventListener('settings-changed', onSettings);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('settings-changed', onSettings);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/games/:id" element={<Game />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <ToastHost />
    </Router>
  );
}

export default App;
