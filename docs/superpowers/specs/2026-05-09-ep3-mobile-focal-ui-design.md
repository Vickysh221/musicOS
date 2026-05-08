# EP3 Mobile Focal UI — Design Spec

**Date:** 2026-05-09
**Branch:** `prototype/min-visual-system-ep3`
**Anchor episode:** EP3 (Riff Genealogy, 18 tracks + opening/interlude/closing = 21 exhibits)

## Purpose

Replace the current EP3 timeline UI with a mobile-first focal-disc layout that expresses
inter-track relations through **inline subtitle pills** and **cumulative vertical reveal**,
matching the user's annotated mockups. This is a prototype-branch experiment validating the
"minimum viable visual system" hypothesis: in 单耳听 / 走神 / 通勤 contexts, three primitives
(focal disc, two-line subtitle with pills, dot-matrix spectrum) carry more meaning than a
6-mode visual grammar.

## Non-goals

- GLSL shader background (deferred — placeholder solid background for now)
- Light-source effect on liquid glass (deferred — flat backdrop-filter is sufficient)
- Cross-episode generalization (this spec scopes to EP3; structural pieces will generalize but
  data wiring assumes EP3 fixtures)
- Replacing or rewriting the exhibition zustand store
- Touching `GlobalPlayer.tsx` audio playback semantics

## States

The UI has exactly two layout phases that the user toggles via the list button:

1. **`vertical-cumulative`** (default, mid-episode)
   - One focal disc centered (the currently playing track)
   - Above the focal disc, a vertical column of all previously-mentioned tracks (the
     `mentionedSet`), stacked with perspective recession
   - Tracks NOT yet mentioned do not render in this layout
2. **`horizontal-carousel`** (toggled on via list button)
   - Apple-style liquid-glass card carousel showing **all 21 exhibits** at once
   - Same 3D transform vocabulary as existing `arcLayout`, parameter-tuned
   - Tap a card → seek to that exhibit, optionally collapse back to vertical

Phase transition reuses the existing framer-motion spring + `CardTransform` interpolation.
No new animation primitive needed.

## Components

### Existing — reused as-is

| File | Reuse |
|---|---|
| `src/components/timeline/TrackCard.tsx` | Card primitive — accepts `CardTransform`, framer-motion |
| `src/components/timeline/timeline-keyframes.ts` | `CardTransform` interface |
| `src/components/timeline/TuningPanel.tsx` | Live param adjustment during dev |
| `src/components/GlobalPlayer.tsx` | Headless audio element + zustand sync |
| `src/store/exhibition.ts` | `playingPosition`, `currentTime`, `duration`, transport actions |
| `src/store/tuning.ts` | TuningParams driving layout functions |
| `useFusionSubtitle` hook (currently in `NowPlayingBar.tsx`) | Sentence-level segments — extract to its own file |

### Existing — replaced or retired

| File | Action |
|---|---|
| `src/components/NowPlayingBar.tsx` | Retire. Its `expanded` list pattern is replaced by `horizontal-carousel` phase. Extract `useFusionSubtitle` into `src/hooks/useFusionSubtitle.ts` first. |
| `src/components/timeline/TimelineScene.tsx` | Keep file, swap layout calls. Add new phases `vertical-cumulative` and `horizontal-carousel` to the phase state machine. |
| `src/components/timeline/presets.ts` | Add `VERTICAL_CUMULATIVE` and `HORIZONTAL_CAROUSEL` presets. Existing presets stay (still used for intro). |

### New components

```
src/components/focal/
  FocalScene.tsx           — top-level container, decides phase, renders discs + subtitle + spectrum + player bar
  FocalDisc.tsx            — one disc (album cover + song/artist label + heart icon if in red-hearts), uses TrackCard underneath
  Subtitle.tsx             — 2-line teleprompter (current + next) with inline pill rendering
  Spectrum.tsx             — dot-matrix Canvas 2D fed by Web Audio AnalyserNode
  PlayerBar.tsx            — liquid-glass bottom bar (progress + transport + list-toggle)
  liquid-glass.css         — shared backdrop-filter styles for player bar / pill / disc label
src/components/focal/layouts/
  verticalCumulativeLayout.ts
  horizontalCarouselLayout.ts
src/hooks/
  useFusionSubtitle.ts     — extracted; returns { current, next } pair instead of single active
  useMentionedSet.ts       — accumulates Set<position> from callback detection across the episode
  useAudioAnalyser.ts      — exposes AnalyserNode bound to GlobalPlayer's audio element
src/data/
  ep3-aliases.ts           — derived alias table { position → string[] } used by callback detection and pill rendering
```

