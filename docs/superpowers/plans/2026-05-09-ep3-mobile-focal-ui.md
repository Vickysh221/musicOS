# EP3 Mobile Focal UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the mobile-first focal UI for EP3 — focal disc + 2-line subtitle with inline pills + dot-matrix spectrum + vertical-cumulative ⇄ horizontal-carousel toggle, on the `prototype/min-visual-system-ep3` branch.

**Architecture:** Reuse the existing exhibition zustand store, `GlobalPlayer` audio element, and `framer-motion` `CardTransform` interpolation. Add new components under `src/components/focal/`, two new layout functions, three new hooks, and a new alias-data module. Mount via a new `/ep3-focal` route (or replace `/ep3` with a feature flag — see Task 13). The existing `/ep1`, `/ep2`, `/ep4` routes stay untouched.

**Tech Stack:** React 18 + TypeScript + Vite, framer-motion, zustand, Web Audio API + Canvas 2D, CSS `backdrop-filter`.

**Spec:** `docs/superpowers/specs/2026-05-09-ep3-mobile-focal-ui-design.md`

**Testing approach:** Per the spec, this is a visual prototype iteration with no automated tests. Each task ends with `pnpm tsc --noEmit` (typecheck) and a manual browser smoke verification step. Granular Vitest tests are added only for the two pure-logic modules (`callbackDetection.ts`, `verticalCumulativeLayout.ts`) where logic is non-trivial and visual inspection won't catch regressions.

**Working directory:** `/Users/vickyshou/Documents/MusicOS/musicos-exhibition` (run `pnpm` commands from here).

---

## Task 1: Extract `useFusionSubtitle` to its own hook file

**Files:**
- Create: `musicos-exhibition/src/hooks/useFusionSubtitle.ts`
- Modify: `musicos-exhibition/src/components/NowPlayingBar.tsx` (remove the inline copy and import)

The hook currently lives inside `NowPlayingBar.tsx` (lines 85-114). Move it verbatim so other components can use it.

- [ ] **Step 1: Create the hook file**

Create `musicos-exhibition/src/hooks/useFusionSubtitle.ts`:

```ts
import { useEffect, useState } from 'react';

export interface FusionSubtitleSegment {
  text: string;
  start: number;
  end: number;
}

/**
 * Sentence-level segments emitted by the fusion pipeline (MiniMax-derived,
 * already offset to the fusion-output timeline). Returns null while the
 * fetch is in flight or if no sidecar exists.
 */
export function useFusionSubtitle(
  fusionUrl: string | null | undefined,
): FusionSubtitleSegment[] | null {
  const [segments, setSegments] = useState<FusionSubtitleSegment[] | null>(null);
  useEffect(() => {
    setSegments(null);
    if (!fusionUrl || !fusionUrl.endsWith('.mp3')) return;
    const subUrl = fusionUrl.slice(0, -4) + '.subtitle.json';
    let cancelled = false;
    fetch(subUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: FusionSubtitleSegment[] | null) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setSegments(data);
      })
      .catch(() => {
        /* fall back silently */
      });
    return () => {
      cancelled = true;
    };
  }, [fusionUrl]);
  return segments;
}
```

- [ ] **Step 2: Update `NowPlayingBar.tsx` to import**

In `musicos-exhibition/src/components/NowPlayingBar.tsx`:
- Delete lines 85-114 (the inline `FusionSubtitleSegment` interface + `useFusionSubtitle` function).
- Add at the top (with other imports): `import { useFusionSubtitle, type FusionSubtitleSegment } from '../hooks/useFusionSubtitle.js';`

- [ ] **Step 3: Typecheck**

Run from `musicos-exhibition/`: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Smoke-test in browser**

Run `pnpm dev` from `musicos-exhibition/`. Navigate to `/ep3`. Play any track. Confirm `NowPlayingBar` still shows transcript text and the expand-list still works. (No visual change expected.)

- [ ] **Step 5: Commit**

```bash
git add musicos-exhibition/src/hooks/useFusionSubtitle.ts musicos-exhibition/src/components/NowPlayingBar.tsx
git commit -m "refactor: extract useFusionSubtitle hook to its own file"
```

---

## Task 2: Add `mentionedSet` slice to exhibition store

**Files:**
- Modify: `musicos-exhibition/src/store/exhibition.ts`

- [ ] **Step 1: Add state and actions**

In `musicos-exhibition/src/store/exhibition.ts`, in the `ExhibitionStore` interface (after `seekRequest`):

```ts
  mentionedSet: ReadonlySet<number>;
  addMentioned: (positions: number[]) => void;
  resetMentioned: () => void;
```

In the `create<ExhibitionStore>` body (after `seekRequest: null,`):

```ts
  mentionedSet: new Set<number>(),
  addMentioned: (positions) => {
    if (positions.length === 0) return;
    const cur = get().mentionedSet;
    let changed = false;
    const next = new Set(cur);
    for (const p of positions) {
      if (!next.has(p)) {
        next.add(p);
        changed = true;
      }
    }
    if (changed) set({ mentionedSet: next });
  },
  resetMentioned: () => set({ mentionedSet: new Set<number>() }),
```

In the existing `load` action, after `set({ exhibits: [], episodeId, ... })`, add `mentionedSet: new Set<number>(),` to the same `set` call. Also in the `stop` action, add `mentionedSet: new Set<number>(),` to its `set` call.

- [ ] **Step 2: Typecheck**

`pnpm tsc --noEmit` — expect no errors.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/src/store/exhibition.ts
git commit -m "feat(store): add mentionedSet slice for cumulative reveal"
```

---

## Task 3: Generate EP3 alias table

**Files:**
- Create: `musicos-exhibition/src/data/ep3-aliases.ts`

This is the alias map used by callback detection and inline-pill rendering. Source data is `musicos-exhibition/public/data/exhibition-ep3.json` (artist + song fields per exhibit). We hand-author rather than runtime-derive so we can curate against false positives.

- [ ] **Step 1: Read the EP3 exhibit list to confirm artist/song values**

Run: `cat musicos-exhibition/public/data/exhibition-ep3.json | python3 -c "import json,sys; d=json.load(sys.stdin); [print(e['position'], e.get('artist',''), '—', e.get('song','')) for e in d['exhibits'] if e['kind']=='track']"`

Use the printed list (artist + song per position) as the canonical source for entries below.

- [ ] **Step 2: Create the alias file**

Create `musicos-exhibition/src/data/ep3-aliases.ts`:

```ts
/**
 * Alias table for callback detection in EP3 narration.
 *
 * Each entry maps an exhibit position to a list of substrings that, when
 * found in subtitle text, indicate a reference to that track. Curated
 * against false positives observed in the prototype-min-visual.html run.
 */
