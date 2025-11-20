import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import profile from '../assets/profile.jpg';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const navigation = [
  { name: 'Home', href: '/', current: true },
  { name: 'Search', href: '/search', current: false },
  { name: 'Discover', href: '/discover', current: false },
  { name: 'Settings', href: '/settings', current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
  // Track auth via presence of token in localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const onStorage = () => setIsAuthenticated(!!localStorage.getItem('token'));
    const onAuthChanged = () => setIsAuthenticated(!!localStorage.getItem('token'));
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-changed', onAuthChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth-changed'));
  };

  // Fetch search with debounce
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const res = await fetch(`http://localhost:5000/api/games/search?q=${encodeURIComponent(q)}`,
          { signal: abortRef.current.signal }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch (e) {
        if (e.name !== 'AbortError') {
          setResults([]);
        }
      }
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <Disclosure as="nav" className="relative bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white">
              <Bars3Icon aria-hidden="true" className="block h-6 w-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden h-6 w-6 group-data-open:block" />
            </DisclosureButton>
          </div>

          {/* Left: logo + Home */}
          <div className="flex flex-1 items-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <img
                alt="Accessible Games Logo"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden sm:flex sm:items-center">
              {navigation.filter((item) => item.name === 'Home').map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white',
                    'rounded-md px-3 py-2 text-sm font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* Center: Search */}
            <div ref={searchBoxRef} className="relative flex-1 px-4 max-w-2xl mx-6 hidden sm:block">
              <form onSubmit={handleSearchSubmit} role="search">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => results.length && setOpen(true)}
                  placeholder="Search games..."
                  aria-label="Search games"
                  className="w-full rounded-md bg-white/95 text-gray-900 placeholder-gray-500 py-2 pl-3 pr-3 shadow focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </form>
              {open && results.length > 0 && (
                <div className="absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                  <ul className="divide-y divide-gray-100">
                    {results.map(r => (
                      <li key={r.id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <a href={`/games/${r.id}`} className="flex items-center justify-between text-sm text-gray-700">
                          <span className="font-medium">{r.title}</span>
                          {r.rating != null && (
                            <span className="ml-2 text-xs text-gray-500">★ {Number(r.rating).toFixed(1)}</span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Notification and profile icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Discover & Settings on desktop */}
            <div className="hidden sm:flex items-center space-x-4 mr-2">
              {isAuthenticated && (
                <a
                  href="/library"
                  className={classNames(
                    'text-gray-300 hover:bg-white/5 hover:text-white',
                    'rounded-md px-3 py-2 text-sm font-medium'
                  )}
                >
                  Library
                </a>
              )}
              {navigation.filter((item) => item.name !== 'Home').map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white',
                    'rounded-md px-3 py-2 text-sm font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </a>
              ))}
            </div>

            <Menu as="div" className="relative ml-3">
              <MenuButton className="relative flex rounded-full focus:outline-none focus:ring-2 focus:ring-white">
                <img alt="" src={profile} className="h-8 w-8 rounded-full" />
              </MenuButton>
              <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg">
                {isAuthenticated ? (
                  <>
                    <MenuItem>
                      <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your profile</a>
                    </MenuItem>
                    <MenuItem>
                      <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem>
                      <a href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Log in</a>
                    </MenuItem>
                    <MenuItem>
                      <a href="/signup" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign up</a>
                    </MenuItem>
                  </>
                )}
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              className={classNames(
                item.current
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium'
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
