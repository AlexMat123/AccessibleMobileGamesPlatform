import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCurrentUser } from '../api.js';
import { getGame } from '../api.js';

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
        const favRaw = localStorage.getItem(`favourites:${me.id}`);
        const wlRaw = localStorage.getItem(`wishlist:${me.id}`);
        const favIds = favRaw ? JSON.parse(favRaw) : [];
        const wlIds = wlRaw ? JSON.parse(wlRaw) : [];
        const enrich = async (items) => {
          const ids = items.map(i => i.id != null ? i.id : i);
          const results = await Promise.all(ids.map(async (id) => {
            try { return await getGame(id); } catch { return null; }
          }));
          return results.filter(Boolean).map(g => ({
            id: g.id,
            title: g.name || g.title,
            developer: g.developer,
            category: g.category,
            rating: g.rating,
            reviews: g.reviews || [],
            tags: (g.tags || []).map(t => (t.name || t)),
            images: g.images || [],
          }));
        };
        const [favFull, wlFull] = await Promise.all([enrich(favIds), enrich(wlIds)]);
        setFavourites(favFull);
        setWishlist(wlFull);
      } catch (e) {
        setError(e.message || 'Failed to load library');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    const handler = async () => {
      if (!user) return;
      const favRaw = localStorage.getItem(`favourites:${user.id}`);
      const wlRaw = localStorage.getItem(`wishlist:${user.id}`);
      const favIds = favRaw ? JSON.parse(favRaw) : [];
      const wlIds = wlRaw ? JSON.parse(wlRaw) : [];
      const enrich = async (items) => {
        const ids = items.map(i => i.id != null ? i.id : i);
        const results = await Promise.all(ids.map(async (id) => {
          try { return await getGame(id); } catch { return null; }
        }));
        return results.filter(Boolean).map(g => ({
          id: g.id,
          title: g.name || g.title,
          developer: g.developer,
          category: g.category,
          rating: g.rating,
          reviews: g.reviews || [],
          tags: (g.tags || []).map(t => (t.name || t)),
          images: g.images || [],
        }));
      };
      const [favFull, wlFull] = await Promise.all([enrich(favIds), enrich(wlIds)]);
      setFavourites(favFull);
      setWishlist(wlFull);
    };
    window.addEventListener('library:updated', handler);
    return () => window.removeEventListener('library:updated', handler);
  }, [user]);

  const persist = (key, items) => {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  };
  const saveFavourites = (items) => {
    if (!user) return;
    setFavourites(items);
    persist(`favourites:${user.id}`, items);
  };
  const saveWishlist = (items) => {
    if (!user) return;
    setWishlist(items);
    persist(`wishlist:${user.id}`, items);
  };

  const removeFromWishlist = (gameId) => saveWishlist(wishlist.filter(g => g.id !== gameId));
  const removeFromFavourites = (gameId) => saveFavourites(favourites.filter(g => g.id !== gameId));

  const moveToWishlist = (game) => {
    if (!user) return;
    const favNext = favourites.filter(g => g.id !== game.id);
    const wlExists = wishlist.some(g => g.id === game.id);
    const wlNext = wlExists ? wishlist : [...wishlist, game];
    saveFavourites(favNext);
    saveWishlist(wlNext);
    window.dispatchEvent(new CustomEvent('library:updated', { detail: { type: 'wishlist', gameId: game.id } }));
  };

  const moveToFavourites = (game) => {
    if (!user) return;
    const wlNext = wishlist.filter(g => g.id !== game.id);
    const favExists = favourites.some(g => g.id === game.id);
    const favNext = favExists ? favourites : [...favourites, game];
    saveWishlist(wlNext);
    saveFavourites(favNext);
    window.dispatchEvent(new CustomEvent('library:updated', { detail: { type: 'favourites', gameId: game.id } }));
  };

  const getImageUrl = (game) => {
    if (!game) return '/placeholder1.png';
    if (game.imageUrl) return game.imageUrl;
    if (Array.isArray(game.images) && game.images.length) return game.images[0];
    return '/placeholder1.png';
  };

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

  // this uses tone tokens already used across the other pages
  const shellTone = 'theme-page';
  const cardTone = 'theme-surface border theme-border rounded-2xl shadow-lg';
  const subtleCard = 'theme-subtle border theme-border rounded-xl';
  const smallMeta = 'text-sm theme-muted';

  const renderCard = (g) => (
    <div key={g.id} className={`relative flex items-start gap-4 ${cardTone} p-4`}>
      <div className="overflow-hidden rounded-xl">
        <img src={getImageUrl(g)} alt={g.title} className="w-28 h-20 object-cover" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold theme-text truncate">{g.title || g.name}</h3>
        <p className={`${smallMeta}`}>
          {g.developer || 'Developer'} • {g.category || 'Category'}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-yellow-500 text-sm">★★★★★</span>
          <span className="theme-muted text-xs">{g.rating?.toFixed?.(1) || '—'} ({g.reviews?.length || 0})</span>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {(g.tags || []).slice(0,3).map((t, i) => (
            <span key={i} className="theme-subtle border theme-border px-2 py-[2px] rounded-full text-[10px] leading-none theme-text">
              {typeof t === 'string' ? t : t?.name || ''}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute right-3 top-3 flex gap-2">
        {tab === 'favourites' ? (
          <button onClick={() => moveToWishlist(g)} className="theme-btn px-3 py-1 rounded-md" aria-label="Move to wishlist">♥</button>
        ) : (
          <button onClick={() => moveToFavourites(g)} className="theme-btn px-3 py-1 rounded-md" aria-label="Move to favourites">★</button>
        )}
        <button
          className="theme-subtle border theme-border px-3 py-1 rounded-md"
          aria-label="Delete"
          onClick={() => (tab === 'favourites' ? removeFromFavourites(g.id) : removeFromWishlist(g.id))}
        >X</button>
      </div>
      <div className="absolute right-3 bottom-3">
        <Link to={`/games/${g.id}`} className="theme-btn px-3 py-1 rounded-md text-sm">View details</Link>
      </div>
    </div>
  );

  return (
    <div className={`${shellTone} min-h-screen flex justify-center py-10 lg:pb-20`}>
      <main className="page-shell w-full max-w-6xl space-y-8">
        <section className={`${cardTone} p-6`}>
          <h1 className="text-2xl font-bold theme-text mb-6">My favourites / wishlist</h1>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('favourites')} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${tab === 'favourites' ? 'theme-btn' : 'theme-subtle border theme-border'}`}>Favourites</button>
            <button onClick={() => setTab('wishlist')} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${tab === 'wishlist' ? 'theme-btn' : 'theme-subtle border theme-border'}`}>Wishlist</button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="flex-1 rounded-md theme-input py-2 px-3" />
            <button className="rounded-md theme-subtle px-3 py-2 border theme-border">Sort by</button>
            <button className="rounded-md theme-subtle px-3 py-2 border theme-border">Filter ▾</button>
          </div>

          <div className="space-y-4">
            {(tab === 'favourites' ? filteredFav : filteredWish).map(renderCard)}
            {(tab === 'favourites' ? filteredFav : filteredWish).length === 0 && (
              <div className={`${subtleCard} p-6 text-center text-sm`}>No games yet. Browse the <Link to="/Search" className="text-sky-600">Search</Link> page and add some!</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