export const EP3_ALIASES: Record<number, string[]> = {
  1: ['Cream', 'Sunshine of Your Love', 'Sunshine'],
  2: ['Hendrix', 'Jimi Hendrix', 'Purple Haze', 'Hendrix 的'],
  3: ['Black Sabbath', 'Sabbath', 'Iommi'],
  4: ['War Pigs', 'War Pigs 的'],
  5: ['Iron Man', 'Iron Man 的'],
  6: ['Paranoid'],
  7: ['Metallica', 'Master of Puppets'],
  8: ['Deep Purple', 'Smoke on the Water', 'Smoke on the Water 的'],
  9: ['Led Zeppelin', 'Zeppelin', 'Immigrant Song'],
  10: ['Aerosmith', 'Walk This Way'],
  11: ['AC/DC', 'AC-DC', 'Back in Black'],
  12: ['Ozzy', 'Crazy Train'],
  13: ['Iron Maiden', 'Maiden', 'The Trooper'],
  14: ['Slayer', 'Raining Blood'],
  15: ['Megadeth', 'Holy Wars'],
  16: ['Pantera', 'Walk'],
  17: ['Tool', 'Schism'],
  18: ['System of a Down', 'Chop Suey'],
};
```

(Adjust entries to match the actual EP3 exhibit list from Step 1 — names above are placeholders if the EP3 lineup differs. Verify against the JSON before committing. The aliases include English title + 中文 narrator's idiomatic forms like `Hendrix 的`.)

- [ ] **Step 3: Typecheck**

`pnpm tsc --noEmit` — expect no errors.

- [ ] **Step 4: Commit**

```bash
git add musicos-exhibition/src/data/ep3-aliases.ts
git commit -m "feat(data): add EP3 alias table for callback detection"
```

---

## Task 4: Callback detection module + Vitest test

**Files:**
- Create: `musicos-exhibition/src/lib/callbackDetection.ts`
- Create: `musicos-exhibition/src/lib/callbackDetection.test.ts`

- [ ] **Step 1: Confirm Vitest is present**

Check `musicos-exhibition/package.json` for `vitest`. Run: `cat musicos-exhibition/package.json | grep -E '"(vitest|test)"'`. If `vitest` is not present, install: `pnpm add -D vitest @vitest/ui`. Add `"test": "vitest"` to scripts if absent.

- [ ] **Step 2: Write the failing test**

Create `musicos-exhibition/src/lib/callbackDetection.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { detectCallbacks } from './callbackDetection.js';

const aliases = {
  1: ['Cream', 'Sunshine of Your Love'],
  2: ['Hendrix', 'Purple Haze'],
  3: ['Black Sabbath', 'Sabbath'],
};

describe('detectCallbacks', () => {
  it('returns empty when no alias matches', () => {
    expect(detectCallbacks('一段普通的描述', 5, aliases).size).toBe(0);
  });

  it('matches when callback marker is present near alias', () => {
    const r = detectCallbacks('你刚才在 Cream 那里听到的低音', 5, aliases);
    expect(r.has(1)).toBe(true);
  });

  it('skips alias matches without any callback marker', () => {
    // Plain mention, no marker word — should not pill.
    const r = detectCallbacks('Cream 的吉他手是 Clapton', 5, aliases);
    expect(r.has(1)).toBe(false);
  });

  it('does not match positions >= currentPosition', () => {
    const r = detectCallbacks('你刚才在 Black Sabbath 那里', 3, aliases);
    expect(r.has(3)).toBe(false);
  });

  it('does not match position 0 (anchor opening)', () => {
    const aliasesWithZero = { ...aliases, 0: ['opening'] };
    const r = detectCallbacks('刚才 opening 提到', 5, aliasesWithZero);
    expect(r.has(0)).toBe(false);
  });

  it('falls back to plain substring when sentence has no markers anywhere', () => {
    // When the FULL sentence has no marker word, allow plain match (graceful
    // degradation) — used when we still want any signal.
    // This is the "no marker present in episode" fallback noted in the spec.
    // For unit-test purposes we simulate by passing allowPlain = true.
    const r = detectCallbacks('Cream 出场', 5, aliases, { allowPlain: true });
    expect(r.has(1)).toBe(true);
  });
});
```

- [ ] **Step 3: Run test, expect failure**

Run from `musicos-exhibition/`: `pnpm vitest run src/lib/callbackDetection.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the module**

Create `musicos-exhibition/src/lib/callbackDetection.ts`:

```ts
const CALLBACK_MARKERS = ['你刚才', '刚才', '之前', '早些时候', '前面', '上一首', '上一个'];
const PROXIMITY_CHARS = 8;

export interface DetectOptions {
  /** Allow plain substring match when no marker is anywhere in the sentence. */
  allowPlain?: boolean;
}

/**
 * Returns the set of exhibit positions referenced as callbacks in `text`.
 *
 * Rules:
 *  - Only positions strictly less than `currentPosition`.
 *  - Position 0 (opening) excluded.
 *  - Alias must appear within PROXIMITY_CHARS chars of a callback marker.
 *  - If no marker is in the sentence and options.allowPlain is true, fall back
 *    to plain substring (graceful degradation).
 */
export function detectCallbacks(
  text: string,
  currentPosition: number,
  aliases: Record<number, string[]>,
  options: DetectOptions = {},
): Set<number> {
  const out = new Set<number>();
  const markerHits: number[] = [];
  for (const m of CALLBACK_MARKERS) {
    let i = text.indexOf(m);
    while (i !== -1) {
      markerHits.push(i);
      i = text.indexOf(m, i + 1);
    }
  }
  const hasMarker = markerHits.length > 0;
  const allowPlain = options.allowPlain === true && !hasMarker;

  for (const [posStr, aliasList] of Object.entries(aliases)) {
    const pos = Number(posStr);
    if (pos === 0) continue;
    if (pos >= currentPosition) continue;
    for (const a of aliasList) {
      const idx = text.indexOf(a);
      if (idx === -1) continue;
      if (hasMarker) {
        const near = markerHits.some((m) => Math.abs(m - idx) <= PROXIMITY_CHARS + a.length);
        if (near) {
          out.add(pos);
          break;
        }
      } else if (allowPlain) {
        out.add(pos);
        break;
      }
    }
  }
  return out;
}
```

- [ ] **Step 5: Run test, expect pass**

`pnpm vitest run src/lib/callbackDetection.test.ts` — expect all pass.

