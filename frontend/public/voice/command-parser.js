import { navigationIntents, settingsIntents } from './intent-registry.js';

const DEFAULT_WAKE_WORD = 'hey platform';
const SETTINGS_KEY = 'appSettings';

const navigation = [
  [/^go( to)? home$/, () => ({ type: 'navigate', target: 'home' })],
  [/^(open )?(filters|filter panel)$/, () => ({ type: 'ui', target: 'filters', action: 'open' })],
  [/^(open )?favourites?$/, () => ({ type: 'navigate', target: 'favourites' })],
  [/^(go to|open) search$/, () => ({ type: 'navigate', target: 'search' })],
  [/^next page$/, () => ({ type: 'navigate', target: 'next-page' })],
  [/^back$/, () => ({ type: 'navigate', target: 'back' })],
  [/^open settings$/, () => ({ type: 'navigate', target: 'settings' })]
];

const searches = [
  [/^(search for |search )(.+)/, (q) => ({ type: 'search', query: q })],
  [/^(find )(.+)/, (q) => ({ type: 'search', query: q })],
  [/^look for (.+)/, (q) => ({ type: 'search', query: q })]
];

const filters = [
  [/^filter by hearing$/, () => ({ type: 'filter', tag: 'Hearing' })],
  [/^filter by motor$/, () => ({ type: 'filter', tag: 'Motor' })],
  [/^filter by vision$/, () => ({ type: 'filter', tag: 'Vision' })],
  [/^filter by speech$/, () => ({ type: 'filter', tag: 'Speech' })],
  [/^filter by cognitive$/, () => ({ type: 'filter', tag: 'Cognitive' })],
  [/^show only one[- ]handed games$/, () => ({ type: 'filter', tag: 'One-Handed' })],
  [/^(reset|clear) (all )?(filters|filter)$/, () => ({ type: 'reset-filters' })],
  // Generic filter capture: "apply filter puzzle", "filter by action", "apply filters hearing"
  [/^(apply (the )?filters?|filter by|filter)\s+(.+)/, (tagText) => {
    const cleaned = String(tagText || '').replace(/[.,!?]/g, ' ').trim();
    if (!cleaned) return null;
    // Support multiple tags: split on commas or " and "
    const parts = cleaned
      .split(/(?:\band\b|,)/i)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 1) return { type: 'filter', tags: parts };
    return { type: 'filter', tag: parts[0] };
  }]
];

const sorters = [
  [/^sort by (relevance|relevant)$/, () => ({ type: 'sort', value: 'relevance' })],
  [/^sort by (newest|latest)$/, () => ({ type: 'sort', value: 'newest' })],
  [/^sort by (rating|top rating|top rated)$/, () => ({ type: 'sort', value: 'rating' })],
  [/^sort by (title|name|a to z|a-z|alphabetical)$/, () => ({ type: 'sort', value: 'title' })]
];

const gameActions = [
  [/^add to watchlist$/, () => ({ type: 'game', action: 'add-to-watchlist' })],
  [/^(open )?reviews$/, () => ({ type: 'game', action: 'open-reviews' })],
  [/^scroll down$/, () => ({ type: 'scroll', direction: 'down' })],
  [/^scroll up$/, () => ({ type: 'scroll', direction: 'up' })]
];

// Forgiving keyword map to recover a filter intent from noisy phrases
const KEYWORD_FILTERS = [
  { keywords: ['hearing'], tag: 'Hearing' },
  { keywords: ['motor'], tag: 'Motor' },
  { keywords: ['vision', 'visual'], tag: 'Vision' },
  { keywords: ['speech', 'voice'], tag: 'Speech' },
  { keywords: ['cognitive', 'cognition'], tag: 'Cognitive' },
  { keywords: ['colorblind', 'colourblind', 'color blind', 'colour blind'], tag: 'Colourblind Mode' },
  { keywords: ['high contrast'], tag: 'High Contrast' },
  { keywords: ['large text'], tag: 'Large Text' },
  { keywords: ['screen reader'], tag: 'Screen Reader Friendly' },
  { keywords: ['no audio', 'no sound'], tag: 'No Audio Needed' },
  { keywords: ['no voice'], tag: 'No Voice Required' },
  { keywords: ['one handed', 'one hand'], tag: 'One-Handed' },
  // Genres
  { keywords: ['puzzle'], tag: 'Puzzle' },
  { keywords: ['action'], tag: 'Action' },
  { keywords: ['rpg'], tag: 'RPG' },
  { keywords: ['platformer'], tag: 'Platformer' },
  { keywords: ['strategy'], tag: 'Strategy' },
  { keywords: ['casual'], tag: 'Casual' },
  { keywords: ['adventure'], tag: 'Adventure' }
];

function forgivingFilterMatch(command) {
  const hasFilterWord = /\b(filter|filters|apply)\b/.test(command);
  if (!hasFilterWord) return null;
  for (const entry of KEYWORD_FILTERS) {
    if (entry.keywords.some((k) => command.includes(k))) {
      return { type: 'filter', tag: entry.tag };
    }
  }
  return null;
}

function getWakeWord() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(SETTINGS_KEY) : null;
    if (!raw) return DEFAULT_WAKE_WORD;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.wakeWordEnabled === false) return DEFAULT_WAKE_WORD;
    const ww = (parsed && parsed.wakeWord) ? String(parsed.wakeWord).trim() : '';
    return ww ? ww.toLowerCase() : DEFAULT_WAKE_WORD;
  } catch (e) {
    console.warn('[voice] failed to read wake word, using default', e);
    return DEFAULT_WAKE_WORD;
  }
}

