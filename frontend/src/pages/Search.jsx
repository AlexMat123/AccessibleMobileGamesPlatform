import { useState } from 'react';

export default function Search() {
  const [query, setQuery] = useState('');

  const focusRing =
    'focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-400 focus-visible:outline-offset-2';

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a href="#results-heading" className="skip-link rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-slate-900">
        Skip to results
      </a>

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
          <p className="text-slate-700">Tag groups will appear here in the next step.</p>
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

