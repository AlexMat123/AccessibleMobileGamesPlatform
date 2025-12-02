import { useEffect } from 'react';
import './App.css';
import './theme.css';
import Home from "./pages/Home";
import Search from "./pages/Search";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Game from "./pages/Game.jsx";
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ToastHost from './components/ToastHost.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import { loadSettings } from './settings';
import Library from './pages/Library.jsx';

const applyThemeFromSettings = (settings) => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const theme = settings?.theme === 'dark' ? 'dark' : 'light';
  const highContrast = !!settings?.highContrastMode;
  const textSize = ['small', 'large', 'medium'].includes(settings?.textSize) ? settings.textSize : 'medium';
  const spacing = ['snug', 'roomy', 'airy'].includes(settings?.spacing) ? settings.spacing : 'roomy';
  const buttonSize = ['normal', 'large', 'xlarge'].includes(settings?.buttonSize) ? settings.buttonSize : 'normal';
  body.dataset.theme = theme;
  body.dataset.hc = highContrast ? 'true' : 'false';
  body.dataset.textSize = textSize;
  body.dataset.spacing = spacing;
  body.dataset.buttonSize = buttonSize;
  // Helps form controls and scrollbars pick the right default colors.
  body.style.colorScheme = (theme === 'dark' || highContrast) ? 'dark' : 'light';
  body.style.fontSize = textSize === 'small' ? '14px' : textSize === 'large' ? '18px' : '16px';
};

// Apply theme immediately on first load to avoid white flash before React mounts.
if (typeof window !== 'undefined') {
  applyThemeFromSettings(loadSettings());
}

// function to handle voice commands in library
function VoiceNavigator() {
  const navigate = useNavigate();
  useEffect(() => {
    const normalize = (s = '') => String(s).toLowerCase().replace(/[.,!?]/g, '').trim();
    const onVoice = (e) => {
      const detail = e.detail || {};
      const type = detail?.type;
      if (type === 'navigate') {
        const target = normalize(detail.target || '');
        if (target === 'library') {
          e.preventDefault?.();
          navigate('/library');
          return;
        }
        if (target === 'wishlist' || target === 'favourites' || target === 'favorites') {
          e.preventDefault?.();
          navigate('/library');
          setTimeout(() => {
            // this prevents duplicate tab switching dispatches
            if (window.__voiceTabSwitching) return;
            window.__voiceTabSwitching = true;
            // First switch tab
            const evtTab = new CustomEvent('voiceCommand', { detail: { type: 'navigate', target } });
            window.dispatchEvent(evtTab);
            const utter = String(detail.utterance || '');
            const m = utter.match(/(?:remove|delete)\s+(.+?)\s+from\s+(favourites|favorites|wishlist)/i);
            if (m) {
              const title = m[1].trim();
              const listRaw = m[2].toLowerCase();
              const list = listRaw === 'wishlist' ? 'wishlist' : 'favourites';
              const evtRemove = new CustomEvent('voiceCommand', { detail: { type: 'library', action: 'remove', list, title } });
              // slight delay to allow Library to render list
              setTimeout(() => window.dispatchEvent(evtRemove), 150);
            }
            // clear guard after a short debounce window
            setTimeout(() => { window.__voiceTabSwitching = false; }, 500);
          }, 150);
          return;
        }
      }
      // fallback, some controllers emit game-card for "open library"
      if (type === 'game-card' && detail?.action === 'open') {
        const title = normalize(detail.title || '');
        if (title === 'library' || title === 'my library') {
          e.preventDefault?.();
          navigate('/library');
          return;
        }
      }
    };
    window.addEventListener('voiceCommand', onVoice);
    return () => window.removeEventListener('voiceCommand', onVoice);
  }, [navigate]);
  return null;
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
      <VoiceNavigator />
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
        <Route path="/library" element={<Library />} />
      </Routes>
      <ToastHost />
    </Router>
  );
}

export default App;
