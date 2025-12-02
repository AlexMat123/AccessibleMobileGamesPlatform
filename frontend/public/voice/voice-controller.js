import { createVoiceListener } from './voice-listener.js';
import { parseCommand, getWakeWord } from './command-parser.js';
import { dispatchVoiceCommand } from './command-actions.js';
import { mountFeedback, updateStatus, announceCommand } from './voice-feedback.js';
import { interpretTranscriptRemote } from './voice-remote.js';

(() => {
  mountFeedback();

  const WAKE_WINDOW_MS = 2500; // brief window for a single follow-up utterance
  let awakeUntil = 0;
  let clearTimer;
  let spellSession = null; // { field: 'email' | 'password' | 'username' | 'confirm' | 'identifier' }

  const setStatus = (msg, ttlMs = 0) => {
    updateStatus(msg);
    if (clearTimer) clearTimeout(clearTimer);
    if (ttlMs > 0) {
      clearTimer = setTimeout(() => {
        updateStatus('Say "hey platform" 👋');
      }, ttlMs);
    }
  };

  const SPELL_MAP = {
    dot: '.',
    period: '.',
    point: '.',
    dash: '-',
    hyphen: '-',
    underscore: '_',
    space: ' ',
    blank: ' ',
    at: '@',
    'at-sign': '@',
    backspace: '<backspace>',
    delete: '<backspace>'
  };
  const LETTER_NAMES = {
    ay: 'a',
    bee: 'b',
    cee: 'c',
    see: 'c',
    sea: 'c',
    dee: 'd',
    e: 'e',
    ee: 'e',
    eff: 'f',
    ef: 'f',
    gee: 'g',
    jee: 'g',
    aitch: 'h',
    ache: 'h',
    jay: 'j',
    kay: 'k',
    el: 'l',
    ell: 'l',
    em: 'm',
    en: 'n',
    oh: 'o',
    owe: 'o',
    pea: 'p',
    pee: 'p',
    cue: 'q',
    queue: 'q',
    ar: 'r',
    are: 'r',
    ess: 's',
    es: 's',
    tee: 't',
    tea: 't',
    you: 'u',
    u: 'u',
    vee: 'v',
    vi: 'v',
    doubleu: 'w',
    doubleyou: 'w',
    ex: 'x',
    why: 'y',
    wy: 'y',
    zed: 'z',
    zee: 'z'
  };

  const parseSpellField = (text = '') => {
    const f = text.toLowerCase().replace(/e[-\s]?mail/g, 'email');
    if (f.includes('user')) return 'username';
    if (f.includes('identifier') || f.includes('login')) return 'identifier';
    if (f.includes('confirm')) return 'confirm';
    if (f.includes('email')) return 'email';
    return 'password';
  };

  function parseSpellInput(raw) {
    const wakeWord = getWakeWord().toLowerCase();
    const wakeParts = wakeWord.split(/\s+/).filter(Boolean);
    const lower = raw.toLowerCase().replace(/e[-\s]?mail/g, 'email').trim();
    if (!lower) return null;
    const startMatch = lower.match(/^spell\s+(email|password|username|user name|identifier|login|confirm(?:ed)? password|confirm)$/);
    if (startMatch) return { type: 'spell', action: 'start', field: parseSpellField(startMatch[1]) };
    if (/\b(stop spelling|end spelling|finish spelling|stop|done)\b/.test(lower)) return { type: 'spell', action: 'stop' };
    if (/\bclear\b/.test(lower)) return { type: 'spell', action: 'append', clear: true };

    const tokens = lower.split(/\s+/).filter(Boolean);
    const fillers = new Set(['hey', 'platform', ...wakeParts, 'type', 'write', 'enter', 'say', 'letter', 'letters', 'word', 'words', 'and', 'then', 'please']);
    let value = '';
    let backspaces = 0;
    for (const t of tokens) {
      const cleaned = t.replace(/[^a-z0-9-]/g, '');
      if (!cleaned) continue;
      if (fillers.has(cleaned)) continue;
      const mapped = SPELL_MAP[cleaned];
      if (mapped === '<backspace>') {
        backspaces += 1;
        continue;
      }
      if (typeof mapped === 'string') {
        value += mapped;
        continue;
      }
      const letterName = LETTER_NAMES[cleaned];
      if (letterName) {
        value += letterName;
        continue;
      }
      if (/^[a-z]$/.test(cleaned)) {
        value += cleaned;
        continue;
      }
      if (/^[a-z]{2,}$/.test(cleaned)) {
        value += cleaned;
        continue;
      }
      if (/^[0-9]$/.test(cleaned)) {
        value += cleaned;
        continue;
      }
      if (/^[0-9]{2,}$/.test(cleaned)) {
        value += cleaned;
      }
    }
    if (!value && !backspaces) return null;
    return { type: 'spell', action: 'append', value, backspaces };
  }

  const listener = createVoiceListener({
    onTranscript: handleTranscript,
    onStatus: updateStatus
  });

  // Try to start immediately, then fall back to first user interaction (gesture) to satisfy browser policies.
  listener.start();
  const startOnInteraction = () => {
    listener.start();
  };
  window.addEventListener('click', startOnInteraction, { once: true });
  window.addEventListener('keydown', startOnInteraction, { once: true });
  setStatus('Click or say your wake word to start listening');

  async function handleTranscript(raw) {
    const lower = raw.toLowerCase();
    const wakeWord = getWakeWord();

    // If we're spelling, bypass the wake word gate so the user can keep dictating characters.
    if (spellSession) {
      const spellCmd = parseSpellInput(raw);
      if (spellCmd) {
        const field = spellCmd.field || spellSession.field;
        const detail = { ...spellCmd, field, utterance: raw };
        if (spellCmd.action === 'start') {
          spellSession = { field };
          setStatus(`Spelling ${field}. Say letters, "dot", "backspace", "stop spelling".`, 2500);
        } else if (spellCmd.action === 'stop') {
          spellSession = null;
          setStatus('Stopped spelling. Say your wake word for other commands.', 3000);
        }
        announceCommand(detail);
        dispatchVoiceCommand(detail);
      }
      return;
    }

    // Refresh wake window when wake word is spoken
    if (lower.includes(wakeWord)) {
      awakeUntil = Date.now() + WAKE_WINDOW_MS;
      setStatus(`Wake word detected. Listening briefly…`, WAKE_WINDOW_MS);
    }

    const isAwake = Date.now() < awakeUntil;
    if (!isAwake && !lower.includes(wakeWord)) {
      // Ignore chatter when not awake; prompt for wake word.
      setStatus(`Say "${wakeWord}" 👋`);
      return;
    }

    // Show the raw transcript so users can see what was heard.
    setStatus(`Heard: ${raw}`, 2500);

    let cmd = parseCommand(raw);
    // Allow follow-up commands within the wake window without repeating wake word
    if (!cmd && isAwake) {
      cmd = parseCommand(`${wakeWord} ${raw}`);
    }
    let usedRemote = false;
    if (!cmd && isAwake) {
      cmd = await interpretTranscriptRemote(raw);
      usedRemote = Boolean(cmd);
    }
    if (!cmd) {
      if (Date.now() > awakeUntil) {
        setStatus(`Heard: "${raw}". Wake window expired. Say "${wakeWord}" 👋`, 2500);
      } else {
        setStatus(`Heard: "${raw}". No command parsed.`, 2000);
      }
      console.info('[voice] no command parsed', raw);
      return;
    }
    // Extend wake window on each recognised command
    awakeUntil = 0; // close window after handling a command
    console.info('[voice] parsed command', cmd);
    setStatus(`Command: ${cmd.type}${cmd.query ? ` "${cmd.query}"` : ''}${cmd.tag ? ` "${cmd.tag}"` : ''}${Array.isArray(cmd.tags) ? ` [${cmd.tags.join(', ')}]` : ''}${usedRemote ? ' (remote)' : ''}`, 2500);
    announceCommand(cmd);
    if (cmd.type === 'spell' && cmd.action === 'start') {
      spellSession = { field: cmd.field || 'email' };
      setStatus(`Spelling ${spellSession.field}. Say letters, "dot", "backspace", "stop spelling".`, 2500);
    }
    if (cmd.type === 'spell' && cmd.action === 'stop') {
      spellSession = null;
      setStatus('Stopped spelling. Say your wake word for other commands.', 3000);
    }
    dispatchVoiceCommand(cmd);
    // Reset the recognizer to avoid concatenating subsequent sentences.
    listener.stop();
    setTimeout(() => listener.start(), 200);
  }
})();
