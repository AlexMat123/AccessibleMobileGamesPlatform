import profile from '../assets/profile.jpg';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, fetchUserReviews } from '../api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [revError, setRevError] = useState('');
  const [revLoading, setRevLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCurrentUser();
        if (!mounted) return;
        setUser(data);
        // fetching recent reviews after user loads
        setRevLoading(true);
        try {
          const revs = await fetchUserReviews(data.id);
          if (mounted) setReviews(revs);
        } catch (e) {
          if (mounted) setRevError(e.message || 'Failed to load reviews');
        } finally {
          if (mounted) setRevLoading(false);
        }
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

            {/* Below the top row: left side spans 2 columns, right column matches Basic Information width */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left side content under the avatar/main info (spans 2 columns) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats row: four equal boxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="User statistics">
                  <StatBox label="Favourites" value={0} />
                  <StatBox label="Watchlist" value={0} />
                  <StatBox label="Reviews" value={reviews.length} />
                  <StatBox label="Helpful Votes" value={0} />
                </div>

                {/* Accessibility needs */}
                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="text-sm font-semibold mb-2">My Accessibility Needs</h3>
                </div>

                {/* Followed Games */}
                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="text-sm font-semibold mb-2">Followed Games</h3>
                </div>
              </div>

              {/* Recent Reviews column on the right (same width as Basic Information) */}
              <div className="bg-white rounded-xl shadow p-4 lg:col-span-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold">Recent Reviews</h3>
                  {revLoading && <span className="text-xs text-gray-500">Loading…</span>}
                </div>
                {revError && <p className="text-xs text-red-600 mb-2">{revError}</p>}
                <div className="space-y-2 overflow-y-auto max-h-64 pr-1" aria-label="User reviews list">
                  {reviews.length === 0 && !revLoading && !revError && (
                    <p className="text-xs text-gray-500">You have not posted any reviews yet.</p>
                  )}
                  {reviews.map(r => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component to display review card
function ReviewCard({ review }) {
  const { game, rating, comment, createdAt } = review;
  const stars = Math.round(rating || 0);
  const starEls = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < stars ? 'text-yellow-500' : 'text-gray-300'}>&#9733;</span>
  ));
  const timeAgo = formatTimeAgo(createdAt);
  return (
    <div className="border rounded-md p-3 bg-gray-50 text-xs text-gray-800">
      <div className="flex justify-between mb-1">
        <span className="font-semibold">{game?.title || 'Game'}</span>
        <span className="text-gray-500">{timeAgo}</span>
      </div>
      <div className="mb-1" aria-label={`Rating ${stars} of 5`}>{starEls}</div>
      <p className="leading-snug">{comment || 'No comment provided.'}</p>
    </div>
  );
}

// Component to display a single stat box
function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center text-center">
      <div className="text-sky-600 text-xl font-semibold" aria-label={`${label} count`}>{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

// function to calculate the time from when the review was posted
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`;
  const yr = Math.floor(day / 365);
  return `${yr} year${yr === 1 ? '' : 's'} ago`;
}
