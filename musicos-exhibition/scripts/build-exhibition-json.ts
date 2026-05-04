import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parsePlaylist } from './lib/parse-playlist.js';
import { parseEpisode } from './lib/parse-episode.js';
import type { Exhibit, TrackExhibit, NonTrackExhibit, Mechanism, ExhibitType } from '../src/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const VAULT_ROOT = path.resolve(__dirname, '../..');
const PLAYLIST = path.join(
  VAULT_ROOT,
  'playlists/rolling-stones_some-girls_miss-you.playlist v0.2.md',
);
const EPISODE = path.join(
  VAULT_ROOT,
  'episodes/rolling-stones_some-girls_miss-you.episode.md',
);
const OUT = path.resolve(__dirname, '../data/exhibition.json');

// Tracks known to be unavailable/unlicensed on NetEase Cloud Music in mainland China.
// Even if the playlist has a link, we null the ID so the UI doesn't attempt playback.
const NETEASE_UNAVAILABLE = new Set<number>([
  11, // Talking Heads — Once in a Lifetime (not licensed on NetEase)
]);

// Mapping: playlist position (1..18) → vault node_id + classification
const TRACK_META: Record<number, {
  node_id: string;
  exhibit_type: ExhibitType;
  is_base_node: boolean;
  mechanism_tags: Mechanism[];
}> = {
  1:  { node_id: 'james-brown_funky-drummer-era_cold-sweat',          exhibit_type: 'ancestor',   is_base_node: false, mechanism_tags: ['M2'] },
  2:  { node_id: 'sly-family-stone_riot_family-affair',               exhibit_type: 'ancestor',   is_base_node: false, mechanism_tags: ['M2', 'M3'] },
  3:  { node_id: 'bowie_young-americans_fame',                        exhibit_type: 'ancestor',   is_base_node: false, mechanism_tags: ['M1'] },
  4:  { node_id: 'parliament_mothership-connection_give-up-the-funk', exhibit_type: 'ancestor',   is_base_node: false, mechanism_tags: ['M2'] },
  5:  { node_id: 'bee-gees_saturday-night-fever_stayin-alive',        exhibit_type: 'ancestor',   is_base_node: false, mechanism_tags: ['M2'] },
  6:  { node_id: 'rolling-stones_some-girls_miss-you',                exhibit_type: 'anchor',     is_base_node: true,  mechanism_tags: ['M1', 'M3'] },
  7:  { node_id: 'blondie_parallel-lines_heart-of-glass',             exhibit_type: 'lateral',    is_base_node: false, mechanism_tags: ['M1'] },
  8:  { node_id: 'devo_q-are-we-not-men_jocko-homo',                  exhibit_type: 'lateral',    is_base_node: false, mechanism_tags: ['M1'] },
  9:  { node_id: 'chic_risque_good-times',                            exhibit_type: 'ancestor',   is_base_node: false, mechanism_tags: ['M1'] },
  10: { node_id: 'joy-division_closer_isolation',                     exhibit_type: 'lateral',    is_base_node: false, mechanism_tags: ['M4'] },
  11: { node_id: 'talking-heads_remain-in-light_once-in-a-lifetime',  exhibit_type: 'descendant', is_base_node: false, mechanism_tags: ['M1', 'M4'] },
  12: { node_id: 'queen_the-game_another-one-bites-the-dust',         exhibit_type: 'descendant', is_base_node: false, mechanism_tags: ['M1', 'M3'] },
  13: { node_id: 'prince_purple-rain_when-doves-cry',                 exhibit_type: 'descendant', is_base_node: false, mechanism_tags: ['M4'] },
  14: { node_id: 'rhcp_blood-sugar_give-it-away',                     exhibit_type: 'descendant', is_base_node: false, mechanism_tags: ['M1'] },
  15: { node_id: 'daft-punk_random-access-memories_get-lucky',        exhibit_type: 'descendant', is_base_node: false, mechanism_tags: ['M1'] },
  16: { node_id: 'tame-impala_currents_the-less-i-know-the-better',   exhibit_type: 'descendant', is_base_node: false, mechanism_tags: ['M1'] },
  17: { node_id: 'khruangbin_con-todo-el-mundo_maria-tambien',        exhibit_type: 'descendant', is_base_node: false, mechanism_tags: ['M1', 'M4'] },
  18: { node_id: 'mkgee_two-star_you-dreamed-of-me',                  exhibit_type: 'descendant', is_base_node: false, mechanism_tags: ['M1'] },
};

