import type { Exhibit } from '../types.js';

export async function loadExhibition(episodeId: string): Promise<Exhibit[]> {
  const resp = await fetch(`/data/exhibition-${episodeId}.json`);
  if (!resp.ok) throw new Error(`Failed to load exhibition-${episodeId}.json: HTTP ${resp.status}`);
  return resp.json() as Promise<Exhibit[]>;
}
