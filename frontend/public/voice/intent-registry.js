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

export const settingsIntents = [
  { utterances: ['go to settings', 'open settings'], intent: { type: 'navigate', target: 'settings' } },
  { utterances: ['enable high contrast mode', 'turn on high contrast'], intent: { type: 'settings', action: 'set-high-contrast-mode', value: true } },
  { utterances: ['disable high contrast mode', 'turn off high contrast'], intent: { type: 'settings', action: 'set-high-contrast-mode', value: false } },
  { utterances: ['enable wake word', 'turn on wake word'], intent: { type: 'settings', action: 'set-wake-word-enabled', value: true } },
  { utterances: ['disable wake word', 'turn off wake word'], intent: { type: 'settings', action: 'set-wake-word-enabled', value: false } },
  { utterances: ['set wake word to voyager', 'wake word voyager'], intent: { type: 'settings', action: 'set-wake-word', value: 'voyager' } },
  { utterances: ['set wake word to astra', 'wake word astra'], intent: { type: 'settings', action: 'set-wake-word', value: 'astra' } },
  { utterances: ['increase text size', 'make text bigger'], intent: { type: 'settings', action: 'set-text-size', value: 'large' } },
  { utterances: ['decrease text size', 'make text smaller'], intent: { type: 'settings', action: 'set-text-size', value: 'small' } },
  { utterances: ['set text size medium', 'set text size to medium'], intent: { type: 'settings', action: 'set-text-size', value: 'medium' } },
  { utterances: ['set text size to large'], intent: { type: 'settings', action: 'set-text-size', value: 'large' } },
  { utterances: ['set text size to small'], intent: { type: 'settings', action: 'set-text-size', value: 'small' } },
  { utterances: ['enable reduce animation', 'reduce animation', 'turn on reduce motion'], intent: { type: 'settings', action: 'set-reduce-motion', value: true } },
  { utterances: ['disable reduce animation', 'turn off reduce motion'], intent: { type: 'settings', action: 'set-reduce-motion', value: false } },
  { utterances: ['enable captions', 'turn on captions', 'show captions', 'turn on subtitles'], intent: { type: 'settings', action: 'set-captions', value: true } },
  { utterances: ['disable captions', 'turn off captions', 'hide captions', 'turn off subtitles'], intent: { type: 'settings', action: 'set-captions', value: false } },
  { utterances: ['enable visual alerts', 'turn on visual alerts', 'turn on visual indicators', 'use visual alerts'], intent: { type: 'settings', action: 'set-visual-alerts', value: true } },
  { utterances: ['disable visual alerts', 'turn off visual alerts', 'turn off visual indicators', 'stop visual alerts'], intent: { type: 'settings', action: 'set-visual-alerts', value: false } }
];

export default {
  navigationIntents,
  settingsIntents
};
