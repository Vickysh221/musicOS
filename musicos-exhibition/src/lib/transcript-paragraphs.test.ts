import { describe, it, expect } from 'vitest';
import {
  splitParagraphs,
  paragraphStartTimes,
  activeParagraphIdx,
  buildSegmentToParagraphMap,
} from './transcript-paragraphs.js';

describe('splitParagraphs', () => {
  it('drops blank paragraphs and trims whitespace', () => {
    expect(splitParagraphs('  alpha  \n\n  beta  \n\n\n  ')).toEqual(['alpha', 'beta']);
  });
  it('returns [] for null/empty', () => {
    expect(splitParagraphs(null)).toEqual([]);
    expect(splitParagraphs('')).toEqual([]);
  });
});

describe('paragraphStartTimes', () => {
  it('allocates duration proportionally by char count', () => {
    const ts = paragraphStartTimes(['aaaa', 'bb'], 60);
    // 4 chars / 6 chars total → first paragraph is 0..40s, second starts at 40s
    expect(ts).toEqual([0, 40]);
  });
  it('returns zeros when duration is 0', () => {
    expect(paragraphStartTimes(['x', 'y'], 0)).toEqual([0, 0]);
  });
});

describe('activeParagraphIdx', () => {
  it('returns the most recently passed start time', () => {
    expect(activeParagraphIdx([0, 10, 25], 7)).toBe(0);
    expect(activeParagraphIdx([0, 10, 25], 12)).toBe(1);
    expect(activeParagraphIdx([0, 10, 25], 99)).toBe(2);
  });
});

describe('buildSegmentToParagraphMap', () => {
  it('maps 1:1 when paragraphs and segments align (Cream case)', () => {
    const paragraphs = [
      'Sunshine of Your Love 一开声，Jack Bruce 的贝斯就走下来。',
      '一九六七年八月，纽约 Atlantic Studios。',
      '在这之前 riff 是串场和铺底；这首之后，riff 自己就是身份证。',
    ];
    const segments = [
      { text: 'Sunshine of Your Love 一开声，Jack Bruce 的贝斯就走下来。', start: 9, end: 20 },
      { text: '一九六七年八月，纽约 Atlantic Studios。', start: 20, end: 33 },
      { text: '在这之前 riff 是串场和铺底；这首之后，riff 自己就是身份证。', start: 34, end: 50 },
    ];
    expect(buildSegmentToParagraphMap(paragraphs, segments)).toEqual([0, 1, 2]);
  });

  it('groups multiple segments into a single paragraph (1:N opening case)', () => {
    const paragraphs = [
      '先听 Black Sabbath 同名歌的开头三十秒。',
      '远处的雨声落了一阵。Iommi 的吉他从最低端慢慢爬上来。',
      '一九七零年二月。专辑摆上货架。',
    ];
    const segments = [
      { text: '先听 Black Sabbath 同名歌的开头三十秒。', start: 0, end: 3 },
      { text: '远处的雨声落了一阵。', start: 3, end: 8 },
      { text: 'Iommi 的吉他从最低端慢慢爬上来。', start: 8, end: 15 },
      { text: '一九七零年二月。', start: 15, end: 17 },
      { text: '专辑摆上货架。', start: 17, end: 20 },
    ];
    expect(buildSegmentToParagraphMap(paragraphs, segments)).toEqual([0, 1, 1, 2, 2]);
  });

  it('returns empty array for empty segments', () => {
    expect(buildSegmentToParagraphMap(['p'], [])).toEqual([]);
  });

  it('falls back to current cursor when a segment cannot be located', () => {
    const paragraphs = ['alpha alpha alpha', 'beta beta beta'];
    const segments = [
      { text: 'alpha alpha alpha', start: 0, end: 1 },
      { text: 'gamma gamma gamma', start: 1, end: 2 }, // unmatched
      { text: 'beta beta beta', start: 2, end: 3 },
    ];
    expect(buildSegmentToParagraphMap(paragraphs, segments)).toEqual([0, 0, 1]);
  });
});
