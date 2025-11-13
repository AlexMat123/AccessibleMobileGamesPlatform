import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchGames, fetchTagGroups } from '../api';

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

  const focusRing =
    'focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-400 focus-visible:outline-offset-2';

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const { groups } = await fetchTagGroups();
        if (!isMounted) return;
        setGroups(groups || []);
      } catch (e) {
        if (!isMounted) return;
        setError(e.message || 'Failed to load tag groups');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Initialize state from URL params once on mount
  useEffect(() => {
    const initialQ = searchParams.get('q') || '';
    const initialTagsParam = searchParams.get('tags') || '';
    const initialTags = new Set(
      initialTagsParam
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    );
    if (initialQ) setQuery(initialQ);
    if (initialTags.size > 0) setSelectedTags(initialTags);
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setGamesLoading(true);
        setGamesError('');
        const data = await fetchGames();
        if (!isMounted) return;
        setGames(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!isMounted) return;
        setGamesError(e.message || 'Failed to load games');
      } finally {
        if (isMounted) setGamesLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Keep URL params in sync with current query and tags
  useEffect(() => {
    const next = {};
    const q = query.trim();
    const tags = Array.from(selectedTags).sort();
    if (q) next.q = q;
    if (tags.length > 0) next.tags = tags.join(',');
    setSearchParams(next, { replace: true });
  }, [query, selectedTags, setSearchParams]);

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tags = Array.from(selectedTags);
    return (Array.isArray(games) ? games : []).filter((g) => {
      const matchesQuery =
        !q ||
        g.title.toLowerCase().includes(q) ||
        (g.platform || '').toLowerCase().includes(q) ||
        (g.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchesTags = tags.length === 0 || tags.every((t) => (g.tags || []).includes(t));
      return matchesQuery && matchesTags;
    });
  }, [games, query, selectedTags]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-lime-700">Accessible Game Search</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Search and filter games</h1>
          <p className="max-w-2xl text-slate-700">
            Keyboard friendly and screen-reader ready. Use the search box or toggle filters below.
          </p>
        </header>

        <form
          role="search"
          aria-label="Search games"
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex-1">
            <label htmlFor="search-field" className="block text-sm font-semibold text-slate-800">
              Keyword search
            </label>
            <input
              id="search-field"
              type="search"
              placeholder="Search by title, platform, or feature"
              className={`mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-500 ${focusRing}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={`rounded-xl border-2 border-lime-600 bg-lime-50 px-4 py-3 text-base font-semibold text-lime-800 hover:bg-lime-100 ${focusRing}`}
            onClick={() => { setQuery(''); setSelectedTags(new Set()); }}
            aria-disabled={!query && selectedTags.size === 0}
            disabled={!query && selectedTags.size === 0}
          >
            Clear search & tags
          </button>
        </form>

        <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          {`${filteredGames.length} result${filteredGames.length === 1 ? '' : 's'} ${query ? `for "${query}"` : ''}${selectedTags.size ? ` with ${selectedTags.size} tag${selectedTags.size > 1 ? 's' : ''}` : ''}.`}
        </div>

        <section aria-labelledby="filter-heading" className="mt-10 space-y-2">
          <h2 id="filter-heading" className="text-2xl font-semibold">Filters</h2>
          {loading ? (
            <p className="text-slate-700">Loading tag groups…</p>
          ) : error ? (
            <p role="alert" className="text-rose-700">{error}</p>
          ) : (
            <div className="space-y-6 mt-4">
              {groups.map((g) => (
                <section key={g.id} aria-labelledby={`${g.id}-title`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 id={`${g.id}-title`} className="text-lg font-semibold text-slate-900">{g.label}</h3>
                    <p className="text-sm text-slate-700">{g.tags.length} option{g.tags.length === 1 ? '' : 's'}</p>
                  </div>
                  <ul role="list" aria-label={`${g.label} tag filters`} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {g.tags.map((tag) => {
                      const active = selectedTags.has(tag);
                      return (
                        <li key={tag}>
                          <button
                            type="button"
                            className={`w-full rounded-xl border-2 px-4 py-3 text-left font-semibold ${active ? 'border-lime-600 bg-lime-50 text-lime-900' : 'border-slate-300 bg-white text-slate-900 hover:border-lime-400'} ${focusRing}`}
                            onClick={() => {
                              setSelectedTags((prev) => {
                                const next = new Set(prev);
                                if (next.has(tag)) next.delete(tag); else next.add(tag);
                                return next;
                              });
                            }}
                            aria-pressed={active}
                          >
                            {tag}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>

        {selectedTags.size > 0 && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="selected-tags-heading">
            <h2 id="selected-tags-heading" className="text-xl font-semibold">Selected tags</h2>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected tags">
              {Array.from(selectedTags).map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    className={`flex items-center gap-2 rounded-full border border-lime-600/40 bg-lime-50 px-3 py-1 text-sm font-semibold text-lime-800 ${focusRing}`}
                    onClick={() => setSelectedTags((prev) => { const next = new Set(prev); next.delete(t); return next; })}
                    aria-label={`Remove tag ${t}`}
                  >
                    {t}
                    <span aria-hidden>×</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="results-heading" className="mt-10 space-y-3">
          <h2 id="results-heading" className="text-2xl font-semibold">Results</h2>
          {gamesLoading ? (
            <p className="text-slate-700">Loading games…</p>
          ) : gamesError ? (
            <p role="alert" className="text-rose-700">{gamesError}</p>
          ) : filteredGames.length === 0 ? (
            <p className="text-slate-700">No games found.</p>
          ) : (
            <ul role="list" className="grid gap-4 sm:grid-cols-2">
              {filteredGames.map((g) => (
                <li key={g.id}>
                  <article className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <header className="flex items-baseline justify-between gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{g.title}</h3>
                      <span className="text-xs font-semibold uppercase tracking-wide text-lime-700">{g.platform}</span>
                    </header>
                    <dl className="mt-2 text-sm text-slate-700">
                      <div className="flex flex-wrap gap-2">
                        <dt className="font-semibold text-slate-900">Release:</dt>
                        <dd>{g.releaseDate ? new Date(g.releaseDate).toLocaleDateString() : 'TBD'}</dd>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <dt className="font-semibold text-slate-900">Rating:</dt>
                        <dd>{g.rating ?? 'N/A'}</dd>
                      </div>
                    </dl>
                    {Array.isArray(g.tags) && g.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2" aria-label="Tags">
                        {g.tags.slice(0, 8).map((t) => (
                          <span key={`${g.id}-${t}`} className="rounded-full border border-lime-600/40 bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-800">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