function findEpisodeNarration(
  episodeTracks: { artist: string; song: string; narration_zh: string }[],
  artist: string,
  song: string,
): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wantArtist = norm(artist);
  const wantSong = norm(song);
  for (const t of episodeTracks) {
    const epArtist = norm(t.artist);
    const epSong = norm(t.song);
    // Exact match
    if (epArtist + epSong === wantArtist + wantSong) return t.narration_zh;
    // Episode artist may include "feat. ..." suffixes — match if episode artist starts with playlist artist
    if (epSong === wantSong && epArtist.startsWith(wantArtist)) return t.narration_zh;
  }
  return null;
}

function main() {
  const playlistMd = readFileSync(PLAYLIST, 'utf8');
  const episodeMd = readFileSync(EPISODE, 'utf8');

  const tracks = parsePlaylist(playlistMd);
  const ep = parseEpisode(episodeMd);

  if (tracks.length !== 18) {
    throw new Error(`Expected 18 tracks, got ${tracks.length}`);
  }

  const exhibits: Exhibit[] = [];

  // Position 0 — opening (narrations sit at 0/19/20 so tracks keep playlist positions 1..18)
  exhibits.push({
    kind: 'narration',
    position: 0,
    exhibit_type: 'opening',
    transcript_zh: ep.opening,
    transcript_en: null,
    transcript_zh_status: 'complete',
    transcript_en_status: 'missing',
    narrator_persona_zh: null,
    narrator_persona_en: null,
  } satisfies NonTrackExhibit);

  // Positions 1..18 — tracks (matching playlist positions)
  for (const t of tracks) {
    const meta = TRACK_META[t.position];
    if (!meta) throw new Error(`Missing meta for track position ${t.position}`);
    const narration = findEpisodeNarration(ep.tracks, t.artist, t.song);
    const transcript_zh = narration ?? t.curatorial_note;
    const transcript_zh_status = narration ? 'complete' as const : 'placeholder' as const;

    exhibits.push({
      kind: 'track',
      position: t.position, // 1..18, matches playlist
      node_id: meta.node_id,
      year: t.year,
      artist: t.artist,
      song: t.song,
      album: '',
      exhibit_type: meta.exhibit_type,
      is_base_node: meta.is_base_node,
      mechanism_tags: meta.mechanism_tags,
      netease_song_id: NETEASE_UNAVAILABLE.has(t.position) ? null : t.netease_song_id,
      audio_url: null,
      album_cover_url: null,
      duration_seconds: null,
      unavailable: false,
      transcript_zh,
      transcript_en: null,
      transcript_zh_status,
      transcript_en_status: 'missing',
      narrator_persona_zh: null,
      narrator_persona_en: null,
    } satisfies TrackExhibit);
  }

  // Position 19 — interlude
  exhibits.push({
    kind: 'narration',
    position: 19,
    exhibit_type: 'interlude',
    transcript_zh: ep.interlude,
    transcript_en: null,
    transcript_zh_status: 'complete',
    transcript_en_status: 'missing',
    narrator_persona_zh: null,
    narrator_persona_en: null,
  } satisfies NonTrackExhibit);

  // Position 20 — closing
  exhibits.push({
    kind: 'narration',
    position: 20,
    exhibit_type: 'thematic_closure',
    transcript_zh: ep.closing,
    transcript_en: null,
    transcript_zh_status: 'complete',
    transcript_en_status: 'missing',
    narrator_persona_zh: null,
    narrator_persona_en: null,
  } satisfies NonTrackExhibit);

  // Fill album from data/nodes
  for (const e of exhibits) {
    if (e.kind !== 'track') continue;
    const nodePath = path.join(VAULT_ROOT, 'data/nodes', `${e.node_id}.json`);
    try {
      const node = JSON.parse(readFileSync(nodePath, 'utf8')) as {
        works?: { type: string; title: string }[]
      };
      const albumWork = node.works?.find((w) => w.type === 'album');
      (e as TrackExhibit).album = albumWork?.title ?? '';
    } catch {
      // skip if node file missing
    }
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(exhibits, null, 2));
  console.log(`Wrote ${exhibits.length} exhibits to ${OUT}`);
}

main();
