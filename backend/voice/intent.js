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

  if (includesAny(stripped, KEYWORDS.reset) && stripped.includes('filter')) {
    return { type: 'reset-filters', utterance: stripped };
  }

  if (includesAny(stripped, KEYWORDS.navigateSearch)) {
    return { type: 'navigate', target: 'search', utterance: stripped };
  }

  if (includesAny(stripped, KEYWORDS.scrollUp)) {
    return { type: 'scroll', direction: 'up', utterance: stripped };
  }
  if (includesAny(stripped, KEYWORDS.scrollDown)) {
    return { type: 'scroll', direction: 'down', utterance: stripped };
  }

  // Genre-driven filters even without explicit "filter"
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

  return null;
}

export default interpretTranscript;
