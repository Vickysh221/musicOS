import { describe, it, expect } from 'vitest';
import { processionLayout, seededJitter } from '../src/components/timeline/timeline-keyframes.js';
import { TUNING_DEFAULTS } from '../src/store/tuning.js';

describe('processionLayout', () => {
  const total = 18;
  const focalIndex = 6;
  const tuning = TUNING_DEFAULTS;

  it('focal card (anchor when nothing hovered) is upright and fully opaque', () => {
    const t = processionLayout({ index: focalIndex, total, focalIndex, hoveredIndex: null, tuning });
    expect(t.rotZ).toBe(0);
    expect(t.opacity).toBe(1);
    expect(t.scale).toBeGreaterThan(1);
  });

  it('non-focal cards have lower opacity than focal', () => {
    const focal = processionLayout({ index: focalIndex, total, focalIndex, hoveredIndex: null, tuning });
    const other = processionLayout({ index: 0, total, focalIndex, hoveredIndex: null, tuning });
    expect(other.opacity).toBeLessThan(focal.opacity);
  });

  it('hovering a card makes it focal and dims the rest harder', () => {
    const hovered = processionLayout({ index: 2, total, focalIndex: 2, hoveredIndex: 2, tuning });
    const dimmed = processionLayout({ index: 5, total, focalIndex: 2, hoveredIndex: 2, tuning });
    expect(hovered.rotZ).toBe(0);
    expect(hovered.opacity).toBe(1);
    expect(hovered.scale).toBeGreaterThan(1);
    expect(dimmed.opacity).toBeLessThanOrEqual(0.5);
  });

  it('x coordinate is monotonically increasing with index', () => {
    let prev = -Infinity;
    for (let i = 0; i < total; i++) {
      const t = processionLayout({ index: i, total, focalIndex, hoveredIndex: null, tuning });
      expect(t.x).toBeGreaterThan(prev);
      prev = t.x;
    }
  });

  it('y moves monotonically with index in the direction set by riseY', () => {
    const left = processionLayout({ index: 0, total, focalIndex, hoveredIndex: null, tuning });
    const right = processionLayout({ index: total - 1, total, focalIndex, hoveredIndex: null, tuning });
    if (tuning.riseY > 0) expect(right.y).toBeLessThan(left.y);
    else if (tuning.riseY < 0) expect(right.y).toBeGreaterThan(left.y);
    else expect(right.y).toBe(left.y);
  });

  it('non-focal jitter rotation is bounded and stable across calls', () => {
    const a = processionLayout({ index: 3, total, focalIndex, hoveredIndex: null, tuning });
    const b = processionLayout({ index: 3, total, focalIndex, hoveredIndex: null, tuning });
    expect(a.rotZ).toBe(b.rotZ);
    expect(Math.abs(a.rotZ)).toBeLessThanOrEqual(tuning.jitterDeg);
  });

  it('seededJitter returns deterministic values in [-1, 1]', () => {
    for (let i = 0; i < 50; i++) {
      const v = seededJitter(i);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(seededJitter(7)).toBe(seededJitter(7));
  });
});
