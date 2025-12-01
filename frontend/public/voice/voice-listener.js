import { getWakeWord } from './command-parser.js';

/**
 * Lightweight wrapper for the Web Speech API to keep the mic alive
 * and stream transcripts to callbacks.
 */
export function createVoiceListener({ onTranscript, onStatus }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onStatus?.('SpeechRecognition not supported');
    console.warn('[voice] SpeechRecognition not supported');
    return {
      start: () => {},
      stop: () => {}
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let running = false;

  recognition.onstart = () => {
    running = true;
    const wakeWord = getWakeWord();
    onStatus?.(`Listening... say "${wakeWord}"`);
    console.info('[voice] mic started');
  };

  recognition.onend = () => {
    running = false;
    onStatus?.('Reconnecting mic...');
    console.info('[voice] mic stopped, restarting');
    setTimeout(() => {
      if (!running) {
        try {
          recognition.start();
        } catch (e) {
          console.warn('[voice] restart failed', e?.message || e);
        }
      }
    }, 400);
  };

  recognition.onerror = (e) => {
    onStatus?.(`Mic error: ${e.error}`);
    console.error('[voice] mic error', e);
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((r) => r[0]?.transcript || '')
      .join(' ')
      .trim();
    if (transcript) {
      console.info('[voice] transcript', transcript);
      onTranscript?.(transcript);
    }
  };

  return {
    start() {
      if (running) return;
      try {
        recognition.start();
        onStatus?.('Starting mic...');
      } catch (e) {
        onStatus?.(`Unable to start mic: ${e.message}`);
      }
    },
    stop() {
      if (!running) return;
      recognition.stop();
    }
  };
}
