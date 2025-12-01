import { navigationIntents } from './intent-registry.js';

const WAKE_WORD = 'hey platform';
const ratingWords = { one: 1, two: 2, three: 3, four: 4, five: 5 };

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

const gameActions = [
  [/^add to watchlist$/, () => ({ type: 'game', action: 'add-to-watchlist' })],
  [/^(open )?reviews$/, () => ({ type: 'game', action: 'open-reviews' })],
  [/^scroll down$/, () => ({ type: 'scroll', direction: 'down' })],
  [/^scroll up$/, () => ({ type: 'scroll', direction: 'up' })],
  [/^follow( game)?$/, () => ({ type: 'game', action: 'follow' })],
  [/^unfollow( game)?$/, () => ({ type: 'game', action: 'unfollow' })],
  [/^(write|add|leave|start) (a )?review$/, () => ({ type: 'game', action: 'write-review' })],
  [/^(open|show) review$/, () => ({ type: 'game', action: 'write-review' })],
  [/^(set|change) (a|the )?(rating|score)( to)? ([1-5])(?:\\b.*)?$/, (value) => ({ type: 'game', action: 'set-review-rating', value: Number(value) })],
  [/^(rating|score) ([1-5])$/, (value) => ({ type: 'game', action: 'set-review-rating', value: Number(value) })],
  [/^(set|change) (a|the )?(rating|score)( to)? (one|two|three|four|five)(?:\\b.*)?$/, (word) => {
    const w = (word || '').toLowerCase();
    const val = ratingWords[w];
    return val ? { type: 'game', action: 'set-review-rating', value: val } : null;
  }],
  [/^(comment|write|type)[, ]+(?:this )?(.+)$/, (text) => {
    const body = (text || '').trim();
    if (!body) return null;
    return { type: 'game', action: 'set-review-comment', value: body };
  }],
  [/^(right|write|type) comment[, ]+(?:this )?(.+)$/, (text) => {
    const body = (text || '').trim();
    if (!body) return null;
    return { type: 'game', action: 'set-review-comment', value: body };
  }],
  [/^focus (the )?(comment|textarea)$/, () => ({ type: 'game', action: 'focus-review-comment' })],
  [/^(submit|post) review$/, () => ({ type: 'game', action: 'submit-review' })],
  [/^(cancel|close) review$/, () => ({ type: 'game', action: 'cancel-review' })],
  [/^download( game)?$/, () => ({ type: 'game', action: 'download' })],
  [/^(add to )?wishlist$/, () => ({ type: 'game', action: 'wishlist' })],
  [/^report( game)?$/, () => ({ type: 'game', action: 'report' })],
  [/^(next|forward) (image|screenshot|slide)$/, () => ({ type: 'game', action: 'next-image' })],
  [/^(previous|prev|back) (image|screenshot|slide)$/, () => ({ type: 'game', action: 'prev-image' })],
  [/^(next|forward) (gallery|carousel)$/, () => ({ type: 'game', action: 'next-additional' })],
  [/^(previous|prev|back) (gallery|carousel)$/, () => ({ type: 'game', action: 'prev-additional' })]
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

function stripWakeWord(input = '') {
  // Normalise punctuation so variants like "hey, platform. ..." are accepted.
  const normalised = input.toLowerCase().replace(/[.,!?]/g, '').trim();
  if (!normalised.startsWith(WAKE_WORD)) return null;
  return normalised.slice(WAKE_WORD.length).trim();
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

function ratingFallback(command) {
  const lowered = command.toLowerCase();
  if (!/\brating\b|\bscore\b/.test(lowered)) return null;
  const digit = lowered.match(/\b([1-5])\b/);
  if (digit) return { type: 'game', action: 'set-review-rating', value: Number(digit[1]) };
  const word = lowered.match(/\b(one|two|three|four|five)\b/);
  if (word) {
    const val = ratingWords[word[1]];
    if (val) return { type: 'game', action: 'set-review-rating', value: val };
  }
  return null;
}

export function parseCommand(rawTranscript) {
  const command = stripWakeWord(rawTranscript);
  if (!command) return null;

  const registryMatch = matchRegisteredIntents(command, navigationIntents);
  if (registryMatch) return registryMatch;

  const result =
    match(command, navigation) ||
    match(command, searches) ||
    match(command, filters) ||
    match(command, gameActions) ||
    ratingFallback(command) ||
    forgivingFilterMatch(command);

  return result ? { ...result, utterance: command } : null;
}

export { WAKE_WORD };
