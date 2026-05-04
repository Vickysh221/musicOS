# Miss You Exhibition — Web Application Design Spec

**Date:** 2026-05-05
**Anchor:** `playlists/rolling-stones_some-girls_miss-you.playlist v0.2.md`
**Status:** Brainstorm complete — awaiting user spec review

---

## 1. Goal

Build a web-based exhibition that turns the 18-track Miss You sonic-cartography playlist (v0.2) into a navigable visual + audio experience. Two playback modes, bilingual (Chinese-first, English toggle), with a horizontal-timeline overview and per-track detail pages.

**Primary deliverable for this round:** the music-source pipeline — `ncm-cli` → 18 MP3 files + 18 album covers + a complete `exhibition.json`. Everything else (UI polish, TTS narration audio, English content) is downstream of that pipeline working end-to-end.

---

## 2. Scope and Priorities

This round (Phase 1) is structured around a single critical-path question: **can we reliably get all 18 tracks of audio + cover art locally hosted, with the data file wired up so any minimum-viable UI can play them?** Everything else defers.

### Priority tiers

| Tier | Item | Phase |
|---|---|---|
| **P0** | Verify `ncm-cli` can extract stable audio + cover URLs | 1 |
| **P0** | `scripts/fetch-audio.ts` — download 18 MP3 + 18 covers to `public/` | 1 |
| **P0** | Resolve Talking Heads (Track 11) missing-on-NetEase issue | 1 |
| **P0** | Generate complete `data/exhibition.json` (Chinese transcript: 12 from `episode.md`, 6 placeholder from `playlist v0.2.md`) | 1 |
| P1 | Minimum React + Vite shell — list page + detail page + native `<audio>` | 1 |
| P1 | Deploy to Vercel | 1 |
| P2 | Horizontal timeline visual, orbit cover carousel, framer-motion, font system, bilingual toggle UI | 1.5 |
| P3 | Write 6 missing Chinese narrations (v0.2 additions) + 18 English translations | 2 |
| P3 | TTS narration synthesis (Chinese + English voices), audio stitching | 3 |

### What this means

The Phase 1 UI is a **stub for verifying the data pipeline**, not the visual product. It has one job: prove the 18 covers display correctly, the 18 audio files play correctly, the 18 transcripts render correctly, and the navigation between tracks works. The orbit carousel, depth-of-field treatment, museum-grade typography, and bilingual switching all wait until Phase 1.5, after we have confidence the data layer is solid.

---

## 3. Architecture

### Tech stack

- **React 18 + Vite + TypeScript**
- `framer-motion` (Phase 1.5) — orbit and focus transitions
- `wouter` — minimal routing (only `/` and `/track/:position`)
- `zustand` — global state (language, mode, current track)
- Pure frontend; static deploy on Vercel

### Directory layout

```
musicos-exhibition/
├── data/
│   └── exhibition.json          # 18 track records + opening/interlude/closing
├── scripts/
│   └── fetch-audio.ts           # ncm-cli wrapper: pulls MP3 + cover, writes paths back
├── src/
│   ├── App.tsx
│   ├── routes/
│   │   ├── Timeline.tsx         # / — chronological list (Phase 1) → horizontal timeline (Phase 1.5)
│   │   └── TrackDetail.tsx      # /track/:position — single-track view
│   ├── components/
│   │   ├── TimelineAxis.tsx     # (Phase 1.5)
│   │   ├── CoverFlow.tsx        # (Phase 1.5) orbit carousel
│   │   ├── Player.tsx           # native <audio> in Phase 1; play/pause overlay in Phase 1.5
│   │   ├── Transcript.tsx       # right-side narrative text
│   │   └── LangToggle.tsx       # (Phase 1.5) zh/en switcher
│   └── store/
│       └── exhibition.ts        # zustand store
└── public/
    ├── audio/                   # 18 MP3 files, named ${position}_${artist-slug}_${song-slug}.mp3
    └── covers/                  # 18 JPG files, named ${position}_${artist-slug}_${song-slug}.jpg
```

