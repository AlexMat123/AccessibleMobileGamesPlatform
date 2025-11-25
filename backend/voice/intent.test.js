import { interpretTranscript } from './intent.js';

describe('interpretTranscript (heuristic fallback)', () => {
  it('recognises reset filters', async () => {
    await expect(interpretTranscript('reset filters')).resolves.toEqual({ type: 'reset-filters', utterance: 'reset filters' });
  });

  it('recognises navigate search', async () => {
    await expect(interpretTranscript('go to search page')).resolves.toEqual({ type: 'navigate', target: 'search', utterance: 'go to search page' });
  });

  it('recognises scroll', async () => {
    await expect(interpretTranscript('scroll down please')).resolves.toEqual({ type: 'scroll', direction: 'down', utterance: 'scroll down please' });
  });

  it('parses search query', async () => {
    await expect(interpretTranscript('search for puzzle games')).resolves.toEqual({ type: 'search', query: 'puzzle games', utterance: 'search for puzzle games' });
  });

  it('parses filter tags', async () => {
    await expect(interpretTranscript('apply filters color blind mode and high contrast')).resolves.toEqual({
      type: 'filter',
      tags: ['color blind mode', 'high contrast'],
      utterance: 'apply filters color blind mode and high contrast'
    });
  });
});
