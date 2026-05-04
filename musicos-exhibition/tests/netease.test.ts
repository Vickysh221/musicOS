import { describe, it, expect } from 'vitest';
import { fetchSongMeta } from '../scripts/lib/netease.js';

const NET = process.env.RUN_NETWORK_TESTS === '1';

describe.skipIf(!NET)('netease', () => {
  // Note: song ID 105575 does not exist on NetEase (returns 404).
  // Using 21968201 — "Miss You (Remastered)" by The Rolling Stones —
  // which was verified during the Task 1 spike and confirmed working.
  it('fetches Miss You URL and cover', async () => {
    const meta = await fetchSongMeta('21968201');
    expect(meta).not.toBeNull();
    expect(meta!.audio_url).toMatch(/^https?:\/\//);
    expect(meta!.cover_url).toMatch(/^https?:\/\//);
    expect(meta!.duration_seconds).toBeGreaterThan(60);
  });
});
