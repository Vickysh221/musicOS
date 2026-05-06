import { describe, it, expect, vi } from 'vitest';
import { loadExhibition } from '../src/lib/load-exhibition.js';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Exhibit } from '../src/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const data = JSON.parse(
  readFileSync(path.resolve(__dirname, '../data/exhibition-ep1.json'), 'utf8')
) as Exhibit[];

describe('loadExhibition', () => {
  it('returns the parsed array for ep1', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    }) as unknown as typeof fetch;
    const exhibits = await loadExhibition('ep1');
    expect(exhibits.length).toBe(21);
  });

  it('finds Miss You by position', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    }) as unknown as typeof fetch;
    const exhibits = await loadExhibition('ep1');
    const miss = exhibits.find((e) => e.kind === 'track' && e.song === 'Miss You');
    expect(miss).toBeDefined();
    expect((miss as import('../src/types.js').TrackExhibit).position).toBe(6);
  });
});