- [ ] **Step 6: Commit**

```bash
git add musicos-exhibition/src/lib/callbackDetection.ts musicos-exhibition/src/lib/callbackDetection.test.ts
git commit -m "feat(lib): callback detection with marker proximity + plain fallback"
```

---

## Task 5: Hook — `useCurrentAndNext`

**Files:**
- Create: `musicos-exhibition/src/hooks/useCurrentAndNext.ts`

Pulls a `{ current, next, currentIdx }` window from `FusionSubtitleSegment[]` based on `currentTime`.

- [ ] **Step 1: Implement**

Create `musicos-exhibition/src/hooks/useCurrentAndNext.ts`:

```ts
import { useMemo } from 'react';
import type { FusionSubtitleSegment } from './useFusionSubtitle.js';

export interface CurrentAndNext {
  current: FusionSubtitleSegment | null;
  next: FusionSubtitleSegment | null;
  currentIdx: number;
}

export function useCurrentAndNext(
  segments: FusionSubtitleSegment[] | null,
  currentTime: number,
): CurrentAndNext {
  return useMemo(() => {
    if (!segments || segments.length === 0) {
      return { current: null, next: null, currentIdx: -1 };
    }
    let idx = -1;
    for (let i = 0; i < segments.length; i++) {
      if (currentTime >= segments[i].start && currentTime < segments[i].end) {
        idx = i;
        break;
      }
    }
    // If we're between segments (gap), keep the most recently passed segment
    // as "current" so the line doesn't blank out.
    if (idx === -1) {
      for (let i = segments.length - 1; i >= 0; i--) {
        if (currentTime >= segments[i].start) {
          idx = i;
          break;
        }
      }
    }
    if (idx === -1) {
      return { current: null, next: segments[0] ?? null, currentIdx: -1 };
    }
    return {
      current: segments[idx],
      next: segments[idx + 1] ?? null,
      currentIdx: idx,
    };
  }, [segments, currentTime]);
}
```

- [ ] **Step 2: Typecheck**

`pnpm tsc --noEmit` — no errors.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/src/hooks/useCurrentAndNext.ts
git commit -m "feat(hooks): useCurrentAndNext for 2-line subtitle window"
```

---

## Task 6: Hook — `useAudioAnalyser` + GlobalPlayer ref export

**Files:**
- Create: `musicos-exhibition/src/hooks/useAudioAnalyser.ts`
- Modify: `musicos-exhibition/src/components/GlobalPlayer.tsx`

Singleton `AudioContext` + `MediaElementSource` keyed by audio element identity (you can only create one `MediaElementSource` per element).

- [ ] **Step 1: Add module-level audio element ref + accessor**

Create `musicos-exhibition/src/hooks/useAudioAnalyser.ts`:

```ts
import { useEffect, useState } from 'react';

let sharedAudioEl: HTMLAudioElement | null = null;
const listeners = new Set<(el: HTMLAudioElement | null) => void>();

export function setSharedAudioElement(el: HTMLAudioElement | null) {
  if (sharedAudioEl === el) return;
  sharedAudioEl = el;
  for (const fn of listeners) fn(el);
}

export function useSharedAudioElement(): HTMLAudioElement | null {
  const [el, setEl] = useState<HTMLAudioElement | null>(sharedAudioEl);
  useEffect(() => {
    listeners.add(setEl);
    setEl(sharedAudioEl);
    return () => {
      listeners.delete(setEl);
    };
  }, []);
  return el;
}

let analyserCtx: AudioContext | null = null;
let analyserSource: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let analyserBoundEl: HTMLAudioElement | null = null;

/**
 * Returns a singleton AnalyserNode bound to the given audio element.
 * Reuses the same MediaElementSource — the Web Audio API forbids creating
 * a second source for the same element.
 */
export function getOrCreateAnalyser(audio: HTMLAudioElement): AnalyserNode | null {
  if (analyserBoundEl === audio && analyserNode) return analyserNode;
  if (analyserBoundEl && analyserBoundEl !== audio) {
    // Different element — we cannot rebind a MediaElementSource. The previous
    // analyser stays attached to the old element (which is a teardown case).
    return null;
  }
  try {
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!analyserCtx) analyserCtx = new Ctor();
    if (!analyserSource) analyserSource = analyserCtx.createMediaElementSource(audio);
    if (!analyserNode) {
      analyserNode = analyserCtx.createAnalyser();
      analyserNode.fftSize = 128;
      analyserSource.connect(analyserNode);
      analyserNode.connect(analyserCtx.destination);
    }
    analyserBoundEl = audio;
    return analyserNode;
  } catch {
    return null;
  }
}

export function resumeAudioContext() {
  if (analyserCtx && analyserCtx.state === 'suspended') {
    void analyserCtx.resume();
  }
}
```

- [ ] **Step 2: Wire `GlobalPlayer.tsx` to publish its audio element**

In `musicos-exhibition/src/components/GlobalPlayer.tsx`, add an import:

```ts
import { setSharedAudioElement, resumeAudioContext } from '../hooks/useAudioAnalyser.js';
```

In the component body, replace `const audioRef = useRef<HTMLAudioElement | null>(null);` with:

```ts
const audioRef = useRef<HTMLAudioElement | null>(null);

