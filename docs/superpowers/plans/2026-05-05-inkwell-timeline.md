# Inkwell-Style Song Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain `<ol>` Timeline with an Inkwell-inspired three-state scroll choreography — the same set of song cards transitions through *constellation* → *linear sequence* → *diagonal procession* as the user scrolls, with a stepper showing the current position.

**Architecture:** Pure CSS 3D transforms (`perspective` + `transform-style: preserve-3d` + per-card `translate3d/rotate3d`) driven by a single normalized scroll-progress value `t ∈ [0, 1]`. Each card computes its `(x, y, z, rotX, rotY, rotZ, opacity)` as a piecewise function of `t` and its index, interpolated across three keyframe states. No WebGL, no Three.js. `framer-motion`'s `useScroll` + `useTransform` provides the progress driver and per-card interpolation; if we want zero new deps, we can fall back to a 60fps `requestAnimationFrame` + `getBoundingClientRect` loop.

**Tech Stack:** React 19, TypeScript, Vite, Wouter, Zustand (existing), `framer-motion@^11` (new — ~30KB gzipped, scroll-linked animation primitive). CSS 3D transforms. No canvas.

---

## File Structure

- `src/routes/Timeline.tsx` — **modify**: replace existing list with `<TimelineScene>` component, keep "Play from beginning" CTA, keep manual-mode link behavior.
- `src/components/timeline/TimelineScene.tsx` — **create**: the scroll container; owns `useScroll` and renders three-state stage. Reads `exhibits` from store.
- `src/components/timeline/TrackCard.tsx` — **create**: a single card. Receives `index`, `total`, `track`, and `progress` (a `MotionValue<number>`). Computes its own transform via `useTransform`.
- `src/components/timeline/timeline-keyframes.ts` — **create**: pure functions returning per-card `{x, y, z, rotX, rotY, rotZ, opacity}` for each of the three states; plus `interpolate(stateA, stateB, u)`. No React imports — unit-testable.
- `src/components/timeline/Stepper.tsx` — **create**: the bottom counter pill (`12` + active label + ghosted prev/next labels) like Inkwell's INTELLIGENCE state.
- `src/components/timeline/timeline.css` — **create**: scoped styles (perspective container, card base, two-tier caption typography). Keep small; transforms come from inline styles via motion values.
- `tests/timeline-keyframes.test.ts` — **create**: unit tests for keyframe math.
- `package.json` — **modify**: add `framer-motion` dependency.

**Three states (locked):**
1. **CONSTELLATION** (`t ∈ [0, 0.33]`): cards arranged in a wide arc, irregular hand-placed rotations (-15° to +15°), one anchor card centered + upright + opaque, others at ~70% opacity. Caption: gray "The Rock × Funk Translation" / black "Miss You".
2. **SEQUENCE** (`t ∈ [0.33, 0.66]`): cards collapse into a tight horizontal row, slight overlap, ~5–8° uniform rotation, glassy translucency on all cards. Caption explains the timeline span.
3. **PROCESSION** (`t ∈ [0.66, 1.0]`): row tilts ~25° upward + receding via `translateZ`, foreshortened. Stepper appears showing `<position>/<total>` and current edge type from `connections_in[0].kind`.

**Card content per state:** album cover image fills the card; on hover, year + artist appear as overlay. In SEQUENCE and PROCESSION states the focal card (nearest stepper index) shows the year overlay always.

---

### Task 1: Add framer-motion dependency

**Files:**
- Modify: `musicos-exhibition/package.json`

- [ ] **Step 1: Install framer-motion**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm install framer-motion@^11
```

Expected: `package.json` gains `"framer-motion": "^11.x.x"` under `dependencies`. `package-lock.json` updates.

- [ ] **Step 2: Verify build still passes**

```bash
npm run build
```

Expected: Vite build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/package.json musicos-exhibition/package-lock.json
git commit -m "chore(exhibition): add framer-motion for scroll choreography"
```

---

### Task 2: Keyframe math — failing test

