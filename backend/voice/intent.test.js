import { interpretTranscript } from './intent.js';

describe('interpretTranscript', () => {
  it('returns null for now', () => {
    expect(interpretTranscript('any text')).toBeNull();
  });
});
