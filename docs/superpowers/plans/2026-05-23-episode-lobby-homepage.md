# Episode Lobby Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/` homepage that scatters episode album covers on a dark grid canvas; hovering an episode swaps every other floating cover into that episode's tracklist preview, and clicking ep1/ep4 morphs the covers into a sideways stack before routing to the Timeline.

**Architecture:** A new `Home` route loads a lightweight all-episodes cover manifest (without touching the per-episode `exhibition` store), renders ~14 absolutely-positioned `FloatingCover` slots over a grid `FloatingCanvas`. Pure layout/manifest logic lives in tested `.ts` libs; React components are verified in the browser. Continuous drift uses CSS keyframes; hover/exit motion uses framer-motion.

**Tech Stack:** React 19 + TS, Vite, wouter, zustand (selectors), framer-motion, vitest. Plain per-component BEM-ish CSS. Local imports keep `.js` extension.

---

## File Structure

- `src/lib/home-manifest.ts` (+ `.test.ts`) — fetch all 6 episode JSONs, extract `{episodeId, number, titles, anchorCover, trackCovers[]}`.
- `src/components/home/home-layout.ts` (+ `.test.ts`) — `SLOTS` definitions, `coverForSlot()`, `restingCover()`, `stackTarget()`.
- `src/components/home/FloatingCover.tsx` (+ `floating-cover.css`) — one slot: position, CSS drift, hover scale, image cross-fade, click, exit-stack.
- `src/components/home/FloatingCanvas.tsx` (+ `floating-canvas.css`) — grid backdrop, center crosshair, wordmark + counter chrome, renders slots.
- `src/routes/Home.tsx` (+ `home.css`) — route shell: load manifest, own `hover` + `exiting` state, wire navigation.
- `src/App.tsx` — replace `/`→`/ep1` redirect with `<Home />`.

---

### Task 1: Episode cover manifest lib

**Files:**
- Create: `src/lib/home-manifest.ts`
- Test: `src/lib/home-manifest.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/home-manifest.test.ts
import { describe, it, expect } from 'vitest';
import { buildEpisodeManifest } from './home-manifest.js';
import type { Exhibit } from '../types.js';

function track(partial: Partial<Exhibit> & { position: number }): Exhibit {
  return {
    kind: 'track',
    exhibit_type: 'lateral',
    is_base_node: false,
    album_cover_url: `/covers/${partial.position}.jpg`,
    artist: 'A',
    song: 'S',
    ...partial,
  } as unknown as Exhibit;
}

describe('buildEpisodeManifest', () => {
  it('collects track covers sorted by position and picks the anchor cover', () => {
    const exhibits: Exhibit[] = [
      track({ position: 3 }),
      track({ position: 1, exhibit_type: 'anchor', album_cover_url: '/covers/anchor.jpg' }),
      track({ position: 2 }),
      { kind: 'narration', position: 99 } as unknown as Exhibit, // ignored
    ];
    const m = buildEpisodeManifest('ep1', exhibits);
    expect(m.episodeId).toBe('ep1');
    expect(m.number).toBe(1);
    expect(m.anchorCover).toBe('/covers/anchor.jpg');
    expect(m.trackCovers).toEqual(['/covers/anchor.jpg', '/covers/2.jpg', '/covers/3.jpg']);
  });

  it('falls back to first track cover when no anchor exhibit exists', () => {
    const m = buildEpisodeManifest('ep2', [track({ position: 5 }), track({ position: 4 })]);
    expect(m.anchorCover).toBe('/covers/4.jpg');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd musicos-exhibition && npx vitest run src/lib/home-manifest.test.ts`
Expected: FAIL — `buildEpisodeManifest` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/home-manifest.ts
import type { Exhibit } from '../types.js';
import { EPISODES } from './episodes.js';
import { loadExhibition } from './load-exhibition.js';

export interface EpisodeManifest {
  episodeId: string;
  number: number;
  titleZh: string;
  titleEn: string;
  anchorCover: string;
  trackCovers: string[];
}

function isTrackWithCover(e: Exhibit): e is Exhibit & { album_cover_url: string } {
  return (
    (e as { kind?: string }).kind === 'track' &&
    typeof (e as { album_cover_url?: unknown }).album_cover_url === 'string' &&
    ((e as { album_cover_url: string }).album_cover_url).length > 0
  );
}

