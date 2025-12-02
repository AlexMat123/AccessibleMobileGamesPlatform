import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCurrentUser, getFollowedGames } from '../api.js';

export default function Library() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('favourites');
  const [query, setQuery] = useState('');

  const [favourites, setFavourites] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const me = await fetchCurrentUser();
        setUser(me);
        const followed = await getFollowedGames(me.id);
        setFavourites(followed);
      } catch (e) {
        setError(e.message || 'Failed to load library');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const filteredFav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favourites;
    return favourites.filter(g => (g.title || '').toLowerCase().includes(q));
  }, [query, favourites]);

  const filteredWish = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wishlist;
    return wishlist.filter(g => (g.title || '').toLowerCase().includes(q));
  }, [query, wishlist]);

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!user) return null;

  const renderCard = (g) => (
    <div key={g.id} className="relative flex items-start gap-4 theme-surface border theme-border rounded-xl p-4">
      <img src={(Array.isArray(g.images) && g.images[0]) || '/placeholder1.png'} alt={g.title} className="w-28 h-20 object-cover rounded-md" />
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{g.title}</h3>
        <p className="text-xs theme-muted">Developer • Category</p>
        <div className="mt-1 text-yellow-500 text-sm">★★★★★ <span className="theme-muted text-xs">4.5 (1000)</span></div>
        <div className="mt-2 flex gap-2">
          {(g.tags || []).slice(0,3).map((t, i) => (
            <span key={i} className="bg-gray-200 text-gray-700 px-2 py-[2px] rounded-full text-[10px] leading-none">{typeof t === 'string' ? t : t?.name || ''}</span>
          ))}
        </div>
      </div>
      <div className="absolute right-3 top-3 flex gap-2">
        {tab === 'favourites' ? (
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded-md">♥</button>
        ) : (
          <button className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded-md">✚</button>
        )}
        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-md">X</button>
      </div>
      <div className="absolute right-3 bottom-3">
        <Link to={`/games/${g.id}`} className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded-md text-sm">View Details</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-sky-100 min-h-screen flex justify-center py-10 lg:pb-20">
      <div className="bg-gray-100 rounded-2xl shadow-lg p-8 w-full max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">My Favourites / Wishlist</h1>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('favourites')} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${tab === 'favourites' ? 'bg-white border theme-border shadow' : 'theme-subtle border theme-border'}`}> Favourites</button>
          <button onClick={() => setTab('wishlist')} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${tab === 'wishlist' ? 'bg-white border theme-border shadow' : 'theme-subtle border theme-border'}`}> Wishlist</button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="flex-1 rounded-md theme-input py-2 px-3" />
          <button className="rounded-md theme-subtle px-3 py-2 border theme-border">Sort By</button>
          <button className="rounded-md theme-subtle px-3 py-2 border theme-border">Filter ▾</button>
        </div>

        <div className="space-y-4">
          {(tab === 'favourites' ? filteredFav : filteredWish).map(renderCard)}
          {(tab === 'favourites' ? filteredFav : filteredWish).length === 0 && (
            <div className="theme-subtle border theme-border rounded-xl p-6 text-center text-sm">No games yet. Browse the <Link to="/" className="text-sky-600">Home</Link> page and add some!</div>
          )}
        </div>
      </div>
    </div>
  );
}
