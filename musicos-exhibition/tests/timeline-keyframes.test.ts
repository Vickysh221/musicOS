import { describe, it, expect } from 'vitest';
import {
  constellationTransform,
  sequenceTransform,
  processionTransform,
  cardTransform,
} from '../src/components/timeline/timeline-keyframes.js';

describe('timeline-keyframes', () => {
  it('CONSTELLATION: anchor (index === anchorIndex) sits at origin upright', () => {
    const t = constellationTransform({ index: 5, total: 41, anchorIndex: 5 });
    expect(t.x).toBe(0);
    expect(t.y).toBe(0);
    expect(t.rotZ).toBe(0);
    expect(t.opacity).toBe(1);
  });

  it('CONSTELLATION: non-anchor cards spread along an arc with hand-placed rotation', () => {
    const left = constellationTransform({ index: 0, total: 41, anchorIndex: 5 });
    const right = constellationTransform({ index: 10, total: 41, anchorIndex: 5 });
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    // arc dips downward at the edges
    expect(left.y).toBeGreaterThan(0);
    expect(right.y).toBeGreaterThan(0);
    // rotation in [-15, 15] degrees
    expect(Math.abs(left.rotZ)).toBeLessThanOrEqual(15);
    expect(Math.abs(right.rotZ)).toBeLessThanOrEqual(15);
    // non-anchor opacity dimmer than anchor
    expect(left.opacity).toBeLessThan(1);
  });

  it('SEQUENCE: cards line up horizontally with uniform small rotation', () => {
    const a = sequenceTransform({ index: 0, total: 41 });
    const b = sequenceTransform({ index: 1, total: 41 });
    expect(b.x - a.x).toBeGreaterThan(0); // monotonic x
    expect(a.y).toBe(0);
    expect(Math.abs(a.rotZ)).toBeLessThanOrEqual(8);
  });

  it('PROCESSION: same x layout as SEQUENCE but tilted via rotX and receding via z', () => {
    const seq = sequenceTransform({ index: 10, total: 41 });
    const proc = processionTransform({ index: 10, total: 41 });
    expect(proc.x).toBeCloseTo(seq.x, 0);
    expect(proc.rotX).toBeGreaterThan(15); // tilted up
    expect(proc.z).toBeLessThan(0); // receding away from camera
  });

  it('cardTransform: at progress=0 returns CONSTELLATION exactly', () => {
    const ct = cardTransform({ index: 0, total: 41, anchorIndex: 5, progress: 0 });
    const expected = constellationTransform({ index: 0, total: 41, anchorIndex: 5 });
    expect(ct).toEqual(expected);
  });

  it('cardTransform: at progress=1 returns PROCESSION exactly', () => {
    const ct = cardTransform({ index: 0, total: 41, anchorIndex: 5, progress: 1 });
    const expected = processionTransform({ index: 0, total: 41 });
    expect(ct.rotX).toBeCloseTo(expected.rotX, 5);
    expect(ct.z).toBeCloseTo(expected.z, 5);
  });

  it('cardTransform: at progress=0.5 is in SEQUENCE band', () => {
    const ct = cardTransform({ index: 10, total: 41, anchorIndex: 5, progress: 0.5 });
    const seq = sequenceTransform({ index: 10, total: 41 });
    expect(ct.x).toBeCloseTo(seq.x, 1);
    expect(ct.y).toBeCloseTo(seq.y, 1);
  });
});
