import { interpretTranscript } from './intent.js';

describe('interpretTranscript (heuristic)', () => {
  it('recognises reset filters', () => {
    expect(interpretTranscript('reset filters')).toEqual({ type: 'reset-filters', utterance: 'reset filters' });
  });

  it('recognises navigate search', () => {
    expect(interpretTranscript('go to search page')).toEqual({ type: 'navigate', target: 'search', utterance: 'go to search page' });
  });

  it('recognises scroll', () => {
    expect(interpretTranscript('scroll down please')).toEqual({ type: 'scroll', direction: 'down', utterance: 'scroll down please' });
  });

  it('parses search query', () => {
    expect(interpretTranscript('search for puzzle games')).toEqual({ type: 'search', query: 'puzzle games', utterance: 'search for puzzle games' });
  });

  it('parses filter tags', () => {
    expect(interpretTranscript('apply filters color blind mode and high contrast')).toEqual({
      type: 'filter',
      tags: ['color blind mode', 'high contrast'],
      utterance: 'apply filters color blind mode and high contrast'
    });
  });
});