## Data model additions

### Alias table

A static map `Record<number, string[]>` keyed by exhibit `position`. Generated once from
`exhibition-ep3.json` (artist canonical name + song title + common abbreviations). Hand-curated
overrides allowed in the same file. Example entry:

```ts
2: ['Hendrix', 'Jimi Hendrix', 'Purple Haze', 'Hendrix 的']
```

This file is hand-edited rather than generated at runtime so we can curate against
false positives observed during the ep3 prototype HTML run (e.g. "Cream" appearing both as
band reference and as English common noun in adjacent context).

### `mentionedSet`

`Set<number>` of positions that have been mentioned in any played subtitle segment so far in
the current episode session. Lives in zustand (extension to `exhibition.ts`):

- `mentionedSet: Set<number>`
- `addMentioned(position: number): void`
- `resetMentioned(): void` — called when episode changes or on user reset

Population rule: when a subtitle segment becomes active, run `detectCallbacks(segment.text,
currentPosition)` against the alias table; for each hit `p < currentPosition`, call
`addMentioned(p)`. Anchor (position 0 / opening) is excluded from the set since it isn't a
disc. The current track is also excluded (it IS the focal disc, not a mentioned satellite).

Persistence: session-scoped only. No localStorage. Episode change resets.

### Callback detection

Module: `src/lib/callbackDetection.ts`

```ts
export function detectCallbacks(
  text: string,
  currentPosition: number,
  aliases: Record<number, string[]>,
): Set<number>
```

Rules (carried over from prototype HTML, with one addition):

1. Only positions `< currentPosition` can match (no forward references).
2. Anchor (position 0) excluded.
3. Substring match against any alias.
4. **New:** require a callback marker in the sentence — `刚才`, `你刚才`, `之前`, `早些时候`,
   `前面`, OR detection is allowed if the matched alias appears within 8 characters of any
   such marker. Falls back to plain substring if no marker words present in episode (graceful
   degradation). This addresses the 47.5% false-positive rate observed in prototype HTML.

### Pill rendering

`Subtitle.tsx` calls `renderWithPills(text, aliases)` which returns `ReactNode[]` —
text segments interleaved with `<span class="pill" data-position={p}>matched_alias</span>`.
Pill click → seek to that exhibit. Only positions that have already been mentioned (i.e. in
`mentionedSet` or `=== matched in current sentence`) get pill treatment; others render as
plain text. (Future: tap-to-preview without seek — out of scope.)

## Layout functions

### `verticalCumulativeLayout`

Inputs: `mentionedSet`, `currentPosition`, `tuningParams`
Output: `Map<position, CardTransform>` — only entries for positions in
`mentionedSet ∪ {currentPosition}`. All other positions get `opacity: 0` (kept in the map for
clean enter/exit animation).

Geometry:
- Focal disc (currentPosition): `x: 0, y: 0, z: 0, scale: 1`
- Mentioned discs stacked above in chronological order (earliest at top):
  - `y_i = -focalOffsetY - (i+1) * verticalSpacing`
  - `z_i = -i * verticalDepth` (perspective recession upward)
  - `scale_i = 1 - i * verticalShrink`
  - `opacity_i = max(0.35, 1 - i * verticalFade)`

Tuning params (added to `tuning.ts`):
`verticalSpacing` (default 110), `verticalDepth` (default 80), `verticalShrink` (default
0.08), `verticalFade` (default 0.12), `focalOffsetY` (default 60).

### `horizontalCarouselLayout`

Same shape as existing `arcLayout` but with a different center-anchor and stronger horizontal
spread. All 21 exhibits render. Apple-card visual treatment via CSS (rounded corners, liquid
glass). Reuses `arcSpacing` / `arcDepth` / `arcRotStep` tuning params, optionally adds a
`carouselScale` (default 0.85) to make cards smaller than the vertical focal disc.

## Subtitle two-line layout

Source: `useFusionSubtitle(fusionUrl)` returns `FusionSubtitleSegment[]`. Add a derived hook
`useCurrentAndNext(segments, currentTime)` returning `{ current, next, currentIdx }`:
- `current`: segment where `start <= t < end`, or null
- `next`: segments[currentIdx + 1] or null

Render:
```
[Current sentence — full opacity, full size, pills active]
[Next sentence — opacity 0.5, size 0.85em, left-aligned, no pills]
```

