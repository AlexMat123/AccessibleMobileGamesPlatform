/**
 * Intent schema:
 * { type: 'navigate'|'search'|'filter'|'reset-filters'|'ui'|'scroll'|'game',
 *   target?: string, query?: string, tags?: string[], tag?: string, action?: string, direction?: 'up'|'down' }
 *
 * Heuristic interpreter for now (keyword-based). Replace with AI/LLM later.
 */
const KEYWORDS = {
  reset: ['reset filters', 'clear filters'],
  search: ['search', 'find', 'look for'],
  filter: ['filter', 'filters', 'apply'],
  navigateSearch: ['search page', 'go to search', 'open search'],
  scrollUp: ['scroll up'],
  scrollDown: ['scroll down', 'scroll']
};

function includesAny(text, arr) {
  return arr.some((k) => text.includes(k));
}

export function interpretTranscript(transcript) {
  const text = String(transcript || '').toLowerCase().trim();
  if (!text) return null;

  if (includesAny(text, KEYWORDS.reset)) {
    return { type: 'reset-filters', utterance: text };
  }

  if (includesAny(text, KEYWORDS.navigateSearch)) {
    return { type: 'navigate', target: 'search', utterance: text };
  }

  if (includesAny(text, KEYWORDS.scrollUp)) {
    return { type: 'scroll', direction: 'up', utterance: text };
  }
  if (includesAny(text, KEYWORDS.scrollDown)) {
    return { type: 'scroll', direction: 'down', utterance: text };
  }

  if (includesAny(text, KEYWORDS.search)) {
    // Strip the first keyword and return the remainder as query
    const query = text.replace(/^(search|find|look for)\s*/i, '').trim();
    return { type: 'search', query: query || text, utterance: text };
  }

  if (includesAny(text, KEYWORDS.filter)) {
    const remainder = text.replace(/^(apply|apply filters|filter|filters)\s*/i, '').trim();
    if (!remainder) return { type: 'filter', tags: [], utterance: text };
    const tags = remainder.split(/(?:,|\band\b)/i).map((s) => s.trim()).filter(Boolean);
    if (tags.length > 1) return { type: 'filter', tags, utterance: text };
    return { type: 'filter', tag: tags[0], utterance: text };
  }

  return null;
}

export default interpretTranscript;
