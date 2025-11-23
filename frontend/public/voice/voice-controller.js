import { createVoiceListener } from './voice-listener.js';
import { parseCommand, WAKE_WORD } from './command-parser.js';
import { dispatchVoiceCommand } from './command-actions.js';
import { mountFeedback, updateStatus, announceCommand } from './voice-feedback.js';

(() => {
  mountFeedback();

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
  updateStatus('Click or say “Hey Platform” to start listening');

  function handleTranscript(raw) {
    // Show the raw transcript so users can see what was heard.
    updateStatus(`Heard: ${raw}`);

    // If wake word was heard but no recognised intent yet, acknowledge it.
    if (raw.toLowerCase().includes(WAKE_WORD) && !parseCommand(raw)) {
      updateStatus(`Heard: "${raw}". Wake word detected, awaiting command…`);
    }

    const cmd = parseCommand(raw);
    if (!cmd) {
      updateStatus(`Heard: "${raw}". No command parsed. Say “${WAKE_WORD} …”`);
      console.info('[voice] no command parsed', raw);
      return;
    }
    console.info('[voice] parsed command', cmd);
    updateStatus(`Command: ${cmd.type}${cmd.query ? ` "${cmd.query}"` : ''}${cmd.tag ? ` "${cmd.tag}"` : ''}`);
    announceCommand(cmd);
    dispatchVoiceCommand(cmd);
  }
})();
