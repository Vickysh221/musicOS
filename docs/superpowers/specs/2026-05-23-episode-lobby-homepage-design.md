# Episode Lobby — Project Homepage Design

**Date:** 2026-05-23
**Surface:** `musicos-exhibition/` React app, new `/` home route
**Status:** Approved (design), pending implementation plan

---

## 1. Goal

Build a project homepage ("episode lobby") that showcases all current episodes (ep1–ep6) as a
sparse field of floating album covers on a grid canvas, inspired by lusano.com's composition.
Core interaction: hovering one episode turns the rest of the canvas into a live preview of that
episode's tracklist. Two episodes (ep1, ep4) get an album-stacking transition that morphs the
scattered covers into their Timeline side-stacked procession.

PC widescreen only this pass — no mobile breakpoint, no pan/zoom chrome.

---

## 2. Visual surface

- **Dark grid canvas** (decided): faint grid-paper lines over the app's `#000` surface; keeps the
  existing gold "now playing" identity. Borrows Lusano's *layout language* (grid, crosshair,
  deliberate emptiness), not its cream palette.
- Center `+` crosshair, low-contrast.
- Minimal chrome: wordmark top-left; an `EP 1–6` / count indicator top-right. No filter row, no
  zoom `[+|-]`, no `%` indicator (those belong to Lusano's pan/zoom model, which we drop).
- Fixed-frame, non-scrolling per the app-shell rules (`html, body, #root { height:100%; overflow:hidden }`).
  Canvas fills the frame; everything composes inside it.

## 3. Idle state

- ~14 floating cover slots scattered across the frame, **biased toward edges/corners** so the center
  and large gutters stay empty (room for hover previews + crosshair/chrome).
- Each of the 6 episodes owns 2–3 slots, showing its anchor cover + a representative track cover.
- Each slot carries: a viewport-% position, a **depth tier** (subtle scale/opacity to suggest
  layering), and an independent slow **auto-drift** loop (±10–20px translate + tiny rotate,
  ~12–20s, staggered phases).
- `prefers-reduced-motion`: drift disabled, covers static.

## 4. Hover → tracklist preview

- Hover any cover → its episode becomes active.
- The hovered cover **lifts/scales slightly and stays**; **every other floating slot cross-fades
  its image to a cover from the active episode's tracklist** (slot index → track index; show ~13
  of the 18–20 tracks). Positions do not move — only the imagery swaps.
- Mouse-leave → restore the resting set.
- Cross-fade ≈250–350ms, using the codebase's framer-motion spring vocabulary
  (`type:'spring', stiffness:220, damping:26, mass:0.6`) / `AnimatePresence` for image swap.
- Effect reads as "the whole room becomes this episode" while preserving the whitespace requirement.

## 5. Click → episode navigation

- Click a cover → navigate to `/epN` (wouter).
- **ep1 & ep4 (Timeline route, side-stacked procession):** on click, floating covers animate into a
  sideways stack matching the Timeline procession geometry, then route. Implementation is an
  approximated shared-element: **play a stacking exit animation on Home, mount Timeline already in
  its stacked state** so it reads as one continuous morph. Pixel-perfect cross-route shared element
  is explicitly out of scope; we iterate on fidelity.
- **ep2/3/5/6 (EpisodeFocal route):** simple fade transition for now.

## 6. Data

- On Home mount, fetch all 6 episode JSONs in parallel and extract only
  `{ episodeId, anchorCover, trackCovers[] }` into a lightweight home-local structure.
- **Must not clobber** the per-episode `exhibition` zustand store (it loads one episode at a time).
  Home keeps its manifest in local state or a small dedicated store.
- Cover paths resolved through `assetUrl()` (`src/lib/asset-url.ts`), respecting `VITE_AUDIO_BASE`.
- Episode titles/anchor metadata available from `src/lib/episodes.ts` (`EPISODES`).

## 7. Components & files

- `src/routes/Home.tsx` — route shell: loads manifest, owns `hoveredEpisode` state, orchestrates.
- `src/components/home/FloatingCanvas.tsx` (+ `floating-canvas.css`) — grid backdrop, crosshair, chrome, slot layout.
- `src/components/home/FloatingCover.tsx` (+ `floating-cover.css`) — single slot: drift loop, hover lift, image cross-fade, click handler.
- `src/components/home/home-layout.ts` — the ~14 slot positions, depth tiers, episode→slot assignment, drift params (co-located layout math, mirroring `focal/layouts/`).
- App wiring: replace `/`→`/ep1` redirect in `App.tsx` with `<Home/>`.

## 8. Conventions (must follow)

- Plain per-component CSS, BEM-ish (`.floating-cover`, `.floating-cover__art`, `.floating-cover--active`).
- CSS custom properties per component for sizing knobs; no global `tokens.css`.
- Local imports keep `.js` extension. TypeScript everywhere.
- framer-motion for layout/entrance/exit; CSS `@keyframes` only for continuous decorative motion.
- Subscribe to stores via selectors.

## 9. Out of scope (this pass)

- Mobile / `<640px` layout.
- Lusano pan/zoom infinite canvas, zoom `%`, filter row.
- Pixel-perfect cross-route shared-element transition (approximation only).
- Audio playback from the homepage.

## 10. Validation

From `musicos-exhibition/`: `npm run dev` (verify drift, hover swap, ep1/ep4 stack transition,
whitespace), `npm test`, `npm run build`.
