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

  listener.start();

  function handleTranscript(raw) {
    const cmd = parseCommand(raw);
    if (!cmd) {
      updateStatus(`Say “${WAKE_WORD} …”`);
      return;
    }
    announceCommand(cmd);
    dispatchVoiceCommand(cmd);
  }
})();
