import type { EpisodeManifest } from '../../lib/home-manifest.js';

export type DepthTier = 0 | 1 | 2;

export interface Slot {
  id: string;
  episodeId: string;
  resting: 'anchor' | number; // 'anchor' or index into trackCovers
  previewIndex: number; // which track index to show when previewing the active episode
  xPct: number;
  yPct: number;
  depth: DepthTier;
  sizePx: number;
  driftDurSec: number;
  driftDelaySec: number;
  rotateDeg: number;
}

// 14 slots, hand-placed toward edges/corners so the center band
// (x 38–62%, y 35–65%) and the lower-center stay clear for previews + chrome.
export const SLOTS: Slot[] = [
  { id: 's0',  episodeId: 'ep1', resting: 'anchor', previewIndex: 0,  xPct: 16, yPct: 14, depth: 2, sizePx: 184, driftDurSec: 15, driftDelaySec: 0,   rotateDeg: -2 },
  { id: 's1',  episodeId: 'ep1', resting: 6,        previewIndex: 1,  xPct: 30, yPct: 72, depth: 1, sizePx: 150, driftDurSec: 18, driftDelaySec: 1.5, rotateDeg: 1.5 },
  { id: 's2',  episodeId: 'ep1', resting: 12,       previewIndex: 2,  xPct: 70, yPct: 80, depth: 0, sizePx: 120, driftDurSec: 20, driftDelaySec: 3,   rotateDeg: -1 },
  { id: 's3',  episodeId: 'ep2', resting: 'anchor', previewIndex: 3,  xPct: 78, yPct: 16, depth: 2, sizePx: 176, driftDurSec: 16, driftDelaySec: 0.8, rotateDeg: 2 },
  { id: 's4',  episodeId: 'ep2', resting: 8,        previewIndex: 4,  xPct: 90, yPct: 60, depth: 1, sizePx: 140, driftDurSec: 19, driftDelaySec: 2.2, rotateDeg: -2 },
  { id: 's5',  episodeId: 'ep3', resting: 'anchor', previewIndex: 5,  xPct: 6,  yPct: 44, depth: 1, sizePx: 158, driftDurSec: 17, driftDelaySec: 1.1, rotateDeg: 1 },
  { id: 's6',  episodeId: 'ep3', resting: 9,        previewIndex: 6,  xPct: 8,  yPct: 82, depth: 0, sizePx: 118, driftDurSec: 21, driftDelaySec: 3.6, rotateDeg: -1.5 },
  { id: 's7',  episodeId: 'ep4', resting: 'anchor', previewIndex: 7,  xPct: 62, yPct: 10, depth: 2, sizePx: 180, driftDurSec: 15, driftDelaySec: 0.4, rotateDeg: -2 },
  { id: 's8',  episodeId: 'ep4', resting: 5,        previewIndex: 8,  xPct: 50, yPct: 82, depth: 1, sizePx: 146, driftDurSec: 18, driftDelaySec: 2.8, rotateDeg: 1.5 },
  { id: 's9',  episodeId: 'ep4', resting: 14,       previewIndex: 9,  xPct: 92, yPct: 86, depth: 0, sizePx: 116, driftDurSec: 22, driftDelaySec: 4,   rotateDeg: -1 },
  { id: 's10', episodeId: 'ep5', resting: 'anchor', previewIndex: 10, xPct: 24, yPct: 30, depth: 1, sizePx: 152, driftDurSec: 17, driftDelaySec: 1.8, rotateDeg: 2 },
  { id: 's11', episodeId: 'ep5', resting: 11,       previewIndex: 11, xPct: 86, yPct: 38, depth: 0, sizePx: 124, driftDurSec: 20, driftDelaySec: 3.2, rotateDeg: -1.5 },
  { id: 's12', episodeId: 'ep6', resting: 'anchor', previewIndex: 12, xPct: 14, yPct: 60, depth: 1, sizePx: 150, driftDurSec: 16, driftDelaySec: 2.4, rotateDeg: 1 },
  { id: 's13', episodeId: 'ep6', resting: 7,        previewIndex: 13, xPct: 74, yPct: 56, depth: 0, sizePx: 122, driftDurSec: 19, driftDelaySec: 0.6, rotateDeg: -2 },
];

export function restingCover(slot: Slot, m: EpisodeManifest): string {
  if (slot.resting === 'anchor') return m.anchorCover;
  return m.trackCovers[slot.resting % m.trackCovers.length] ?? m.anchorCover;
}

export interface HoverState {
  hoveredSlotId: string;
  activeEpisodeId: string;
}

export function coverForSlot(
  slot: Slot,
  manifests: Record<string, EpisodeManifest>,
  hover: HoverState | null,
): string {
  const own = manifests[slot.episodeId];
  if (!hover) return restingCover(slot, own);
  if (slot.id === hover.hoveredSlotId) return restingCover(slot, own);
  const active = manifests[hover.activeEpisodeId];
  return active.trackCovers[slot.previewIndex % active.trackCovers.length] ?? active.anchorCover;
}

// Collapse target for the ep1/ep4 stacking exit: cards converge near
// center-left and fan slightly, reading as a sideways stack.
export function stackTarget(
  orderIndex: number,
  _total: number,
): { xPct: number; yPct: number; rotateDeg: number } {
  const centerX = 42;
  const centerY = 50;
  return {
    xPct: centerX + orderIndex * 0.7,
    yPct: centerY,
    rotateDeg: -6 + (orderIndex % 3) * 2,
  };
}
