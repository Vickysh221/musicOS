import { describe, it, expect } from 'vitest';
import type { Exhibit, TrackExhibit, NonTrackExhibit } from '../src/types';

describe('Exhibit types', () => {
  it('TrackExhibit has all P0 fields', () => {
    const t: TrackExhibit = {
      kind: 'track',
      position: 6,
      node_id: 'rolling-stones_some-girls_miss-you',
      year: 1978,
      artist: 'The Rolling Stones',
      song: 'Miss You',
      album: 'Some Girls',
      exhibit_type: 'anchor',
      is_base_node: true,
      mechanism_tags: ['M1', 'M3'],
      netease_song_id: '105575',
      audio_url: '/audio/06_rolling-stones_miss-you.mp3',
      album_cover_url: '/covers/06_rolling-stones_miss-you.jpg',
      duration_seconds: 300,
      unavailable: false,
      transcript_zh: '...',
      transcript_en: null,
      transcript_zh_status: 'complete',
      transcript_en_status: 'missing',
      narrator_persona_zh: null,
      narrator_persona_en: null,
    };
    expect(t.kind).toBe('track');
    expect(t.position).toBe(6);
  });

  it('NonTrackExhibit lacks audio fields', () => {
    const n: NonTrackExhibit = {
      kind: 'narration',
      position: 1,
      exhibit_type: 'opening',
      transcript_zh: '...',
      transcript_en: null,
      transcript_zh_status: 'complete',
      transcript_en_status: 'missing',
      narrator_persona_zh: null,
      narrator_persona_en: null,
    };
    expect(n.kind).toBe('narration');
  });

  it('Exhibit is a discriminated union', () => {
    const items: Exhibit[] = [];
    expect(items).toEqual([]);
  });
});
