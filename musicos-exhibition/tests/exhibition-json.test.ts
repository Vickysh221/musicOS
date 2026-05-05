import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Exhibit, TrackExhibit } from '../src/types';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data/exhibition.json');

describe('build-exhibition-json', () => {
  beforeAll(() => {
    execSync('npm run build-data', { cwd: ROOT, stdio: 'inherit' });
  });

  let data: Exhibit[];

  beforeAll(() => {
    data = JSON.parse(readFileSync(OUT, 'utf8')) as Exhibit[];
  });

  it('contains 21 exhibits (18 tracks + opening + interlude + closing)', () => {
    expect(data).toHaveLength(21);
  });

  it('has exactly 18 track-kind exhibits', () => {
    expect(data.filter((e) => e.kind === 'track')).toHaveLength(18);
  });

  it('track positions are 1..18 contiguous (matching playlist)', () => {
    const tracks = data
      .filter((e) => e.kind === 'track')
      .map((e) => e.position)
      .sort((a, b) => a - b);
    expect(tracks).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
  });

  it('narrations sit at positions 0, 19, 20', () => {
    const narrations = data
      .filter((e) => e.kind === 'narration')
      .map((e) => e.position)
      .sort((a, b) => a - b);
    expect(narrations).toEqual([0, 19, 20]);
  });

  it('Miss You is the only is_base_node', () => {
    const bases = data.filter(
      (e): e is TrackExhibit => e.kind === 'track' && e.is_base_node,
    );
    expect(bases).toHaveLength(1);
    expect(bases[0]!.song).toBe('Miss You');
  });

  it('Talking Heads track has netease_song_id null but is still a track', () => {
    const th = data.find(
      (e): e is TrackExhibit => e.kind === 'track' && e.artist === 'Talking Heads',
    );
    expect(th).toBeDefined();
    expect(th!.netease_song_id).toBeNull();
  });

  it('12 tracks have transcript_zh_status === "complete"', () => {
    const complete = data.filter(
      (e) => e.kind === 'track' && e.transcript_zh_status === 'complete',
    );
    expect(complete).toHaveLength(12);
  });

  it('6 tracks have transcript_zh_status === "placeholder"', () => {
    const placeholders = data.filter(
      (e) => e.kind === 'track' && e.transcript_zh_status === 'placeholder',
    );
    expect(placeholders).toHaveLength(6);
  });

  it('all transcript_en_status values are "missing" (Phase 1)', () => {
    expect(data.every((e) => e.transcript_en_status === 'missing')).toBe(true);
  });

  it('audio_url is null in built output (Phase 1: not yet fetched)', () => {
    const tracks = data.filter((e): e is TrackExhibit => e.kind === 'track');
    expect(tracks.every((t) => t.audio_url === null)).toBe(true);
  });

  it('album_cover_url is backfilled from public/covers/<slug>.jpg when present', () => {
    const tracks = data.filter((e): e is TrackExhibit => e.kind === 'track');
    // At least 15 of 18 tracks should have a non-null cover URL pointing at /covers/.
    const withCovers = tracks.filter((t) => typeof t.album_cover_url === 'string' && t.album_cover_url!.startsWith('/covers/'));
    expect(withCovers.length).toBeGreaterThanOrEqual(15);
  });
});
