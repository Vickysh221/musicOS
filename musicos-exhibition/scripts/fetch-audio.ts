// Talking Heads — Once in a Lifetime (position 11): no NetEase ID available.
// Options: (a) yt-dlp from YouTube, (b) swap to a different track, (c) leave unavailable.
// Decision for Phase 1: mark unavailable (c). Audio: cover + transcript only.
// Queen — Another One Bites the Dust (position 12): same situation.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchSongMeta } from './lib/netease.js';
import { fileSlug } from './lib/slug.js';
import type { Exhibit, TrackExhibit } from '../src/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data/exhibition.json');
const AUDIO_DIR = path.join(ROOT, 'public/audio');
const COVER_DIR = path.join(ROOT, 'public/covers');

mkdirSync(AUDIO_DIR, { recursive: true });
mkdirSync(COVER_DIR, { recursive: true });

async function downloadTo(url: string, dest: string): Promise<void> {
  if (existsSync(dest)) {
    console.log(`  skip (exists): ${path.basename(dest)}`);
    return;
  }
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com/' },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`  saved: ${path.basename(dest)} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
}

async function main() {
  const data = JSON.parse(readFileSync(DATA, 'utf8')) as Exhibit[];
  let succ = 0, fail = 0, skipped = 0;

  for (const e of data) {
    if (e.kind !== 'track') continue;
    if (!e.netease_song_id) {
      console.log(`[${e.position}] ${e.artist} — ${e.song}: no netease_song_id, marking unavailable`);
      (e as TrackExhibit).unavailable = true;
      skipped++;
      continue;
    }
    console.log(`[${e.position}] ${e.artist} — ${e.song} (id=${e.netease_song_id})`);
    try {
      const meta = await fetchSongMeta(e.netease_song_id);
      if (!meta) {
        console.log(`  No meta returned (auth required or track unavailable)`);
        (e as TrackExhibit).unavailable = true;
        fail++;
        continue;
      }
      const slug = fileSlug(e.position, e.artist, e.song);
      const audioPath = path.join(AUDIO_DIR, `${slug}.mp3`);
      const coverPath = path.join(COVER_DIR, `${slug}.jpg`);
      await downloadTo(meta.audio_url, audioPath);
      await downloadTo(meta.cover_url, coverPath);
      (e as TrackExhibit).audio_url = `/audio/${slug}.mp3`;
      (e as TrackExhibit).album_cover_url = `/covers/${slug}.jpg`;
      (e as TrackExhibit).duration_seconds = meta.duration_seconds;
      succ++;
      if (meta.free_trial) {
        console.log(`  ⚠️  preview clip (30s) — auth required for full track`);
      }
    } catch (err) {
      console.error(`  FAIL: ${(err as Error).message}`);
      (e as TrackExhibit).unavailable = true;
      fail++;
    }
  }

  writeFileSync(DATA, JSON.stringify(data, null, 2));
  console.log(`\nDone: ${succ} downloaded, ${fail} failed/unavailable, ${skipped} no-id`);
}

main();