### Data model

Single record in `exhibition.json`:

```json
{
  "position": 6,
  "node_id": "rolling-stones_some-girls_miss-you",
  "year": 1978,
  "artist": "The Rolling Stones",
  "song": "Miss You",
  "album": "Some Girls",
  "exhibit_type": "anchor",
  "is_base_node": true,
  "mechanism_tags": ["M1", "M3"],
  "netease_song_id": "105575",
  "audio_url": "/audio/06_rolling-stones_miss-you.mp3",
  "album_cover_url": "/covers/06_rolling-stones_miss-you.jpg",
  "duration_seconds": 300,
  "unavailable": false,
  "transcript_zh": "我们到了展览的中心节点。1977 年，Mick Jagger...",
  "transcript_en": null,
  "transcript_zh_status": "complete",
  "transcript_en_status": "missing",
  "narrator_persona_zh": null,
  "narrator_persona_en": null
}
```

Plus three non-track records: `opening`, `interlude` (after Track 9), `thematic_closure` — these have transcript fields but no audio/cover; they sit in the same JSON array with `exhibit_type` distinguishing them.

`is_base_node: true` is set only on Miss You. UI uses it to decide the subtle visual emphasis (slightly larger, soft halo) — not heavy-handed.

`unavailable: true` on records where audio could not be obtained (e.g., Talking Heads if no replacement source is found). UI shows the cover and transcript, plays a silent placeholder or shows "音源待定 / source unavailable."

---

## 4. Music-source pipeline (the P0 deliverable)

### Constraints

NetEase Cloud Music URLs have three unfriendly properties:
1. **Time-limited** — signed URLs expire in hours to a couple of days.
2. **CORS** — direct browser `<audio src="netease-url">` is often blocked.
3. **Region / licensing** — Talking Heads — `Once in a Lifetime` is unavailable on NetEase.

### Solution: local hosting

`ncm-cli` solves the "get currently valid URL" problem; local hosting solves the persistence problem. We download once, host alongside the React app, never depend on NetEase at runtime.

```
scripts/fetch-audio.ts
  for each record in exhibition.json:
    1. ncm-cli song-url <netease_song_id> → audio download URL
    2. ncm-cli song-info <netease_song_id> → cover URL, duration, metadata
    3. Download MP3 → public/audio/${position}_${artist-slug}_${song-slug}.mp3
    4. Download cover JPG → public/covers/${position}_${artist-slug}_${song-slug}.jpg
    5. Write local paths back into exhibition.json
    6. On failure: set unavailable=true, log skip reason
```

### Resource sizing

18 tracks × ~5 MB average ≈ **~90 MB total**. Vercel's static hosting handles this without issue; deploy size and bandwidth are non-concerns at this scale.

### Talking Heads handling (Track 11)

Three options, decision deferred to implementation:
- (a) Find an alternative source (YouTube extraction, manual MP3 acquisition)
- (b) Substitute another track from the same Remain in Light era
- (c) Mark `unavailable: true`, display cover + transcript only, no audio

Recommendation: try (a) first; fall back to (c). Don't substitute (b) — Once in a Lifetime is the right track for the curatorial argument; replacing it weakens the narrative.

### Legal note

This approach is appropriate for a private / personal-exhibition / academic context. Do not deploy publicly to anonymous traffic without thinking about licensing. If a public deploy becomes a goal later, swap the local audio for NetEase iframes as a fallback (worse UX but legally cleaner).

---

## 5. UI views

### View A — Timeline overview (`/`)

**Phase 1 (stub):** vertical list of 18 tracks. Each row: position number / year / artist / song / album / one-line tag. Click row → detail page. Top-of-page button: ▶ Play from beginning (auto mode).

**Phase 1.5 (target):** horizontal chronological timeline. Year-axis at the bottom (1967, 1971, 1975, 1976, 1977, 1978×3, 1979, 1980×3, 1984, 1991, 2013, 2015, 2018, 2024). 18 nodes positioned by real-time spacing — the 1978–1980 cluster naturally crowds, which visually highlights the "translation moment." Each node is a small album-cover thumbnail. Hover → tooltip with artist/song/tag. Click → detail page.