Spring transition between segments: ~300ms ease-out fade + small y-translate. When `next`
becomes `current`, the next-line slides up into the current-line position.

If no fusion subtitle exists for the playing exhibit (opening/closing/interlude), fall back
to the existing `splitSections` proportional estimate. Pills disabled in fallback mode (no
sentence-level alignment).

## Spectrum

`Spectrum.tsx` props: `audioElement: HTMLAudioElement | null`. Internally:

1. On mount + when `audioElement` changes, create or reuse a singleton `AudioContext` +
   `MediaElementSource` + `AnalyserNode` (fftSize: 128 → 64 frequency bins).
2. `requestAnimationFrame` loop reads `analyser.getByteFrequencyData(buf)`.
3. Canvas 2D draws a dot matrix: 16 columns × 6 rows (96 dots), each dot's brightness driven
   by `buf[col * 2]` mapped to one of 4 alpha levels. Dots that are "off" still render as
   faint guides (opacity 0.06) to maintain matrix presence.

Singleton pattern needed because `MediaElementSource` can only be created once per audio
element. Expose `getOrCreateAnalyser(audio: HTMLAudioElement): AnalyserNode` from
`useAudioAnalyser`.

`GlobalPlayer.tsx` change: forward audio ref via a ref-callback exposed through a new
`useAudioElement()` hook (wraps a module-level ref). No semantic playback changes.

## Player bar (liquid glass)

Bottom-fixed bar with:
- Track title + artist (left, ellipsized)
- Transport: prev / play-pause / next
- Progress bar (thin, scrubbable)
- List-toggle button → switches `phase` between `vertical-cumulative` and
  `horizontal-carousel`

Liquid glass via:
```css
backdrop-filter: blur(28px) saturate(160%);
background: rgba(255,255,255,0.08);
border: 1px solid rgba(255,255,255,0.12);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 40px rgba(0,0,0,0.35);
```

Same treatment applied to subtitle pills (smaller blur radius) and disc-overlay label.

## Phase state machine

Extend the existing intro-phase logic in `TimelineScene.tsx` (or move into `FocalScene.tsx`):

```
intro1 → intro3 (rest) → vertical-cumulative ⇄ horizontal-carousel
```

Transitions:
- `intro3 → vertical-cumulative` on first play
- `vertical-cumulative ⇄ horizontal-carousel` on list-button toggle
- Any tap on a horizontal-carousel card → seek + return to `vertical-cumulative`

Spring params (reuse `DEFAULT_TRANSITION` from `TrackCard.tsx`): stiffness 220, damping 26,
mass 0.6. Phase change duration ≈ 800-1000ms perceived.

## Routing / wiring

`FocalScene` mounts as a sibling of `GlobalPlayer` at the EP3 page root. Replaces the current
`TimelineScene` + `NowPlayingBar` pair on the EP3 route only. Other episodes continue to use
the existing UI until we decide to roll forward.

## Testing & validation

Manual on prototype branch:
- All 21 exhibits play through end-to-end with vertical-cumulative active
- `mentionedSet` grows monotonically; tracks appear with the correct callback timing
- Pill highlight aligns with subtitle text where alias matches
- Toggle to horizontal-carousel shows all 21, tap-seek works, returns to vertical
- Spectrum responds to playing audio, decays to faint guide grid on pause
- No console errors on phase transition or episode end
- 30s screen-record reviewed at 0.25× to validate transition smoothness

No automated tests for this prototype iteration. Visual correctness is the bar.

## Open decisions deferred to implementation

- Exact alias list curation (will iterate as false-positives surface)
- Whether `mentionedSet` persists across cross-fade (interlude) or resets — start with
  persists, revise if confusing
- Carousel re-entry behavior on seek: snap or animate — start with animate

## File-level execution order

(Detailed plan generated by writing-plans skill — this section just signals direction.)

1. Extract `useFusionSubtitle` to `src/hooks/`
2. Add `mentionedSet` slice to `exhibition.ts`
3. Add alias table + `callbackDetection.ts`
4. Build `Subtitle.tsx` with pills (driveable in isolation via dev page or storybook-lite)
5. Build `Spectrum.tsx` + `useAudioAnalyser.ts`
6. Build `verticalCumulativeLayout` + `horizontalCarouselLayout`
7. Build `FocalDisc.tsx` + `FocalScene.tsx` (assemble)
8. Build `PlayerBar.tsx` + liquid-glass styles
9. Wire to EP3 route, retire `NowPlayingBar` from EP3 only
10. Manual play-through, tune params via `TuningPanel`
