import { describe, it, expect } from 'vitest';
import { parseCommand } from '../../public/voice/command-parser.js';

describe('voice command parser (wake-word gated)', () => {
  it('returns null without wake word', () => {
    expect(parseCommand('filter by motor')).toBeNull();
  });

  it('parses navigation via registry', () => {
    const intent = parseCommand('Hey Platform go to search');
    expect(intent).toEqual({ type: 'navigate', target: 'search', utterance: 'go to search' });
  });

  it('parses filter commands with wake word', () => {
    const intent = parseCommand('hey platform filter by motor');
    expect(intent).toEqual({ type: 'filter', tag: 'Motor', utterance: 'filter by motor' });
  });

  it('parses search commands with wake word', () => {
    const intent = parseCommand('hey platform search for puzzle games');
    expect(intent).toEqual({ type: 'search', query: 'puzzle games', utterance: 'search for puzzle games' });
  });
});