Miss You node visual emphasis: ~1.4× scale, label below, soft halo — subtle, not declarative.

The 1978 trio (Miss You / Heart of Glass / Jocko Homo) staggered vertically to avoid overlap, with Miss You centered.

Top-right: language toggle `[中 / EN]`, mode selector `▶ 自动`.

Curatorial thesis text from `playlist v0.2.md` shown as a floating bottom-left caption (in active language).

### View B — Track detail (`/track/:position`)

**Phase 1 (stub):** two-column. Left: album cover image + native `<audio controls>`. Right: track metadata + transcript. Bottom: prev / next links.

**Phase 1.5 (target):**

```
Left zone — orbit carousel:
  All 18 cards arranged along a circular path.
  Circle center is off-screen (lower-left); the visible arc curves
  gently from upper-left toward the right edge.

  Current track = right-most position on the orbit.
    - Highest z-index, no rotation, full scale (1.0×)
    - Play/pause button overlaid on cover center (semi-transparent
      circle, ~64px, hover-revealed during playback)
    - Album cover is the play surface

  Adjacent cards (prev, next) along the orbit:
    - ~0.78× scale, slight rotation along orbit tangent,
      light blur (2-3px), opacity 0.7

  Distant cards:
    - ~0.55×, 5-6px blur, opacity 0.4
    - Tail off the upper-left edge of the visible canvas

  Animation:
    - On prev/next, all cards slide one slot along the orbit
      (framer-motion layoutId for shared transitions)
    - Duration ~600-800ms, ease-out

Right zone — transcript:
  Top: position N/18 · year
  Title block: artist / song / album
  Tag line: exhibit_type · mechanism_tags
  Divider
  Body: transcript_${language}, scrollable

Bottom-center:
  ◯  ⬤
  ←  →
  Prev (light outline) — Next (dark fill)
  Asymmetry signals forward momentum

Top-right:
  [中 / EN] toggle, mode indicator (auto / manual)

Top-left:
  ← back to timeline
```

### Mode behavior

| Trigger | Result |
|---|---|
| Timeline → ▶ 自动 | Navigate to `/track/1`, auto mode active |
| Timeline → click any node | Navigate to `/track/N`, manual mode |
| Detail page → toggle mode | Switch state any time |
| Auto mode + audio `ended` event | Slide orbit forward, navigate to next track, autoplay |
| Manual mode + audio `ended` event | Stay; user must click → |
| ← back to timeline | Pause audio, reset to overview |

---

## 6. Bilingual handling

### Data fields

Per track / non-track record:

```json
{
  "transcript_zh": "...",
  "transcript_en": "...",
  "transcript_zh_status": "complete | placeholder | missing",
  "transcript_en_status": "complete | placeholder | missing"
}
```

`placeholder` = a stand-in is rendered (e.g., the v0.2 curatorial annotation pasted in for the 6 new Chinese narrations). `missing` = nothing exists; UI shows the absent-language hint.

### Toggle UX (Phase 1.5)

- Top-right corner `[中 / EN]`
- Click → swap transcript text + font-family + UI labels (no reload)
- `localStorage` persists the choice across sessions
- Default: Chinese

### Fallback when language missing

- Chinese missing → "讲解词建设中"
- English missing → "Curatorial note in progress"

### Metadata stays Latin

Artist names, album titles, song titles, mechanism codes (M1/M2/M3/M4) display in Latin script regardless of UI language. Mechanism full names switch:
- Chinese: `M1 翻译美学`
- English: `M1 Translation Aesthetic`

### Fonts

```css
/* Chinese transcript */
font-family: "Noto Serif SC", "Source Han Serif SC", serif;

/* English transcript */
font-family: "EB Garamond", "Crimson Text", Georgia, serif;

/* Metadata / UI chrome — always Latin */
font-family: "Inter", -apple-system, sans-serif;
```

