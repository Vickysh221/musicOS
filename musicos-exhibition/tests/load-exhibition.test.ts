import { describe, it, expect } from 'vitest';
import { loadExhibition } from '../src/lib/load-exhibition.js';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Exhibit } from '../src/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const data = JSON.parse(
  readFileSync(path.resolve(__dirname, '../data/exhibition.json'), 'utf8')
) as Exhibit[];

describe('loadExhibition', () => {
  it('returns the parsed array when given input', async () => {
    const exhibits = await loadExhibition(data);
    expect(exhibits.length).toBe(21);
  });

  it('finds Miss You by position', async () => {
    const exhibits = await loadExhibition(data);
    const miss = exhibits.find((e) => e.kind === 'track' && e.song === 'Miss You');
    expect(miss).toBeDefined();
    expect((miss as import('../src/types.js').TrackExhibit).position).toBe(6);
  });
});
