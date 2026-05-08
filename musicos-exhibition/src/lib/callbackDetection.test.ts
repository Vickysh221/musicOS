import { describe, it, expect } from 'vitest';
import { detectCallbacks } from './callbackDetection.js';

const aliases = {
  1: ['Cream', 'Sunshine of Your Love'],
  2: ['Hendrix', 'Purple Haze'],
  3: ['Black Sabbath', 'Sabbath'],
};

describe('detectCallbacks', () => {
  it('returns empty when no alias matches', () => {
    expect(detectCallbacks('一段普通的描述', 5, aliases).size).toBe(0);
  });

  it('matches when callback marker is present near alias', () => {
    const r = detectCallbacks('你刚才在 Cream 那里听到的低音', 5, aliases);
    expect(r.has(1)).toBe(true);
  });

  it('skips alias matches without any callback marker', () => {
    // Plain mention, no marker word — should not pill.
    const r = detectCallbacks('Cream 的吉他手是 Clapton', 5, aliases);
    expect(r.has(1)).toBe(false);
  });

  it('does not match positions >= currentPosition', () => {
    const r = detectCallbacks('你刚才在 Black Sabbath 那里', 3, aliases);
    expect(r.has(3)).toBe(false);
  });

  it('does not match position 0 (anchor opening)', () => {
    const aliasesWithZero = { ...aliases, 0: ['opening'] };
    const r = detectCallbacks('刚才 opening 提到', 5, aliasesWithZero);
    expect(r.has(0)).toBe(false);
  });

  it('falls back to plain substring when sentence has no markers and allowPlain', () => {
    const r = detectCallbacks('Cream 出场', 5, aliases, { allowPlain: true });
    expect(r.has(1)).toBe(true);
  });
});
