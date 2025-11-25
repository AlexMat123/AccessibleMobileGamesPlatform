import profile from '../assets/profile.jpg';
import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '../api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCurrentUser();
        if (!mounted) return;
        setUser(data);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleString('en-GB', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-sky-100 flex justify-center py-10">
      <div className="w-full max-w-6xl bg-gray-100 rounded-2xl shadow-lg p-8">
        {loading && <p className="text-gray-700">Loading profile…</p>}
        {!loading && error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {!loading && !error && user && (
          <div>
            {/* Top row containing user information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Avatar + main user info */}
              <div className="bg-white rounded-xl shadow p-4 flex gap-4 items-center lg:col-span-2">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  <img src={profile} alt="User avatar" className="w-20 h-20 object-cover rounded-full" />
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-semibold text-gray-900">{user.username}</h1>
                  <p className="text-sm text-gray-700">{user.email}</p>
                  {memberSince && (
                    <p className="text-xs text-gray-500 mt-2">Member Since <span className="font-medium">{memberSince}</span></p>
                  )}
                </div>
              </div>

              {/* Basic information box */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Basic Information</h2>
                  <div className="space-y-1 text-sm text-gray-800">
                    <div><span className="font-medium">Username:</span> {user.username}</div>
                    <div><span className="font-medium">Email:</span> {user.email}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button className="flex-1 bg-sky-600 text-white text-sm font-medium py-2 rounded-md opacity-60 cursor-not-allowed" disabled>
                    Edit Profile
                  </button>
                  <button className="flex-1 bg-sky-500 text-white text-sm font-medium py-2 rounded-md opacity-60 cursor-not-allowed" disabled>
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* stats, accessibility needs, reviews, followed games will be added later in this section */}
            <div className="text-sm text-gray-500">
              more to add here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
