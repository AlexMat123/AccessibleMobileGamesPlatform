const WAKE_WORD = 'hey platform';

const navigation = [
  [/^go( to)? home$/, () => ({ type: 'navigate', target: 'home' })],
  [/^(open )?(filters|filter panel)$/, () => ({ type: 'ui', target: 'filters', action: 'open' })],
  [/^(open )?favourites?$/, () => ({ type: 'navigate', target: 'favourites' })],
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

export function parseCommand(rawTranscript) {
  const command = stripWakeWord(rawTranscript);
  if (!command) return null;

  const result =
    match(command, navigation) ||
    match(command, searches) ||
    match(command, filters) ||
    match(command, gameActions) ||
    forgivingFilterMatch(command);

  return result ? { ...result, utterance: command } : null;
}

export { WAKE_WORD };
