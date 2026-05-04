# Miss You Exhibition — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working music-source pipeline (`ncm-cli` → 18 local MP3s + 18 covers + complete `exhibition.json`) and a minimum-viable React+Vite shell that proves the pipeline end-to-end.

**Architecture:** A `musicos-exhibition/` project at the repo root, containing (a) Node scripts that read the existing `data/nodes/` registry and `episodes/*.md` transcripts to build a single `exhibition.json`, (b) a fetch script that downloads audio + cover art via ncm-cli (or a fallback NetEase API path), (c) a stub React+Vite app that loads `exhibition.json` and renders a list view + per-track view with native `<audio>` controls.

**Tech Stack:** Node 25 / npm 11, TypeScript, Vite 5, React 18, wouter (routing), zustand (state), tsx (script runner), vitest (tests), `ncm-cli` 0.1.3 (existing, on PATH), NeteaseCloudMusicApi (fallback if ncm-cli can't expose URLs).

**Spec reference:** `docs/superpowers/specs/2026-05-05-miss-you-exhibition-design.md`

---

## File Structure

New directory at repo root: `musicos-exhibition/`

```
musicos-exhibition/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .gitignore
├── README.md
├── data/
│   └── exhibition.json                      # built by scripts/build-exhibition-json.ts
├── scripts/
│   ├── build-exhibition-json.ts             # assembles exhibition.json from vault sources
│   ├── fetch-audio.ts                       # downloads MP3 + cover for each track
│   ├── spike-ncm.ts                         # one-off probe (Task 1)
│   └── lib/
│       ├── slug.ts                          # filename slug helpers
│       ├── netease.ts                       # ncm-cli wrapper + API fallback
│       ├── parse-playlist.ts                # extract netease song IDs from playlist v0.2.md
│       └── parse-episode.ts                 # extract Chinese transcripts from episode.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts                             # Exhibit, TrackExhibit, NonTrackExhibit
│   ├── lib/
│   │   └── load-exhibition.ts
│   ├── store/
│   │   └── exhibition.ts                    # zustand store
│   └── routes/
│       ├── Timeline.tsx                     # stub list (Phase 1)
│       └── TrackDetail.tsx                  # stub detail (Phase 1)
├── public/
│   ├── audio/                               # gitignored after Phase 1 verification (~90MB)
│   └── covers/                              # committed (small)
└── tests/
    ├── parse-playlist.test.ts
    ├── parse-episode.test.ts
    ├── slug.test.ts
    └── exhibition-json.test.ts
```

**Vault sources read by build script (already exist):**
- `playlists/rolling-stones_some-girls_miss-you.playlist v0.2.md` → tracklist + NetEase IDs + curatorial notes (placeholder transcripts for v0.2-only tracks)
- `episodes/rolling-stones_some-girls_miss-you.episode.md` → finished Chinese transcripts for 12 of the 18 tracks
- `data/nodes/<node-id>.json` → artist / album / year / mechanism tags / narrative metadata

---

## Task 1: Spike — determine ncm-cli URL extraction strategy

**Files:**
- Create: `musicos-exhibition/scripts/spike-ncm.ts`

This task is a **spike**, not TDD. The goal is to answer one yes/no question: does `ncm-cli play --output json` (or any other ncm-cli command) return the resolved audio URL we can pass to `fetch()`?

If yes, we wrap ncm-cli in `lib/netease.ts`. If no, we fall back to direct calls to a NeteaseCloudMusicApi instance (the same backend ncm-cli uses internally — typically `https://music.163.com/api/song/enhance/player/url` or the `/song/url/v1` endpoint).

- [ ] **Step 1: Initialize the project directory**

```bash
cd /Users/vickyshou/Documents/MusicOS
mkdir -p musicos-exhibition/scripts/lib musicos-exhibition/tests
cd musicos-exhibition
npm init -y
npm install --save-dev typescript tsx @types/node
npx tsc --init --target es2022 --module nodenext --moduleResolution nodenext --strict --esModuleInterop --skipLibCheck --outDir dist
```

Expected: `package.json`, `tsconfig.json` created.

- [ ] **Step 2: Write the spike script**

Create `musicos-exhibition/scripts/spike-ncm.ts`:

```typescript
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
    `timeout 3 ncm-cli play --song --original-id ${ORIGINAL_ID} --output json 2>&1 || true`,
    { encoding: 'utf8' }
  );
  console.log(out.slice(0, 3000));
} catch (e) { console.error('play probe failed:', (e as Error).message); }

console.log('\n=== Probe 3: state command after a play attempt ===');
try {
  const state = execSync(`ncm-cli state --output json 2>&1 || true`, { encoding: 'utf8' });
  console.log(state.slice(0, 2000));
} catch (e) { console.error('state failed:', (e as Error).message); }
```

- [ ] **Step 3: Run the spike and capture output**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx tsx scripts/spike-ncm.ts 2>&1 | tee /tmp/ncm-spike.log
```

Read the output. Look specifically for:
- An `audio_url`, `url`, `streamUrl`, or similar field in any JSON output
- Encrypted ID in search results (we'll need this for the play command in some forms)

- [ ] **Step 4: Decide on the URL strategy**

Record the decision in `musicos-exhibition/scripts/lib/netease.ts` as a top-of-file comment. Two cases:

**Case A (ncm-cli exposes URL):** Use ncm-cli for everything.
**Case B (ncm-cli does not expose URL):** Fall back to direct NetEase API. Install dependencies:

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm install NeteaseCloudMusicApi
```

(If `NeteaseCloudMusicApi` isn't usable as a library import, instead write a small fetch-based wrapper that calls `https://music.163.com/api/song/url/v1?id=<id>&level=standard` directly. The exact endpoint and auth path will be determined during this step based on what works against the user's network.)

- [ ] **Step 5: Commit the spike**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/package.json musicos-exhibition/tsconfig.json musicos-exhibition/scripts/spike-ncm.ts
git commit -m "chore(exhibition): scaffold project + ncm-cli URL extraction spike"
```

---

## Task 2: Project scaffold (Vite + React + tooling)

**Files:**
- Create: `musicos-exhibition/index.html`
- Create: `musicos-exhibition/vite.config.ts`
- Create: `musicos-exhibition/src/main.tsx`
- Create: `musicos-exhibition/src/App.tsx`
- Create: `musicos-exhibition/.gitignore`
- Modify: `musicos-exhibition/package.json` (add scripts)

- [ ] **Step 1: Install runtime deps**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm install react react-dom wouter zustand
npm install --save-dev @vitejs/plugin-react vite vitest @types/react @types/react-dom
```

- [ ] **Step 2: Write `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 5173 },
});
```

- [ ] **Step 3: Write `index.html`**

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Miss You · Sonic Cartography</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Write `src/main.tsx`**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Write `src/App.tsx` (placeholder)**

```typescript
export function App() {
  return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Miss You Exhibition — Phase 1 scaffold</div>;
}
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
dist/
.vite/
*.log
public/audio/
```

(We commit `public/covers/` because it's small; we keep `public/audio/` out of git because it's ~90MB and arguably-licensed.)

- [ ] **Step 7: Add npm scripts**

Edit `musicos-exhibition/package.json` so `"scripts"` block reads:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview --port 4173",
  "test": "vitest run",
  "build-data": "tsx scripts/build-exhibition-json.ts",
  "fetch-audio": "tsx scripts/fetch-audio.ts",
  "spike": "tsx scripts/spike-ncm.ts"
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm run dev &
SERVER_PID=$!
sleep 3
curl -s http://localhost:5173/ | head -20
kill $SERVER_PID
```

Expected: an HTML response containing `<div id="root">`.

- [ ] **Step 9: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/
git commit -m "feat(exhibition): vite + react scaffold"
```

---

## Task 3: Type definitions

**Files:**
- Create: `musicos-exhibition/src/types.ts`

- [ ] **Step 1: Write the failing test**

Create `musicos-exhibition/tests/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { Exhibit, TrackExhibit, NonTrackExhibit } from '../src/types';

describe('Exhibit types', () => {
  it('TrackExhibit has all P0 fields', () => {
    const t: TrackExhibit = {
      kind: 'track',
      position: 6,
      node_id: 'rolling-stones_some-girls_miss-you',
      year: 1978,
      artist: 'The Rolling Stones',
      song: 'Miss You',
      album: 'Some Girls',
      exhibit_type: 'anchor',
      is_base_node: true,
      mechanism_tags: ['M1', 'M3'],
      netease_song_id: '105575',
      audio_url: '/audio/06_rolling-stones_miss-you.mp3',
      album_cover_url: '/covers/06_rolling-stones_miss-you.jpg',
      duration_seconds: 300,
      unavailable: false,
      transcript_zh: '...',
      transcript_en: null,
      transcript_zh_status: 'complete',
      transcript_en_status: 'missing',
      narrator_persona_zh: null,
      narrator_persona_en: null,
    };
    expect(t.kind).toBe('track');
    expect(t.position).toBe(6);
  });

  it('NonTrackExhibit lacks audio fields', () => {
    const n: NonTrackExhibit = {
      kind: 'narration',
      position: 1,
      exhibit_type: 'opening',
      transcript_zh: '...',
      transcript_en: null,
      transcript_zh_status: 'complete',
      transcript_en_status: 'missing',
      narrator_persona_zh: null,
      narrator_persona_en: null,
    };
    expect(n.kind).toBe('narration');
  });

  it('Exhibit is a discriminated union', () => {
    const items: Exhibit[] = [];
    expect(items).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test (it should fail with module-not-found)**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx vitest run tests/types.test.ts
```

Expected: FAIL — cannot find module `../src/types`.

- [ ] **Step 3: Implement the types**

Create `musicos-exhibition/src/types.ts`:

```typescript
export type ExhibitType =
  | 'opening'
  | 'ancestor'
  | 'anchor'
  | 'lateral'
  | 'descendant'
  | 'interlude'
  | 'thematic_closure';

export type TranscriptStatus = 'complete' | 'placeholder' | 'missing';

export type Mechanism = 'M1' | 'M2' | 'M3' | 'M4';

interface ExhibitBase {
  position: number;
  exhibit_type: ExhibitType;
  transcript_zh: string | null;
  transcript_en: string | null;
  transcript_zh_status: TranscriptStatus;
  transcript_en_status: TranscriptStatus;
  narrator_persona_zh: string | null;
  narrator_persona_en: string | null;
}

export interface TrackExhibit extends ExhibitBase {
  kind: 'track';
  node_id: string;
  year: number;
  artist: string;
  song: string;
  album: string;
  is_base_node: boolean;
  mechanism_tags: Mechanism[];
  netease_song_id: string;
  audio_url: string | null;
  album_cover_url: string | null;
  duration_seconds: number | null;
  unavailable: boolean;
}

export interface NonTrackExhibit extends ExhibitBase {
  kind: 'narration';
}

export type Exhibit = TrackExhibit | NonTrackExhibit;
```

- [ ] **Step 4: Run the test (it should pass)**

```bash
npx vitest run tests/types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/src/types.ts musicos-exhibition/tests/types.test.ts
git commit -m "feat(exhibition): exhibit type definitions"
```

---

## Task 4: Parse the v0.2 playlist (extract NetEase song IDs)

**Files:**
- Create: `musicos-exhibition/scripts/lib/parse-playlist.ts`
- Create: `musicos-exhibition/tests/parse-playlist.test.ts`

The playlist file is `playlists/rolling-stones_some-girls_miss-you.playlist v0.2.md`. Each track section follows the pattern `## Track N: <Artist> — <Song> (<Year>)` and includes a NetEase URL like `[Listen on NetEase](https://music.163.com/#/song?id=NUMERIC_ID)`. Track 12 (Queen) has the variant `[Listen on NetEase — search Queen · Another One Bites the Dust]` with no ID — special-case to `null`.

- [ ] **Step 1: Write the failing test**

Create `musicos-exhibition/tests/parse-playlist.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parsePlaylist } from '../scripts/lib/parse-playlist';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PLAYLIST_PATH = path.resolve(
  __dirname,
  '../../playlists/rolling-stones_some-girls_miss-you.playlist v0.2.md',
);

describe('parsePlaylist', () => {
  const md = readFileSync(PLAYLIST_PATH, 'utf8');
  const tracks = parsePlaylist(md);

  it('extracts 18 tracks', () => {
    expect(tracks).toHaveLength(18);
  });

  it('Track 1 is James Brown — Cold Sweat 1967, NetEase 18713', () => {
    expect(tracks[0]).toMatchObject({
      position: 1,
      artist: 'James Brown',
      song: 'Cold Sweat',
      year: 1967,
      netease_song_id: '18713',
    });
  });

  it('Track 6 is the anchor (Miss You)', () => {
    expect(tracks[5]).toMatchObject({
      position: 6,
      artist: 'The Rolling Stones',
      song: 'Miss You',
      year: 1978,
      netease_song_id: '105575',
    });
  });

  it('Track 12 (Queen) has null netease_song_id', () => {
    expect(tracks[11].artist).toBe('Queen');
    expect(tracks[11].netease_song_id).toBeNull();
  });

  it('Track 18 is Mk.gee, year 2024', () => {
    expect(tracks[17]).toMatchObject({
      position: 18,
      artist: 'Mk.gee',
      year: 2024,
    });
  });

  it('every track has a curatorial_note string', () => {
    for (const t of tracks) {
      expect(typeof t.curatorial_note).toBe('string');
      expect(t.curatorial_note.length).toBeGreaterThan(50);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx vitest run tests/parse-playlist.test.ts
```

Expected: FAIL — cannot find module `../scripts/lib/parse-playlist`.

- [ ] **Step 3: Implement the parser**

Create `musicos-exhibition/scripts/lib/parse-playlist.ts`:

```typescript
export interface ParsedTrack {
  position: number;
  artist: string;
  song: string;
  year: number;
  netease_song_id: string | null;
  curatorial_note: string;
}

export function parsePlaylist(md: string): ParsedTrack[] {
  const tracks: ParsedTrack[] = [];

  // Track sections: ## Track N: Artist — Song (Year)
  // The em-dash may be — (U+2014). Year is a 4-digit number in parentheses.
  const headerRe = /^## Track (\d+): (.+?) — (.+?) \((\d{4})\)\s*$/gm;
  const matches = [...md.matchAll(headerRe)];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const position = Number(m[1]);
    const artist = m[2].trim();
    const song = m[3].trim();
    const year = Number(m[4]);

    // Section body: from end of this header to start of next header (or EOF)
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : md.length;
    const section = md.slice(start, end);

    // NetEase ID extraction
    const idMatch = section.match(/music\.163\.com\/#\/song\?id=(\d+)/);
    const netease_song_id = idMatch ? idMatch[1] : null;

    // Curatorial note: take the first non-blank prose paragraph after the *italic* line
    const curatorial_note = section
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith('*') && !p.startsWith('[') && !p.startsWith('#')) ?? '';

    tracks.push({ position, artist, song, year, netease_song_id, curatorial_note });
  }

  return tracks;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/parse-playlist.test.ts
```

Expected: PASS, all 6 assertions green.

- [ ] **Step 5: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/scripts/lib/parse-playlist.ts musicos-exhibition/tests/parse-playlist.test.ts
git commit -m "feat(exhibition): playlist v0.2 parser"
```

---

## Task 5: Parse the episode.md (extract Chinese transcripts for 12 tracks)

**Files:**
- Create: `musicos-exhibition/scripts/lib/parse-episode.ts`
- Create: `musicos-exhibition/tests/parse-episode.test.ts`

The episode markdown has sections like `## Exhibit N: <Artist> — <Song> (<Year>)` followed by metadata block then `### Narration` then prose. We extract the prose under `### Narration` for each `track`-type exhibit, plus the opening / interlude / closing texts.

- [ ] **Step 1: Write the failing test**

```typescript
// musicos-exhibition/tests/parse-episode.test.ts
import { describe, it, expect } from 'vitest';
import { parseEpisode } from '../scripts/lib/parse-episode';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const EPISODE_PATH = path.resolve(
  __dirname,
  '../../episodes/rolling-stones_some-girls_miss-you.episode.md',
);

describe('parseEpisode', () => {
  const md = readFileSync(EPISODE_PATH, 'utf8');
  const result = parseEpisode(md);

  it('returns opening narration', () => {
    expect(result.opening).toContain('这是一场音乐博物馆的展览');
  });

  it('returns interlude narration', () => {
    expect(result.interlude).toContain('三条同时期的道路展示完了');
  });

  it('returns closing narration', () => {
    expect(result.closing).toContain('结尾');
  });

  it('returns track narrations keyed by artist + song', () => {
    const stones = result.tracks.find(
      (t) => t.artist === 'The Rolling Stones' && t.song === 'Miss You',
    );
    expect(stones).toBeDefined();
    expect(stones!.narration_zh).toContain('我们到了展览的中心节点');
  });

  it('contains 12 track narrations', () => {
    expect(result.tracks).toHaveLength(12);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/parse-episode.test.ts
```

Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement the parser**

Create `musicos-exhibition/scripts/lib/parse-episode.ts`:

```typescript
export interface ParsedEpisodeTrack {
  artist: string;
  song: string;
  narration_zh: string;
}

export interface ParsedEpisode {
  opening: string;
  interlude: string;
  closing: string;
  tracks: ParsedEpisodeTrack[];
}

export function parseEpisode(md: string): ParsedEpisode {
  // Opening — under "## Exhibit 1: Opening Narration", body after "## Exhibit 1..." headline,
  //          stop at next "## Exhibit"
  const opening = extractBetween(md, /## Exhibit 1: Opening Narration/, /## Exhibit 2:/);

  // Interlude — Exhibit 10
  const interlude = extractBetween(md, /## Exhibit 10: Interlude/, /## Exhibit 11:/);

  // Closing — Exhibit 15
  const closing = extractBetween(md, /## Exhibit 15: Closing Narration/, /## Appendix:/);

  // Tracks: Exhibit 2..9 and 11..14 (positions 2..9 are 4 ancestors + anchor + 3 laterals;
  //         11..14 are 4 descendants). Total = 12.
  const tracks: ParsedEpisodeTrack[] = [];
  const trackRe = /^## Exhibit (\d+): (.+?) — (.+?) \(\d{4}\)\s*$/gm;
  const matches = [...md.matchAll(trackRe)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const num = Number(m[1]);
    if (num === 1 || num === 10 || num === 15) continue; // skip non-track exhibits
    const artist = m[2].trim();
    const song = m[3].trim();
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : md.length;
    const section = md.slice(start, end);

    // narration body lives under "### Narration" (or "### Narration (Anchor Track)") down to "---"
    const narrMatch = section.match(/### Narration[^\n]*\n([\s\S]*?)(?=\n---)/);
    const narration_zh = narrMatch ? narrMatch[1].trim() : '';
    tracks.push({ artist, song, narration_zh });
  }

  return { opening, interlude, closing, tracks };
}

function extractBetween(md: string, startRe: RegExp, endRe: RegExp): string {
  const startMatch = md.match(startRe);
  if (!startMatch) return '';
  const start = startMatch.index! + startMatch[0].length;
  const tail = md.slice(start);
  const endMatch = tail.match(endRe);
  const sliceEnd = endMatch ? endMatch.index! : tail.length;
  const block = tail.slice(0, sliceEnd);

  // Strip the "**Duration:** ... **Type:** ..." metadata header lines and "### Narration" line
  return block
    .split('\n')
    .filter((line) => !line.startsWith('**') && line.trim() !== '---' && !line.startsWith('### '))
    .join('\n')
    .trim();
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/parse-episode.test.ts
```

Expected: PASS, 5 assertions green.

- [ ] **Step 5: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/scripts/lib/parse-episode.ts musicos-exhibition/tests/parse-episode.test.ts
git commit -m "feat(exhibition): episode.md transcript parser"
```

---

## Task 6: Slug helper

**Files:**
- Create: `musicos-exhibition/scripts/lib/slug.ts`
- Create: `musicos-exhibition/tests/slug.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// musicos-exhibition/tests/slug.test.ts
import { describe, it, expect } from 'vitest';
import { slugify, fileSlug } from '../scripts/lib/slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('The Rolling Stones')).toBe('the-rolling-stones');
  });

  it('drops apostrophes and punctuation', () => {
    expect(slugify("Stayin' Alive")).toBe('stayin-alive');
    expect(slugify('Q: Are We Not Men?')).toBe('q-are-we-not-men');
  });

  it('collapses repeated hyphens', () => {
    expect(slugify('Give Up the Funk (Tear the Roof off the Sucker)')).toBe(
      'give-up-the-funk-tear-the-roof-off-the-sucker',
    );
  });

  it('handles em-dash + period', () => {
    expect(slugify('Mk.gee')).toBe('mkgee');
  });
});