**Files:**
- Create: `musicos-exhibition/tests/timeline-keyframes.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// musicos-exhibition/tests/timeline-keyframes.test.ts
import { describe, it, expect } from 'vitest';
import {
  constellationTransform,
  sequenceTransform,
  processionTransform,
  cardTransform,
} from '../src/components/timeline/timeline-keyframes.js';

describe('timeline-keyframes', () => {
  it('CONSTELLATION: anchor (index === anchorIndex) sits at origin upright', () => {
    const t = constellationTransform({ index: 5, total: 41, anchorIndex: 5 });
    expect(t.x).toBe(0);
    expect(t.y).toBe(0);
    expect(t.rotZ).toBe(0);
    expect(t.opacity).toBe(1);
  });

  it('CONSTELLATION: non-anchor cards spread along an arc with hand-placed rotation', () => {
    const left = constellationTransform({ index: 0, total: 41, anchorIndex: 5 });
    const right = constellationTransform({ index: 10, total: 41, anchorIndex: 5 });
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    // arc dips downward at the edges
    expect(left.y).toBeGreaterThan(0);
    expect(right.y).toBeGreaterThan(0);
    // rotation in [-15, 15] degrees
    expect(Math.abs(left.rotZ)).toBeLessThanOrEqual(15);
    expect(Math.abs(right.rotZ)).toBeLessThanOrEqual(15);
    // non-anchor opacity dimmer than anchor
    expect(left.opacity).toBeLessThan(1);
  });

  it('SEQUENCE: cards line up horizontally with uniform small rotation', () => {
    const a = sequenceTransform({ index: 0, total: 41 });
    const b = sequenceTransform({ index: 1, total: 41 });
    expect(b.x - a.x).toBeGreaterThan(0); // monotonic x
    expect(a.y).toBe(0);
    expect(Math.abs(a.rotZ)).toBeLessThanOrEqual(8);
  });

  it('PROCESSION: same x layout as SEQUENCE but tilted via rotX and receding via z', () => {
    const seq = sequenceTransform({ index: 10, total: 41 });
    const proc = processionTransform({ index: 10, total: 41 });
    expect(proc.x).toBeCloseTo(seq.x, 0);
    expect(proc.rotX).toBeGreaterThan(15); // tilted up
    expect(proc.z).toBeLessThan(0); // receding away from camera
  });

  it('cardTransform: at progress=0 returns CONSTELLATION exactly', () => {
    const ct = cardTransform({ index: 0, total: 41, anchorIndex: 5, progress: 0 });
    const expected = constellationTransform({ index: 0, total: 41, anchorIndex: 5 });
    expect(ct).toEqual(expected);
  });

  it('cardTransform: at progress=1 returns PROCESSION exactly', () => {
    const ct = cardTransform({ index: 0, total: 41, anchorIndex: 5, progress: 1 });
    const expected = processionTransform({ index: 0, total: 41 });
    expect(ct.rotX).toBeCloseTo(expected.rotX, 5);
    expect(ct.z).toBeCloseTo(expected.z, 5);
  });

  it('cardTransform: at progress=0.5 is in SEQUENCE band', () => {
    const ct = cardTransform({ index: 10, total: 41, anchorIndex: 5, progress: 0.5 });
    const seq = sequenceTransform({ index: 10, total: 41 });
    expect(ct.x).toBeCloseTo(seq.x, 1);
    expect(ct.y).toBeCloseTo(seq.y, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx vitest run tests/timeline-keyframes.test.ts
```

Expected: FAIL — module `../src/components/timeline/timeline-keyframes.js` does not exist.

---

### Task 3: Keyframe math — implementation

**Files:**
- Create: `musicos-exhibition/src/components/timeline/timeline-keyframes.ts`

- [ ] **Step 1: Implement keyframe module**

