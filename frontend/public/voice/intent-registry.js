/**
 * Central registry for spoken utterances -> command intents.
 * Add new entries here (no code changes needed elsewhere).
 */
export const navigationIntents = [
  {
    utterances: ['go to search', 'open search'],
    intent: { type: 'navigate', target: 'search' }
  },
  {
    utterances: ['go home', 'go to home', 'home'],
    intent: { type: 'navigate', target: 'home' }
  },
  {
    utterances: ['back', 'go back'],
    intent: { type: 'navigate', target: 'back' }
  },
  {
    utterances: ['next page', 'forward'],
    intent: { type: 'navigate', target: 'next-page' }
  }
];

export default {
  navigationIntents
};
