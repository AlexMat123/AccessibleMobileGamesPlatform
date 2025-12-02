import { useEffect, useRef, useState } from 'react';
import { registerUser } from '../api';
import { pushToast } from '../components/ToastHost.jsx';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const formRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const voiceFieldRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { token } = await registerUser(username, email, password);
      if (token) {
        localStorage.setItem('token', token);
        window.dispatchEvent(new Event('auth-changed'));
      }
      pushToast('successfully registered');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onVoice = (e) => {
      const detail = e.detail || {};
      if (detail.type !== 'auth') return;
      if (detail.form && detail.form !== 'signup') return;

      if (detail.action === 'set-field') {
        e.preventDefault();
        const value = detail.value || '';
        switch (detail.field) {
          case 'username':
            setUsername(value);
            usernameRef.current?.focus({ preventScroll: true });
            voiceFieldRef.current = 'username';
            break;
          case 'email':
          case 'identifier':
            setEmail(value);
            emailRef.current?.focus({ preventScroll: true });
            voiceFieldRef.current = 'email';
            break;
          case 'password':
            setPassword(value);
            passwordRef.current?.focus({ preventScroll: true });
            voiceFieldRef.current = 'password';
            break;
          case 'confirm':
            setConfirm(value);
            confirmRef.current?.focus({ preventScroll: true });
            voiceFieldRef.current = 'confirm';
            break;
          default:
            break;
        }
        return;
      }

      if (detail.action === 'focus') {
        e.preventDefault();
        switch (detail.field) {
          case 'username':
            usernameRef.current?.focus({ preventScroll: true });
            voiceFieldRef.current = 'username';
            break;
          case 'email':
          case 'identifier':
            emailRef.current?.focus({ preventScroll: true });
            voiceFieldRef.current = 'email';
            break;
          case 'password':
            passwordRef.current?.focus({ preventScroll: true });
            voiceFieldRef.current = 'password';
            break;
          case 'confirm':
            confirmRef.current?.focus({ preventScroll: true });
            voiceFieldRef.current = 'confirm';
            break;
          default:
            break;
        }
        return;
      }

      if (detail.action === 'type') {
        e.preventDefault();
        const value = detail.value || '';
        let target = voiceFieldRef.current;
        const active = document.activeElement;
        if (!target) {
          if (active === usernameRef.current) target = 'username';
          if (active === emailRef.current) target = 'email';
          if (active === passwordRef.current) target = 'password';
          if (active === confirmRef.current) target = 'confirm';
        }
        switch (target) {
          case 'username':
            setUsername(value);
            break;
          case 'email':
            setEmail(value);
            break;
          case 'password':
            setPassword(value);
            break;
          case 'confirm':
            setConfirm(value);
            break;
          default:
            break;
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
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirm('');
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
        <h1 className="text-xl font-semibold text-gray-800">Sign up</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Username</label>
          <input
            ref={usernameRef}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            type="email"
            ref={emailRef}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
        <div>
          <label className="block text-sm text-gray-700 mb-1">Confirm password</label>
          <input
            type="password"
            ref={confirmRef}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-md py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