```typescript
// musicos-exhibition/src/components/timeline/timeline-keyframes.ts

export interface CardTransform {
  x: number;       // px from container center
  y: number;       // px from container center (positive = down)
  z: number;       // px in 3D space (negative = away from camera)
  rotX: number;    // degrees
  rotY: number;    // degrees
  rotZ: number;    // degrees
  opacity: number; // 0..1
}

// Deterministic pseudo-random in [-1, 1] from an integer seed.
// Used so card rotations look "hand-placed" but stable across renders.
function seededJitter(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return (x - Math.floor(x)) * 2 - 1;
}

const ARC_RADIUS_X = 520;   // px — half-width of the constellation fan
const ARC_DROP_Y = 180;     // px — how far edge cards drop below center
const SEQ_SPACING = 56;     // px between card centers in sequence row
const PROC_TILT_DEG = 28;   // tilt angle of procession state
const PROC_DEPTH_SCALE = 8; // px translateZ per card index in procession

export function constellationTransform(params: {
  index: number;
  total: number;
  anchorIndex: number;
}): CardTransform {
  const { index, total, anchorIndex } = params;
  if (index === anchorIndex) {
    return { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, opacity: 1 };
  }
  // Position relative to anchor on a normalized arc parameter u in [-1, 1].
  const half = Math.max(anchorIndex, total - 1 - anchorIndex, 1);
  const u = (index - anchorIndex) / half;
  const x = u * ARC_RADIUS_X;
  // Parabolic dip: y = ARC_DROP_Y * u^2
  const y = ARC_DROP_Y * u * u;
  const rotZ = 15 * seededJitter(index); // hand-placed feel, in [-15, 15]
  return { x, y, z: 0, rotX: 0, rotY: 0, rotZ, opacity: 0.7 };
}

export function sequenceTransform(params: {
  index: number;
  total: number;
}): CardTransform {
  const { index, total } = params;
  const center = (total - 1) / 2;
  const x = (index - center) * SEQ_SPACING;
  const rotZ = 8 * seededJitter(index + 1000); // small uniform-ish jitter
  return { x, y: 0, z: 0, rotX: 0, rotY: 0, rotZ, opacity: 0.85 };
}

export function processionTransform(params: {
  index: number;
  total: number;
}): CardTransform {
  const { index, total } = params;
  const seq = sequenceTransform({ index, total });
  const center = (total - 1) / 2;
  const depthFromCenter = Math.abs(index - center);
  return {
    x: seq.x,
    y: 0,
    z: -depthFromCenter * PROC_DEPTH_SCALE,
    rotX: PROC_TILT_DEG,
    rotY: 0,
    rotZ: seq.rotZ * 0.5,
    opacity: 0.9,
  };
}

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

function lerpTransform(a: CardTransform, b: CardTransform, u: number): CardTransform {
  return {
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u),
    z: lerp(a.z, b.z, u),
    rotX: lerp(a.rotX, b.rotX, u),
    rotY: lerp(a.rotY, b.rotY, u),
    rotZ: lerp(a.rotZ, b.rotZ, u),
    opacity: lerp(a.opacity, b.opacity, u),
  };
}

// progress in [0, 1] across the whole scroll range.
// 0..0.33 = CONSTELLATION → SEQUENCE
// 0.33..0.66 = SEQUENCE (hold then transition)
// 0.66..1.0 = SEQUENCE → PROCESSION
export function cardTransform(params: {
  index: number;
  total: number;
  anchorIndex: number;
  progress: number;
}): CardTransform {
  const { index, total, anchorIndex, progress } = params;
  const p = Math.max(0, Math.min(1, progress));
  const a = constellationTransform({ index, total, anchorIndex });
  const b = sequenceTransform({ index, total });
  const c = processionTransform({ index, total });

  if (p <= 0.5) {
    const u = p / 0.5; // 0..1 across constellation→sequence
    return lerpTransform(a, b, u);
  }
  const u = (p - 0.5) / 0.5; // 0..1 across sequence→procession
  return lerpTransform(b, c, u);
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx vitest run tests/timeline-keyframes.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/src/components/timeline/timeline-keyframes.ts musicos-exhibition/tests/timeline-keyframes.test.ts
git commit -m "feat(timeline): keyframe math for three-state scroll choreography"
```

---

### Task 4: TrackCard component

**Files:**
- Create: `musicos-exhibition/src/components/timeline/TrackCard.tsx`

- [ ] **Step 1: Implement TrackCard**

