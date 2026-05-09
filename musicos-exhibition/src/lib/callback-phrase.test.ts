import { describe, it, expect } from 'vitest';
import {
  findCallbackTargets,
  findCallbackPhrases,
  aliasesForPosition,
} from './callback-phrase.js';
import type { Exhibit, TrackExhibit } from '../types.js';

function track(partial: Partial<TrackExhibit> & { position: number }): TrackExhibit {
  const base: TrackExhibit = {
    kind: 'track',
    position: partial.position,
    exhibit_type: 'anchor',
    transcript_zh: null,
    transcript_en: null,
    transcript_zh_status: 'complete',
    transcript_en_status: 'missing',
    narrator_persona_zh: null,
    narrator_persona_en: null,
    node_id: '',
    year: 1970,
    artist: '',
    song: '',
    album: '',
    is_base_node: false,
    mechanism_tags: [],
    netease_song_id: null,
    audio_url: null,
    fusion_audio_url: null,
    album_cover_url: null,
    duration_seconds: null,
    unavailable: false,
    genre: null,
    episode_focus: '',
    red_heart_tier: 'blind_spot',
    red_heart_matched_seeds: [],
    muted_this_episode: false,
    bridge_narration_zh: null,
    bridge_narration_en: null,
    connections_in: [],
    connections_out: [],
    connections_lateral: [],
    narrative_weight: null,
    strong_connection_id: null,
    archived_weak_connections: [],
  };
  return { ...base, ...partial };
}

describe('findCallbackTargets', () => {
  it('collects from other tracks strong_connection_id', () => {
    const exhibits: Exhibit[] = [
      track({ position: 1, strong_connection_id: 'conn_001_to_002_x' }),
      track({ position: 2, strong_connection_id: 'conn_002_to_003_x' }),
      track({ position: 3 }),
    ];
    expect(findCallbackTargets(exhibits, 3)).toEqual([2]);
  });

  it('collects from focal archived_weak_connections', () => {
    const exhibits: Exhibit[] = [
      track({ position: 1 }),
      track({ position: 2 }),
      track({
        position: 3,
        archived_weak_connections: [
          { connection_id: 'conn_001_to_003_x', archive_reason: 'redundant_with_strong' },
          { connection_id: 'conn_002_to_003_x', archive_reason: 'redundant_with_strong' },
        ],
      }),
    ];
    expect(findCallbackTargets(exhibits, 3)).toEqual([1, 2]);
  });

  it('merges strong + archived (Black Sabbath case)', () => {
    const exhibits: Exhibit[] = [
      track({ position: 1, strong_connection_id: 'conn_001_to_002_same_era' }),
      track({ position: 2, strong_connection_id: 'conn_002_to_003_inherit' }),
      track({
        position: 3,
        archived_weak_connections: [
          { connection_id: 'conn_001_to_003_inherit', archive_reason: 'redundant_with_strong' },
          { connection_id: 'conn_002_to_003_inherit', archive_reason: 'redundant_with_strong' },
        ],
      }),
    ];
    expect(findCallbackTargets(exhibits, 3)).toEqual([1, 2]);
  });
});

describe('findCallbackPhrases', () => {
  it('returns one hit per clause, longest-alias-wins', () => {
    const text = '你刚才在 Cream 那里听到了齐奏；在 Hendrix 那里听到了三全音。';
    const candidates = [
      { position: 1, aliases: ['Cream'] },
      { position: 2, aliases: ['Hendrix'] },
    ];
    const hits = findCallbackPhrases(text, candidates);
    expect(hits).toHaveLength(2);
    expect(hits[0]?.targetPosition).toBe(1);
    expect(hits[0]?.phrase).toBe('你刚才在 Cream 那里听到了齐奏');
    expect(hits[1]?.targetPosition).toBe(2);
    expect(hits[1]?.phrase).toBe('在 Hendrix 那里听到了三全音');
  });

  it('skips clauses with no candidate alias', () => {
    const text = 'Iommi 想出了三全音。Cream 那段齐奏也回来了。';
    const hits = findCallbackPhrases(text, [{ position: 1, aliases: ['Cream'] }]);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.phrase).toBe('Cream 那段齐奏也回来了');
  });
});

describe('aliasesForPosition', () => {
  it('combines curated aliases + track artist/song, longest first', () => {
    const tracks = [track({ position: 1, artist: 'Cream', song: 'Sunshine of Your Love' })];
    const got = aliasesForPosition(1, tracks, { 1: ['Sunshine'] });
    expect(got[0]).toBe('Sunshine of Your Love');
    expect(got).toContain('Cream');
    expect(got).toContain('Sunshine');
  });
});
