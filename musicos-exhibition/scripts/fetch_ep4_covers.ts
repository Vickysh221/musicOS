import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { song_detail } = require('NeteaseCloudMusicApi') as Record<
  string,
  (params: Record<string, unknown>) => Promise<{ body?: unknown }>
>;

const tracklist = JSON.parse(
  readFileSync('/Users/vickyshou/Documents/MusicOS/playlists/dorantes_orobroy_orobroy.tracklist.json', 'utf8'),
) as Array<{ position: number; netease_song_id: number | null; artist: string; song: string; version_note?: string }>;

const OUT = '/tmp/ep4_covers';

// Slug map for filename stems (must match those in youtube_manifest_ep4.txt)
const STEMS: Record<number, string> = {
  1: '01_dorantes_orobroy-nueva-version',
  2: '02_el-lebrijano_me-vienen-siguiendo',
  3: '03_camaron-de-la-isla_la-leyenda-del-tiempo',
  4: '04_paco-de-lucia_entre-dos-aguas',
  5: '05_pata-negra_blues-de-la-frontera',
  6: '06_chano-dominguez_el-puerto',
  7: '07_albeniz_iberia-evocacion',
  8: '08_keith-jarrett_koln-concert-pt-i',
  9: '09_buena-vista-social-club_chan-chan',
  10: '10_bebo-valdes-diego-el-cigala_lagrimas-negras',
  11: '11_michel-camilo-tomatito_spain',
  12: '12_esperanza-fernandez_al-compas-del-baile',
  13: '13_dorantes_orobroy-1998',
  14: '14_buika_mi-nina-lola',
  15: '15_carmen-linares_zorongo-gitano',
  16: '16_maria-jose-llergo_nina-de-las-dunas',
  17: '17_rosalia_malamente',
  18: '18_c-tangana_tu-me-dejaste-de-querer',
  19: '19_david-lagos_romance-de-la-monja',
  20: '20_dorantes-lebrijano_agua-aire-y-fuego',
};

async function downloadTo(url: string, dest: string): Promise<void> {
  const u = url.startsWith('http://') ? url.replace('http://', 'https://') : url;
  const resp = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com/' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`  saved ${path.basename(dest)} (${(buf.length/1024).toFixed(0)}KB)`);
}

async function main() {
  for (const t of tracklist) {
    const stem = STEMS[t.position];
    if (!stem) continue;
    if (!t.netease_song_id) {
      console.log(`[${t.position}] ${t.artist} — ${t.song}: no NetEase ID, skip (use YouTube thumb)`);
      continue;
    }
    try {
      const result = await song_detail({ ids: String(t.netease_song_id) });
      const body = result.body as { songs?: Array<{ al: { picUrl: string } }> };
      const url = body.songs?.[0]?.al?.picUrl;
      if (!url) { console.log(`[${t.position}] no cover URL`); continue; }
      // Request a high-res variant by appending size param NetEase supports
      const hi = url.includes('?') ? url : `${url}?param=1200y1200`;
      console.log(`[${t.position}] ${stem}: ${url}`);
      await downloadTo(hi, path.join(OUT, `${stem}.jpg`));
    } catch (e) {
      console.log(`[${t.position}] FAIL: ${(e as Error).message}`);
    }
  }
}
main();
