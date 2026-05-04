import { describe, it, expect } from 'vitest';
import { slugify, fileSlug } from '../scripts/lib/slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('The Rolling Stones')).toBe('the-rolling-stones');
  });

  it('drops apostrophes and punctuation', () => {
    expect(slugify("Stayin' Alive")).toBe('stayin-alive');
    expect(slugify('Q: Are We Not Men?')).toBe('q-are-we-not-men');
  });

  it('collapses repeated hyphens', () => {
    expect(slugify('Give Up the Funk (Tear the Roof off the Sucker)')).toBe(
      'give-up-the-funk-tear-the-roof-off-the-sucker',
    );
  });

  it('handles dots (Mk.gee)', () => {
    expect(slugify('Mk.gee')).toBe('mkgee');
  });
});

describe('fileSlug', () => {
  it('prefixes 2-digit position', () => {
    expect(fileSlug(6, 'The Rolling Stones', 'Miss You')).toBe(
      '06_the-rolling-stones_miss-you',
    );
  });

  it('handles position 18', () => {
    expect(fileSlug(18, 'Mk.gee', 'You Dreamed of Me')).toBe(
      '18_mkgee_you-dreamed-of-me',
    );
  });
});
