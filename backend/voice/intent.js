/**
 * Intent schema:
 * { type: 'navigate'|'search'|'filter'|'reset-filters'|'ui'|'scroll'|'game',
 *   target?: string, query?: string, tags?: string[], tag?: string, action?: string, direction?: 'up'|'down' }
 *
 * Heuristic interpreter (offline, free) with optional Ollama LLM if VOICE_LLM_MODEL is set.
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

function heuristicInterpret(text) {
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

async function interpretWithOllama(text) {
  const model = process.env.VOICE_LLM_MODEL;
  const host = process.env.VOICE_LLM_HOST || 'http://localhost:11434';
  if (!model) return null;

  const system = `
You are an intent parser. Return ONLY JSON with fields:
{ "type": "navigate|search|filter|reset-filters|ui|scroll|game",
  "target?": string,
  "query?": string,
  "tags?": [string],
  "tag?": string,
  "action?": string,
  "direction?": "up"|"down",
  "utterance": "<original text>"
}
Rules:
- "reset/clear filters" => type=reset-filters
- "go to/open search" => type=navigate target=search
- "scroll up/down" => type=scroll with direction
- "search/find/look for ..." => type=search with query text (strip the verb)
- "filter/apply filters ..." => type=filter with tags array (split on "and"/commas)
- Otherwise return null.
`;

  const body = {
    model,
    prompt: `${system.trim()}\nUser: ${text}\nJSON:`,
    stream: false,
    format: 'json'
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.response) return null;
    const parsed = JSON.parse(json.response);
    if (!parsed?.type) return null;
    return { ...parsed, utterance: parsed.utterance || text };
  } catch (err) {
    console.warn('[voice-intent] Ollama interpret failed', err?.message || err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function interpretTranscript(transcript) {
  const text = String(transcript || '').toLowerCase().trim();
  if (!text) return null;

  // Try local LLM if configured; otherwise heuristic
  const llmIntent = await interpretWithOllama(text);
  if (llmIntent) return llmIntent;

  return heuristicInterpret(text);
}

export default interpretTranscript;