function stripWakeWord(input = '') {
  // Normalise punctuation so variants like "hey, platform. ..." are accepted.
  const wakeWord = getWakeWord();
  const normalised = input.toLowerCase().replace(/[.,!?]/g, '').trim();
  if (!normalised.startsWith(wakeWord)) return null;
  return normalised.slice(wakeWord.length).trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const v0 = new Array(b.length + 1).fill(0);
  const v1 = new Array(b.length + 1).fill(0);
  for (let i = 0; i < v0.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j < v0.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

function stripWakeWordLoose(input = '') {
  const wakeWord = getWakeWord();
  const normalised = input.toLowerCase().replace(/[.,!?]/g, '').trim();
  const slice = normalised.slice(0, wakeWord.length + 4); // allow minor slips
  const distance = levenshtein(slice.slice(0, wakeWord.length), wakeWord);
  if (distance <= 2) return normalised.slice(wakeWord.length).trim();
  return null;
}

function match(command, matchers) {
  for (const [regex, build] of matchers) {
    const m = command.match(regex);
    if (m) {
      const captures = m.slice(1).filter(Boolean);
      const primary = captures.length ? captures[captures.length - 1] : command;
      const result = build(primary, m);
      if (result) return result;
    }
  }
  return null;
}

function matchRegisteredIntents(command, registry) {
  const normalised = command.toLowerCase().trim();
  for (const entry of registry) {
    for (const utterance of entry.utterances) {
      if (normalised === utterance.toLowerCase().trim()) {
        return { ...entry.intent, utterance: command };
      }
    }
  }
  return null;
}

function fuzzyRegistryMatch(command, registry) {
  const target = command.toLowerCase().trim();
  let best = null;
  for (const entry of registry) {
    for (const utterance of entry.utterances) {
      const candidate = utterance.toLowerCase().trim();
      const dist = levenshtein(target, candidate);
      const tolerance = Math.max(2, Math.ceil(candidate.length * 0.25));
      if (dist <= tolerance) {
        if (!best || dist < best.dist) {
          best = { dist, intent: { ...entry.intent, utterance: command } };
        }
      }
    }
  }
  return best ? best.intent : null;
}

function textSizeFallback(command) {
  // Catch noisy phrases like "can you set text size maybe medium"
  const sizeHit = command.match(/\b(text size|font size).*\b(small|medium|large)\b/);
  if (sizeHit) {
    return { type: 'settings', action: 'set-text-size', value: sizeHit[2] };
  }
  return null;
}

function buttonSizeFallback(command) {
  // e.g., "make the buttons extra large", "set button size normal"
  const lower = command.toLowerCase();
  if (lower.includes('extra large') || lower.includes('extra-large') || lower.includes('xlarge')) {
    return { type: 'settings', action: 'set-button-size', value: 'xlarge' };
  }
  const hit = command.match(/\b(buttons?|button size)\b.*\b(normal|large)\b/);
  if (!hit) return null;
  const raw = hit[2];
  const value = raw === 'normal' ? 'normal' : 'large';
  return { type: 'settings', action: 'set-button-size', value };
}

function spacingFallback(command) {
  // e.g., "set spacing to extra room", "make spacing tighter"
  const hit = command.match(/\bspacing\b.*\b(tight|snug|roomy|roomie|normal|extra[ -]?room|wide|wider)\b/);
  if (!hit) return null;
  const raw = hit[1];
  if (raw.includes('extra room')) return { type: 'settings', action: 'set-spacing', value: 'airy' };
  if (raw === 'tight' || raw === 'snug' || raw === 'wider') return { type: 'settings', action: 'set-spacing', value: 'snug' };
  if (raw === 'roomy' || raw === 'roomie' || raw === 'normal' || raw === 'wide') return { type: 'settings', action: 'set-spacing', value: 'roomy' };
  return { type: 'settings', action: 'set-spacing', value: 'airy' };
}

function wakeWordFallback(command) {
  // e.g., "change wake word to astra", "set wakeword voyager"
  const hit = command.match(/\bwake ?word\b.*\b(?:to )?([a-z0-9\s'-]{2,20})$/i);
  if (!hit) return null;
  const raw = hit[1].trim();
  if (!raw) return null;
  const word = raw.split(/\s+/).join(' ').toLowerCase();
  return { type: 'settings', action: 'set-wake-word', value: word };
}

export function parseCommand(rawTranscript) {
  let command = stripWakeWord(rawTranscript);
  if (!command) command = stripWakeWordLoose(rawTranscript);
  if (!command) return null;

  const registryMatch = matchRegisteredIntents(command, [...navigationIntents, ...settingsIntents]);
  if (registryMatch) return registryMatch;

  const fuzzyRegistry = fuzzyRegistryMatch(command, [...navigationIntents, ...settingsIntents]);
  if (fuzzyRegistry) return fuzzyRegistry;

  const result =
    match(command, navigation) ||
    match(command, searches) ||
    match(command, filters) ||
    match(command, sorters) ||
    match(command, gameActions) ||
    textSizeFallback(command) ||
    buttonSizeFallback(command) ||
    spacingFallback(command) ||
    wakeWordFallback(command) ||
    forgivingFilterMatch(command);

  return result ? { ...result, utterance: command } : null;
}

export { DEFAULT_WAKE_WORD, getWakeWord };