useEffect(() => {
  setSharedAudioElement(audioRef.current);
  return () => setSharedAudioElement(null);
}, []);
```

In the existing play `useEffect` (the one that calls `el.play()`), call `resumeAudioContext()` immediately before `void el.play().catch(...)`.

- [ ] **Step 3: Typecheck**

`pnpm tsc --noEmit` — no errors.

- [ ] **Step 4: Smoke-test**

Run `pnpm dev`, navigate to `/ep3`, play a track, confirm audio still plays. (No visible change — only behind-the-scenes wiring.)

- [ ] **Step 5: Commit**

```bash
git add musicos-exhibition/src/hooks/useAudioAnalyser.ts musicos-exhibition/src/components/GlobalPlayer.tsx
git commit -m "feat(hooks): expose shared audio element + AnalyserNode singleton"
```

---

## Task 7: Vertical-cumulative layout function + Vitest test

**Files:**
- Create: `musicos-exhibition/src/components/focal/layouts/verticalCumulativeLayout.ts`
- Create: `musicos-exhibition/src/components/focal/layouts/verticalCumulativeLayout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `musicos-exhibition/src/components/focal/layouts/verticalCumulativeLayout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { verticalCumulativeLayout } from './verticalCumulativeLayout.js';

const params = {
  verticalSpacing: 100,
  verticalDepth: 50,
  verticalShrink: 0.1,
  verticalFade: 0.15,
  focalOffsetY: 60,
};

describe('verticalCumulativeLayout', () => {
  it('places focal disc at origin', () => {
    const m = verticalCumulativeLayout({
      mentioned: [],
      currentPosition: 5,
      allPositions: [0, 1, 2, 3, 4, 5, 6, 7],
      params,
    });
    const focal = m.get(5);
    expect(focal).toBeDefined();
    expect(focal!.x).toBe(0);
    expect(focal!.y).toBe(0);
    expect(focal!.scale).toBe(1);
    expect(focal!.opacity).toBe(1);
  });

  it('stacks mentioned positions above focal in order', () => {
    const m = verticalCumulativeLayout({
      mentioned: [1, 3], // earliest first
      currentPosition: 5,
      allPositions: [0, 1, 2, 3, 4, 5, 6, 7],
      params,
    });
    const top = m.get(1)!;
    const mid = m.get(3)!;
    expect(top.y).toBeLessThan(mid.y); // top is more negative (higher up)
    expect(top.scale).toBeLessThan(mid.scale); // further-back is smaller
  });

  it('hides positions not in mentioned and not focal', () => {
    const m = verticalCumulativeLayout({
      mentioned: [1],
      currentPosition: 5,
      allPositions: [0, 1, 2, 3, 4, 5, 6, 7],
      params,
    });
    expect(m.get(2)!.opacity).toBe(0);
    expect(m.get(7)!.opacity).toBe(0);
  });

  it('clamps opacity floor for distant mentioned discs', () => {
    const m = verticalCumulativeLayout({
      mentioned: [1, 2, 3, 4],
      currentPosition: 10,
      allPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      params,
    });
    for (const p of [1, 2, 3, 4]) {
      expect(m.get(p)!.opacity).toBeGreaterThanOrEqual(0.35);
    }
  });
});
```

- [ ] **Step 2: Run test, expect failure**

`pnpm vitest run src/components/focal/layouts/verticalCumulativeLayout.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `musicos-exhibition/src/components/focal/layouts/verticalCumulativeLayout.ts`:

```ts
import type { CardTransform } from '../../timeline/timeline-keyframes.js';

export interface VerticalCumulativeParams {
  verticalSpacing: number;
  verticalDepth: number;
  verticalShrink: number;
  verticalFade: number;
  focalOffsetY: number;
}

export interface VerticalCumulativeArgs {
  mentioned: number[]; // sorted ascending (chronological)
  currentPosition: number;
  allPositions: number[]; // every renderable position (used to emit hidden entries)
  params: VerticalCumulativeParams;
}

const HIDDEN: CardTransform = {
  x: 0, y: 0, z: -400, rotX: 0, rotY: 0, rotZ: 0, opacity: 0, scale: 0.6,
};

/**
 * Vertical cumulative layout: focal disc at origin, mentioned discs stacked
 * upward in chronological order with perspective recession. Positions outside
 * `mentioned ∪ {currentPosition}` get a hidden transform so framer-motion can
 * animate them in/out cleanly.
 */
export function verticalCumulativeLayout(args: VerticalCumulativeArgs): Map<number, CardTransform> {
  const { mentioned, currentPosition, allPositions, params } = args;
  const out = new Map<number, CardTransform>();
  for (const p of allPositions) {
    if (p === currentPosition) {
      out.set(p, { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, opacity: 1, scale: 1 });
      continue;
    }
    const idxFromBottom = mentioned.indexOf(p);
    if (idxFromBottom === -1) {
      out.set(p, HIDDEN);
      continue;
    }
    // mentioned[0] is earliest. We want earliest at top, so distance from focal
    // grows as we go backward in `mentioned`.
    const i = mentioned.length - idxFromBottom; // 1..mentioned.length
    out.set(p, {
      x: 0,
      y: -params.focalOffsetY - i * params.verticalSpacing,
      z: -i * params.verticalDepth,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      opacity: Math.max(0.35, 1 - i * params.verticalFade),
      scale: Math.max(0.4, 1 - i * params.verticalShrink),
    });
  }
  return out;
}
```

- [ ] **Step 4: Run test, expect pass**

`pnpm vitest run src/components/focal/layouts/verticalCumulativeLayout.test.ts`

- [ ] **Step 5: Commit**

```bash
git add musicos-exhibition/src/components/focal/layouts/verticalCumulativeLayout.ts musicos-exhibition/src/components/focal/layouts/verticalCumulativeLayout.test.ts
git commit -m "feat(focal): vertical-cumulative layout with perspective recession"
```

---

## Task 8: Horizontal-carousel layout function

**Files:**
- Create: `musicos-exhibition/src/components/focal/layouts/horizontalCarouselLayout.ts`

Reuses the same shape as `arcLayout` from `timeline-keyframes.ts`, but explicitly targeting all positions and with a smaller default scale.

- [ ] **Step 1: Implement**

Create `musicos-exhibition/src/components/focal/layouts/horizontalCarouselLayout.ts`:

```ts
import type { CardTransform } from '../../timeline/timeline-keyframes.js';

export interface HorizontalCarouselParams {
  arcSpacing: number;
  arcDepth: number;
  arcRotStep: number;
  carouselScale: number;
}

export interface HorizontalCarouselArgs {
  allPositions: number[];
  currentPosition: number;
  params: HorizontalCarouselParams;
}

/**
 * Horizontal carousel layout — all positions visible, parabolic z-recession
 * around the playing card. Same vocabulary as arcLayout but applied to the
 * full episode and tunable to a smaller scale.
 */
export function horizontalCarouselLayout(args: HorizontalCarouselArgs): Map<number, CardTransform> {
  const { allPositions, currentPosition, params } = args;
  const out = new Map<number, CardTransform>();
  const sorted = [...allPositions].sort((a, b) => a - b);
  const playingIdx = sorted.indexOf(currentPosition);
  const halfSpan = Math.max(1, Math.floor(sorted.length / 2));
  sorted.forEach((p, i) => {
    const rel = i - (playingIdx === -1 ? 0 : playingIdx);
    const x = rel * params.arcSpacing;
    const z = -params.arcDepth * rel * rel;
    const rotY = -rel * params.arcRotStep;
    const opacity = Math.max(0.15, 1 - (Math.abs(rel) / halfSpan) * 0.7);
    out.set(p, {
      x,
      y: 0,
      z,
      rotX: 0,
      rotY,
      rotZ: 0,
      opacity,
      scale: params.carouselScale,
    });
  });
  return out;
}
```

- [ ] **Step 2: Typecheck**

`pnpm tsc --noEmit` — no errors.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/src/components/focal/layouts/horizontalCarouselLayout.ts
git commit -m "feat(focal): horizontal-carousel layout for full-episode view"
```

