import type { Exhibit, TrackExhibit } from '../types.js';
import { EPISODES } from './episodes.js';
import { loadExhibition } from './load-exhibition.js';

export interface EpisodeManifest {
  episodeId: string;
  number: number;
  titleZh: string;
  titleEn: string;
  anchorCover: string;
  trackCovers: string[];
}

function isTrackWithCover(e: Exhibit): e is TrackExhibit {
  return e.kind === 'track' && e.album_cover_url !== null && e.album_cover_url.length > 0;
}

export function buildEpisodeManifest(episodeId: string, exhibits: Exhibit[]): EpisodeManifest {
  const meta = EPISODES.find((e) => e.id === episodeId);
  if (!meta) throw new Error(`Unknown episode: ${episodeId}`);

  const tracks = exhibits
    .filter(isTrackWithCover)
    .slice()
    .sort((a, b) => a.position - b.position);

  const trackCovers = tracks.map((t) => t.album_cover_url as string);
  const anchor =
    tracks.find((t) => t.exhibit_type === 'anchor') ??
    tracks.find((t) => t.is_base_node);
  const anchorCover = (anchor?.album_cover_url as string) ?? trackCovers[0] ?? '';

  return {
    episodeId,
    number: meta.number,
    titleZh: meta.titleZh,
    titleEn: meta.titleEn,
    anchorCover,
    trackCovers,
  };
}

export async function loadHomeManifest(): Promise<EpisodeManifest[]> {
  return Promise.all(
    EPISODES.map(async (meta) => buildEpisodeManifest(meta.id, await loadExhibition(meta.id))),
  );
}
