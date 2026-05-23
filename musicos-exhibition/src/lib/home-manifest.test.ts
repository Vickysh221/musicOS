import { describe, it, expect } from 'vitest';
import { buildEpisodeManifest } from './home-manifest.js';
import type { Exhibit } from '../types.js';

function track(partial: Partial<Exhibit> & { position: number }): Exhibit {
  return {
    kind: 'track',
    exhibit_type: 'lateral',
    is_base_node: false,
    album_cover_url: `/covers/${partial.position}.jpg`,
    artist: 'A',
    song: 'S',
    ...partial,
  } as unknown as Exhibit;
}

describe('buildEpisodeManifest', () => {
  it('collects track covers sorted by position and picks the anchor cover', () => {
    const exhibits: Exhibit[] = [
      track({ position: 3 }),
      track({ position: 1, exhibit_type: 'anchor', album_cover_url: '/covers/anchor.jpg' }),
      track({ position: 2 }),
      { kind: 'narration', position: 99 } as unknown as Exhibit,
    ];
    const m = buildEpisodeManifest('ep1', exhibits);
    expect(m.episodeId).toBe('ep1');
    expect(m.number).toBe(1);
    expect(m.anchorCover).toBe('/covers/anchor.jpg');
    expect(m.trackCovers).toEqual(['/covers/anchor.jpg', '/covers/2.jpg', '/covers/3.jpg']);
  });

  it('falls back to first track cover when no anchor exhibit exists', () => {
    const m = buildEpisodeManifest('ep2', [track({ position: 5 }), track({ position: 4 })]);
    expect(m.anchorCover).toBe('/covers/4.jpg');
  });
});
