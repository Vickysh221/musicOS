import { describe, it, expect } from 'vitest';
import { verticalCumulativeLayout } from './verticalCumulativeLayout.js';

const params = {
  verticalSpacing: 100,
  verticalDepth: 50,
  verticalShrink: 0.1,
  verticalFade: 0.15,
  verticalRotX: 0,
  verticalRotY: 0,
  verticalOffsetX: 0,
  focalOffsetY: 60,
};

describe('verticalCumulativeLayout', () => {
  it('places focal disc at origin', () => {
    const m = verticalCumulativeLayout({
      mentioned: [],
      currentPosition: 5,
      allPositions: [0, 1, 2, 3, 4, 5, 6, 7],
      params,
    });
    const focal = m.get(5);
    expect(focal).toBeDefined();
    expect(focal!.x).toBe(0);
    expect(focal!.y).toBe(0);
    expect(focal!.scale).toBe(1);
    expect(focal!.opacity).toBe(1);
  });

  it('stacks mentioned positions above focal in order', () => {
    const m = verticalCumulativeLayout({
      mentioned: [1, 3], // earliest first
      currentPosition: 5,
      allPositions: [0, 1, 2, 3, 4, 5, 6, 7],
      params,
    });
    const top = m.get(1)!;
    const mid = m.get(3)!;
    expect(top.y).toBeLessThan(mid.y); // top is more negative (higher up)
    expect(top.scale).toBeLessThan(mid.scale); // further-back is smaller
  });

  it('hides positions not in mentioned and not focal', () => {
    const m = verticalCumulativeLayout({
      mentioned: [1],
      currentPosition: 5,
      allPositions: [0, 1, 2, 3, 4, 5, 6, 7],
      params,
    });
    expect(m.get(2)!.opacity).toBe(0);
    expect(m.get(7)!.opacity).toBe(0);
  });

  it('clamps opacity floor for distant mentioned discs', () => {
    const m = verticalCumulativeLayout({
      mentioned: [1, 2, 3, 4],
      currentPosition: 10,
      allPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      params,
    });
    for (const p of [1, 2, 3, 4]) {
      expect(m.get(p)!.opacity).toBeGreaterThanOrEqual(0.35);
    }
  });
});
