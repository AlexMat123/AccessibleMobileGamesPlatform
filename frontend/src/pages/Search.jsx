import { useEffect, useState } from 'react';
import { fetchTagGroups } from '../api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-lime-700">Accessible Game Search</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Search and filter games</h1>
          <p className="max-w-2xl text-slate-700">
            Keyboard friendly and screen-reader ready. Use the search box below. Filters and tag groups will appear here in the next step.
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
            onClick={() => setQuery('')}
            aria-disabled={!query}
            disabled={!query}
          >
            Clear search
          </button>
        </form>

        <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          {query ? `Searching for “${query}”… (filters coming next)` : 'No filters applied yet. Type to search; filters coming next.'}
        </div>

        <section aria-labelledby="filter-heading" className="mt-10 space-y-2">
          <h2 id="filter-heading" className="text-2xl font-semibold">
            Filters
          </h2>
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
                    {g.tags.map((tag) => (
                      <li key={tag}>
                        <button
                          type="button"
                          className={`w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-left font-semibold text-slate-900 hover:border-lime-400 ${focusRing}`}
                          // Filtering logic will be added in a later step
                          onClick={() => {}}
                          aria-pressed={false}
                        >
                          {tag}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="results-heading" className="mt-10 space-y-3">
          <h2 id="results-heading" className="text-2xl font-semibold">
            Results
          </h2>
          <p className="text-slate-700">Results will show here once filtering is implemented.</p>
        </section>
      </main>
    </div>
  );
}