---

## Task 9: Add focal-specific tuning params

**Files:**
- Modify: `musicos-exhibition/src/store/tuning.ts`

- [ ] **Step 1: Extend `TuningParams` and defaults**

In `musicos-exhibition/src/store/tuning.ts`, in the `TuningParams` interface, add at the end (before `panelOpen`):

```ts
  // Focal scene — vertical cumulative
  verticalSpacing: number;
  verticalDepth: number;
  verticalShrink: number;
  verticalFade: number;
  focalOffsetY: number;
  // Focal scene — horizontal carousel
  carouselScale: number;
```

In `TUNING_DEFAULTS`, add (before `panelOpen`):

```ts
  verticalSpacing: 110,
  verticalDepth: 80,
  verticalShrink: 0.08,
  verticalFade: 0.12,
  focalOffsetY: 60,
  carouselScale: 0.85,
```

Bump the persist key to `musicos-tuning-v2` so existing users get the new defaults rather than a partial persisted shape:

```ts
{ name: 'musicos-tuning-v2' },
```

- [ ] **Step 2: Typecheck**

`pnpm tsc --noEmit` — no errors.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/src/store/tuning.ts
git commit -m "feat(tuning): add focal scene tuning params (vertical + carousel)"
```

---

## Task 10: `Subtitle.tsx` — 2-line teleprompter with inline pills

**Files:**
- Create: `musicos-exhibition/src/components/focal/Subtitle.tsx`
- Create: `musicos-exhibition/src/components/focal/subtitle.css`

- [ ] **Step 1: Implement the pill renderer**

Create `musicos-exhibition/src/components/focal/Subtitle.tsx`:

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import './subtitle.css';

interface SubtitleProps {
  current: string | null;
  next: string | null;
  /** Position → aliases. Pills only render for positions in `mentionedSet`. */
  aliases: Record<number, string[]>;
  mentionedSet: ReadonlySet<number>;
  onPillClick?: (position: number) => void;
}

interface PillSegment {
  kind: 'pill';
  position: number;
  text: string;
}
interface PlainSegment {
  kind: 'plain';
  text: string;
}
type Segment = PillSegment | PlainSegment;

/**
 * Walks `text` left-to-right, greedily wrapping the longest matching alias
 * for any pill-eligible position into a <span class="pill">.
 */
function segmentText(
  text: string,
  aliases: Record<number, string[]>,
  eligible: ReadonlySet<number>,
): Segment[] {
  if (!text) return [];
  const candidates: { pos: number; alias: string }[] = [];
  for (const pos of eligible) {
    const list = aliases[pos];
    if (!list) continue;
    for (const a of list) candidates.push({ pos, alias: a });
  }
  // Prefer longer aliases first (so "Black Sabbath" wins over "Sabbath").
  candidates.sort((a, b) => b.alias.length - a.alias.length);

  const segments: Segment[] = [];
  let i = 0;
  while (i < text.length) {
    let matched: { pos: number; alias: string } | null = null;
    for (const c of candidates) {
      if (text.startsWith(c.alias, i)) {
        matched = c;
        break;
      }
    }
    if (matched) {
      segments.push({ kind: 'pill', position: matched.pos, text: matched.alias });
      i += matched.alias.length;
    } else {
      const last = segments[segments.length - 1];
      if (last && last.kind === 'plain') last.text += text[i];
      else segments.push({ kind: 'plain', text: text[i] });
      i++;
    }
  }
  return segments;
}

export function Subtitle({ current, next, aliases, mentionedSet, onPillClick }: SubtitleProps) {
  const currentSegs = segmentText(current ?? '', aliases, mentionedSet);

  return (
    <div className="subtitle">
      <div className="subtitle__current">
        <AnimatePresence mode="wait">
          <motion.div
            key={current ?? '__empty__'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {currentSegs.map((s, i) =>
              s.kind === 'pill' ? (
                <button
                  key={i}
                  type="button"
                  className="subtitle__pill"
                  onClick={() => onPillClick?.(s.position)}
                  data-position={s.position}
                >
                  {s.text}
                </button>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="subtitle__next" aria-hidden="true">
        {next}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CSS**

Create `musicos-exhibition/src/components/focal/subtitle.css`:

```css
.subtitle {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  line-height: 1.45;
  text-align: left;
}
.subtitle__current {
  font-size: 16px;
  opacity: 1;
}
.subtitle__next {
  font-size: 13.6px; /* 0.85em of current */
  opacity: 0.5;
  text-align: left;
  min-height: 1.4em;
}
.subtitle__pill {
  display: inline;
  padding: 1px 8px;
  margin: 0 2px;
  border: 0;
  border-radius: 999px;
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: background 0.15s ease;
}
.subtitle__pill:hover,
.subtitle__pill:focus-visible {
  background: rgba(255, 255, 255, 0.18);
}
```

- [ ] **Step 3: Typecheck**

`pnpm tsc --noEmit` — no errors.

- [ ] **Step 4: Commit**

```bash
git add musicos-exhibition/src/components/focal/Subtitle.tsx musicos-exhibition/src/components/focal/subtitle.css
git commit -m "feat(focal): 2-line subtitle component with inline pills"
```

---

## Task 11: `Spectrum.tsx` — dot-matrix Web Audio visualizer

**Files:**
- Create: `musicos-exhibition/src/components/focal/Spectrum.tsx`
- Create: `musicos-exhibition/src/components/focal/spectrum.css`

- [ ] **Step 1: Implement**

Create `musicos-exhibition/src/components/focal/Spectrum.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { getOrCreateAnalyser, useSharedAudioElement } from '../../hooks/useAudioAnalyser.js';
import './spectrum.css';

const COLS = 16;
const ROWS = 6;
const DOT_RADIUS = 2.4;
const DOT_GAP_X = 12;
const DOT_GAP_Y = 10;