export function buildEpisodeManifest(episodeId: string, exhibits: Exhibit[]): EpisodeManifest {
  const meta = EPISODES.find((e) => e.id === episodeId);
  if (!meta) throw new Error(`Unknown episode: ${episodeId}`);

  const tracks = exhibits
    .filter(isTrackWithCover)
    .slice()
    .sort((a, b) => a.position - b.position);

  const trackCovers = tracks.map((t) => t.album_cover_url);
  const anchor =
    tracks.find((t) => (t as { exhibit_type?: string }).exhibit_type === 'anchor') ??
    tracks.find((t) => (t as { is_base_node?: boolean }).is_base_node);
  const anchorCover = anchor?.album_cover_url ?? trackCovers[0] ?? '';

  return {
    episodeId,
    number: meta.number,
    titleZh: meta.titleZh,
    titleEn: meta.titleEn,
    anchorCover,
    trackCovers,
  };
}

export async function loadHomeManifest(): Promise<EpisodeManifest[]> {
  return Promise.all(
    EPISODES.map(async (meta) => buildEpisodeManifest(meta.id, await loadExhibition(meta.id))),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/home-manifest.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/home-manifest.ts src/lib/home-manifest.test.ts
git commit -m "feat(home): add all-episode cover manifest lib"
```

---

### Task 2: Slot layout + cover-selection logic

**Files:**
- Create: `src/components/home/home-layout.ts`
- Test: `src/components/home/home-layout.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/components/home/home-layout.test.ts
import { describe, it, expect } from 'vitest';
import { SLOTS, coverForSlot, restingCover, stackTarget } from './home-layout.js';
import type { EpisodeManifest } from '../../lib/home-manifest.js';

function mkManifest(id: string, n: number): EpisodeManifest {
  return {
    episodeId: id,
    number: n,
    titleZh: id,
    titleEn: id,
    anchorCover: `/${id}/anchor.jpg`,
    trackCovers: Array.from({ length: 18 }, (_, i) => `/${id}/t${i}.jpg`),
  };
}

const manifests: Record<string, EpisodeManifest> = Object.fromEntries(
  ['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6'].map((id, i) => [id, mkManifest(id, i + 1)]),
);

describe('home-layout', () => {
  it('defines 14 slots covering all six episodes with center kept clear', () => {
    expect(SLOTS).toHaveLength(14);
    const eps = new Set(SLOTS.map((s) => s.episodeId));
    expect([...eps].sort()).toEqual(['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6']);
    for (const s of SLOTS) {
      const inCenter = s.xPct > 38 && s.xPct < 62 && s.yPct > 35 && s.yPct < 65;
      expect(inCenter).toBe(false);
    }
  });

  it('restingCover returns anchor for anchor slots, track cover otherwise', () => {
    const anchorSlot = SLOTS.find((s) => s.resting === 'anchor')!;
    expect(restingCover(anchorSlot, manifests[anchorSlot.episodeId])).toBe(
      `/${anchorSlot.episodeId}/anchor.jpg`,
    );
  });

  it('coverForSlot shows resting covers when nothing is hovered', () => {
    const slot = SLOTS[0];
    expect(coverForSlot(slot, manifests, null)).toBe(restingCover(slot, manifests[slot.episodeId]));
  });

  it('coverForSlot swaps non-hovered slots to the active episode tracklist', () => {
    const hovered = SLOTS[0];
    const other = SLOTS.find((s) => s.id !== hovered.id)!;
    const hover = { hoveredSlotId: hovered.id, activeEpisodeId: hovered.episodeId };
    // hovered slot keeps its own resting cover
    expect(coverForSlot(hovered, manifests, hover)).toBe(
      restingCover(hovered, manifests[hovered.episodeId]),
    );
    // any other slot shows a cover from the hovered episode's tracklist
    expect(coverForSlot(other, manifests, hover)).toBe(
      manifests[hovered.episodeId].trackCovers[other.previewIndex % 18],
    );
  });

  it('stackTarget converges cards toward center with stagger', () => {
    const a = stackTarget(0, 14);
    const b = stackTarget(5, 14);
    expect(b.xPct).toBeGreaterThan(a.xPct);
    expect(a.yPct).toBeCloseTo(b.yPct, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/home/home-layout.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/home/home-layout.ts
import type { EpisodeManifest } from '../../lib/home-manifest.js';

export type DepthTier = 0 | 1 | 2;

export interface Slot {
  id: string;
  episodeId: string;
  resting: 'anchor' | number; // 'anchor' or index into trackCovers
  previewIndex: number; // which track index to show when previewing the active episode
  xPct: number;
  yPct: number;
  depth: DepthTier;
  sizePx: number;
  driftDurSec: number;
  driftDelaySec: number;
  rotateDeg: number;
}

// 14 slots, hand-placed toward edges/corners so the center band
// (x 38–62%, y 35–65%) and the lower-center stay clear for previews + chrome.
export const SLOTS: Slot[] = [
  { id: 's0',  episodeId: 'ep1', resting: 'anchor', previewIndex: 0,  xPct: 16, yPct: 14, depth: 2, sizePx: 184, driftDurSec: 15, driftDelaySec: 0,   rotateDeg: -2 },
  { id: 's1',  episodeId: 'ep1', resting: 6,        previewIndex: 1,  xPct: 30, yPct: 72, depth: 1, sizePx: 150, driftDurSec: 18, driftDelaySec: 1.5, rotateDeg: 1.5 },
  { id: 's2',  episodeId: 'ep1', resting: 12,       previewIndex: 2,  xPct: 70, yPct: 80, depth: 0, sizePx: 120, driftDurSec: 20, driftDelaySec: 3,   rotateDeg: -1 },
  { id: 's3',  episodeId: 'ep2', resting: 'anchor', previewIndex: 3,  xPct: 78, yPct: 16, depth: 2, sizePx: 176, driftDurSec: 16, driftDelaySec: 0.8, rotateDeg: 2 },
  { id: 's4',  episodeId: 'ep2', resting: 8,        previewIndex: 4,  xPct: 90, yPct: 60, depth: 1, sizePx: 140, driftDurSec: 19, driftDelaySec: 2.2, rotateDeg: -2 },
  { id: 's5',  episodeId: 'ep3', resting: 'anchor', previewIndex: 5,  xPct: 6,  yPct: 44, depth: 1, sizePx: 158, driftDurSec: 17, driftDelaySec: 1.1, rotateDeg: 1 },
  { id: 's6',  episodeId: 'ep3', resting: 9,        previewIndex: 6,  xPct: 8,  yPct: 82, depth: 0, sizePx: 118, driftDurSec: 21, driftDelaySec: 3.6, rotateDeg: -1.5 },
  { id: 's7',  episodeId: 'ep4', resting: 'anchor', previewIndex: 7,  xPct: 62, yPct: 10, depth: 2, sizePx: 180, driftDurSec: 15, driftDelaySec: 0.4, rotateDeg: -2 },
  { id: 's8',  episodeId: 'ep4', resting: 5,        previewIndex: 8,  xPct: 50, yPct: 82, depth: 1, sizePx: 146, driftDurSec: 18, driftDelaySec: 2.8, rotateDeg: 1.5 },
  { id: 's9',  episodeId: 'ep4', resting: 14,       previewIndex: 9,  xPct: 92, yPct: 86, depth: 0, sizePx: 116, driftDurSec: 22, driftDelaySec: 4,   rotateDeg: -1 },
  { id: 's10', episodeId: 'ep5', resting: 'anchor', previewIndex: 10, xPct: 24, yPct: 30, depth: 1, sizePx: 152, driftDurSec: 17, driftDelaySec: 1.8, rotateDeg: 2 },
  { id: 's11', episodeId: 'ep5', resting: 11,       previewIndex: 11, xPct: 86, yPct: 38, depth: 0, sizePx: 124, driftDurSec: 20, driftDelaySec: 3.2, rotateDeg: -1.5 },
  { id: 's12', episodeId: 'ep6', resting: 'anchor', previewIndex: 12, xPct: 14, yPct: 60, depth: 1, sizePx: 150, driftDurSec: 16, driftDelaySec: 2.4, rotateDeg: 1 },
  { id: 's13', episodeId: 'ep6', resting: 7,        previewIndex: 13, xPct: 74, yPct: 56, depth: 0, sizePx: 122, driftDurSec: 19, driftDelaySec: 0.6, rotateDeg: -2 },
];

export function restingCover(slot: Slot, m: EpisodeManifest): string {
  if (slot.resting === 'anchor') return m.anchorCover;
  return m.trackCovers[slot.resting % m.trackCovers.length] ?? m.anchorCover;
}

export interface HoverState {
  hoveredSlotId: string;
  activeEpisodeId: string;
}

export function coverForSlot(
  slot: Slot,
  manifests: Record<string, EpisodeManifest>,
  hover: HoverState | null,
): string {
  const own = manifests[slot.episodeId];
  if (!hover) return restingCover(slot, own);
  if (slot.id === hover.hoveredSlotId) return restingCover(slot, own);
  const active = manifests[hover.activeEpisodeId];
  return active.trackCovers[slot.previewIndex % active.trackCovers.length] ?? active.anchorCover;
}

// Collapse target for the ep1/ep4 stacking exit: cards converge near
// center-left and fan slightly, reading as a sideways stack.
export function stackTarget(
  orderIndex: number,
  _total: number,
): { xPct: number; yPct: number; rotateDeg: number } {
  const centerX = 42;
  const centerY = 50;
  return {
    xPct: centerX + orderIndex * 0.7,
    yPct: centerY,
    rotateDeg: -6 + (orderIndex % 3) * 2,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/home/home-layout.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/home-layout.ts src/components/home/home-layout.test.ts
git commit -m "feat(home): add slot layout + cover-selection logic"
```

---

### Task 3: FloatingCover component

**Files:**
- Create: `src/components/home/FloatingCover.tsx`
- Create: `src/components/home/floating-cover.css`

(Visual component — verified in the browser in Task 6. No unit test.)

- [ ] **Step 1: Write the stylesheet**

```css
/* src/components/home/floating-cover.css */
.floating-cover {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--size, 150px);
  height: var(--size, 150px);
  margin-left: calc(var(--size, 150px) / -2);
  margin-top: calc(var(--size, 150px) / -2);
  transform-style: preserve-3d;
}

/* Continuous decorative drift — paused under reduced-motion via modifier. */
.floating-cover__drift {
  width: 100%;
  height: 100%;
  animation: floating-cover-drift var(--drift-dur, 18s) ease-in-out var(--drift-delay, 0s) infinite alternate;
}
.floating-cover--still .floating-cover__drift {
  animation: none;
}

@keyframes floating-cover-drift {
  from { transform: translate3d(0, 0, 0) rotate(var(--drift-rot, 0deg)); }
  to   { transform: translate3d(0, -16px, 0) rotate(calc(var(--drift-rot, 0deg) * -1)); }
}

.floating-cover__inner {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
  border: none;
  padding: 0;
  background: none;
  border-radius: 3px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.floating-cover__art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 3px;
}

/* Depth tiers: farther covers sit back (smaller, dimmer). */
.floating-cover--depth-0 { opacity: 0.78; }
.floating-cover--depth-1 { opacity: 0.9; }
.floating-cover--depth-2 { opacity: 1; }

/* When another slot is hovered, previews read slightly recessed. */
.floating-cover--dimmed { filter: saturate(0.92) brightness(0.92); }
```

- [ ] **Step 2: Write the component**

```tsx
// src/components/home/FloatingCover.tsx
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import type { CSSProperties } from 'react';
import { assetUrl } from '../../lib/asset-url.js';
import type { Slot } from './home-layout.js';
import './floating-cover.css';

const HOVER_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26, mass: 0.6 };

export interface ExitTarget {
  xPct: number;
  yPct: number;
  rotateDeg: number;
}

interface Props {
  slot: Slot;
  cover: string;
  active: boolean; // this slot is the hovered one
  dimmed: boolean; // some other slot is hovered
  reducedMotion: boolean;
  exit: ExitTarget | null; // ep1/ep4 stacking exit target, or null
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

export function FloatingCover({
  slot,
  cover,
  active,
  dimmed,
  reducedMotion,
  exit,
  onHover,
  onLeave,
  onClick,
}: Props) {
  const positionStyle: CSSProperties = exit
    ? { left: `${exit.xPct}%`, top: `${exit.yPct}%` }
    : { left: `${slot.xPct}%`, top: `${slot.yPct}%` };

  const style = {
    '--x': `${slot.xPct}%`,
    '--y': `${slot.yPct}%`,
    '--size': `${slot.sizePx}px`,
    '--drift-dur': `${slot.driftDurSec}s`,
    '--drift-delay': `${slot.driftDelaySec}s`,
    '--drift-rot': `${slot.rotateDeg}deg`,
    ...positionStyle,
  } as CSSProperties;

  const className = [
    'floating-cover',
    `floating-cover--depth-${slot.depth}`,
    reducedMotion || exit ? 'floating-cover--still' : '',
    dimmed && !active ? 'floating-cover--dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      className={className}
      style={style}
      animate={{
        scale: active ? 1.12 : 1,
        rotate: exit ? exit.rotateDeg : 0,
        zIndex: active ? 50 : slot.depth + 10,
      }}
      transition={HOVER_SPRING}
    >
      <div className="floating-cover__drift">
        <button
          type="button"
          className="floating-cover__inner"
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          onClick={onClick}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={cover}
              className="floating-cover__art"
              src={assetUrl(cover)}
              alt=""
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Type-check compiles**

Run: `npx tsc --noEmit`
Expected: no errors in `FloatingCover.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/FloatingCover.tsx src/components/home/floating-cover.css
git commit -m "feat(home): add FloatingCover with drift, hover scale, image cross-fade"
```

---

### Task 4: FloatingCanvas (grid backdrop + chrome)

**Files:**
- Create: `src/components/home/FloatingCanvas.tsx`
- Create: `src/components/home/floating-canvas.css`

(Visual component — verified in the browser in Task 6.)

- [ ] **Step 1: Write the stylesheet**

```css
/* src/components/home/floating-canvas.css */
.floating-canvas {
  position: fixed;
  inset: 0;
  background-color: #000;
  /* Faint dark grid paper. */
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 32px 32px;
  overflow: hidden;
}

.floating-canvas__crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.35);
  font: 400 18px/1 ui-monospace, 'SF Mono', monospace;
  pointer-events: none;
  user-select: none;
}

.floating-canvas__wordmark {
  position: absolute;
  left: 28px;
  top: 22px;
  color: rgba(255, 255, 255, 0.82);
  font: 400 20px/1 'PingFang SC', -apple-system, sans-serif;
  letter-spacing: 0.04em;
  pointer-events: none;
}

.floating-canvas__counter {
  position: absolute;
  right: 28px;
  top: 24px;
  color: rgba(255, 255, 255, 0.5);
  font: 400 13px/1 ui-monospace, 'SF Mono', monospace;
  letter-spacing: 0.08em;
  pointer-events: none;
}
```

- [ ] **Step 2: Write the component**

```tsx
// src/components/home/FloatingCanvas.tsx
import type { ReactNode } from 'react';
import './floating-canvas.css';

interface Props {
  episodeCount: number;
  children: ReactNode;
}

export function FloatingCanvas({ episodeCount, children }: Props) {
  return (
    <div className="floating-canvas">
      <div className="floating-canvas__wordmark">MusicOS</div>
      <div className="floating-canvas__counter">EP 1–{episodeCount}</div>
      <div className="floating-canvas__crosshair">+</div>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Type-check compiles**

Run: `npx tsc --noEmit`
Expected: no errors in `FloatingCanvas.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/FloatingCanvas.tsx src/components/home/floating-canvas.css
git commit -m "feat(home): add FloatingCanvas grid backdrop + chrome"
```

---

### Task 5: Home route shell (manifest load, hover + stacking-exit wiring)

**Files:**
- Create: `src/routes/Home.tsx`
- Create: `src/routes/home.css`

(Integration surface — verified in the browser in Task 6.)

- [ ] **Step 1: Write the stylesheet**

```css
/* src/routes/home.css */
.home {
  position: fixed;
  inset: 0;
}
.home__loading {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.4);
  font: 400 13px/1 ui-monospace, 'SF Mono', monospace;
  letter-spacing: 0.1em;
}
```

- [ ] **Step 2: Write the component**

```tsx
// src/routes/Home.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { FloatingCanvas } from '../components/home/FloatingCanvas.js';
import { FloatingCover, type ExitTarget } from '../components/home/FloatingCover.js';
import { SLOTS, coverForSlot, stackTarget, type HoverState } from '../components/home/home-layout.js';
import { loadHomeManifest, type EpisodeManifest } from '../lib/home-manifest.js';
import './home.css';

const STACK_EPISODES = new Set(['ep1', 'ep4']);
const STACK_DURATION_MS = 650;

export function Home() {
  const [, setLocation] = useLocation();
  const [manifests, setManifests] = useState<Record<string, EpisodeManifest> | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [exitingEpisode, setExitingEpisode] = useState<string | null>(null);
  const navTimer = useRef<number | null>(null);

  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    let alive = true;
    loadHomeManifest().then((list) => {
      if (!alive) return;
      setManifests(Object.fromEntries(list.map((m) => [m.episodeId, m])));
    });
    return () => {
      alive = false;
      if (navTimer.current) window.clearTimeout(navTimer.current);
    };
  }, []);

  function handleClick(episodeId: string) {
    if (exitingEpisode) return;
    if (STACK_EPISODES.has(episodeId) && !reducedMotion) {
      setHover(null);
      setExitingEpisode(episodeId);
      navTimer.current = window.setTimeout(() => setLocation(`/${episodeId}`), STACK_DURATION_MS);
    } else {
      setLocation(`/${episodeId}`);
    }
  }

  if (!manifests) {
    return (
      <div className="home">
        <FloatingCanvas episodeCount={6}>
          <div className="home__loading">LOADING</div>
        </FloatingCanvas>
      </div>
    );
  }

  return (
    <div className="home">
      <FloatingCanvas episodeCount={6}>
        {SLOTS.map((slot, i) => {
          const exit: ExitTarget | null = exitingEpisode ? stackTarget(i, SLOTS.length) : null;
          return (
            <FloatingCover
              key={slot.id}
              slot={slot}
              cover={coverForSlot(slot, manifests, hover)}
              active={hover?.hoveredSlotId === slot.id}
              dimmed={hover !== null}
              reducedMotion={reducedMotion}
              exit={exit}
              onHover={() => !exitingEpisode && setHover({ hoveredSlotId: slot.id, activeEpisodeId: slot.episodeId })}
              onLeave={() => !exitingEpisode && setHover(null)}
              onClick={() => handleClick(slot.episodeId)}
            />
          );
        })}
      </FloatingCanvas>
    </div>
  );
}
```

- [ ] **Step 3: Type-check compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/Home.tsx src/routes/home.css
git commit -m "feat(home): add Home route shell with hover swap + ep1/ep4 stacking exit"
```

---

### Task 6: Wire route into App + browser verification

**Files:**
- Modify: `src/App.tsx` (the `/` route block)

- [ ] **Step 1: Add the import**

In `src/App.tsx`, add alongside the other route imports:

```tsx
import { Home } from './routes/Home.js';
```

- [ ] **Step 2: Replace the redirect with the Home route**

Replace this block:

```tsx
          <Route path="/">
            <Redirect to="/ep1" />
          </Route>
```

with:

```tsx
          <Route path="/">
            <Home />
          </Route>
```

Then remove the now-unused `Redirect` from the wouter import:

```tsx
import { Route, Switch, useRoute } from 'wouter';
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: both pass, no unused-import error for `Redirect`.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: PASS — existing tests green, plus Task 1 & 2 suites.

- [ ] **Step 5: Browser verification**

Run: `npm run dev`, open `http://localhost:5173/`. Confirm:
- ~14 covers scattered toward the edges; center band + lower-center stay empty; covers drift slowly.
- Hover any cover → it lifts/scales and stays; every other cover cross-fades to that episode's tracklist covers. Mouse-leave restores the resting set.
- Click an **ep2/3/5/6** cover → routes straight to that episode.
- Click an **ep1 or ep4** cover → covers converge into a side-stack (~650ms), then the Timeline loads.
- Sidebar still renders; no console errors.

Note any visual tuning needed (slot positions, stack geometry) and adjust `home-layout.ts` values, then re-verify.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(home): mount Home at / replacing the ep1 redirect"
```

---

## Self-Review Notes

- **Spec coverage:** §2 surface → Task 4 (grid/crosshair/chrome) + dark palette. §3 idle/drift → Task 2 (SLOTS) + Task 3 (CSS drift). §4 hover preview → Task 2 (`coverForSlot`) + Task 3 (cross-fade) + Task 5 (hover state). §5 navigation + ep1/ep4 stack → Task 2 (`stackTarget`) + Task 5 (`handleClick`/exit). §6 data → Task 1 (manifest, no store clobber). §7 files → all tasks. §8 conventions → BEM CSS, `.js` imports, framer/CSS split honored. §9 out-of-scope (mobile, pan/zoom, pixel-perfect shared element) → not implemented, by design.
- **Placeholder scan:** none — every code step is complete.
- **Type consistency:** `Slot`, `HoverState`, `ExitTarget`, `EpisodeManifest`, `coverForSlot`, `restingCover`, `stackTarget`, `loadHomeManifest` names match across Tasks 1–5.
- **Known approximation:** ep1/ep4 "morph" is a stacking exit on Home + Timeline mounting pre-stacked, not a true cross-route shared element (per spec §5/§9). Geometry in `stackTarget` is a first pass to tune in the browser (Task 6 Step 5).
