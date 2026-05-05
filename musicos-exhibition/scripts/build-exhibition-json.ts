import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parsePlaylist } from './lib/parse-playlist.js';
import { parseEpisode } from './lib/parse-episode.js';
import { parseConnections, type ConnectionsFile } from './lib/parse-connections.js';
import { fileSlug } from './lib/slug.js';
import type { Exhibit, TrackExhibit, NonTrackExhibit, Mechanism, ExhibitType, ConnectionKind, EvidenceBasis, RedHeartTier, RedHeartSeed, NarrativeWeight, ArchivedConnection } from '../src/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const VAULT_ROOT = path.resolve(__dirname, '../..');
const PLAYLIST = path.join(
  VAULT_ROOT,
  'playlists/rolling-stones_some-girls_miss-you.playlist v0.3.md',
);
const EPISODE = path.join(
  VAULT_ROOT,
  'episodes/rolling-stones_some-girls_miss-you.episode.md',
);
const EPISODE_JSON = path.join(
  VAULT_ROOT,
  'episodes/rolling-stones_some-girls_miss-you.episode.json',
);
const CONNECTIONS = path.join(
  VAULT_ROOT,
  'playlists/rolling-stones_some-girls_miss-you.connections.json',
);
const OUT = path.resolve(__dirname, '../data/exhibition.json');

// Tracks known to be unavailable/unlicensed on NetEase Cloud Music in mainland China.
// Even if the playlist has a link, we null the ID so the UI doesn't attempt playback.
const NETEASE_UNAVAILABLE = new Set<number>([
  11, // Talking Heads — Once in a Lifetime (not licensed on NetEase)
]);

// Corrections for stale NetEase IDs found in the playlist markdown.
// Keys are playlist positions (1..18); values are the replacement IDs (as strings).
// Verified working (code=200, url=OK) via song_url_v1 at time of correction (2026-05-05).
const NETEASE_ID_CORRECTIONS: Record<number, string> = {
  1:  '27138926',   // James Brown — Cold Sweat; old ID 18713 returns 404
  2:  '20344729',   // Sly & the Family Stone — Family Affair; old ID 6039 returns 404
  4:  '18300309',   // Parliament — Give Up the Funk; old ID 26149 returns 404
  5:  '5059535',    // Bee Gees — Stayin' Alive; old ID 6450 returns 404
  6:  '21968201',   // The Rolling Stones — Miss You (Remastered); old ID 105575 returns 404
  8:  '4021819',    // Devo — Jocko Homo; old ID 6316 returns 404
  13: '21393063',   // Prince — When Doves Cry; old ID 5054 returns 404
  14: '21536236',   // Red Hot Chili Peppers — Give It Away; old ID 5225 returns 404
  15: '26349642',   // Daft Punk — Get Lucky; old ID 28633948 returns 404
  16: '33004499',   // Tame Impala — The Less I Know the Better; old ID 427814441 returns 404
};

const GENRE_BY_POSITION: Record<number, string> = {
  1: 'Funk',
  2: 'Funk / Soul',
  3: 'Plastic soul',
  4: 'P-Funk',
  5: 'Disco',
  6: 'Rock × Disco',
  7: 'Punk × Disco',
  8: 'Art punk / proto-new-wave',
  9: 'Disco',
  10: 'Post-punk',
  11: 'Art rock / post-punk funk',
  12: 'Stadium rock × disco',
  13: 'Minneapolis funk-rock',
  14: 'Funk-rock',
  15: 'Nu-disco',
  16: 'Psychedelic pop',
  17: 'Dub-soul / instrumental groove',
  18: 'Bedroom R&B / experimental rock',
};

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

interface ConnectionRefBuild {
  id: string;
  other_position: number;
  other_label: string;
  kind: ConnectionKind;
  evidence_basis: EvidenceBasis;
  narration_zh: string;
  narration_en: string;
}

function pushTo<T>(m: Map<number, T[]>, k: number, v: T): void {
  const list = m.get(k) ?? [];
  list.push(v);
  m.set(k, list);
}

interface RedHeartResult {
  tier: RedHeartTier;
  matched_seeds: RedHeartSeed[];
}

function runRedHeartMatch(artist: string, song: string, album: string): RedHeartResult {
  const payload = JSON.stringify({ artist, song, album });
  const pyScript = [
    'import sys, json',
    'from tools.red_heart_match import match',
    'node = json.loads(sys.argv[1])',
    'print(json.dumps(match(node)))',
  ].join('; ');
  const result = spawnSync('python3', ['-c', pyScript, payload], {
    cwd: VAULT_ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `red_heart_match failed for ${artist} — ${song} (status=${result.status}): ${result.stderr}`,
    );
  }
  return JSON.parse(result.stdout.trim());
}

