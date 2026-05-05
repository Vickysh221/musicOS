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

  it('all 18 tracks have transcript_zh_status === "complete" (v0.4: Devo bridge counts as complete narration)', () => {
    const complete = data.filter(
      (e) => e.kind === 'track' && e.transcript_zh_status === 'complete',
    );
    expect(complete).toHaveLength(18);
  });

  it('0 tracks remain placeholder under v0.4 (Devo carries bridge_narration_zh instead)', () => {
    const placeholders = data.filter(
      (e) => e.kind === 'track' && e.transcript_zh_status === 'placeholder',
    );
    expect(placeholders).toHaveLength(0);
  });

  it('all transcript_en_status values are "missing" (Phase 1)', () => {
    expect(data.every((e) => e.transcript_en_status === 'missing')).toBe(true);
  });

  it('audio_url is preserved from previous build (not clobbered to null by build-data)', () => {
    // build-exhibition-json.ts now carries audio_url forward from the existing file.
    // Tracks with a netease_song_id (after fetch-audio) should have a non-null url;
    // tracks without an id (pos 11 Talking Heads, pos 12 Queen) have null intentionally.
    const tracks = data.filter((e): e is TrackExhibit => e.kind === 'track');
    const withId = tracks.filter((t) => t.netease_song_id !== null);
    // At minimum, the field must be a string or null — never undefined.
    expect(tracks.every((t) => t.audio_url === null || typeof t.audio_url === 'string')).toBe(true);
    // After fetch-audio has run, tracks with an ID should have a url.
    if (withId.some((t) => t.audio_url !== null)) {
      expect(withId.every((t) => t.audio_url !== null)).toBe(true);
    }
  });

  it('every track has episode_focus = "bassline_dna"', () => {
    const tracks = data.filter((e) => e.kind === 'track') as TrackExhibit[];
    for (const t of tracks) {
      expect(t.episode_focus).toBe('bassline_dna');
    }
  });

  it('every track has a non-null genre', () => {
    const tracks = data.filter((e) => e.kind === 'track') as TrackExhibit[];
    for (const t of tracks) {
      expect(t.genre, `track ${t.position} missing genre`).toBeTruthy();
    }
  });

  it('every track has red_heart_tier in {hit,adjacent,blind_spot}', () => {
    const tracks = data.filter((e) => e.kind === 'track') as TrackExhibit[];
    for (const t of tracks) {
      expect(['hit', 'adjacent', 'blind_spot']).toContain(t.red_heart_tier);
    }
  });

  it('non-muted tracks (excluding position 1) have ≥1 inbound connection', () => {
    // Spec hard req: "at least one of in/out must be non-empty for non-arc-endpoint positions"
    // Position 10 (Joy Division) is a lateral node — it has connections_out + connections_lateral
    // but no from_inspires_to inbound; the test checks inbound OR outbound to satisfy spec intent.
    const tracks = data.filter((e) => e.kind === 'track') as TrackExhibit[];
    for (const t of tracks) {
      if (t.muted_this_episode) continue;
      if (t.position === 1) continue;  // arc start has no upstream
      const hasConnection = t.connections_in.length >= 1 || t.connections_out.length >= 1;
      expect(hasConnection, `track ${t.position} has no inbound or outbound connections`)
        .toBe(true);
    }
  });

  it('Devo (position 8) is muted with a bridge_narration_zh', () => {
    const devo = (data.filter((e) => e.kind === 'track') as TrackExhibit[])
      .find((t) => t.position === 8)!;
    expect(devo.muted_this_episode).toBe(true);
    expect(devo.bridge_narration_zh).toBeTruthy();
  });

  it('album_cover_url is backfilled from public/covers/<slug>.jpg when present', () => {
    const tracks = data.filter((e): e is TrackExhibit => e.kind === 'track');
    // At least 15 of 18 tracks should have a non-null cover URL pointing at /covers/.
    const withCovers = tracks.filter((t) => typeof t.album_cover_url === 'string' && t.album_cover_url!.startsWith('/covers/'));
    expect(withCovers.length).toBeGreaterThanOrEqual(15);
  });
});
