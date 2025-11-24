import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchGames, fetchTagGroups, searchGames } from '../api';

const focusRing = 'focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-400 focus-visible:outline-offset-2';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesError, setGamesError] = useState('');

  const [selectedTags, setSelectedTags] = useState(() => new Set());
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  const [serverResults, setServerResults] = useState([]);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Refs for voice-driven focus/scroll
  const searchInputRef = useRef(null);
  const filtersRef = useRef(null);
  const resultsRef = useRef(null);
  const genreSelectRef = useRef(null);

  // Category accordion open state
  const [openCategories, setOpenCategories] = useState(() => new Set());

  // Load tag groups
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const { groups } = await fetchTagGroups();
        if (!alive) return;
        setGroups(groups || []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Failed to load tag groups');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Init state from URL
  useEffect(() => {
    const q = (searchParams.get('q') || '').trim();
    const tags = (searchParams.get('tags') || '');
    const genre = searchParams.get('genre') || '';
    const sort = searchParams.get('sort') || '';
    if (q) setQuery(q);
    const t = new Set(tags.split(',').map(s => s.trim()).filter(Boolean));
    if (t.size) setSelectedTags(t);
    if (genre) setSelectedGenre(genre);
    if (['relevance','newest','rating','title'].includes(sort)) setSortBy(sort);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load all games
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setGamesLoading(true);
        setGamesError('');
        const data = await fetchGames();
        if (!alive) return;
        setGames(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setGamesError(e?.message || 'Failed to load games');
      } finally {
        if (alive) setGamesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Keep URL in sync
  useEffect(() => {
    const next = {};
    if (query.trim()) next.q = query.trim();
    const t = Array.from(selectedTags);
    if (t.length) next.tags = t.join(',');
    if (selectedGenre) next.genre = selectedGenre;
    if (sortBy !== 'relevance') next.sort = sortBy;
    setSearchParams(next, { replace: true });
  }, [query, selectedTags, selectedGenre, sortBy, setSearchParams]);

  // Client-side filter
  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tags = Array.from(selectedTags);
    if (selectedGenre) tags.push(selectedGenre);
    return games.filter(g => {
      const mq = !q
        || g.title?.toLowerCase().includes(q)
        || (g.platform || '').toLowerCase().includes(q)
        || (g.tags || []).some(t => t.toLowerCase().includes(q));
      const mt = tags.length === 0 || tags.every(t => (g.tags || []).includes(t));
      return mq && mt;
    });
  }, [games, query, selectedTags, selectedGenre]);

  // Server-side search (debounced)
  useEffect(() => {
    let cancel = false;
    const timer = setTimeout(async () => {
      try {
        setServerLoading(true);
        setServerError('');
        const t = Array.from(selectedTags);
        if (selectedGenre) t.push(selectedGenre);
        const data = await searchGames({ q: query, tags: t });
        if (!cancel) setServerResults(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancel) setServerError(e?.message || 'Search failed');
      } finally {
        if (!cancel) setServerLoading(false);
      }
    }, 250);
    return () => { cancel = true; clearTimeout(timer); };
  }, [query, selectedTags, selectedGenre]);

  const haveFilters = Boolean(query.trim() || selectedTags.size || selectedGenre);
  const finalResults = (serverError || (serverResults.length === 0 && haveFilters))
    ? filteredGames
    : (haveFilters ? serverResults : filteredGames);

  // Ensure cards always show the full tag set from /api/games, even when
  // server-side search returns only the matched tags for performance.
  const fullTagsById = useMemo(() => {
    const map = new Map();
    games.forEach(g => {
      map.set(g.id, g.tags || []);
    });
    return map;
  }, [games]);

  const hydratedResults = useMemo(
    () => finalResults.map(r => ({
      ...r,
      tags: fullTagsById.get(r.id) || r.tags || []
    })),
    [finalResults, fullTagsById]
  );

  const sortedResults = useMemo(() => {
    const arr = [...hydratedResults];
    switch (sortBy) {
      case 'rating':
        return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'title':
        return arr.sort((a, b) => a.title.localeCompare(b.title));
      case 'newest':
        return arr.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
      default:
        return arr;
    }
  }, [hydratedResults, sortBy]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  const genreOptions = (() => {
    // Accept several shapes from API: { id:'genres', label:'Genres', tags:[...] }
    // or legacy { name:'Genres', tags:[...] } or { group:'Genres', items:[...] }
    const group = groups.find(g => g?.label === 'Genres' || g?.id === 'genres' || g?.name === 'Genres' || g?.group === 'Genres');
    if (!group) return [];
    const tags = group.tags || group.items || [];
    return Array.isArray(tags) ? tags : [];
  })();

  // Build Accessibility Category -> Tags mapping from backend groups
  const categories = useMemo(() => {
    const catGroup = groups.find(g => g?.label === 'Accessibility Categories' || g?.id === 'accessibility-categories');
    return Array.isArray(catGroup?.tags) ? catGroup.tags : [];
  }, [groups]);

  const tagsByCategory = useMemo(() => {
    const map = {};
    categories.forEach(cat => {
      const idGuess = String(cat || '').toLowerCase();
      const group = groups.find(g => g?.id === idGuess || g?.label === `${cat} Tags` || g?.name === `${cat} Tags`);
      const tags = group?.tags || [];
      map[cat] = Array.isArray(tags) ? tags : [];
    });
    return map;
  }, [groups, categories]);

  const allTags = useMemo(() => {
    const names = [];
    groups.forEach(g => {
      const t = g?.tags || g?.items;
      if (Array.isArray(t)) names.push(...t);
    });
    return names;
  }, [groups]);

  const toggleCategoryOpen = (cat) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const slugify = (s = '') => String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Light highlight to show what was toggled via voice
  const flashClass = 'voice-flash';
  const normalizeText = (s = '') => s.toLowerCase().replace(/[.,!?]/g, '').trim();
  const tagSynonyms = {
    'colorblind mode': 'Colourblind Mode',
    'colourblind mode': 'Colourblind Mode',
    'colour blind mode': 'Colourblind Mode',
    'color blind mode': 'Colourblind Mode',
    'colour blind': 'Colourblind Mode',
    'color blind': 'Colourblind Mode',
    'no audio needed': 'No Audio Needed',
    'no audio': 'No Audio Needed',
    'no audio required': 'No Audio Needed',
    'no sound': 'No Audio Needed',
    'no voice required': 'No Voice Required',
    'no voice needed': 'No Voice Required',
    'one handed': 'One-Handed',
    'one hand': 'One-Handed',
    'screenreader friendly': 'Screen Reader Friendly',
    'screen reader friendly': 'Screen Reader Friendly'
  };
  const canonicalTagName = (name = '') => {
    const norm = normalizeText(name);
    return tagSynonyms[norm] || name;
  };
  useEffect(() => {
    const styleId = 'voice-flash-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .${flashClass} {
        outline: 3px solid #a5f3fc;
        outline-offset: 3px;
        transition: outline-color 0.4s ease;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const focusAndFlash = (el) => {
    if (!el) return;
    if (typeof el.focus === 'function') el.focus({ preventScroll: true });
    el.classList.add(flashClass);
    setTimeout(() => el.classList.remove(flashClass), 1200);
  };

  const clickTagButton = (tag) => {
    const canonical = canonicalTagName(tag);
    const needle = normalizeText(canonical);
    const btn = Array.from(document.querySelectorAll('button[data-voice-tag]')).find((b) => {
      const attr = normalizeText(canonicalTagName(b.getAttribute('data-voice-tag')));
      const txt = normalizeText(canonicalTagName(b.textContent));
      return attr === needle || txt === needle || attr.includes(needle) || needle.includes(attr) || txt.includes(needle) || needle.includes(txt);
    });
    if (!btn) return false;

    const isActive = btn.getAttribute('aria-pressed') === 'true';
    // Only click if we need to toggle on
    if (!isActive) btn.click();
    focusAndFlash(btn);
    return true;
  };

  const setGenreByVoice = (genre) => {
    const select = genreSelectRef.current;
    if (!select) return false;
    const match = Array.from(select.options).find(
      opt => normalizeText(opt.value) === normalizeText(genre) || normalizeText(opt.textContent) === normalizeText(genre)
    );
    if (match) {
      select.value = match.value;
      setSelectedGenre(match.value);
      focusAndFlash(select);
      // Fire a change event to keep parity with user interaction
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  };

  // Voice commands: search, filter, and open filters drawer.
  useEffect(() => {
    const matchGenre = (name = '') => {
      const needle = normalizeText(name);
      return genreOptions.find((g) => {
        const hay = g.toLowerCase();
        return hay === needle || hay.includes(needle) || needle.includes(hay);
      });
    };

    const matchTag = (name = '') => {
      const needle = normalizeText(canonicalTagName(name));
      return allTags.find((t) => {
        const hay = normalizeText(canonicalTagName(t));
        return hay === needle || hay.includes(needle) || needle.includes(hay);
      });
    };

    const onVoice = (e) => {
      const detail = e.detail || {};
      const type = detail.type;
      if (!type) return;
      console.info('[voice][search] command', detail);

      if (type === 'search' && detail.query) {
        e.preventDefault();
        setQuery(detail.query);
        searchInputRef.current?.focus({ preventScroll: true });
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (type === 'filter' && (detail.tag || Array.isArray(detail.tags))) {
        e.preventDefault();
        const spokenList = Array.isArray(detail.tags) ? detail.tags : [detail.tag];
        spokenList.forEach((raw, idx) => {
          const spokenTag = canonicalTagName(raw);
          const genre = matchGenre(spokenTag);
          const tag = matchTag(spokenTag);
          const offset = 50 + idx * 120;

          // Expand relevant category accordion if we know where this tag lives
          const catEntry = Object.entries(tagsByCategory).find(
            ([, tags]) => Array.isArray(tags) && tags.some(t => normalizeText(canonicalTagName(t)) === normalizeText(spokenTag))
          );
          if (catEntry) {
            const [catName] = catEntry;
            setOpenCategories(prev => new Set(prev).add(catName));
          }

          if (genre) {
            setQuery('');
            setTimeout(() => {
              setGenreByVoice(genre);
            }, offset);
          } else if (tag) {
            setQuery('');
            const attempt = () => clickTagButton(tag);
            setTimeout(attempt, offset);
            setTimeout(() => {
              const clicked = attempt();
              if (!clicked) setSelectedTags(prev => new Set([...prev, tag]));
            }, offset + 120);
          } else {
            toggleTag(spokenTag);
            console.info('[voice][search] fallback toggle for tag text', spokenTag);
            setTimeout(() => {
              const btns = Array.from(document.querySelectorAll('button[data-voice-tag]'));
              const needle = normalizeText(spokenTag);
              const btn = btns.find(b => {
                const hay = normalizeText(canonicalTagName(b.getAttribute('data-voice-tag')));
                const txt = normalizeText(canonicalTagName(b.textContent));
                return hay === needle || txt === needle || hay.includes(needle) || needle.includes(hay) || txt.includes(needle) || needle.includes(txt);
              });
              if (btn) {
                btn.click();
                focusAndFlash(btn);
              }
            }, offset);
          }
        });
        filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (type === 'reset-filters') {
        e.preventDefault();
        setQuery('');
        setSelectedTags(new Set());
        setSelectedGenre('');
        setSortBy('relevance');
        setOpenCategories(new Set());
        filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (type === 'ui' && detail.target === 'filters') {
        e.preventDefault();
        filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('voiceCommand', onVoice);
    return () => window.removeEventListener('voiceCommand', onVoice);
  }, [genreOptions, allTags, tagsByCategory]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold sm:text-4xl">Search</h1>
        </header>

        {/* Search bar */}
        <div className={`mt-6 flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 focus-within:outline focus-within:outline-4 focus-within:outline-lime-400 focus-within:outline-offset-2`}>
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-500">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            id="search-field"
            ref={searchInputRef}
            type="search"
            placeholder="Search games, genres, or accessibility tags..."
            className="w-full bg-transparent px-2 py-2 text-base text-slate-900 placeholder-slate-500 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search games"
          />
          <button type="button" aria-label="Voice search" className="rounded-md p-2 text-slate-500 hover:text-slate-700">
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z"></path>
              <path d="M19 11a7 7 0 0 1-14 0"></path>
              <path d="M12 19v3"></path>
            </svg>
          </button>
        </div>

        <div className="mt-8 grid grid-cols-12 gap-6">
          {/* Sticky left drawer */}
          <aside className="col-span-12 self-start lg:col-span-4 lg:sticky lg:top-6">
            <div ref={filtersRef} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Filters</h2>
                <button
                  type="button"
                  className={`rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-50 ${focusRing}`}
                  onClick={() => { setQuery(''); setSelectedTags(new Set()); setSelectedGenre(''); setSortBy('relevance'); }}
                >
                  Reset
                </button>
              </div>

              {/* Disability Categories (accordion to reveal specific tags) */}
              <section className="mt-4">
                <h3 className="text-sm font-semibold text-slate-700">Disability Categories</h3>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {categories.map(cat => {
                    const isOpen = openCategories.has(cat);
                    const slug = slugify(cat);
                    const btnId = `cat-btn-${slug}`;
                    const panelId = `cat-panel-${slug}`;
                    return (
                      <div key={cat} className="rounded-lg border border-slate-300 bg-white">
                        <button
                          id={btnId}
                          type="button"
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-slate-800 ${focusRing}`}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => toggleCategoryOpen(cat)}
                        >
                          <span>{cat}</span>
                          <span aria-hidden className="ml-2 text-slate-500">{isOpen ? '▾' : '▸'}</span>
                        </button>
                        {isOpen && (
                          <div id={panelId} role="region" aria-labelledby={btnId} className="border-t border-slate-200 p-2">
                            <div className="grid grid-cols-1 gap-2">
                              {(tagsByCategory[cat] || []).map(tag => {
                                const active = selectedTags.has(tag);
                                return (
                                  <button
                                    key={tag}
                                    data-voice-tag={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium ${active ? 'border border-lime-500 bg-lime-50 text-lime-800' : 'border border-slate-300 bg-white text-slate-800'} ${focusRing}`}
                                    aria-pressed={active}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Genre dropdown */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3">
                <label htmlFor="genre" className="block text-sm font-semibold text-slate-700">Genre</label>
                <select
                  id="genre"
                  ref={genreSelectRef}
                  className={`mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ${focusRing}`}
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  <option value="">All</option>
                  {genreOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Sort dropdown */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                <label htmlFor="sort-by" className="block text-sm font-semibold text-slate-700">Sort By</label>
                <select
                  id="sort-by"
                  className={`mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ${focusRing}`}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Rating</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" className={`flex-1 rounded-lg border border-lime-500 bg-lime-500/10 px-4 py-2 text-sm font-semibold text-lime-800 hover:bg-lime-500/20 ${focusRing}`}>Apply</button>
                <button
                  type="button"
                  className={`flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 ${focusRing}`}
                  onClick={() => { setQuery(''); setSelectedTags(new Set()); setSelectedGenre(''); setSortBy('relevance'); }}
                >
                  Reset
                </button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <section ref={resultsRef} className="col-span-12 space-y-4 lg:col-span-8">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <nav aria-label="Breadcrumbs">Home › Search › {selectedGenre ? `Results for "${selectedGenre}"` : (query ? `Results for "${query}"` : 'All Results')}</nav>
              <span>Filters (open)</span>
            </div>

            {gamesLoading || serverLoading ? (
              <p className="text-slate-700" role="status" aria-live="polite">Loading games...</p>
            ) : gamesError ? (
              <p role="alert" className="text-rose-700">{gamesError}</p>
            ) : sortedResults.length === 0 ? (
              <p className="text-slate-700">No games found.</p>
            ) : (
              <ul role="list" aria-live="polite" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sortedResults.map(g => (
                  <li key={g.id}>
                    <article className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="h-32 w-full bg-slate-200" aria-hidden></div>
                      <div className="p-4">
                        <header className="flex items-baseline justify-between gap-3">
                          <h3 className="text-lg font-bold text-slate-900">{g.title}</h3>
                          <span className="text-xs font-semibold uppercase tracking-wide text-lime-700">{g.platform}</span>
                        </header>
                        {Array.isArray(g.tags) && g.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2" aria-label="Accessibility tags">
                            {g.tags.map(t => {
                              const isActive = selectedTags.has(t) || (!!selectedGenre && selectedGenre === t);
                              const baseClasses = 'rounded-full px-3 py-1 text-xs font-semibold';
                              const activeClasses = 'border border-lime-600 bg-lime-50 text-lime-900';
                              const inactiveClasses = 'border border-slate-300 bg-slate-50 text-slate-700';
                              return (
                                <span
                                  key={`${g.id}-${t}`}
                                  className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                                >
                                  {t}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
