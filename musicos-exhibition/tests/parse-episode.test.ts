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

  it('contains 17 non-bridge track narrations (Devo at position 8 has no transcript_zh)', () => {
    // Track 8 (Devo) is bridge-only — its narration_zh is empty/bridge text only.
    // The parser may or may not include it; what matters is ≥17 tracks are parsed.
    expect(result.tracks.length).toBeGreaterThanOrEqual(17);
  });

  it('contains James Brown at position 1', () => {
    const jb = result.tracks.find((t) => t.position === 1);
    expect(jb).toBeDefined();
    expect(jb!.artist).toBe('James Brown');
  });

  it('contains Khruangbin at position 17', () => {
    const kh = result.tracks.find((t) => t.position === 17);
    expect(kh).toBeDefined();
    expect(kh!.artist).toBe('Khruangbin');
  });

  it('contains Mk.gee at position 18', () => {
    const mk = result.tracks.find((t) => t.position === 18);
    expect(mk).toBeDefined();
    expect(mk!.artist).toBe('Mk.gee');
  });

  it('Track N: headers are parsed correctly (## Track N format)', () => {
    // Spot-check that the new format parses correctly
    const chic = result.tracks.find((t) => t.artist === 'Chic' && t.song === 'Good Times');
    expect(chic).toBeDefined();
    expect(chic!.position).toBe(9);
  });
});
