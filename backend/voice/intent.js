/**
 * Intent schema:
 * { type: 'navigate'|'search'|'filter'|'reset-filters'|'ui'|'scroll'|'game',
 *   target?: string, query?: string, tags?: string[], tag?: string, action?: string, direction?: 'up'|'down', utterance: string }
 *
 * Heuristic interpreter (offline, free) designed to handle rambling sentences and filler words.
 */

const KEYWORDS = {
  reset: ['reset', 'clear'],
  searchVerbs: ['search', 'find', 'look for', 'show', 'show me'],
  filterVerbs: ['filter', 'filters', 'apply filter', 'apply filters'],
  navigateSearch: ['search page', 'go to search', 'open search'],
  scrollUp: ['scroll up', 'page up', 'scroll top'],
  scrollDown: ['scroll down', 'page down', 'scroll']
};

const GENRES = ['action', 'adventure', 'puzzle', 'strategy', 'simulation', 'casual', 'rpg', 'platformer', 'sports', 'kids'];

const NAV_LIBRARY = ['library', 'my library', 'open library'];
const NAV_WISHLIST = ['wishlist', 'wish list'];
const NAV_FAVOURITES = ['favourites', 'favorites', 'favs', 'favourited', 'favorite list'];

function includesAny(text, arr) {
  return arr.some((k) => text.includes(k));
}

function normalize(text) {
  return String(text || '').toLowerCase().replace(/[.,!?]/g, ' ').trim();
}

function stripFiller(text) {
  let t = normalize(text);
  const fillers = [
    'hey platform',
    'platform',
    'can you',
    'could you',
    'please',
    'maybe',
    'show me',
    'can u',
    'will you',
    'could u',
    'could you maybe',
    'maybe you can',
    'can you maybe',
    'would you'
  ];
  fillers.forEach((f) => {
    t = t.replace(f, ' ');
  });
  return t.replace(/\s+/g, ' ').trim();
}

function findGenres(text) {
  const found = [];
  GENRES.forEach((g) => {
    if (text.includes(g)) found.push(capitalize(g));
  });
  return found;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function interpretTranscript(transcript) {
  const raw = String(transcript || '').trim();
  const text = normalize(raw);
  if (!text) return null;

  const stripped = stripFiller(text);

  // add current game to wishlist/favourites (handle before navigation so it doesn't get treated as navigate)
  const addMatchEarly = stripped.match(/(?:add|save|put)\s+(?:this|the)?\s*(?:game|it)?\s*to\s+(favourites|favorites|wishlist)\b/i);
  if (addMatchEarly) {
    const listRaw = addMatchEarly[1].toLowerCase();
    const action = listRaw === 'wishlist' ? 'wishlist' : 'favourites';
    return { type: 'game', action, utterance: stripped };
  }

  if (includesAny(stripped, KEYWORDS.reset) && stripped.includes('filter')) {
    return { type: 'reset-filters', utterance: stripped };
  }

  if (includesAny(stripped, KEYWORDS.navigateSearch)) {
    return { type: 'navigate', target: 'search', utterance: stripped };
  }

  // command to remove games form wishilit or favourites
  const removeMatch = stripped.match(/^(?:remove|delete)\s+(.+?)\s+from\s+(favourites|favorites|wishlist)\b/);
  if (removeMatch) {
    const title = removeMatch[1].trim();
    const listRaw = removeMatch[2].toLowerCase();
    const list = listRaw === 'wishlist' ? 'wishlist' : 'favourites';
    return { type: 'library', action: 'remove', list, title, utterance: stripped };
  }

  // command to move games between lists
  const moveMatch = stripped.match(/^(?:move|transfer|shift)\s+(.+?)\s+to\s+(favourites|favorites|wishlist)\b/);
  if (moveMatch) {
    const title = moveMatch[1].trim();
    const listRaw = moveMatch[2].toLowerCase();
    const list = listRaw === 'wishlist' ? 'wishlist' : 'favourites';
    return { type: 'library', action: 'move', list, title, utterance: stripped };
  }

  // command to navigate to the library page and its subsections
  if (includesAny(stripped, NAV_LIBRARY) || stripped.includes('go to library') || stripped.includes('open my library')) {
    return { type: 'navigate', target: 'library', utterance: stripped };
  }
  if (stripped.includes('go to wishlist') || stripped.includes('open wishlist') || includesAny(stripped, NAV_WISHLIST)) {
    return { type: 'navigate', target: 'wishlist', utterance: stripped };
  }
  if (stripped.includes('go to favourites') || stripped.includes('go to favorites') || stripped.includes('open favourites') || stripped.includes('open favorites') || includesAny(stripped, NAV_FAVOURITES)) {
    return { type: 'navigate', target: 'favourites', utterance: stripped };
  }

  if (includesAny(stripped, KEYWORDS.scrollUp)) {
    return { type: 'scroll', direction: 'up', utterance: stripped };
  }
  if (includesAny(stripped, KEYWORDS.scrollDown)) {
    return { type: 'scroll', direction: 'down', utterance: stripped };
  }

  // command to apply filters
  const genres = findGenres(stripped);
  if (genres.length === 1) {
    return { type: 'filter', tag: genres[0], utterance: stripped };
  }
  if (genres.length > 1) {
    return { type: 'filter', tags: genres, utterance: stripped };
  }

  // Filter intents anywhere in the sentence
  if (includesAny(stripped, KEYWORDS.filterVerbs)) {
    const remainder = stripped.replace(/^(apply|apply filters|filter|filters)\s*/i, '').trim();
    if (!remainder) return { type: 'filter', tags: [], utterance: stripped };
    const tags = remainder.split(/(?:,|\band\b)/i).map((s) => s.trim()).filter(Boolean);
    if (tags.length > 1) return { type: 'filter', tags, utterance: stripped };
    return { type: 'filter', tag: tags[0], utterance: stripped };
  }

  // Search intents, even when prefixed with filler
  if (includesAny(stripped, KEYWORDS.searchVerbs)) {
    const query = stripped.replace(/^(search|find|look for|show|show me)\s*/i, '').trim();
    return { type: 'search', query: query || stripped, utterance: stripped };
  }

  // Open game by title (e.g., "open tetris", "play aurora quest")
  const openGameMatch = stripped.match(/^(?:open|play|launch)\s+(.+)$/i);
  if (openGameMatch) {
    const title = openGameMatch[1].trim();
    const navWords = ['library', 'my library', 'search', 'settings', 'accessibility'];
    if (!navWords.includes(title.toLowerCase())) {
      return { type: 'game-card', action: 'open', title, utterance: stripped };
    }
  }

  return null;
}

export default interpretTranscript;