export function Spectrum() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audio = useSharedAudioElement();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hi-DPI sizing.
    const dpr = window.devicePixelRatio || 1;
    const width = COLS * DOT_GAP_X;
    const height = ROWS * DOT_GAP_Y;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const analyser = audio ? getOrCreateAnalyser(audio) : null;
    const buf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    let rafId = 0;
    function draw() {
      if (analyser && buf) analyser.getByteFrequencyData(buf);
      ctx!.clearRect(0, 0, width, height);
      for (let c = 0; c < COLS; c++) {
        const v = buf ? buf[Math.min(buf.length - 1, c * 2)] / 255 : 0;
        const litRows = Math.round(v * ROWS);
        for (let r = 0; r < ROWS; r++) {
          const fromBottom = ROWS - 1 - r;
          const lit = fromBottom < litRows;
          const alpha = lit ? 0.55 + 0.4 * v : 0.06;
          ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx!.beginPath();
          ctx!.arc(
            DOT_GAP_X / 2 + c * DOT_GAP_X,
            DOT_GAP_Y / 2 + r * DOT_GAP_Y,
            DOT_RADIUS,
            0,
            Math.PI * 2,
          );
          ctx!.fill();
        }
      }
      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [audio]);

  return <canvas ref={canvasRef} className="spectrum" aria-hidden="true" />;
}
```

- [ ] **Step 2: Add CSS**

Create `musicos-exhibition/src/components/focal/spectrum.css`:

```css
.spectrum {
  display: block;
  margin: 8px auto;
}
```

- [ ] **Step 3: Typecheck**

`pnpm tsc --noEmit` — no errors.

- [ ] **Step 4: Commit**

```bash
git add musicos-exhibition/src/components/focal/Spectrum.tsx musicos-exhibition/src/components/focal/spectrum.css
git commit -m "feat(focal): dot-matrix Web Audio spectrum component"
```

---

## Task 12: `FocalDisc.tsx`, `PlayerBar.tsx`, `liquid-glass.css`

**Files:**
- Create: `musicos-exhibition/src/components/focal/FocalDisc.tsx`
- Create: `musicos-exhibition/src/components/focal/focal-disc.css`
- Create: `musicos-exhibition/src/components/focal/PlayerBar.tsx`
- Create: `musicos-exhibition/src/components/focal/player-bar.css`
- Create: `musicos-exhibition/src/components/focal/liquid-glass.css`

- [ ] **Step 1: Liquid glass shared styles**

Create `musicos-exhibition/src/components/focal/liquid-glass.css`:

```css
.lg-surface {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 12px 40px rgba(0, 0, 0, 0.35);
}
```

- [ ] **Step 2: FocalDisc**

Create `musicos-exhibition/src/components/focal/FocalDisc.tsx`:

```tsx
import { motion, type Transition } from 'framer-motion';
import { assetUrl } from '../../lib/asset-url.js';
import type { TrackExhibit } from '../../types.js';
import type { CardTransform } from '../timeline/timeline-keyframes.js';
import './focal-disc.css';

interface Props {
  track: TrackExhibit;
  transform: CardTransform;
  zIndex: number;
  isFocal: boolean;
  onClick?: () => void;
  transition?: Transition;
}

const DEFAULT_TRANSITION: Transition = { type: 'spring', stiffness: 220, damping: 26, mass: 0.6 };

export function FocalDisc({ track, transform, zIndex, isFocal, onClick, transition }: Props) {
  const { x, y, z, rotX, rotY, rotZ, opacity, scale } = transform;
  const isHearted = track.red_heart_tier === 'hit';
  return (
    <motion.button
      type="button"
      className={`focal-disc${isFocal ? ' focal-disc--focal' : ''}`}
      style={{ zIndex }}
      animate={{ x, y, z, rotateX: rotX, rotateY: rotY, rotateZ: rotZ, scale, opacity }}
      transition={transition ?? DEFAULT_TRANSITION}
      onClick={onClick}
      aria-label={`${track.position}. ${track.artist} — ${track.song}`}
    >
      <div className="focal-disc__art">
        {track.album_cover_url ? (
          <img src={assetUrl(track.album_cover_url)} alt="" />
        ) : (
          <div className="focal-disc__art-placeholder" />
        )}
      </div>
      {isFocal && (
        <div className="focal-disc__label lg-surface">
          <span className="focal-disc__song">{track.song}</span>
          <span className="focal-disc__artist">{track.artist}</span>
          {isHearted && <span className="focal-disc__heart" aria-label="Red heart">♥</span>}
        </div>
      )}
    </motion.button>
  );
}
```

- [ ] **Step 3: FocalDisc CSS**

Create `musicos-exhibition/src/components/focal/focal-disc.css`:

```css
.focal-disc {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 220px;
  height: 220px;
  margin: -110px 0 0 -110px;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transform-style: preserve-3d;
}
.focal-disc__art {
  width: 100%;
  height: 100%;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.5);
}
.focal-disc__art img,
.focal-disc__art-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.focal-disc__art-placeholder {
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
}
.focal-disc__label {
  position: absolute;
  left: 50%;
  bottom: -56px;
  transform: translateX(-50%);
  padding: 8px 14px;
  border-radius: 14px;
  display: flex;
  gap: 8px;
  align-items: baseline;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.95);
}
.focal-disc__song {
  font-weight: 600;
  font-size: 14px;
}
.focal-disc__artist {
  font-size: 12px;
  opacity: 0.75;
}
.focal-disc__heart {
  margin-left: 4px;
  color: #ff6b81;
}
```

- [ ] **Step 4: PlayerBar**

Create `musicos-exhibition/src/components/focal/PlayerBar.tsx`:

```tsx
import { useExhibition } from '../../store/exhibition.js';
import './player-bar.css';

interface Props {
  onListToggle: () => void;
  listOpen: boolean;
}

