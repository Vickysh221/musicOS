import type { Exhibit } from '../types.js';

export async function loadExhibition(input?: Exhibit[]): Promise<Exhibit[]> {
  if (input) return input;
  const resp = await fetch('/data/exhibition.json');
  if (!resp.ok) throw new Error(`Failed to load exhibition.json: HTTP ${resp.status}`);
  return resp.json() as Promise<Exhibit[]>;
}