describe('fileSlug', () => {
  it('prefixes 2-digit position', () => {
    expect(fileSlug(6, 'The Rolling Stones', 'Miss You')).toBe(
      '06_the-rolling-stones_miss-you',
    );
  });

  it('handles position 18', () => {
    expect(fileSlug(18, 'Mk.gee', 'You Dreamed of Me')).toBe(
      '18_mkgee_you-dreamed-of-me',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/slug.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `musicos-exhibition/scripts/lib/slug.ts`:

```typescript
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function fileSlug(position: number, artist: string, song: string): string {
  const pad = String(position).padStart(2, '0');
  return `${pad}_${slugify(artist)}_${slugify(song)}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/slug.test.ts
```

Expected: PASS, 6 assertions green.

- [ ] **Step 5: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/scripts/lib/slug.ts musicos-exhibition/tests/slug.test.ts
git commit -m "feat(exhibition): slug helpers"
```

---

## Task 7: Build `exhibition.json`

**Files:**
- Create: `musicos-exhibition/scripts/build-exhibition-json.ts`
- Create: `musicos-exhibition/tests/exhibition-json.test.ts`
- Create: `musicos-exhibition/data/exhibition.json` (output of running the script)

This script reads the playlist + episode + node files and writes a complete `exhibition.json` covering: 1 opening + 18 tracks + 1 interlude + 1 closing = 21 records.

- [ ] **Step 1: Write the failing integration test**

```typescript
// musicos-exhibition/tests/exhibition-json.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Exhibit, TrackExhibit } from '../src/types';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data/exhibition.json');

describe('build-exhibition-json', () => {
  beforeAll(() => {
    execSync('npm run build-data', { cwd: ROOT, stdio: 'inherit' });
  });

  const data = JSON.parse(readFileSync(OUT, 'utf8')) as Exhibit[];

  it('contains 21 exhibits (18 tracks + opening + interlude + closing)', () => {
    expect(data).toHaveLength(21);
  });

  it('has exactly 18 track-kind exhibits', () => {
    expect(data.filter((e) => e.kind === 'track')).toHaveLength(18);
  });

  it('track positions are 1..18 contiguous (matching playlist)', () => {
    const tracks = data
      .filter((e) => e.kind === 'track')
      .map((e) => e.position)
      .sort((a, b) => a - b);
    expect(tracks).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
  });

  it('narrations sit at positions 0, 19, 20', () => {
    const narrations = data
      .filter((e) => e.kind === 'narration')
      .map((e) => e.position)
      .sort((a, b) => a - b);
    expect(narrations).toEqual([0, 19, 20]);
  });

  it('Miss You is the only is_base_node', () => {
    const bases = data.filter(
      (e): e is TrackExhibit => e.kind === 'track' && e.is_base_node,
    );
    expect(bases).toHaveLength(1);
    expect(bases[0].song).toBe('Miss You');
  });

  it('Talking Heads track has netease_song_id null but is still a track', () => {
    const th = data.find(
      (e): e is TrackExhibit => e.kind === 'track' && e.artist === 'Talking Heads',
    );
    expect(th).toBeDefined();
    expect(th!.netease_song_id).toBeNull();
  });

  it('12 tracks have transcript_zh_status === "complete"', () => {
    const complete = data.filter(
      (e) => e.kind === 'track' && e.transcript_zh_status === 'complete',
    );
    expect(complete).toHaveLength(12);
  });

  it('6 tracks have transcript_zh_status === "placeholder"', () => {
    const placeholders = data.filter(
      (e) => e.kind === 'track' && e.transcript_zh_status === 'placeholder',
    );
    expect(placeholders).toHaveLength(6);
  });

  it('all transcript_en_status values are "missing" (Phase 1)', () => {
    expect(data.every((e) => e.transcript_en_status === 'missing')).toBe(true);
  });

  it('audio_url and album_cover_url are null in built output (Phase 1: not yet fetched)', () => {
    const tracks = data.filter((e): e is TrackExhibit => e.kind === 'track');
    expect(tracks.every((t) => t.audio_url === null)).toBe(true);
    expect(tracks.every((t) => t.album_cover_url === null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx vitest run tests/exhibition-json.test.ts
```

Expected: FAIL — `npm run build-data` script doesn't exist or build script not implemented.

- [ ] **Step 3: Implement `build-exhibition-json.ts`**

Create `musicos-exhibition/scripts/build-exhibition-json.ts`:

```typescript
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parsePlaylist } from './lib/parse-playlist';
import { parseEpisode } from './lib/parse-episode';
import type { Exhibit, TrackExhibit, NonTrackExhibit, Mechanism, ExhibitType } from '../src/types';

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

// Mapping: position-in-playlist → node_id (vault registry filename without .json) + extras.
// We hardcode this once because slug rules in data/nodes/ don't match playlist artist text 1:1.
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
  const want = norm(artist) + norm(song);
  for (const t of episodeTracks) {
    if (norm(t.artist) + norm(t.song) === want) return t.narration_zh;
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

  // Positions 2..19 — 18 tracks
  for (const t of tracks) {
    const meta = TRACK_META[t.position];
    if (!meta) throw new Error(`Missing meta for track position ${t.position}`);
    const narration = findEpisodeNarration(ep.tracks, t.artist, t.song);
    const transcript_zh = narration ?? t.curatorial_note;
    const transcript_zh_status = narration ? 'complete' : 'placeholder';

    exhibits.push({
      kind: 'track',
      position: t.position, // 1..18, matches playlist
      node_id: meta.node_id,
      year: t.year,
      artist: t.artist,
      song: t.song,
      album: '', // filled later from data/nodes
      exhibit_type: meta.exhibit_type,
      is_base_node: meta.is_base_node,
      mechanism_tags: meta.mechanism_tags,
      netease_song_id: t.netease_song_id,
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

  // Position 19 — interlude (sits between last track and closing)
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
      const node = JSON.parse(readFileSync(nodePath, 'utf8'));
      const albumWork = (node.works as { type: string; title: string }[] | undefined)?.find(
        (w) => w.type === 'album',
      );
      e.album = albumWork?.title ?? '';
    } catch (err) {
      console.warn(`Skipping album lookup for ${e.node_id}: ${(err as Error).message}`);
    }
  }

  writeFileSync(OUT, JSON.stringify(exhibits, null, 2));
  console.log(`Wrote ${exhibits.length} exhibits to ${OUT}`);
}

main();
```

**Position numbering (locked):** Tracks keep their playlist positions 1..18 (so Miss You is `/track/6`, matching the spec). The three narrations are tucked at positions 0 (opening), 19 (interlude), 20 (closing) — sortable, distinct from any track, and consistent with the type test in Task 3 and the routing in Tasks 11/12/14.

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx vitest run tests/exhibition-json.test.ts
```

Expected: PASS, all 10 assertions green.

- [ ] **Step 5: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/scripts/build-exhibition-json.ts \
        musicos-exhibition/scripts/lib/parse-playlist.ts \
        musicos-exhibition/scripts/lib/parse-episode.ts \
        musicos-exhibition/tests/exhibition-json.test.ts \
        musicos-exhibition/data/exhibition.json
git commit -m "feat(exhibition): build exhibition.json from vault sources"
```

---

## Task 8: NetEase wrapper (URL + cover lookup)

**Files:**
- Create: `musicos-exhibition/scripts/lib/netease.ts`
- Create: `musicos-exhibition/tests/netease.test.ts`

The implementation depends on Task 1's spike. Two paths:

**Path A — ncm-cli exposes URL:** wrap `ncm-cli play --output json` (or whichever subcommand prints the URL).

**Path B — fall back to direct API:** call NetEase's public song-url endpoint directly via `fetch`. The unauthenticated endpoint pattern is `https://music.163.com/api/song/enhance/player/url?ids=[<id>]&br=320000` (existence and signing details to be confirmed during implementation; this may require setting a `User-Agent` or `Cookie` header).

- [ ] **Step 1: Write the test (network-gated)**

```typescript
// musicos-exhibition/tests/netease.test.ts
import { describe, it, expect } from 'vitest';
import { fetchSongMeta } from '../scripts/lib/netease';

const NET = process.env.RUN_NETWORK_TESTS === '1';

describe.skipIf(!NET)('netease', () => {
  it('fetches Miss You URL and cover', async () => {
    const meta = await fetchSongMeta('105575');
    expect(meta.audio_url).toMatch(/^https?:\/\//);
    expect(meta.cover_url).toMatch(/^https?:\/\//);
    expect(meta.duration_seconds).toBeGreaterThan(60);
  });
});
```

- [ ] **Step 2: Run the test (skipped without env var)**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx vitest run tests/netease.test.ts
```

Expected: SKIP (no `RUN_NETWORK_TESTS=1`).

- [ ] **Step 3: Implement based on Task 1 outcome**

Create `musicos-exhibition/scripts/lib/netease.ts`. Pseudocode for both paths:

```typescript
// musicos-exhibition/scripts/lib/netease.ts
//
// Strategy chosen in Task 1 spike: <FILL IN — A or B>
//
import { execSync } from 'node:child_process';

export interface SongMeta {
  audio_url: string;
  cover_url: string;
  duration_seconds: number;
}

export async function fetchSongMeta(neteaseSongId: string): Promise<SongMeta> {
  // Path A: parse ncm-cli output
  // const out = execSync(`ncm-cli ... --output json`, { encoding: 'utf8' });
  // const j = JSON.parse(out);
  // return { audio_url: j.url, cover_url: j.cover, duration_seconds: j.duration };

  // Path B: direct fetch
  const resp = await fetch(
    `https://music.163.com/api/song/enhance/player/url?ids=[${neteaseSongId}]&br=320000`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://music.163.com/',
      },
    },
  );
  const j = await resp.json();
  const audio_url = j.data?.[0]?.url;
  if (!audio_url) throw new Error(`No URL for song ${neteaseSongId}`);
  // Cover comes from a separate endpoint:
  const detail = await fetch(
    `https://music.163.com/api/song/detail?ids=[${neteaseSongId}]`,
    { headers: { Referer: 'https://music.163.com/' } },
  );
  const dj = await detail.json();
  const song = dj.songs?.[0];
  return {
    audio_url,
    cover_url: song?.album?.picUrl ?? '',
    duration_seconds: Math.round((song?.duration ?? 0) / 1000),
  };
}
```

- [ ] **Step 4: Run the network test against the live API**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
RUN_NETWORK_TESTS=1 npx vitest run tests/netease.test.ts
```

Expected: PASS.

If the endpoint shape returned by the user's network is different from the pseudocode (e.g., different JSON structure, auth required), adjust `fetchSongMeta` until the test passes. **The test is the contract.**

- [ ] **Step 5: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/scripts/lib/netease.ts musicos-exhibition/tests/netease.test.ts
git commit -m "feat(exhibition): netease song-meta wrapper"
```

---

## Task 9: Audio + cover fetcher

**Files:**
- Create: `musicos-exhibition/scripts/fetch-audio.ts`

This script reads `data/exhibition.json`, iterates through every track with `netease_song_id !== null && unavailable === false`, fetches the meta via `fetchSongMeta`, downloads the MP3 and cover JPG to `public/audio/` and `public/covers/`, and writes the resulting paths back into `exhibition.json`.

- [ ] **Step 1: Implement the script**

Create `musicos-exhibition/scripts/fetch-audio.ts`:

```typescript
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchSongMeta } from './lib/netease';
import { fileSlug } from './lib/slug';
import type { Exhibit } from '../src/types';

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
  let succ = 0, fail = 0;

  for (const e of data) {
    if (e.kind !== 'track') continue;
    if (!e.netease_song_id) {
      console.log(`[${e.position}] ${e.artist} — ${e.song}: no netease_song_id, marking unavailable`);
      e.unavailable = true;
      continue;
    }
    console.log(`[${e.position}] ${e.artist} — ${e.song} (id=${e.netease_song_id})`);
    try {
      const meta = await fetchSongMeta(e.netease_song_id);
      const slug = fileSlug(e.position, e.artist, e.song);
      const audioPath = path.join(AUDIO_DIR, `${slug}.mp3`);
      const coverPath = path.join(COVER_DIR, `${slug}.jpg`);
      await downloadTo(meta.audio_url, audioPath);
      await downloadTo(meta.cover_url, coverPath);
      e.audio_url = `/audio/${slug}.mp3`;
      e.album_cover_url = `/covers/${slug}.jpg`;
      e.duration_seconds = meta.duration_seconds;
      succ++;
    } catch (err) {
      console.error(`  FAIL: ${(err as Error).message}`);
      e.unavailable = true;
      fail++;
    }
  }

  writeFileSync(DATA, JSON.stringify(data, null, 2));
  console.log(`\nDone: ${succ} ok, ${fail} failed`);
}

main();
```

- [ ] **Step 2: Run on a 3-track sample first (sanity check)**

Before fetching all 18, verify the pipeline by editing `scripts/fetch-audio.ts` to slice the data array:

```typescript
// TEMPORARY: only first 3 tracks for verification
const data = (JSON.parse(readFileSync(DATA, 'utf8')) as Exhibit[]).slice(0, 4);
```

Then:

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm run fetch-audio
ls -la public/audio public/covers
```

Expected: 3 MP3 files, 3 JPG files. If the playback works (`afplay public/audio/02_*.mp3` on macOS), the pipeline is good.

- [ ] **Step 3: Revert the slice, run the full 18**

```bash
# Remove the .slice(0, 4) addition
npm run fetch-audio
ls public/audio | wc -l
ls public/covers | wc -l
```

Expected: each `wc -l` returns 17 or 18 (Talking Heads will fail or be skipped).

- [ ] **Step 4: Verify the data file was updated**

```bash
node -e "const d=require('./data/exhibition.json'); const tracks=d.filter(e=>e.kind==='track'); console.log('tracks with audio:', tracks.filter(t=>t.audio_url).length); console.log('unavailable:', tracks.filter(t=>t.unavailable).length);"
```

Expected: `tracks with audio: 17` (or 18 if Talking Heads found), `unavailable: 1` (or 0).

- [ ] **Step 5: Decide on Talking Heads**

Three options per the spec §4:
- (a) Find an alternative source manually (YouTube extraction with `yt-dlp`, drop file at `public/audio/12_talking-heads_once-in-a-lifetime.mp3`)
- (b) Use a different track from Remain in Light (replace netease_song_id, re-run fetch)
- (c) Leave `unavailable: true`; UI will show cover + transcript only

Pick one. Document the decision at the top of `scripts/fetch-audio.ts` as a comment. If (a), also drop a cover at `public/covers/12_talking-heads_once-in-a-lifetime.jpg` and edit `exhibition.json` to set `audio_url` / `album_cover_url` / `unavailable: false` for that track.

- [ ] **Step 6: Commit (script + updated exhibition.json + covers)**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/scripts/fetch-audio.ts \
        musicos-exhibition/data/exhibition.json \
        musicos-exhibition/public/covers/
git commit -m "feat(exhibition): fetch audio + covers via netease wrapper"
```

(Audio files are in `.gitignore` and stay out of the commit.)

---

## Task 10: Load `exhibition.json` into the React app

**Files:**
- Create: `musicos-exhibition/src/lib/load-exhibition.ts`
- Create: `musicos-exhibition/src/store/exhibition.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// musicos-exhibition/tests/load-exhibition.test.ts
import { describe, it, expect } from 'vitest';
import { loadExhibition } from '../src/lib/load-exhibition';
import data from '../data/exhibition.json';

describe('loadExhibition', () => {
  it('returns the parsed array', async () => {
    const exhibits = await loadExhibition(data as never);
    expect(exhibits.length).toBeGreaterThanOrEqual(21);
  });

  it('finds Miss You by position', async () => {
    const exhibits = await loadExhibition(data as never);
    const miss = exhibits.find((e) => e.kind === 'track' && e.song === 'Miss You');
    expect(miss).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx vitest run tests/load-exhibition.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `musicos-exhibition/src/lib/load-exhibition.ts`:

```typescript
import type { Exhibit } from '../types';

export async function loadExhibition(input?: Exhibit[]): Promise<Exhibit[]> {
  if (input) return input;
  const resp = await fetch('/data/exhibition.json');
  if (!resp.ok) throw new Error(`Failed to load exhibition.json: HTTP ${resp.status}`);
  return resp.json() as Promise<Exhibit[]>;
}
```

Create `musicos-exhibition/src/store/exhibition.ts`:

```typescript
import { create } from 'zustand';
import type { Exhibit } from '../types';
import { loadExhibition } from '../lib/load-exhibition';

interface ExhibitionStore {
  exhibits: Exhibit[];
  language: 'zh' | 'en';
  mode: 'auto' | 'manual';
  load: () => Promise<void>;
  setLanguage: (lang: 'zh' | 'en') => void;
  setMode: (mode: 'auto' | 'manual') => void;
}

export const useExhibition = create<ExhibitionStore>((set) => ({
  exhibits: [],
  language: 'zh',
  mode: 'manual',
  load: async () => {
    const exhibits = await loadExhibition();
    set({ exhibits });
  },
  setLanguage: (language) => set({ language }),
  setMode: (mode) => set({ mode }),
}));
```

- [ ] **Step 4: Verify the test passes**

```bash
npx vitest run tests/load-exhibition.test.ts
```

Expected: PASS.

- [ ] **Step 5: Make the data file servable by Vite**

Move or symlink `data/exhibition.json` so Vite serves it at `/data/exhibition.json`. Cleanest: copy to `public/data/exhibition.json` as a build step. Edit `package.json`:

```json
"scripts": {
  "dev": "npm run sync-data && vite",
  "build": "npm run sync-data && vite build",
  "sync-data": "mkdir -p public/data && cp data/exhibition.json public/data/exhibition.json",
  "preview": "vite preview --port 4173",
  "test": "vitest run",
  "build-data": "tsx scripts/build-exhibition-json.ts && npm run sync-data",
  "fetch-audio": "tsx scripts/fetch-audio.ts && npm run sync-data",
  "spike": "tsx scripts/spike-ncm.ts"
}
```

Add `public/data/` to `.gitignore` (it's a generated copy):

```
node_modules/
dist/
.vite/
*.log
public/audio/
public/data/
```

- [ ] **Step 6: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/src/lib/load-exhibition.ts \
        musicos-exhibition/src/store/exhibition.ts \
        musicos-exhibition/tests/load-exhibition.test.ts \
        musicos-exhibition/package.json \
        musicos-exhibition/.gitignore
git commit -m "feat(exhibition): load exhibition.json via zustand store"
```

---

## Task 11: Stub Timeline route (vertical list)

**Files:**
- Create: `musicos-exhibition/src/routes/Timeline.tsx`
- Modify: `musicos-exhibition/src/App.tsx`

- [ ] **Step 1: Implement the timeline list**

Create `musicos-exhibition/src/routes/Timeline.tsx`:

```typescript
import { useEffect } from 'react';
import { Link } from 'wouter';
import { useExhibition } from '../store/exhibition';

export function Timeline() {
  const { exhibits, load } = useExhibition();

  useEffect(() => {
    if (exhibits.length === 0) load();
  }, [exhibits.length, load]);

  const tracks = exhibits.filter((e) => e.kind === 'track');

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 800, margin: '0 auto' }}>
      <h1>Miss You · Sonic Cartography</h1>
      <p style={{ opacity: 0.7 }}>
        The Rock × Funk Translation — 1967 → 2024 — {tracks.length} tracks
      </p>
      <Link href="/track/1">
        <a style={{ display: 'inline-block', margin: '16px 0', padding: '8px 16px', background: '#222', color: '#fff', textDecoration: 'none' }}>
          ▶ Play from beginning (auto)
        </a>
      </Link>
      <ol style={{ listStyle: 'none', padding: 0 }}>
        {tracks.map((t) => (
          <li key={t.position} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <Link href={`/track/${t.position}`}>
              <a style={{ textDecoration: 'none', color: 'inherit' }}>
                <span style={{ display: 'inline-block', width: 32, opacity: 0.5 }}>{t.position}</span>
                <span style={{ display: 'inline-block', width: 60, opacity: 0.7 }}>{t.year}</span>
                <strong>{t.artist}</strong> — {t.song}
                {t.is_base_node && <span style={{ marginLeft: 8, fontSize: 12, color: '#a60' }}>★ ANCHOR</span>}
                {t.unavailable && <span style={{ marginLeft: 8, fontSize: 12, color: '#a00' }}>(no audio)</span>}
              </a>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Verify Timeline renders all 18 tracks via dev server**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm run dev &
SERVER_PID=$!
sleep 3
curl -s http://localhost:5173/ > /tmp/timeline.html
grep -c '<li' /tmp/timeline.html
kill $SERVER_PID
```

Expected: `18` (number of `<li>` elements rendered server-side; even though SSR is off, the test still confirms the page loads).

(You'll also want to manually open `http://localhost:5173/` in a browser to verify the list looks right and the Miss You row has the ★ ANCHOR marker.)

- [ ] **Step 3: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/src/routes/Timeline.tsx
git commit -m "feat(exhibition): stub timeline route — vertical list of 18 tracks"
```

---

## Task 12: Stub TrackDetail route

**Files:**
- Create: `musicos-exhibition/src/routes/TrackDetail.tsx`

- [ ] **Step 1: Implement the detail page**

Create `musicos-exhibition/src/routes/TrackDetail.tsx`:

```typescript
import { useEffect } from 'react';
import { Link, useRoute } from 'wouter';
import { useExhibition } from '../store/exhibition';

export function TrackDetail() {
  const [, params] = useRoute<{ position: string }>('/track/:position');
  const position = Number(params?.position);
  const { exhibits, load, language } = useExhibition();

  useEffect(() => {
    if (exhibits.length === 0) load();
  }, [exhibits.length, load]);

  const track = exhibits.find((e) => e.kind === 'track' && e.position === position);
  const tracks = exhibits.filter((e) => e.kind === 'track');
  const idx = tracks.findIndex((t) => t.position === position);
  const prev = idx > 0 ? tracks[idx - 1] : null;
  const next = idx < tracks.length - 1 ? tracks[idx + 1] : null;

  if (!track || track.kind !== 'track') {
    return (
      <div style={{ padding: 24 }}>
        <Link href="/"><a>← Back</a></Link>
        <p>Track {position} not found.</p>
      </div>
    );
  }

  const transcript = language === 'zh' ? track.transcript_zh : track.transcript_en;
  const transcriptStatus =
    language === 'zh' ? track.transcript_zh_status : track.transcript_en_status;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 1200, margin: '0 auto' }}>
      <Link href="/"><a style={{ gridColumn: '1 / -1' }}>← Back to timeline</a></Link>

      <div>
        {track.album_cover_url && (
          <img
            src={track.album_cover_url}
            alt={`${track.album} cover`}
            style={{ width: '100%', maxWidth: 400, aspectRatio: 1, objectFit: 'cover' }}
          />
        )}
        <p style={{ opacity: 0.6, marginTop: 12 }}>
          Track {track.position} / 18 · {track.year}
        </p>
        <h2 style={{ margin: '4px 0' }}>{track.artist}</h2>
        <h3 style={{ margin: '4px 0', fontWeight: 'normal' }}>{track.song}</h3>
        {track.album && <p style={{ opacity: 0.7 }}>from {track.album}</p>}

        {track.audio_url ? (
          <audio src={track.audio_url} controls style={{ width: '100%', marginTop: 16 }} />
        ) : (
          <p style={{ color: '#a00', marginTop: 16 }}>音源待定 / source unavailable</p>
        )}

        <nav style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          {prev ? <Link href={`/track/${prev.position}`}><a>← {prev.artist}</a></Link> : <span />}
          {next ? <Link href={`/track/${next.position}`}><a>{next.artist} →</a></Link> : <span />}
        </nav>
      </div>

      <div>
        <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 4 }}>
          {track.exhibit_type.toUpperCase()} · {track.mechanism_tags.join(' · ')}
          {transcriptStatus === 'placeholder' && (
            <span style={{ marginLeft: 8, color: '#a60' }}>(curatorial note — full narration pending)</span>
          )}
        </p>
        <hr style={{ marginBottom: 12 }} />
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {transcript ?? (language === 'zh' ? '讲解词建设中' : 'Curatorial note in progress')}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in dev server**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm run dev &
SERVER_PID=$!
sleep 3
curl -s http://localhost:5173/track/6 | grep -i 'miss you' | head -3
kill $SERVER_PID
```

Expected: at least one match for "Miss You". (Better verification: open the URL in a browser, confirm the cover loads and the audio control appears.)

- [ ] **Step 3: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/src/routes/TrackDetail.tsx
git commit -m "feat(exhibition): stub track detail route"
```

---

## Task 13: Wire routing in `App.tsx`

**Files:**
- Modify: `musicos-exhibition/src/App.tsx`

- [ ] **Step 1: Replace App with router**

Overwrite `musicos-exhibition/src/App.tsx`:

```typescript
import { Route, Switch } from 'wouter';
import { Timeline } from './routes/Timeline';
import { TrackDetail } from './routes/TrackDetail';

export function App() {
  return (
    <Switch>
      <Route path="/" component={Timeline} />
      <Route path="/track/:position" component={TrackDetail} />
      <Route>
        <div style={{ padding: 24 }}>404 — not found</div>
      </Route>
    </Switch>
  );
}
```

- [ ] **Step 2: Smoke-test the full flow**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm run dev &
SERVER_PID=$!
sleep 3
# Pull index, then a few track URLs
curl -sI http://localhost:5173/ | head -1
curl -sI http://localhost:5173/track/6 | head -1
curl -sI http://localhost:5173/track/18 | head -1
kill $SERVER_PID
```

Expected: each `curl -sI` returns `HTTP/1.1 200 OK`.

- [ ] **Step 3: Manual end-to-end check**

Open `http://localhost:5173/` in a browser. Walk through:
1. Timeline page shows 18 rows
2. Click any row → detail page loads
3. Audio plays (for tracks with `audio_url`)
4. Cover image displays
5. Chinese transcript renders for the 12 finished tracks; placeholder text for the 6 v0.2 additions
6. ←/→ nav between tracks works
7. ← Back to timeline works

If any of these fail, diagnose and fix before commit.

- [ ] **Step 4: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/src/App.tsx
git commit -m "feat(exhibition): wire routing for / and /track/:position"
```

---

## Task 14: Auto-mode (audio `ended` → next track)

**Files:**
- Modify: `musicos-exhibition/src/routes/TrackDetail.tsx`
- Modify: `musicos-exhibition/src/routes/Timeline.tsx`

This is the only mode behavior we implement in Phase 1 (timeline → ▶ Play from beginning enters auto, audio end auto-advances). Manual mode is everywhere else.

- [ ] **Step 1: Modify Timeline's "Play from beginning" link to set mode**

In `Timeline.tsx`, replace the `▶ Play from beginning` link with a button that calls `setMode('auto')` then navigates:

```typescript
import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useExhibition } from '../store/exhibition';

export function Timeline() {
  const { exhibits, load, setMode } = useExhibition();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (exhibits.length === 0) load();
  }, [exhibits.length, load]);

  const tracks = exhibits.filter((e) => e.kind === 'track');

  const startAuto = () => {
    setMode('auto');
    navigate('/track/1');
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 800, margin: '0 auto' }}>
      <h1>Miss You · Sonic Cartography</h1>
      <p style={{ opacity: 0.7 }}>
        The Rock × Funk Translation — 1967 → 2024 — {tracks.length} tracks
      </p>
      <button
        onClick={startAuto}
        style={{ margin: '16px 0', padding: '8px 16px', background: '#222', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        ▶ Play from beginning (auto)
      </button>
      <ol style={{ listStyle: 'none', padding: 0 }}>
        {tracks.map((t) => (
          <li key={t.position} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <Link href={`/track/${t.position}`} onClick={() => setMode('manual')}>
              <a style={{ textDecoration: 'none', color: 'inherit' }}>
                <span style={{ display: 'inline-block', width: 32, opacity: 0.5 }}>{t.position}</span>
                <span style={{ display: 'inline-block', width: 60, opacity: 0.7 }}>{t.year}</span>
                <strong>{t.artist}</strong> — {t.song}
                {t.is_base_node && <span style={{ marginLeft: 8, fontSize: 12, color: '#a60' }}>★ ANCHOR</span>}
                {t.unavailable && <span style={{ marginLeft: 8, fontSize: 12, color: '#a00' }}>(no audio)</span>}
              </a>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Wire the audio `onEnded` handler in TrackDetail**

Replace the `<audio>` element in `TrackDetail.tsx` with:

```typescript
import { useLocation } from 'wouter';
// ...inside the component:
const [, navigate] = useLocation();
const { mode } = useExhibition();

const handleEnded = () => {
  if (mode === 'auto' && next) {
    navigate(`/track/${next.position}`);
  }
};

// ...in JSX:
{track.audio_url ? (
  <audio
    src={track.audio_url}
    controls
    autoPlay={mode === 'auto'}
    onEnded={handleEnded}
    style={{ width: '100%', marginTop: 16 }}
    key={track.audio_url} // ensures element remounts on track change
  />
) : (
  <p style={{ color: '#a00', marginTop: 16 }}>音源待定 / source unavailable</p>
)}
```

(The `key={track.audio_url}` is necessary because React reuses the `<audio>` element across re-renders by default, which would prevent the new `src` from auto-playing.)

Also surface the mode at the top of the detail page:

```typescript
<p style={{ gridColumn: '1 / -1', opacity: 0.6, fontSize: 13 }}>
  Mode: {mode}
</p>
```

- [ ] **Step 3: Manual smoke test**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm run dev
```

Open `http://localhost:5173/`, click ▶ Play from beginning. Track 1 should start playing. Skip toward the end of the audio (drag the seek bar near the end) — when audio ends, should navigate to track 2 and autoplay it.

If `autoPlay` is blocked by browser policy (Safari/Chrome require user interaction first): the click on the ▶ button counts as that interaction; if it still doesn't autoplay, log it as a known limitation and proceed (auto-advance works on subsequent tracks once user has clicked play once).

- [ ] **Step 4: Commit**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/src/routes/Timeline.tsx \
        musicos-exhibition/src/routes/TrackDetail.tsx
git commit -m "feat(exhibition): auto-mode advances on audio ended"
```

---

## Task 15: Deploy to Vercel

**Files:**
- Create: `musicos-exhibition/vercel.json`

- [ ] **Step 1: Write `vercel.json` with SPA fallback**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

(This is needed so deep-linking to `/track/6` doesn't 404 on Vercel's CDN; it rewrites all paths to `index.html` and lets wouter resolve client-side.)

- [ ] **Step 2: Build locally to verify it works**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm run build
ls dist/
```

Expected: `dist/index.html`, `dist/assets/`, `dist/data/exhibition.json`, `dist/audio/*` (if synced), `dist/covers/*`.

(Vite's `vite build` copies `public/` contents to `dist/`. If audio files aren't being copied because they're gitignored from `public/`, that's fine — they'll still be in `public/` on the build machine and copied during build.)

- [ ] **Step 3: Preview the production build**

```bash
npm run preview &
PREVIEW_PID=$!
sleep 3
curl -sI http://localhost:4173/ | head -1
curl -sI http://localhost:4173/track/6 | head -1
kill $PREVIEW_PID
```

Expected: both return 200 (or, for `/track/6`, 200 after the Vercel rewrite — `vite preview` doesn't apply Vercel rewrites; it'll 404. That's expected; the rewrite only takes effect on Vercel itself).

- [ ] **Step 4: Deploy to Vercel**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx vercel --prod
```

Follow CLI prompts: link to user's account, confirm project name `musicos-exhibition`, accept defaults for build settings (framework: Vite). The CLI surfaces a deploy URL on success.

(If the user doesn't want to deploy publicly yet, skip this step and document the build-and-preview commands as the local-only verification path.)

- [ ] **Step 5: Smoke-test the deployed URL**

Open the URL printed by Vercel. Verify:
- Timeline page loads
- Click into Track 6 (Miss You) — cover, audio, transcript all render
- Audio plays
- ←/→ navigation works

- [ ] **Step 6: Commit Vercel config**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/vercel.json
git commit -m "chore(exhibition): vercel SPA rewrite config"
```

---

## Phase 1 Definition of Done — verification checklist

After Task 15, manually walk through these and confirm:

- [ ] `data/exhibition.json` exists, contains 21 records (1 opening + 18 tracks + 1 interlude + 1 closing)
- [ ] `public/audio/` contains 17–18 MP3 files
- [ ] `public/covers/` contains 17–18 JPG files
- [ ] Talking Heads decision documented in code comment
- [ ] Timeline route renders all 18 tracks
- [ ] Each track detail page renders cover, audio control, transcript
- [ ] Auto mode advances on audio end
- [ ] Manual mode (clicking timeline rows) does not auto-advance
- [ ] All 12 finished Chinese transcripts render correctly
- [ ] All 6 v0.2-only tracks render placeholder transcript with "(curatorial note — full narration pending)" indicator
- [ ] Deployed URL works end-to-end

If all boxes are checked, Phase 1 is complete and the project is ready to advance to Phase 1.5 (visual upgrade: horizontal timeline + orbit carousel + framer-motion + bilingual toggle).

---

## What's deliberately NOT in this plan (deferred to later phases)

- Horizontal timeline visual / orbit carousel / framer-motion (Phase 1.5)
- Language toggle UI (Phase 1.5)
- Font system (Phase 1.5)
- Six new Chinese narrations for v0.2 additions (Phase 2)
- Eighteen English transcripts (Phase 2)
- TTS narration synthesis (Phase 3)
- TTS voice selection (Phase 3)
- Audio stitching of narration + music (Phase 3)