export function PlayerBar({ onListToggle, listOpen }: Props) {
  const isPlaying = useExhibition((s) => s.isPlaying);
  const togglePlay = useExhibition((s) => s.togglePlay);
  const next = useExhibition((s) => s.next);
  const prev = useExhibition((s) => s.prev);
  const currentTime = useExhibition((s) => s.currentTime);
  const duration = useExhibition((s) => s.duration);
  const seekTo = useExhibition((s) => s.seekTo);

  const pct = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="player-bar lg-surface">
      <button type="button" className="player-bar__btn" onClick={prev} aria-label="Previous">‹‹</button>
      <button type="button" className="player-bar__btn player-bar__btn--play" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <button type="button" className="player-bar__btn" onClick={next} aria-label="Next">››</button>
      <div
        className="player-bar__progress"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const t = ((e.clientX - rect.left) / rect.width) * duration;
          seekTo(Math.max(0, t));
        }}
      >
        <div className="player-bar__progress-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <button
        type="button"
        className={`player-bar__btn player-bar__btn--list${listOpen ? ' player-bar__btn--list-open' : ''}`}
        onClick={onListToggle}
        aria-pressed={listOpen}
        aria-label="Toggle list"
      >
        ≡
      </button>
    </div>
  );
}
```

- [ ] **Step 5: PlayerBar CSS**

Create `musicos-exhibition/src/components/focal/player-bar.css`:

```css
.player-bar {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 22px;
  color: rgba(255, 255, 255, 0.95);
  z-index: 30;
}
.player-bar__btn {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.player-bar__btn--play {
  background: rgba(255, 255, 255, 0.18);
}
.player-bar__btn--list-open {
  background: rgba(255, 255, 255, 0.28);
}
.player-bar__progress {
  flex: 1 1 auto;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.14);
  cursor: pointer;
  position: relative;
}
.player-bar__progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.85);
}
```

- [ ] **Step 6: Typecheck**

`pnpm tsc --noEmit` — no errors.

- [ ] **Step 7: Commit**

```bash
git add musicos-exhibition/src/components/focal/FocalDisc.tsx musicos-exhibition/src/components/focal/focal-disc.css musicos-exhibition/src/components/focal/PlayerBar.tsx musicos-exhibition/src/components/focal/player-bar.css musicos-exhibition/src/components/focal/liquid-glass.css
git commit -m "feat(focal): FocalDisc + liquid-glass PlayerBar"
```

---

## Task 13: `FocalScene.tsx` — assemble + phase machine

**Files:**
- Create: `musicos-exhibition/src/components/focal/FocalScene.tsx`
- Create: `musicos-exhibition/src/components/focal/focal-scene.css`

This is the integration component. It mounts `Subtitle`, `Spectrum`, the disc layer, and `PlayerBar`. It owns the phase state and feeds the layouts.

- [ ] **Step 1: Implement**

Create `musicos-exhibition/src/components/focal/FocalScene.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useExhibition } from '../../store/exhibition.js';
import { useTuning } from '../../store/tuning.js';
import { useFusionSubtitle } from '../../hooks/useFusionSubtitle.js';
import { useCurrentAndNext } from '../../hooks/useCurrentAndNext.js';
import { detectCallbacks } from '../../lib/callbackDetection.js';
import { EP3_ALIASES } from '../../data/ep3-aliases.js';
import { verticalCumulativeLayout } from './layouts/verticalCumulativeLayout.js';
import { horizontalCarouselLayout } from './layouts/horizontalCarouselLayout.js';
import { Subtitle } from './Subtitle.js';
import { Spectrum } from './Spectrum.js';
import { PlayerBar } from './PlayerBar.js';
import { FocalDisc } from './FocalDisc.js';
import type { TrackExhibit } from '../../types.js';
import './focal-scene.css';

type Phase = 'vertical' | 'horizontal';