function indexConnections(conn: ConnectionsFile): {
  inbound:  Map<number, ConnectionRefBuild[]>;
  outbound: Map<number, ConnectionRefBuild[]>;
  lateral:  Map<number, ConnectionRefBuild[]>;
} {
  // v0.4: `direction` removed. All pairs are causal (from < to in
  // lineage). Outbound at from-position uses the foreshadow voice
  // (named when present, else anonymous). Inbound at to-position uses
  // the callback voice. `lateral` stays for back-compat in the type
  // but is always empty in v0.4.
  const inbound  = new Map<number, ConnectionRefBuild[]>();
  const outbound = new Map<number, ConnectionRefBuild[]>();
  const lateral  = new Map<number, ConnectionRefBuild[]>();
  const labels: Record<string, string> = conn.position_labels ?? {};

  for (const p of conn.connection_pairs) {
    const fwd = p.narration_modes.foreshadow_named_at_from
      ?? p.narration_modes.foreshadow_anonymous_at_from;
    const back = p.narration_modes.callback_named_at_to;

    const refForFrom: ConnectionRefBuild = {
      id: p.id,
      other_position: p.to_position,
      other_label: labels[String(p.to_position)] ?? '',
      kind: p.kind,
      evidence_basis: p.evidence_basis,
      narration_zh: fwd.voice_zh,
      narration_en: fwd.voice_en,
    };
    const refForTo: ConnectionRefBuild = {
      id: p.id,
      other_position: p.from_position,
      other_label: labels[String(p.from_position)] ?? '',
      kind: p.kind,
      evidence_basis: p.evidence_basis,
      narration_zh: back.voice_zh,
      narration_en: back.voice_en,
    };

    pushTo(outbound, p.from_position, refForFrom);
    pushTo(inbound,  p.to_position,   refForTo);
  }
  return { inbound, outbound, lateral };
}

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
    // Episode artist may include "feat. ..." suffixes
    if (epSong === wantSong && epArtist.startsWith(wantArtist)) return t.narration_zh;
    // Playlist song may have "(subtitle)" appended — match if playlist song starts with episode song
    if (epArtist === wantArtist && wantSong.startsWith(epSong)) return t.narration_zh;
  }
  return null;
}

