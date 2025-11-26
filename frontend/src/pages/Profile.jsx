import profile from '../assets/profile.jpg';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, fetchUserReviews, getAccessibilityPreferences, updateAccessibilityPreferences, getFollowedGames, updateUserProfile, changeUserPassword } from '../api';
import { pushToast } from '../components/ToastHost.jsx';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [revError, setRevError] = useState('');
  const [revLoading, setRevLoading] = useState(false);
  const [prefs, setPrefs] = useState({ visual: false, motor: false, cognitive: false, hearing: false });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsError, setPrefsError] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [followedGames, setFollowedGames] = useState([]);
  const [fgIndex, setFgIndex] = useState(0); // carousel index

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // for carousel display
  const VISIBLE = 5;
  const getWindow = (arr, start, size) => Array.from({ length: Math.min(size, arr.length) }, (_, k) => arr[(start + k) % arr.length]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCurrentUser();
        if (!mounted) return;
        setUser(data);
        setEditForm({ username: data.username || '', email: data.email || '' });
        // load accessibility prefs
        setPrefsLoading(true);
        try {
          const loaded = await getAccessibilityPreferences(data.id);
          if (mounted) setPrefs({
            visual: !!loaded.visual,
            motor: !!loaded.motor,
            cognitive: !!loaded.cognitive,
            hearing: !!loaded.hearing
          });
        } catch (e) {
          if (mounted) setPrefsError(e.message || 'Failed to load accessibility preferences');
        } finally {
          if (mounted) setPrefsLoading(false);
        }
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
        // fetching followed games after user loads
        try {
          const games = await getFollowedGames(data.id);
          if (mounted) setFollowedGames(games);
        } catch { /* ignore */ }
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // resetting carousel index when list changes
  useEffect(() => { setFgIndex(0); }, [followedGames]);

  function handleSavePrefs(e) {
    e.preventDefault();
    if (!user) return;
    setSavingPrefs(true);
    updateAccessibilityPreferences(user.id, prefs)
      .then(saved => { setPrefs(saved); pushToast('Accessibility preferences updated'); })
      .catch(err => { setPrefsError(err.message || 'Failed to save preferences'); })
      .finally(() => setSavingPrefs(false));
  }

  function onOpenEdit() { setEditError(''); setShowEdit(true); }
  function onOpenPwd() { setPwdError(''); setShowPwd(true); }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!user) return;
    setSavingEdit(true);
    try {
      const updated = await updateUserProfile(user.id, { username: editForm.username, email: editForm.email });
      setUser(u => ({ ...u, username: updated.username, email: updated.email }));
      pushToast('Profile updated');
      setShowEdit(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update profile');
    } finally { setSavingEdit(false); }
  }

  async function handleSavePwd(e) {
    e.preventDefault();
    if (!user) return;
    setSavingPwd(true);
    try {
      await changeUserPassword(user.id, pwdForm.currentPassword, pwdForm.newPassword);
      pushToast('Password updated');
      setShowPwd(false);
      setPwdForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwdError(err.message || 'Failed to change password');
    } finally { setSavingPwd(false); }
  }

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
                  <button className="flex-1 bg-sky-600 text-white text-sm font-medium py-2 rounded-md" onClick={onOpenEdit}>
                    Edit Profile
                  </button>
                  <button className="flex-1 bg-sky-500 text-white text-sm font-medium py-2 rounded-md" onClick={onOpenPwd}>
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Main lower grid: left (stats + accessibility), right (reviews), then followed games full width */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Left side (stats + accessibility) */}
              <div className="lg:col-span-2 flex flex-col">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" aria-label="User statistics">
                  <StatBox label="Favourites" value={0} />
                  <StatBox label="Watchlist" value={0} />
                  <StatBox label="Reviews" value={reviews.length} />
                  <StatBox label="Helpful Votes" value={0} />
                </div>                {/* Accessibility needs (fixed height, button bottom-right) */}
                <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between h-[206px]">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">My Accessibility Needs</h3>
                    {prefsLoading && <p className="text-xs text-gray-500">Loading preferences…</p>}
                    {prefsError && <p className="text-xs text-red-600 mb-2">{prefsError}</p>}
                    <form onSubmit={handleSavePrefs} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Checkbox id="pref-visual" label="Visual Impairments" desc="Recommend games with visual accessibility" checked={prefs.visual} onChange={(v) => setPrefs(p => ({ ...p, visual: v }))} />
                        <Checkbox id="pref-cognitive" label="Cognitive Support" desc="Recommend games with cognitive support" checked={prefs.cognitive} onChange={(v) => setPrefs(p => ({ ...p, cognitive: v }))} />
                        <Checkbox id="pref-motor" label="Motor Impairments" desc="Recommend games with motor accessibility" checked={prefs.motor} onChange={(v) => setPrefs(p => ({ ...p, motor: v }))} />
                        <Checkbox id="pref-hearing" label="Hearing Impairments" desc="Recommend games with hearing accessibility" checked={prefs.hearing} onChange={(v) => setPrefs(p => ({ ...p, hearing: v }))} />
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={savingPrefs} className="px-3 py-1 rounded-md text-xs font-medium bg-sky-600 text-white disabled:opacity-50">
                          {savingPrefs ? 'Saving…' : 'Confirm Preferences'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Recent Reviews (match accessibility height) */}
              <div className="bg-white rounded-xl shadow p-4 lg:col-span-1 flex flex-col h-[306px]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold">Recent Reviews</h3>
                  {revLoading && <span className="text-xs text-gray-500">Loading…</span>}
                </div>
                {revError && <p className="text-xs text-red-600 mb-2">{revError}</p>}
                <div className="space-y-2 overflow-y-auto pr-1 flex-1" aria-label="User reviews list">
                  {reviews.length === 0 && !revLoading && !revError && (
                    <p className="text-xs text-gray-500">You have not posted any reviews yet.</p>
                  )}
                  {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                </div>
              </div>
            </div>

            {/* Followed Games full width */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="text-sm font-semibold mb-2">Followed Games</h3>
              {followedGames.length === 0 && (
                <p className="text-xs text-gray-500">You are not following any games yet.</p>
              )}
              {followedGames.length > 0 && followedGames.length <= VISIBLE && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {followedGames.map(g => (
                    <a key={g.id} href={`/games/${g.id}`} className="block group">
                      <div className="aspect-video bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                        {g.images && g.images.length ? (
                          <img src={g.images[0]} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <span className="text-[10px] text-gray-500">No image</span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] font-medium truncate" title={g.title}>{g.title}</div>
                    </a>
                  ))}
                </div>
              )}
              {followedGames.length > VISIBLE && (
                <div className="relative">
                  {/* Left arrow */}
                  <button
                    aria-label="Previous followed games"
                    onClick={() => setFgIndex(i => (i - 1 + followedGames.length) % followedGames.length)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center"
                  >
                    <span className="text-sm">&lt;</span>
                  </button>
                  {/* Right arrow */}
                  <button
                    aria-label="Next followed games"
                    onClick={() => setFgIndex(i => (i + 1) % followedGames.length)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center"
                  >
                    <span className="text-sm">&gt;</span>
                  </button>
                  <div className="mx-10">
                    <div className="grid grid-cols-5 gap-4">
                      {getWindow(followedGames, fgIndex, VISIBLE).map(g => (
                        <a key={`${g.id}-${fgIndex}`} href={`/games/${g.id}`} className="block group">
                          <div className="aspect-video bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                            {g.images && g.images.length ? (
                              <img src={g.images[0]} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <span className="text-[10px] text-gray-500">No image</span>
                            )}
                          </div>
                          <div className="mt-1 text-[11px] font-medium truncate" title={g.title}>{g.title}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Profile modal */}
            {showEdit && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
                  <h3 className="text-base font-semibold mb-3">Edit Profile</h3>
                  {editError && <p className="text-xs text-red-600 mb-2">{editError}</p>}
                  <form onSubmit={handleSaveEdit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                      <input type="text" value={editForm.username} onChange={(e) => setEditForm(f => ({ ...f, username: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowEdit(false)} className="px-3 py-1 rounded-md text-xs font-medium bg-gray-200">Cancel</button>
                      <button type="submit" disabled={savingEdit} className="px-3 py-1 rounded-md text-xs font-medium bg-sky-600 text-white">{savingEdit ? 'Updating…' : 'Update Profile'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Change Password modal */}
            {showPwd && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
                  <h3 className="text-base font-semibold mb-3">Change Password</h3>
                  {pwdError && <p className="text-xs text-red-600 mb-2">{pwdError}</p>}
                  <form onSubmit={handleSavePwd} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                      <input type="password" value={pwdForm.currentPassword} onChange={(e) => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                      <input type="password" value={pwdForm.newPassword} onChange={(e) => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowPwd(false)} className="px-3 py-1 rounded-md text-xs font-medium bg-gray-200">Cancel</button>
                      <button type="submit" disabled={savingPwd} className="px-3 py-1 rounded-md text-xs font-medium bg-sky-600 text-white">{savingPwd ? 'Updating…' : 'Update Password'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

function Checkbox({ id, label, desc, checked, onChange }) {
  return (
    <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-md p-2">
      <input
        id={id}
        type="checkbox"
        className="mt-1 accent-sky-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} className="text-xs leading-snug cursor-pointer select-none">
        <span className="font-medium">{label}</span><br />
        <span className="text-gray-600">{desc}</span>
      </label>
    </div>
  );
}