```tsx
// musicos-exhibition/src/components/timeline/TrackCard.tsx
import { motion, useTransform, type MotionValue } from 'framer-motion';
import type { TrackExhibit } from '../../types.js';
import { cardTransform } from './timeline-keyframes.js';

interface Props {
  track: TrackExhibit;
  index: number;
  total: number;
  anchorIndex: number;
  progress: MotionValue<number>;
  isFocal: boolean;
  onClick: () => void;
}

export function TrackCard({ track, index, total, anchorIndex, progress, isFocal, onClick }: Props) {
  const x = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).x);
  const y = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).y);
  const z = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).z);
  const rotX = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).rotX);
  const rotZ = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).rotZ);
  const opacity = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).opacity);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="track-card"
      style={{
        x,
        y,
        z,
        rotateX: rotX,
        rotateZ: rotZ,
        opacity,
        transformStyle: 'preserve-3d',
      }}
      aria-label={`${track.position}. ${track.artist} — ${track.song}`}
    >
      {track.album_cover_url ? (
        <img src={track.album_cover_url} alt="" className="track-card__art" />
      ) : (
        <div className="track-card__art track-card__art--placeholder" />
      )}
      {(isFocal || track.is_base_node) && (
        <div className="track-card__overlay">
          <div className="track-card__year">{track.year}</div>
          <div className="track-card__artist">{track.artist}</div>
          <div className="track-card__song">{track.song}</div>
        </div>
      )}
    </motion.button>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/src/components/timeline/TrackCard.tsx
git commit -m "feat(timeline): TrackCard with scroll-driven 3D transform"
```

---

### Task 5: Stepper component

**Files:**
- Create: `musicos-exhibition/src/components/timeline/Stepper.tsx`

- [ ] **Step 1: Implement Stepper**

```tsx
// musicos-exhibition/src/components/timeline/Stepper.tsx
import type { TrackExhibit } from '../../types.js';

interface Props {
  track: TrackExhibit | null;
  index: number;
  total: number;
  visible: boolean;
}

const KIND_LABEL: Record<string, string> = {
  bassline_prototype: 'Bassline Prototype',
  groove_dna: 'Groove DNA',
  personnel_bridge_bass: 'Personnel Bridge',
  gear_lineage_bass: 'Gear Lineage',
};

export function Stepper({ track, index, total, visible }: Props) {
  if (!visible || !track) return null;

  const incoming = track.connections_in[0];
  const lateral = track.connections_lateral[0];
  const outgoing = track.connections_out[0];

  return (
    <div className="stepper" style={{ opacity: visible ? 1 : 0 }}>
      <div className="stepper__anchor">{track.is_base_node ? 'Anchor' : 'Track'}</div>
      <div className="stepper__count">{index + 1}/{total}</div>
      <div className="stepper__kinds">
        <div className="stepper__kind stepper__kind--ghost">
          {incoming ? KIND_LABEL[incoming.kind] ?? incoming.kind : ''}
        </div>
        <div className="stepper__kind stepper__kind--active">
          {lateral ? KIND_LABEL[lateral.kind] ?? lateral.kind : track.song}
        </div>
        <div className="stepper__kind stepper__kind--ghost">
          {outgoing ? KIND_LABEL[outgoing.kind] ?? outgoing.kind : ''}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/src/components/timeline/Stepper.tsx
git commit -m "feat(timeline): stepper pill with edge-kind ghosting"
```

---

### Task 6: TimelineScene container

**Files:**
- Create: `musicos-exhibition/src/components/timeline/TimelineScene.tsx`

- [ ] **Step 1: Implement TimelineScene**

