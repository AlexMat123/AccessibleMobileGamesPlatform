import { useEffect, useRef, useState } from 'react';
import { loginUser } from '../api';
import { pushToast } from '../components/ToastHost.jsx';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const formRef = useRef(null);
  const identifierRef = useRef(null);
  const passwordRef = useRef(null);
  const voiceFieldRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await loginUser(identifier, password);
      localStorage.setItem('token', token);
      window.dispatchEvent(new Event('auth-changed'));
      pushToast('successfully logged in');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onVoice = (e) => {
      const detail = e.detail || {};
      if (detail.type !== 'auth') return;
      if (detail.form && detail.form !== 'login') return;

      if (detail.action === 'set-field') {
        e.preventDefault();
        const value = detail.value || '';
        if (['identifier', 'email', 'username'].includes(detail.field)) {
          setIdentifier(value);
          identifierRef.current?.focus({ preventScroll: true });
          voiceFieldRef.current = 'identifier';
        }
        if (detail.field === 'password') {
          setPassword(value);
          passwordRef.current?.focus({ preventScroll: true });
          voiceFieldRef.current = 'password';
        }
        return;
      }

      if (detail.action === 'focus') {
        e.preventDefault();
        if (detail.field === 'identifier' || detail.field === 'email' || detail.field === 'username') {
          identifierRef.current?.focus({ preventScroll: true });
          voiceFieldRef.current = 'identifier';
        }
        if (detail.field === 'password') {
          passwordRef.current?.focus({ preventScroll: true });
          voiceFieldRef.current = 'password';
        }
        return;
      }

      if (detail.action === 'type') {
        e.preventDefault();
        const value = detail.value || '';
        const active = document.activeElement;
        let target = voiceFieldRef.current;
        if (!target) {
          if (active === identifierRef.current) target = 'identifier';
          if (active === passwordRef.current) target = 'password';
        }
        if (target === 'identifier') {
          setIdentifier(value);
        }
        if (target === 'password') {
          setPassword(value);
        }
        return;
      }

      if (detail.action === 'submit') {
        e.preventDefault();
        if (formRef.current?.requestSubmit) {
          formRef.current.requestSubmit();
        } else {
          onSubmit({ preventDefault: () => {} });
        }
        return;
      }

      if (detail.action === 'clear') {
        e.preventDefault();
        setIdentifier('');
        setPassword('');
        setError('');
        voiceFieldRef.current = null;
      }
    };
    window.addEventListener('voiceCommand', onVoice);
    return () => window.removeEventListener('voiceCommand', onVoice);
  }, []);

  return (
    <div className="min-h-screen bg-sky-100 flex items-center justify-center p-6">
      <form ref={formRef} onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-800">Log in</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email or Username</label>
          <input
            ref={identifierRef}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="you@example.com or username"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Password</label>
          <input
            type="password"
            ref={passwordRef}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-md py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