function main() {
  const playlistMd = readFileSync(PLAYLIST, 'utf8');
  const episodeMd = readFileSync(EPISODE, 'utf8');

  const tracks = parsePlaylist(playlistMd);
  const ep = parseEpisode(episodeMd);

  // Load and parse connections
  const conn = parseConnections(JSON.parse(readFileSync(CONNECTIONS, 'utf8')));
  const idx = indexConnections(conn);

  // Load episode.json for bridge narrations (muted tracks), album data,
  // and v0.4 fields (narrative_weight, strong_connection_id,
  // archived_weak_connections) when present.
  const episodeJson = JSON.parse(readFileSync(EPISODE_JSON, 'utf8')) as {
    exhibits: {
      position: number;
      album?: string;
      bridge_narration_zh?: string | null;
      bridge_narration_en?: string | null;
      narrative_weight?: NarrativeWeight | null;
      strong_connection_id?: string | null;
      archived_weak_connections?: ArchivedConnection[];
    }[];
  };
  const episodeJsonByPos = new Map(
    episodeJson.exhibits.map((e) => [e.position, e]),
  );

  // Tracklist provides narrative_weight as the source of truth when the
  // episode.json hasn't yet been rebuilt under v0.4 (PR-4C output).
  const TRACKLIST = path.join(VAULT_ROOT, `playlists/${conn.playlist_slug}.tracklist.json`);
  const tracklistRows = JSON.parse(readFileSync(TRACKLIST, 'utf8')) as {
    position: number;
    narrative_weight?: NarrativeWeight;
  }[];
  const weightByPos = new Map<number, NarrativeWeight | null>();
  for (const row of tracklistRows) {
    weightByPos.set(row.position, row.narrative_weight ?? null);
  }

  function lookupBridgeFromEpisodeJson(position: number, lang: 'zh' | 'en'): string | null {
    const ex = episodeJsonByPos.get(position);
    if (!ex) return null;
    return lang === 'zh' ? (ex.bridge_narration_zh ?? null) : (ex.bridge_narration_en ?? null);
  }

  if (tracks.length !== 18) {
    throw new Error(`Expected 18 tracks, got ${tracks.length}`);
  }

  // Preserve audio fields that fetch-audio.ts writes; build-data must not clobber them.
  type AudioState = Pick<TrackExhibit, 'audio_url' | 'album_cover_url' | 'duration_seconds' | 'unavailable'>;
  const prevAudio = new Map<number, AudioState>();
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8')) as Exhibit[];
    for (const e of prev) {
      if (e.kind === 'track') {
        const t = e as TrackExhibit;
        prevAudio.set(t.position, {
          audio_url: t.audio_url,
          album_cover_url: t.album_cover_url,
          duration_seconds: t.duration_seconds,
          unavailable: t.unavailable,
        });
      }
    }
  } catch {
    // first run — no existing file, prevAudio stays empty
  }

  // Detect fusion audio (narration+music stitched) from public/audio_fusion/<NN>_*.mp3
  function detectFusionUrl(position: number): string | null {
    const fusionDir = path.resolve(__dirname, '../public/audio_fusion');
    if (!existsSync(fusionDir)) return null;
    const prefix = `${String(position).padStart(2, '0')}_`;
    try {
      const entries = readdirSync(fusionDir);
      const match = entries.find((f) => f.startsWith(prefix) && f.endsWith('.mp3'));
      return match ? `/audio_fusion/${match}` : null;
    } catch {
      return null;
    }
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
    fusion_audio_url: detectFusionUrl(0),
  } satisfies NonTrackExhibit);

  // Positions 1..18 — tracks (matching playlist positions)
  for (const t of tracks) {
    const meta = TRACK_META[t.position];
    if (!meta) throw new Error(`Missing meta for track position ${t.position}`);
    const narration = findEpisodeNarration(ep.tracks, t.artist, t.song);
    const transcript_zh = narration ?? t.curatorial_note;
    const transcript_zh_status = narration ? 'complete' as const : 'placeholder' as const;

    const epAlbum = episodeJsonByPos.get(t.position)?.album ?? '';
    const rh = runRedHeartMatch(t.artist, t.song, epAlbum);
    const muted = conn.muted_positions.includes(t.position);

    // Backfill album_cover_url from public/covers/<slug>.jpg if it exists on disk.
    // Used as fallback when prevAudio (from fetch-audio.ts) hasn't populated it yet.
    const coverSlug = fileSlug(t.position, t.artist, t.song);
    const coverFile = path.resolve(__dirname, `../public/covers/${coverSlug}.jpg`);
    const detectedCoverUrl = existsSync(coverFile) ? `/covers/${coverSlug}.jpg` : null;

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
      netease_song_id: NETEASE_UNAVAILABLE.has(t.position)
        ? null
        : (NETEASE_ID_CORRECTIONS[t.position] ?? t.netease_song_id),
      audio_url: prevAudio.get(t.position)?.audio_url ?? null,
      fusion_audio_url: detectFusionUrl(t.position),
      album_cover_url: prevAudio.get(t.position)?.album_cover_url ?? detectedCoverUrl,
      duration_seconds: prevAudio.get(t.position)?.duration_seconds ?? null,
      unavailable: prevAudio.get(t.position)?.unavailable ?? false,
      transcript_zh,
      transcript_en: null,
      transcript_zh_status,
      transcript_en_status: 'missing',
      narrator_persona_zh: null,
      narrator_persona_en: null,
      // New fields from T10
      genre: GENRE_BY_POSITION[t.position] ?? null,
      episode_focus: conn.episode_focus,
      red_heart_tier: rh.tier,
      red_heart_matched_seeds: rh.matched_seeds,
      muted_this_episode: muted,
      bridge_narration_zh: muted ? lookupBridgeFromEpisodeJson(t.position, 'zh') : null,
      bridge_narration_en: muted ? lookupBridgeFromEpisodeJson(t.position, 'en') : null,
      connections_in:       idx.inbound.get(t.position)  ?? [],
      connections_out:      idx.outbound.get(t.position) ?? [],
      connections_lateral:  idx.lateral.get(t.position)  ?? [],
      narrative_weight: episodeJsonByPos.get(t.position)?.narrative_weight
        ?? weightByPos.get(t.position)
        ?? null,
      strong_connection_id: episodeJsonByPos.get(t.position)?.strong_connection_id ?? null,
      archived_weak_connections: episodeJsonByPos.get(t.position)?.archived_weak_connections ?? [],
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
    fusion_audio_url: detectFusionUrl(19),
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
    fusion_audio_url: detectFusionUrl(20),
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
