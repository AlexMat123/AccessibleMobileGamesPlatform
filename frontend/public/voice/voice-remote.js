/**
 * Best-effort call to backend interpreter. Returns intent or null.
 */
export async function interpretTranscriptRemote(raw) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await window.fetch('/api/voice/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: raw }),
      signal: controller.signal
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.intent || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default interpretTranscriptRemote;