Museum / academic-publication tone overall.

### English transcript creation

Out of scope for Phase 1. When the time comes, **do not machine-translate**. The narrative voice is too specific (music-critical register, proper nouns, IPA-aware pronunciation hints) for raw GPT output. Use human translation or human-supervised translation.

---

## 7. Phasing

### Phase 1 (this round) — pipeline + stub

**Definition of done:**
- `ncm-cli` confirmed working end-to-end (one test track, full round trip)
- `scripts/fetch-audio.ts` written and run; 18 MP3 + 18 covers in `public/`
- `data/exhibition.json` complete with 18 track records (12 Chinese transcript ready, 6 placeholder) plus opening/interlude/closing entries
- Talking Heads source decision made and applied
- React + Vite shell deployed to Vercel
- From the deployed URL: walk through all 18 tracks, hear audio on each, see cover on each, read Chinese transcript on each
- No orbit, no timeline, no language toggle yet — those are Phase 1.5

### Phase 1.5 — visual upgrade

- Replace stub timeline with horizontal-axis chronological view
- Replace stub detail page with orbit carousel + cover-overlay play/pause
- Add language toggle UI (English content still mostly placeholder)
- Add framer-motion transitions
- Apply font system

### Phase 2 — content

- Write 6 missing Chinese transcripts (Bee Gees, Parliament, RHCP, Tame Impala, Khruangbin, Mk.gee) in the voice of `episode.md`'s existing 12
- Translate / write all 18 English transcripts
- Resolve Talking Heads if not done in Phase 1

### Phase 3 — TTS

- Choose TTS engine (Azure Neural / ElevenLabs / Google Cloud)
- Pick Chinese voice + English voice
- Convert each transcript to SSML (Chinese already SSML in `episode.json`; English requires fresh SSML)
- Synthesize narration audio → `public/narration/`
- Wire detail page to play narration → music in sequence
- Auto mode plays: narration → music → next exhibit → narration → music → ...

---

## 8. Open questions / deferred decisions

1. **Talking Heads source** — pick (a) alternative source, (b) substitute, or (c) silent display. Decide during Phase 1 implementation.
2. **TTS engine** — defer to Phase 3.
3. **English transcript translator** — defer to Phase 2; not a self-translation by Claude.
4. **Auto-mode looping behavior** — when Track 18 finishes in auto mode, does it loop back to Track 1, return to timeline, or stop on the last frame? Not blocking Phase 1; decide at Phase 1.5.
5. **Mobile responsiveness** — assume desktop / wide-screen for exhibition use; mobile is a nice-to-have. Confirm at Phase 1.5.

---

## 9. Risks

- **ncm-cli stability** — if the tool can't reliably produce direct MP3 URLs for all 18 tracks, the entire pipeline approach changes. Phase 1 should validate this on a small sample (3–5 tracks) before committing to all 18.
- **Audio quality consistency** — NetEase serves variable bitrate / codec. Some tracks may sound markedly worse than others. Acceptable for an exhibition context but worth checking.
- **Cover art licensing** — same legal note as audio. Personal / private context only.
- **Talking Heads gap** — the curatorial argument depends on this track. A silent display is a meaningful loss; budget time to actually hunt down a source.

---

## 10. Reference assets in this vault

- `playlists/rolling-stones_some-girls_miss-you.playlist v0.2.md` — 18-track curated playlist, source of truth for tracklist + curatorial annotations
- `episodes/rolling-stones_some-girls_miss-you.episode.md` — human-readable narration script for 12 of the 18 tracks (Phase 1 transcript source)
- `episodes/rolling-stones_some-girls_miss-you.episode.json` — SSML-formatted narration manifest, structurally complete for the original 12 tracks (will be the basis of Phase 3 TTS)
- `Foundations/sonic_cartography_spec_v0.3.md` — overall vault spec governing how maps, episodes, and playlists relate
- `data/nodes/*.json` — global node registry; cross-reference when building `exhibition.json`
