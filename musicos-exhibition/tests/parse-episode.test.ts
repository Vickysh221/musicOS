import { describe, it, expect } from 'vitest';
import { parseEpisode } from '../scripts/lib/parse-episode';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const EPISODE_PATH = path.resolve(
  __dirname,
  '../../episodes/rolling-stones_some-girls_miss-you.episode.md',
);

describe('parseEpisode', () => {
  const md = readFileSync(EPISODE_PATH, 'utf8');
  const result = parseEpisode(md);

  it('returns opening narration (non-empty)', () => {
    expect(result.opening.length).toBeGreaterThan(20);
  });

  it('returns interlude narration (non-empty)', () => {
    expect(result.interlude.length).toBeGreaterThan(20);
  });

  it('returns closing narration (non-empty)', () => {
    expect(result.closing.length).toBeGreaterThan(20);
  });

  it('returns track narrations keyed by artist + song', () => {
    const stones = result.tracks.find(
      (t) => t.artist === 'The Rolling Stones' && t.song === 'Miss You',
    );
    expect(stones).toBeDefined();
    expect(stones!.narration_zh.length).toBeGreaterThan(50);
  });

  it('contains 12 track narrations', () => {
    expect(result.tracks).toHaveLength(12);
  });
});
