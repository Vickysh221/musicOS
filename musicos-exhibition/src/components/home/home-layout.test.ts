import { describe, it, expect } from 'vitest';
import { SLOTS, coverForSlot, restingCover, stackTarget } from './home-layout.js';
import type { EpisodeManifest } from '../../lib/home-manifest.js';

function mkManifest(id: string, n: number): EpisodeManifest {
  return {
    episodeId: id,
    number: n,
    titleZh: id,
    titleEn: id,
    anchorCover: `/${id}/anchor.jpg`,
    trackCovers: Array.from({ length: 18 }, (_, i) => `/${id}/t${i}.jpg`),
  };
}

const manifests: Record<string, EpisodeManifest> = Object.fromEntries(
  ['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6'].map((id, i) => [id, mkManifest(id, i + 1)]),
);

describe('home-layout', () => {
  it('defines 14 slots covering all six episodes with center kept clear', () => {
    expect(SLOTS).toHaveLength(14);
    const eps = new Set(SLOTS.map((s) => s.episodeId));
    expect([...eps].sort()).toEqual(['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6']);
    for (const s of SLOTS) {
      const inCenter = s.xPct > 38 && s.xPct < 62 && s.yPct > 35 && s.yPct < 65;
      expect(inCenter).toBe(false);
    }
  });

  it('restingCover returns anchor for anchor slots, track cover otherwise', () => {
    const anchorSlot = SLOTS.find((s) => s.resting === 'anchor')!;
    expect(restingCover(anchorSlot, manifests[anchorSlot.episodeId]!)).toBe(
      `/${anchorSlot.episodeId}/anchor.jpg`,
    );
  });

  it('coverForSlot shows resting covers when nothing is hovered', () => {
    const slot = SLOTS[0]!;
    expect(coverForSlot(slot, manifests, null)).toBe(restingCover(slot, manifests[slot.episodeId]!));
  });

  it('coverForSlot swaps non-hovered slots to the active episode tracklist', () => {
    const hovered = SLOTS[0]!;
    const other = SLOTS.find((s) => s.episodeId !== hovered.episodeId)!;
    const hover = { hoveredSlotId: hovered.id, activeEpisodeId: hovered.episodeId };
    expect(coverForSlot(hovered, manifests, hover)).toBe(
      restingCover(hovered, manifests[hovered.episodeId]!),
    );
    const active = manifests[hovered.episodeId]!;
    expect(coverForSlot(other, manifests, hover)).toBe(
      active.trackCovers[other.previewIndex % active.trackCovers.length],
    );
  });

  it('restingCover resolves a numeric resting slot to the indexed track cover', () => {
    const slot = SLOTS.find((s) => typeof s.resting === 'number')!;
    const m = manifests[slot.episodeId]!;
    expect(restingCover(slot, m)).toBe(m.trackCovers[(slot.resting as number) % m.trackCovers.length]);
  });

  it('coverForSlot returns empty string when the slot episode is missing from manifests', () => {
    expect(coverForSlot(SLOTS[0]!, {}, null)).toBe('');
  });

  it('stackTarget converges cards toward center with stagger', () => {
    const a = stackTarget(0, 14);
    const b = stackTarget(5, 14);
    expect(b.xPct).toBeGreaterThan(a.xPct);
    expect(a.yPct).toBeCloseTo(b.yPct, 5);
  });
});
