import React, { useState, useEffect, useRef } from "react";
import { fetchGames } from "../api";
import { Link } from "react-router-dom";


export default function Home() {
  // [1] State from backend
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // [2] Carousel state
  const [advIndex, setAdvIndex] = useState(0);
  const [blindIndex, setBlindIndex] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [hoveredAdv, setHoveredAdv] = useState(null);
  const [hoveredBlind, setHoveredBlind] = useState(null);

  // [3] Autoplay for featured
  const autoplayRef = useRef(null);
  const AUTOPLAY_MS = 5000;

  const startAutoplay = (len) => {
    if (!len) return;
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % len);
    }, AUTOPLAY_MS);
  };

  // [4] Load games from backend once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchGames();
        if (!alive) return;
        setGames(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load games");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // [5] Derive sections from the loaded games

  // Always make Tetris the first featured game if it exists
  const tetris = games.find(
      (g) => g.title && g.title.toLowerCase() === "tetris"
  );

  const rest = games.filter((g) => g !== tetris);

  // Example: top 3 featured games with Tetris first
  const featuredGames = [
    ...(tetris ? [tetris] : []),
    ...rest
  ]
      .slice()
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 3);

  // Adventure games - by tag or category
  const adventureGames = games.filter((g) =>
      (g.category || "").toLowerCase().includes("adventure") ||
      (g.tags || []).some((t) => typeof t === 'string' && t.toLowerCase() === "adventure")
  );

  // Blind-friendly: any of these accessibility tags
  const blindTagCandidates = new Set([
    "Vision",
    "Screen Reader Friendly",
    "High Contrast",
    "Large Text",
    "Colourblind Mode",
    "No Audio Needed",
    "Captions",
    "Visual Alerts",
  ]);

  const blindGames = games.filter((g) =>
      (g.tags || []).some((t) => typeof t === 'string' && blindTagCandidates.has(t))
  );

  // [6] Start / restart autoplay when featured set changes
  useEffect(() => {
    if (!featuredGames.length) return;
    startAutoplay(featuredGames.length);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [featuredGames.length]);

  // [7] Carousel helpers
  const prevAdv = () =>
      setAdvIndex((i) =>
          adventureGames.length
              ? (i - 1 + adventureGames.length) % adventureGames.length
              : 0
      );
  const nextAdv = () =>
      setAdvIndex((i) =>
          adventureGames.length ? (i + 1) % adventureGames.length : 0
      );

  const prevBlind = () =>
      setBlindIndex((i) =>
          blindGames.length ? (i - 1 + blindGames.length) % blindGames.length : 0
      );
  const nextBlind = () =>
      setBlindIndex((i) =>
          blindGames.length ? (i + 1) % blindGames.length : 0
      );

  const prevFeatured = () => {
    if (!featuredGames.length) return;
    setFeaturedIndex(
        (i) => (i - 1 + featuredGames.length) % featuredGames.length
    );
    startAutoplay(featuredGames.length);
  };
  const nextFeatured = () => {
    if (!featuredGames.length) return;
    setFeaturedIndex((i) => (i + 1) % featuredGames.length);
    startAutoplay(featuredGames.length);
  };
  const goToFeatured = (i) => {
    if (!featuredGames.length) return;
    setFeaturedIndex(i);
    startAutoplay(featuredGames.length);
  };

  const VISIBLE = 5;
  const getWindow = (arr, start, size) =>
      Array.from(
          { length: Math.min(size, arr.length) },
          (_, k) => arr[(start + k) % arr.length]
      );

  const renderStars = (rating) =>
      Array.from({ length: 5 }, (_, i) => (
          <span
              key={`star-${i}`}
              className={i < Math.round(rating) ? "text-yellow-500" : "text-gray-300"}
          >
        ★
      </span>
      ));

  // [8] Loading / error handling
  if (loading) {
    return (
        <div className="bg-sky-100 min-h-screen flex justify-center items-center">
          <p className="text-gray-700 text-lg">Loading games...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="bg-sky-100 min-h-screen flex justify-center items-center">
          <p className="text-red-700 text-lg">Error: {error}</p>
        </div>
    );
  }

  const fg =
      featuredGames.length > 0
          ? featuredGames[featuredIndex % featuredGames.length]
          : null;

  const getImageUrl = (game) => {
    if (game.images && game.images.length > 0) {
      return game.images[0];
    }
    return '/placeholder1.png';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
      <div className="bg-sky-100 min-h-screen flex justify-center py-10 lg:pb-20">
        <div className="bg-gray-100 rounded-2xl shadow-lg p-8 w-full max-w-6xl">
          {/* Featured / Newest Games (carousel) */}
          {fg && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Featured / Newest Games</h2>
              <div className="flex flex-col md:flex-row bg-white rounded-xl shadow p-6 gap-6">
                {/* Image + arrows */}
                <div className="flex flex-col items-center md:w-1/2 gap-4">
                  <div className="flex items-center justify-center gap-4 w-full">
                    <button aria-label="Previous featured game" onClick={prevFeatured}
                        className="w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center">
                      ←
                    </button>
                    <img
                      src={getImageUrl(fg)}
                      alt={fg.title}
                      className="rounded-lg shadow-md w-full max-w-md object-cover"
                    />
                    <button
                        aria-label="Next featured game"
                        onClick={nextFeatured}
                        className="w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center"
                    >
                      →
                    </button>
                  </div>
                  {/* Position indicator */}
                  <div className="w-full space-y-2" aria-live="polite">
                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-1">
                      {featuredGames.map((g, i) => (
                        <button
                          key={g.id}
                          aria-label={`Go to ${g.title}`}
                          onClick={() => goToFeatured(i)}
                          className={`w-3 h-3 rounded-full transition-colors ${i === featuredIndex ? 'bg-sky-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dynamic details */}
                <div className="md:w-1/2 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <h3 className="text-2xl font-semibold">{fg.title}</h3>
                      <p className="text-sm text-gray-600">Release Date: <span className="font-semibold">{formatDate(fg.releaseDate)}</span></p>
                    </div>
                    <p className="text-gray-700 mt-2">
                      <span className="font-semibold">Developer:</span> {fg.developer || 'N/A'} • {fg.category || 'N/A'}
                    </p>
                    {/* Rating */}
                    <div className="flex items-center mt-3">
                      {Array.from({ length: 5 }, (_, i) => (
                          <span key={`featured-star-${i}`} className={i < Math.round(fg.rating) ? "text-yellow-500" : "text-gray-300"}>★</span>
                      ))}
                      <span className="ml-2 text-gray-700">{fg.rating?.toFixed(1) || '0.0'} ({fg.reviews?.length || 0})</span>
                    </div>
                    {/* Tags */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {(fg.tags || []).map((tag, idx) => (
                          <span key={`${fg.id}-tag-${idx}`} className="bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">{tag}</span>
                      ))}
                    </div>
                  </div>
                  {/* Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Link to={`/games/${fg.id}`} className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 rounded-lg font-medium transition">View More</Link>
                    <button className="bg-orange-400 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium transition"> Add to Wishlist</button>
                    <button className="bg-pink-400 hover:bg-pink-600 text-white px-5 py-2 rounded-lg font-medium transition"> Add to Favourites</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Adventure Games */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Adventure Games</h2>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button aria-label="Previous adventure game" onClick={prevAdv} className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center">←</button>
              <div className="flex gap-4">
                {getWindow(adventureGames, advIndex, VISIBLE).map((g) => (
                    <Link
                        key={g.id}
                        to={`/games/${g.id}`}
                        className="relative flex-none w-48 rounded-md shadow-md bg-white overflow-visible hover:shadow-lg transition"
                        onMouseEnter={() => setHoveredAdv(g.id)}
                        onMouseLeave={() => setHoveredAdv(null)}
                    >
                      <div className="overflow-hidden rounded-t-md">
                        <img
                            src={getImageUrl(g)}
                            alt={g.title}
                            className="w-full h-32 object-cover transition-transform duration-300 hover:scale-110"
                        />
                      </div>
                      {hoveredAdv === g.id && (
                          <div className="absolute left-0 top-full mt-1 w-full bg-white/95 backdrop-blur-sm shadow-lg rounded-md p-3 space-y-1 text-xs z-20 pointer-events-none">
                            <h4 className="text-sm font-semibold text-gray-800 truncate" title={g.title}>{g.title}</h4>
                            <p className="text-gray-600 truncate" title={`${g.developer || 'N/A'} • ${g.category || 'N/A'}`}>{g.developer || 'N/A'} • {g.category || 'N/A'}</p>
                            <div className="flex items-center text-[10px]">{renderStars(g.rating)}<span className="ml-1 text-gray-700 text-[11px]">{g.rating?.toFixed(1) || '0.0'}</span><span className="ml-1 text-gray-500">({g.reviews?.length || 0})</span></div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {(g.tags || []).slice(0,3).map((t, idx) => (
                                  <span key={`${g.id}-adv-tag-${idx}`} className="bg-gray-200 text-gray-700 px-2 py-[2px] rounded-full text-[10px] leading-none">{t}</span>
                              ))}
                            </div>
                          </div>
                      )}
                    </Link>
                ))}
              </div>
              <button aria-label="Next adventure game" onClick={nextAdv} className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center">→</button>
            </div>
          </section>

          {/* Blind-friendly Games */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Blind-friendly Games</h2>
            <div className="flex items-center justify-center gap-4">
              <button aria-label="Previous blind-friendly game" onClick={prevBlind} className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center">←</button>
              <div className="flex gap-4">
                {getWindow(blindGames, blindIndex, VISIBLE).map((g) => (
                    <Link
                        key={g.id}
                        to={`/games/${g.id}`}
                        className="relative flex-none w-48 rounded-md shadow-md bg-white overflow-visible hover:shadow-lg transition"
                        onMouseEnter={() => setHoveredBlind(g.id)}
                        onMouseLeave={() => setHoveredBlind(null)}
                    >
                      <div className="overflow-hidden rounded-t-md">
                        <img
                            src={getImageUrl(g)}
                            alt={g.title}
                            className="w-full h-32 object-cover transition-transform duration-300 hover:scale-110"
                        />
                      </div>
                      {hoveredBlind === g.id && (
                          <div className="absolute left-0 top-full mt-1 w-full bg-white/95 backdrop-blur-sm shadow-lg rounded-md p-3 space-y-1 text-xs z-20 pointer-events-none">
                            <h4 className="text-sm font-semibold text-gray-800 truncate" title={g.title}>{g.title}</h4>
                            <p className="text-gray-600 truncate" title={`${g.developer || 'N/A'} • ${g.category || 'N/A'}`}>{g.developer || 'N/A'} • {g.category || 'N/A'}</p>
                            <div className="flex items-center text-[10px]">{renderStars(g.rating)}<span className="ml-1 text-gray-700 text-[11px]">{g.rating?.toFixed(1) || '0.0'}</span><span className="ml-1 text-gray-500">({g.reviews?.length || 0})</span></div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {(g.tags || []).slice(0,3).map((t, idx) => (
                                  <span key={`${g.id}-blind-tag-${idx}`} className="bg-gray-200 text-gray-700 px-2 py-[2px] rounded-full text-[10px] leading-none">{t}</span>
                              ))}
                            </div>
                          </div>
                      )}
                    </Link>
                ))}
              </div>
              <button aria-label="Next blind-friendly game" onClick={nextBlind} className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center">→</button>
            </div>
          </section>
        </div>
      </div>
  );
}
