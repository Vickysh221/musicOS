/**
 * NetEase URL Extraction Strategy — Spike Conclusion (2026-05-05)
 * ================================================================
 *
 * DECISION: PATH B — NeteaseCloudMusicApi npm library (NOT ncm-cli)
 *
 * WHY NOT PATH A (ncm-cli):
 * --------------------------
 * 1. `ncm-cli play --output json` does NOT emit audio URLs to stdout.
 *    Its JSON output is only {success, message} — no url field.
 * 2. `ncm-cli state --output json` only returns {status, position, volume,
 *    currentIndex, queueLength} — no URL.
 * 3. The ncm-cli openapi manifest (openncm.music.163.com) has 35 methods
 *    across 9 resources (song, playlist, album, search, user, recommend,
 *    cloud, note). NONE of them expose a song audio URL endpoint.
 * 4. The internal `_fetchUrl` function lives inside the player daemon
 *    (communicating via Unix socket at ~/.config/ncm-cli/player-daemon.sock)
 *    and is never surfaced to CLI callers via JSON.
 * 5. ncm-cli's source is obfuscated — no way to call it as a library.
 *
 * WHY PATH B (NeteaseCloudMusicApi) WORKS:
 * ------------------------------------------
 * The NeteaseCloudMusicApi npm package (v4.31.0, binaryify) exposes 377
 * functions as CommonJS exports. Two are key:
 *
 * A) song_url_v1({ id: number, level: 'standard'|'higher'|'exhigh'|'lossless' })
 *    Returns:
 *      { data: [{ url: string, br: number, type: 'mp3', freeTrialInfo, code }] }
 *    - url is a CDN link: http://m702.music.126.net/<signed path>.mp3
 *    - CDN headers include Access-Control-Allow-Origin: * — browser fetch() works
 *    - Without auth cookie: url is a 30-second trial clip (freeTrialInfo.end = 30)
 *    - With auth cookie: full track (freeTrialInfo = null)
 *    - code 200 = success; code -110 = login required for this track
 *    - The unsigned /api/song/enhance/player/url endpoint returns url=null
 *      for the same song (code -110), confirming the library handles crypto/auth
 *
 * B) song_detail({ ids: '21968201' })
 *    Returns:
 *      { songs: [{ name, al: { picUrl }, ar: [{ name }] }] }
 *    - al.picUrl is an https://p3.music.126.net/... cover image URL
 *    - Works without auth cookie for most tracks
 *
 * VERIFIED SAMPLE (Miss You Remastered, originalId: 21968201):
 *   audio url  : http://m702.music.126.net/<signed>/...mp3  (HTTP 200, 480KB, 30s trial)
 *   cover url  : https://p3.music.126.net/vA4nNKBlP7yeW5YT076t-w==/745468883643682.jpg
 *   CDN CORS   : Access-Control-Allow-Origin: * — confirmed fetchable from browser
 *
 * USAGE NOTE — CJS IMPORT:
 *   NeteaseCloudMusicApi is CommonJS only. Use createRequire() in ESM context:
 *
 *   import { createRequire } from 'node:module';
 *   const require = createRequire(import.meta.url);
 *   const { song_url_v1, song_detail } = require('NeteaseCloudMusicApi');
 *
 *   Or, for the web frontend (Vite build), call a small backend proxy API
 *   (e.g., Vercel Edge Function) that wraps these calls server-side, since
 *   NeteaseCloudMusicApi is a Node.js-only package.
 *
 * IMPLEMENTATION PLAN FOR TASK 8:
 *   1. In the Node.js build script context: use createRequire pattern above.
 *   2. For runtime browser playback in production: expose a /api/netease/url
 *      edge function that proxies song_url_v1 and caches the result (TTL ~1h,
 *      since signed URLs expire in expi=1200 seconds / 20 minutes).
 *   3. Cover URLs (p3.music.126.net) are stable and do not need proxying.
 *   4. If auth cookie is available (ncm-cli tokens.enc.json), pass it to
 *      song_url_v1 via the cookie option for full-length playback.
 *
 * -----------------------------------------------------------------------
 * STUB: The actual implementation of getAudioUrl() and getCoverUrl()
 *       will be written in Task 8.
 * -----------------------------------------------------------------------
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { song_url_v1, song_detail } = require('NeteaseCloudMusicApi') as Record<
  string,
  (params: Record<string, unknown>) => Promise<{ body?: unknown }>
>;

export interface AudioResult {
  url: string;
  br: number;
  type: string;
  /** null = full track; present = preview clip */
  freeTrialInfo: { start: number; end: number } | null;
}