export function FocalScene() {
  const exhibits = useExhibition((s) => s.exhibits);
  const playingPosition = useExhibition((s) => s.playingPosition);
  const currentTime = useExhibition((s) => s.currentTime);
  const mentionedSet = useExhibition((s) => s.mentionedSet);
  const addMentioned = useExhibition((s) => s.addMentioned);
  const play = useExhibition((s) => s.play);
  const tuning = useTuning();

  const [phase, setPhase] = useState<Phase>('vertical');

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');
  const trackPositions = tracks.map((t) => t.position).sort((a, b) => a - b);
  const currentExhibit = exhibits.find((e) => e.position === playingPosition) ?? null;
  const currentPosition = playingPosition ?? trackPositions[0] ?? 0;

  const subtitle = useFusionSubtitle(currentExhibit?.fusion_audio_url ?? null);
  const { current, next } = useCurrentAndNext(subtitle, currentTime);

  // Run callback detection on the *current* sentence and accumulate.
  useEffect(() => {
    if (!current) return;
    const hits = detectCallbacks(current.text, currentPosition, EP3_ALIASES, { allowPlain: false });
    if (hits.size > 0) addMentioned([...hits]);
  }, [current, currentPosition, addMentioned]);

  const mentionedSorted = trackPositions.filter((p) => mentionedSet.has(p) && p !== currentPosition);

  const layout =
    phase === 'vertical'
      ? verticalCumulativeLayout({
          mentioned: mentionedSorted,
          currentPosition,
          allPositions: trackPositions,
          params: {
            verticalSpacing: tuning.verticalSpacing,
            verticalDepth: tuning.verticalDepth,
            verticalShrink: tuning.verticalShrink,
            verticalFade: tuning.verticalFade,
            focalOffsetY: tuning.focalOffsetY,
          },
        })
      : horizontalCarouselLayout({
          allPositions: trackPositions,
          currentPosition,
          params: {
            arcSpacing: tuning.arcSpacing,
            arcDepth: tuning.arcDepth,
            arcRotStep: tuning.arcRotStep,
            carouselScale: tuning.carouselScale,
          },
        });

  const onPillClick = (position: number) => {
    play(position);
  };
  const onCardClick = (position: number) => {
    play(position);
    setPhase('vertical');
  };

  return (
    <div className="focal-scene">
      <header className="focal-scene__header">
        <div className="focal-scene__ep">EP3 · Riff Genealogy</div>
        <Spectrum />
        <Subtitle
          current={current?.text ?? null}
          next={next?.text ?? null}
          aliases={EP3_ALIASES}
          mentionedSet={mentionedSet}
          onPillClick={onPillClick}
        />
      </header>

      <div className="focal-scene__stage" style={{ perspective: `${tuning.perspective}px` }}>
        <div className="focal-scene__stage-inner">
          {tracks.map((t) => {
            const tf = layout.get(t.position);
            if (!tf) return null;
            const isFocal = t.position === currentPosition;
            const z = isFocal ? 1000 : 100 - Math.abs(t.position - currentPosition);
            return (
              <FocalDisc
                key={t.position}
                track={t}
                transform={tf}
                isFocal={isFocal}
                zIndex={z}
                onClick={() => onCardClick(t.position)}
              />
            );
          })}
        </div>
      </div>

      <PlayerBar
        listOpen={phase === 'horizontal'}
        onListToggle={() => setPhase((p) => (p === 'vertical' ? 'horizontal' : 'vertical'))}
      />
    </div>
  );
}
```

- [ ] **Step 2: CSS**

Create `musicos-exhibition/src/components/focal/focal-scene.css`:

```css
.focal-scene {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #0d0d0d;
  color: #fff;
}
.focal-scene__header {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  padding: 16px 16px 8px;
  z-index: 20;
}
.focal-scene__ep {
  font-size: 12px;
  letter-spacing: 0.18em;
  opacity: 0.6;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.focal-scene__stage {
  position: absolute;
  inset: 0;
}
.focal-scene__stage-inner {
  position: absolute;
  left: 50%;
  top: 55%;
  transform-style: preserve-3d;
}
```

- [ ] **Step 3: Typecheck**

`pnpm tsc --noEmit` — no errors.

- [ ] **Step 4: Commit**

```bash
git add musicos-exhibition/src/components/focal/FocalScene.tsx musicos-exhibition/src/components/focal/focal-scene.css
git commit -m "feat(focal): FocalScene assembles disc layer + subtitle + player bar"
```

---

## Task 14: Mount FocalScene on `/ep3`

**Files:**
- Create: `musicos-exhibition/src/routes/EpisodeFocal.tsx`
- Modify: `musicos-exhibition/src/App.tsx`

We replace the EP3 timeline UI but keep `GlobalPlayer` and the exhibition load lifecycle.

- [ ] **Step 1: Create the focal route**

Create `musicos-exhibition/src/routes/EpisodeFocal.tsx`:

```tsx
import { useEffect } from 'react';
import { useExhibition } from '../store/exhibition.js';
import { GlobalPlayer } from '../components/GlobalPlayer.js';
import { FocalScene } from '../components/focal/FocalScene.js';

interface Props {
  episodeId: string;
}

export function EpisodeFocal({ episodeId }: Props) {
  const loadedId = useExhibition((s) => s.episodeId);
  const load = useExhibition((s) => s.load);
  const exhibits = useExhibition((s) => s.exhibits);

  useEffect(() => {
    if (loadedId !== episodeId) load(episodeId);
  }, [episodeId, loadedId, load]);

  if (exhibits.length === 0) {
    return <div style={{ padding: 24, color: '#fff' }}>Loading…</div>;
  }

  return (
    <>
      <GlobalPlayer />
      <FocalScene />
    </>
  );
}
```

- [ ] **Step 2: Switch the EP3 route**

In `musicos-exhibition/src/App.tsx`:
- Add at the top: `import { EpisodeFocal } from './routes/EpisodeFocal.js';`
- Replace the `<Route path="/ep3"><Timeline episodeId="ep3" /></Route>` block with:

```tsx
<Route path="/ep3">
  <EpisodeFocal episodeId="ep3" />
</Route>
```

(Other episode routes unchanged.)

- [ ] **Step 3: Typecheck**

`pnpm tsc --noEmit` — no errors.

- [ ] **Step 4: Smoke-test the new UI**

Run `pnpm dev`, navigate to `/ep3`. Press play. Verify:
- Top header shows "EP3 · Riff Genealogy" + spectrum animating + subtitle (current+next visible).
- Single focal disc centered with album art, song/artist label below.
- As narration mentions earlier tracks (with marker words like 你刚才/刚才), pills should appear inline AND those discs should appear stacked above the focal disc.
- Tap list button (`≡`) → phase animates to horizontal carousel of all tracks.
- Tap any card → seeks to that track and returns to vertical phase.
- Tap pill → seeks to that track.
- Audio continues uninterrupted across phase changes.

If any of these fail, check console errors first; common issues will be CORS on subtitle JSON (shouldn't happen — same origin) or `MediaElementSource` reuse warnings (single `GlobalPlayer` mount makes this safe).

- [ ] **Step 5: Commit**

```bash
git add musicos-exhibition/src/routes/EpisodeFocal.tsx musicos-exhibition/src/App.tsx
git commit -m "feat(routes): mount FocalScene on /ep3 replacing Timeline"
```

---

## Task 15: Tune defaults via TuningPanel + finalize

**Files:**
- Modify: `musicos-exhibition/src/components/timeline/TuningPanel.tsx` (add focal-scene sliders)
- Modify: `musicos-exhibition/src/store/tuning.ts` (any default refinements found by tuning)

- [ ] **Step 1: Add sliders for focal params**

Open `musicos-exhibition/src/components/timeline/TuningPanel.tsx`. Following the existing slider pattern in that file, add a new section labelled "Focal scene" with sliders bound to:
- `verticalSpacing` (range 60-200)
- `verticalDepth` (range 0-200)
- `verticalShrink` (range 0-0.2, step 0.01)
- `verticalFade` (range 0-0.3, step 0.01)
- `focalOffsetY` (range 0-200)
- `carouselScale` (range 0.5-1.2, step 0.05)

Match the existing slider markup verbatim — read the file first to confirm props/onChange shape.

- [ ] **Step 2: Tuning session**

Run `pnpm dev`, open `/ep3`, open the tuning panel, play through the full episode. Adjust sliders to feel right on a phone-sized viewport (use Chrome devtools mobile emulation, ~390×844). Once values feel right, copy them into `TUNING_DEFAULTS` in `tuning.ts`.

- [ ] **Step 3: Typecheck + final smoke**

`pnpm tsc --noEmit`, then `pnpm dev` and play through `/ep3` end to end one more time on mobile emulation. Confirm phase transitions are <1s and don't drop frames.

- [ ] **Step 4: Commit**

```bash
git add musicos-exhibition/src/components/timeline/TuningPanel.tsx musicos-exhibition/src/store/tuning.ts
git commit -m "feat(tuning): focal scene sliders + tuned defaults"
```

---

## Task 16: Push the prototype branch

- [ ] **Step 1: Verify clean tree + tests**

Run from `musicos-exhibition/`:
```bash
pnpm vitest run
pnpm tsc --noEmit
```
Both should pass.

- [ ] **Step 2: Push**

```bash
git push -u origin prototype/min-visual-system-ep3
```

(Confirm with the user before opening a PR — this is a prototype branch, the user may want to iterate further before review.)

---

## Self-review notes

- **Spec coverage:** every spec section has at least one task — useFusionSubtitle extraction (T1), mentionedSet (T2), aliases (T3), callback detection (T4), 2-line subtitle (T5+T10), spectrum (T6+T11), vertical layout (T7), horizontal layout (T8), tuning params (T9+T15), FocalDisc/PlayerBar/liquid glass (T12), assembly (T13), routing (T14).
- **Type consistency:** `verticalCumulativeLayout` params (`verticalSpacing`, `verticalDepth`, `verticalShrink`, `verticalFade`, `focalOffsetY`) appear identically in T7, T9, T13, T15. `carouselScale` likewise. `EP3_ALIASES` consumer signature consistent across T4, T10, T13.
- **Placeholder scan:** no TBDs. The alias entries in T3 are explicitly flagged as "verify against the JSON before committing"; the engineer will fill from the live data.
- **Notable deviations from skill default:** No automated tests for visual components — spec explicitly waives this. Vitest tests gated to the two pure modules where logic is non-trivial.
