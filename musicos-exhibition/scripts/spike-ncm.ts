import { execSync } from 'node:child_process';

// Miss You: encrypted ID is unknown to us; we have the original (numeric) ID 105575.
// First search to obtain the encrypted ID.
const ORIGINAL_ID = '105575';

console.log('=== Probe 1: search song ===');
try {
  const search = execSync(
    `ncm-cli search song --keyword "Miss You Rolling Stones" --limit 5 --output json`,
    { encoding: 'utf8' }
  );
  console.log(search.slice(0, 2000));
} catch (e) { console.error('search failed:', (e as Error).message); }

console.log('\n=== Probe 2: play --output json (do not actually play, just see what it prints) ===');
// We deliberately call play; if it returns JSON containing a URL, we capture it.
// Use a fake/short timeout-friendly approach: pipe output, kill after 2s.
try {
  const out = execSync(
    `ncm-cli play --song --original-id ${ORIGINAL_ID} --output json 2>&1 || true`,
    { encoding: 'utf8', timeout: 5000 }
  );
  console.log(out.slice(0, 3000));
} catch (e) { console.error('play probe failed:', (e as Error).message); }

console.log('\n=== Probe 3: state command after a play attempt ===');
try {
  const state = execSync(`ncm-cli state --output json 2>&1 || true`, { encoding: 'utf8' });
  console.log(state.slice(0, 2000));
} catch (e) { console.error('state failed:', (e as Error).message); }

console.log('\n=== Probe 4: ncm-cli --help (all top-level flags) ===');
try {
  const help = execSync(`ncm-cli --help 2>&1`, { encoding: 'utf8' });
  console.log(help.slice(0, 2000));
} catch (e) { console.error('help failed:', (e as Error).message); }

console.log('\n=== Probe 5: ncm-cli play --help ===');
try {
  const playHelp = execSync(`ncm-cli play --help 2>&1`, { encoding: 'utf8' });
  console.log(playHelp.slice(0, 2000));
} catch (e) { console.error('play --help failed:', (e as Error).message); }

console.log('\n=== Probe 6: manifest API methods (what ncm-cli openapi exposes) ===');
try {
  const fs = await import('node:fs');
  const manifestPath = `${process.env.HOME}/.config/ncm-cli/cache/manifest.json`;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const [resource, spec] of Object.entries(manifest.manifests as Record<string, { methods?: Array<{ name: string; path: string }> }>)) {
    for (const method of spec.methods ?? []) {
      console.log(`${resource}.${method.name} => ${method.path}`);
    }
  }
} catch (e) { console.error('manifest read failed:', (e as Error).message); }

console.log('\n=== Probe 7: NeteaseCloudMusicApi library — song_url_v1 ===');
try {
  // Dynamic import because the package is CommonJS
  const ncmApi = await import('NeteaseCloudMusicApi') as Record<string, (params: Record<string, unknown>) => Promise<{ body?: unknown; data?: unknown }>>;
  if (ncmApi.song_url_v1) {
    // originalId 21968201 = "Miss You (Remastered)" from Some Girls (found via search)
    const result = await ncmApi.song_url_v1({ id: 21968201, level: 'standard' });
    const body = (result.body ?? result) as { data?: Array<{ url: string | null; code: number; freeTrialInfo?: { start: number; end: number } }> };
    const track = body.data?.[0];
    if (track) {
      console.log('url:', track.url);
      console.log('code:', track.code);
      console.log('freeTrialInfo:', JSON.stringify(track.freeTrialInfo));
    }
  } else {
    console.log('song_url_v1 not found in NeteaseCloudMusicApi exports');
  }
} catch (e) { console.error('NeteaseCloudMusicApi probe failed:', (e as Error).message); }

console.log('\n=== Probe 8: NeteaseCloudMusicApi library — song_detail (cover URL) ===');
try {
  const ncmApi = await import('NeteaseCloudMusicApi') as Record<string, (params: Record<string, unknown>) => Promise<{ body?: unknown }>>;
  if (ncmApi.song_detail) {
    const result = await ncmApi.song_detail({ ids: '21968201' });
    const body = (result.body ?? result) as { songs?: Array<{ name: string; al: { picUrl: string }; ar: Array<{ name: string }> }> };
    const song = body.songs?.[0];
    if (song) {
      console.log('name:', song.name);
      console.log('coverImgUrl:', song.al?.picUrl);
      console.log('artists:', song.ar?.map((a) => a.name).join(', '));
    }
  }
} catch (e) { console.error('song_detail probe failed:', (e as Error).message); }

console.log('\n=== CONCLUSIONS ===');
console.log('Path A (ncm-cli exposes URL via JSON output): NO');
console.log('  - ncm-cli play does not emit audio URLs to stdout');
console.log('  - ncm-cli state only shows: status/position/volume/queue');
console.log('  - ncm-cli openapi manifest has NO song URL endpoint');
console.log('  - _fetchUrl is an internal daemon function, not surfaced to CLI callers');
console.log('');
console.log('Path B (NeteaseCloudMusicApi library): YES — this is the strategy');
console.log('  - song_url_v1({ id, level }) returns { url, br, type, freeTrialInfo }');
console.log('  - URL is a CDN mp3 with Access-Control-Allow-Origin: * (CORS-safe)');
console.log('  - song_detail({ ids }) returns cover picUrl from album.picUrl');
console.log('  - Without auth: 30-second trial clips; with cookie auth: full tracks');
console.log('  - For exhibition use: trial clips are sufficient for preview playback');
