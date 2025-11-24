import { createVoiceListener } from './voice-listener.js';
import { parseCommand, WAKE_WORD } from './command-parser.js';
import { dispatchVoiceCommand } from './command-actions.js';
import { mountFeedback, updateStatus, announceCommand } from './voice-feedback.js';

(() => {
  mountFeedback();

  const WAKE_WINDOW_MS = 2500; // brief window for a single follow-up utterance
  let awakeUntil = 0;
  let clearTimer;

  const setStatus = (msg, ttlMs = 0) => {
    updateStatus(msg);
    if (clearTimer) clearTimeout(clearTimer);
    if (ttlMs > 0) {
      clearTimer = setTimeout(() => {
        updateStatus('Say “hey platform …”');
      }, ttlMs);
    }
  };

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
  setStatus('Click or say “Hey Platform” to start listening');

  function handleTranscript(raw) {
    const lower = raw.toLowerCase();

    // Refresh wake window when wake word is spoken
    if (lower.includes(WAKE_WORD)) {
      awakeUntil = Date.now() + WAKE_WINDOW_MS;
      setStatus('Wake word detected. Listening briefly…', WAKE_WINDOW_MS);
    }

    const isAwake = Date.now() < awakeUntil;
    if (!isAwake && !lower.includes(WAKE_WORD)) {
      // Ignore chatter when not awake; prompt for wake word.
      setStatus(`Say “${WAKE_WORD} …”`);
      return;
    }

    // Show the raw transcript so users can see what was heard.
    setStatus(`Heard: ${raw}`, 2500);

    let cmd = parseCommand(raw);
    // Allow follow-up commands within the wake window without repeating wake word
    if (!cmd && isAwake) {
      cmd = parseCommand(`${WAKE_WORD} ${raw}`);
    }
    if (!cmd) {
      if (Date.now() > awakeUntil) {
        setStatus(`Heard: "${raw}". Wake window expired. Say “${WAKE_WORD} …”`, 2500);
      } else {
        setStatus(`Heard: "${raw}". No command parsed.`, 2000);
      }
      console.info('[voice] no command parsed', raw);
      return;
    }
    // Extend wake window on each recognised command
    awakeUntil = 0; // close window after handling a command
    console.info('[voice] parsed command', cmd);
    setStatus(`Command: ${cmd.type}${cmd.query ? ` "${cmd.query}"` : ''}${cmd.tag ? ` "${cmd.tag}"` : ''}`, 2500);
    announceCommand(cmd);
    dispatchVoiceCommand(cmd);
    // Reset the recognizer to avoid concatenating subsequent sentences.
    listener.stop();
    setTimeout(() => listener.start(), 200);
  }
})();
