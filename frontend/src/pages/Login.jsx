import { useState } from 'react';
import { loginUser } from '../api';
import { pushToast } from '../components/ToastHost.jsx';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-sky-100 flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-800">Log in</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email or Username</label>
          <input
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