```tsx
// musicos-exhibition/src/components/timeline/TimelineScene.tsx
import { useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { useLocation } from 'wouter';
import type { TrackExhibit } from '../../types.js';
import { useExhibition } from '../../store/exhibition.js';
import { TrackCard } from './TrackCard.js';
import { Stepper } from './Stepper.js';
import './timeline.css';

interface Props {
  tracks: TrackExhibit[];
}

export function TimelineScene({ tracks }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const { setMode } = useExhibition();

  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ['start start', 'end end'],
  });

  const total = tracks.length;
  const anchorIndex = Math.max(0, tracks.findIndex((t) => t.is_base_node));
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', setProgress);

  // Focal track in PROCESSION state (progress > 0.5): map progress 0.5..1 across all tracks.
  const focalIndex =
    progress > 0.5
      ? Math.min(total - 1, Math.floor(((progress - 0.5) / 0.5) * total))
      : anchorIndex;

  const captionState: 'constellation' | 'sequence' | 'procession' =
    progress < 0.33 ? 'constellation' : progress < 0.66 ? 'sequence' : 'procession';

  const onCardClick = (position: number) => {
    setMode('manual');
    navigate(`/track/${position}`);
  };

  return (
    <div ref={sceneRef} className="timeline-scene">
      <div className="timeline-scene__sticky">
        <div className="timeline-scene__stage">
          {tracks.map((track, i) => (
            <TrackCard
              key={track.position}
              track={track}
              index={i}
              total={total}
              anchorIndex={anchorIndex}
              progress={scrollYProgress}
              isFocal={i === focalIndex}
              onClick={() => onCardClick(track.position)}
            />
          ))}
        </div>
        <div className="timeline-scene__caption">
          {captionState === 'constellation' && (
            <>
              <div className="caption__sub">The Rock × Funk Translation</div>
              <div className="caption__title">Miss You · 1967 → 2024</div>
            </>
          )}
          {captionState === 'sequence' && (
            <>
              <div className="caption__sub">{total} tracks across 57 years</div>
              <div className="caption__title">Bassline DNA</div>
            </>
          )}
          {captionState === 'procession' && (
            <Stepper track={tracks[focalIndex] ?? null} index={focalIndex} total={total} visible />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/src/components/timeline/TimelineScene.tsx
git commit -m "feat(timeline): scene container with scroll-linked progress"
```

---

### Task 7: Timeline CSS

**Files:**
- Create: `musicos-exhibition/src/components/timeline/timeline.css`

- [ ] **Step 1: Write timeline.css**

```css
/* musicos-exhibition/src/components/timeline/timeline.css */

.timeline-scene {
  /* Three-state scroll: 300vh of scroll drives the choreography */
  height: 300vh;
  position: relative;
  background: #f6f6f4;
}

.timeline-scene__sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  perspective: 1400px;
  perspective-origin: 50% 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.timeline-scene__stage {
  position: relative;
  width: 100%;
  height: 60vh;
  transform-style: preserve-3d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-card {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 140px;
  height: 190px;
  margin: -95px 0 0 -70px; /* center the card on (left:50%, top:50%) */
  border: none;
  padding: 0;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  overflow: hidden;
  transform-style: preserve-3d;
  will-change: transform, opacity;
}

.track-card__art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.track-card__art--placeholder {
  background: linear-gradient(135deg, #ddd, #bbb);
}

.track-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0) 60%);
  color: #fff;
  font-family: -apple-system, 'Inter', 'Söhne', system-ui, sans-serif;
  font-size: 11px;
  line-height: 1.3;
}
.track-card__year { opacity: 0.8; }
.track-card__artist { font-weight: 600; }
.track-card__song { opacity: 0.85; font-style: italic; }

.timeline-scene__caption {
  margin-top: 32px;
  text-align: center;
  font-family: -apple-system, 'Inter', 'Söhne', system-ui, sans-serif;
}
.caption__sub {
  font-size: 13px;
  color: #888;
  letter-spacing: 0.01em;
  margin-bottom: 6px;
}
.caption__title {
  font-size: 16px;
  color: #111;
  font-weight: 500;
}

.stepper {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 16px;
  font-family: -apple-system, 'Inter', system-ui, sans-serif;
}
.stepper__anchor { font-size: 14px; color: #111; }
.stepper__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #111;
  border-radius: 50%;
  font-size: 13px;
}
.stepper__kinds {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}
.stepper__kind {
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 13px;
  border: 1px solid transparent;
}
.stepper__kind--active {
  border-color: #111;
  color: #111;
}
.stepper__kind--ghost {
  color: #bbb;
}

@media (prefers-reduced-motion: reduce) {
  .timeline-scene { height: auto; }
  .timeline-scene__sticky { position: static; height: auto; padding: 32px 0; }
}
```