/**
 * Try to load a NetEase session cookie from ncm-cli config.
 *
 * ncm-cli stores its config at ~/.config/ncm-cli/config.json.
 * If a `cookie` field is present there, we pass it to API calls to get
 * full-length tracks instead of 30-second trial clips.
 *
 * @returns Cookie string (e.g. "MUSIC_U=<token>; __csrf=<csrf>") or undefined
 */
function loadNcmCookie(): string | undefined {
  try {
    const configPath = path.join(
      process.env['HOME'] ?? '',
      '.config/ncm-cli/config.json',
    );
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>;
    const cookie = config['cookie'] as string | undefined;
    return cookie ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve a NetEase audio streaming URL for a given numeric song ID.
 *
 * @param originalId - The numeric (original) song ID, e.g. 21968201
 * @param level      - Quality level; default 'standard' (128kbps mp3)
 * @param cookie     - Optional NetEase session cookie for full-length tracks
 * @returns AudioResult or null if the song is unavailable/login-gated
 */
export async function getAudioUrl(
  originalId: number,
  level: 'standard' | 'higher' | 'exhigh' | 'lossless' = 'standard',
  cookie?: string,
): Promise<AudioResult | null> {
  const params: Record<string, unknown> = { id: originalId, level };
  if (cookie) params['cookie'] = cookie;
  const result = await song_url_v1(params);
  const body = result.body as {
    data?: Array<{
      url: string | null;
      br: number;
      type: string;
      code: number;
      freeTrialInfo: { start: number; end: number } | null;
    }>;
    code: number;
  };
  const track = body?.data?.[0];
  if (!track || track.code !== 200 || !track.url) return null;
  return {
    url: track.url,
    br: track.br,
    type: track.type,
    freeTrialInfo: track.freeTrialInfo ?? null,
  };
}

/**
 * Resolve cover image URL, duration, and artist name for a given numeric song ID.
 *
 * @param originalId - The numeric (original) song ID, e.g. 21968201
 * @param cookie     - Optional NetEase session cookie
 * @returns { name, coverUrl, artists, durationMs } or null
 */
export async function getSongDetail(
  originalId: number,
  cookie?: string,
): Promise<{
  name: string;
  coverUrl: string;
  artists: string[];
  /** Full track duration in milliseconds (from metadata, always correct regardless of auth) */
  durationMs: number;
} | null> {
  const params: Record<string, unknown> = { ids: String(originalId) };
  if (cookie) params['cookie'] = cookie;
  const result = await song_detail(params);
  const body = result.body as {
    songs?: Array<{
      name: string;
      al: { picUrl: string };
      ar: Array<{ name: string }>;
      /** Duration in milliseconds */
      dt: number;
    }>;
  };
  const song = body?.songs?.[0];
  if (!song) return null;
  return {
    name: song.name,
    coverUrl: song.al.picUrl,
    artists: song.ar.map((a) => a.name),
    durationMs: song.dt,
  };
}

/**
 * Unified meta fetch: audio CDN URL + album cover + duration for a NetEase song.
 *
 * Duration is always read from song metadata (dt field), so it reflects the full
 * track length even when auth is unavailable and the audio URL is a 30s preview.
 *
 * @param neteaseSongId - NetEase song ID as a string, e.g. '21968201'
 * @returns SongMeta or null if the song is unavailable
 */
export async function fetchSongMeta(neteaseSongId: string): Promise<SongMeta | null> {
  const id = Number(neteaseSongId);

  // Try auth cookie from ncm-cli — allows full-length playback if available
  const cookie = loadNcmCookie();

  const [audioResult, detail] = await Promise.all([
    getAudioUrl(id, 'standard', cookie),
    getSongDetail(id, cookie),
  ]);

  if (!audioResult || !detail) return null;

  return {
    audio_url: audioResult.url,
    cover_url: detail.coverUrl,
    // Use metadata duration (always full track length regardless of auth)
    duration_seconds: Math.round(detail.durationMs / 1000),
    free_trial: audioResult.freeTrialInfo !== null,
  };
}

export interface SongMeta {
  audio_url: string;
  cover_url: string;
  /** Full track duration in seconds (from metadata, accurate even for trial clips) */
  duration_seconds: number;
  /** true = audio_url is a 30s preview clip; false = full track */
  free_trial: boolean;
}
