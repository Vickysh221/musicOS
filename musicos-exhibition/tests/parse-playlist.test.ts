import { describe, it, expect } from 'vitest';
import { parsePlaylist } from '../scripts/lib/parse-playlist';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const PLAYLIST_PATH = path.resolve(
  __dirname,
  '../../playlists/rolling-stones_some-girls_miss-you.playlist v0.2.md',
);

describe('parsePlaylist', () => {
  const md = readFileSync(PLAYLIST_PATH, 'utf8');
  const tracks = parsePlaylist(md);

  it('extracts 18 tracks', () => {
    expect(tracks).toHaveLength(18);
  });

  it('Track 1 is James Brown — Cold Sweat 1967, NetEase 18713', () => {
    expect(tracks[0]).toMatchObject({
      position: 1,
      artist: 'James Brown',
      song: 'Cold Sweat',
      year: 1967,
      netease_song_id: '18713',
    });
  });

  it('Track 6 is the anchor (Miss You)', () => {
    expect(tracks[5]).toMatchObject({
      position: 6,
      artist: 'The Rolling Stones',
      song: 'Miss You',
      year: 1978,
      netease_song_id: '105575',
    });
  });

  it('Track 12 (Queen) has null netease_song_id', () => {
    expect(tracks[11]!.artist).toBe('Queen');
    expect(tracks[11]!.netease_song_id).toBeNull();
  });

  it('Track 18 is Mk.gee, year 2024', () => {
    expect(tracks[17]).toMatchObject({
      position: 18,
      artist: 'Mk.gee',
      year: 2024,
    });
  });

  it('every track has a curatorial_note string', () => {
    for (const t of tracks) {
      expect(typeof t.curatorial_note).toBe('string');
      expect(t.curatorial_note.length).toBeGreaterThan(50);
    }
  });
});