- [ ] **Step 2: Verify build still passes**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add musicos-exhibition/src/components/timeline/timeline.css
git commit -m "feat(timeline): scoped CSS for inkwell-style scene"
```

---

### Task 8: Wire TimelineScene into Timeline route

**Files:**
- Modify: `musicos-exhibition/src/routes/Timeline.tsx`

- [ ] **Step 1: Replace list with TimelineScene**

Replace the entire contents of `src/routes/Timeline.tsx` with:

```tsx
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useExhibition } from '../store/exhibition.js';
import { TimelineScene } from '../components/timeline/TimelineScene.js';
import type { TrackExhibit } from '../types.js';

export function Timeline() {
  const { exhibits, load, setMode } = useExhibition();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (exhibits.length === 0) load();
  }, [exhibits.length, load]);

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');

  const startAuto = () => {
    setMode('auto');
    navigate('/track/1');
  };

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: '-apple-system, Inter, system-ui, sans-serif',
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          zIndex: 10,
          mixBlendMode: 'difference',
          color: '#fff',
        }}
      >
        <div>Miss You · Sonic Cartography</div>
        <button
          onClick={startAuto}
          style={{
            background: 'transparent',
            color: 'inherit',
            border: '1px solid currentColor',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          ▶ Play from beginning
        </button>
      </header>
      <TimelineScene tracks={tracks} />
    </>
  );
}
```

- [ ] **Step 2: Run dev server and visually verify**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npm run dev
```

Open `http://localhost:5173/`. Expected behavior:
- Page is 300vh tall.
- At scroll = 0: cards fanned in arc, anchor card centered upright.
- At scroll = 50%: cards in horizontal sequence row.
- At scroll = 100%: row tilted into 3D procession with stepper pill visible at bottom.
- Clicking a card navigates to `/track/<position>`.
- "▶ Play from beginning" still works.

- [ ] **Step 3: Type-check + tests**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add musicos-exhibition/src/routes/Timeline.tsx
git commit -m "feat(timeline): replace list with inkwell-style scroll choreography"
```

---

### Task 9: Manual QA pass

- [ ] **Step 1: Reduced motion**

In macOS System Settings → Accessibility → Display, enable "Reduce motion". Reload `http://localhost:5173/`. Expected: scene falls back to a static stack (no sticky scroll), all cards visible at once, clickable.

- [ ] **Step 2: Mobile viewport**

In browser devtools, switch to a 375×812 viewport. Expected: stage scales sensibly; cards may overlap more aggressively but are still tappable; no horizontal scroll bar.

- [ ] **Step 3: Edge cases**

- Verify cards without `album_cover_url` show the gradient placeholder.
- Verify `is_base_node` card shows year/artist overlay even when not focal.
- Verify scroll progress at exactly `0`, `0.33`, `0.5`, `0.66`, `1.0` produces visually distinct, well-formed states (no jitter, no NaN transforms).

- [ ] **Step 4: Final commit if any fixes**

If any QA issues required edits, commit them. If clean, no commit needed.

---

## Self-Review Notes

**Spec coverage check:**
- Three-state choreography (constellation / sequence / procession): Tasks 3, 6 ✓
- Card visual (album art + overlay): Task 4, 7 ✓
- Stepper pill: Tasks 5, 6 ✓
- Two-tier caption typography: Tasks 6, 7 ✓
- Click-to-navigate preserves existing manual mode flow: Task 6, 8 ✓
- "Play from beginning" CTA preserved: Task 8 ✓
- Reduced motion fallback: Task 7, 9 ✓

**Type consistency check:**
- `cardTransform`, `constellationTransform`, `sequenceTransform`, `processionTransform` — names consistent across Tasks 2, 3, 4.
- `TrackExhibit` import path `../../types.js` — consistent in Tasks 4, 5, 6, 8.
- `useExhibition` import path `../../store/exhibition.js` — consistent.

**Open question for executor:** if `framer-motion` install is blocked (offline / policy), Task 1 can be replaced with a hand-rolled `useScroll` hook using `IntersectionObserver` + `requestAnimationFrame`. Total ~40 LoC. Ask before substituting.
