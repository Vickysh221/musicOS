# MusicOS Vault — Agent SOP

This vault implements Sonic Cartography: a system for mapping music genealogy from a chosen
anchor outward, overlaying the user's listening data, and producing annotated playlists.

**Full spec:** `Foundations/sonic_cartography_spec_v0.4.md` — read it before starting any task.

**Sourcing principles:** `docs/superpowers/plans/sonic_cartography_sourcing_principles.md` — read it before any generative task (map expansion, playlist annotation, episode narration, fact-check pass). Core rule: every `fact`-tier claim requires ≥2 independent sources, at least 1 Tier 1–2. Run the §8 self-check before every delivery.

**Episode audio pipeline:** `docs/episode_audio_pipeline.md` — runbook for transcript → TTS narration → music fusion → exhibition wiring, including the YouTube-fallback for missing/truncated audio sources. Read before producing audio for any new episode.

---

## Core architectural rule: nodes are permanent singletons

A song by an artist is **one permanent node** in this vault. It does not belong to any single
anchor expansion. Different versions of the same song share the same node unless a version has
distinct historical significance as a separate cultural artifact (e.g. a re-recording that
launched a separate movement).

**Before creating a node:**
```python
from tools.node_registry import node_exists, put_node
if node_exists(node_id):
    put_node(node, enrich=True)   # add new narrative data, never duplicate
else:
    put_node(node)                # create new
```

Never embed full node objects in a map file. Maps store `node_ids` (references).

---

## Data files

- `data/user_tracks.json` — 1690 red-heart tracks, normalized from NetEase Cloud export
- `data/nodes/<node_id>.json` — global node registry (one file per node)
- `tools/coverage.py` — coverage computation utility (spec §4.2)
- `tools/node_registry.py` — node CRUD: `node_exists`, `get_node`, `put_node`, `update_all_coverage`, `resolve_map`
- `maps/<anchor_slug>.map.json` — anchor + `node_ids[]` + inline `edges[]`
- `playlists/<anchor_slug>.playlist.md` — annotated playlist for each expansion (text/visual mode)
- `episodes/<anchor_slug>.episode.json` — audio episode script + stitching manifest (audio mode, spec §7B)
- `episodes/<anchor_slug>.episode.md` — human-readable episode for review before TTS synthesis
- `anchors/backlog/<slug>.idea.md` — parked anchor ideas not yet ready for expansion (see `anchors/backlog/README.md` for schema)

---

## Anchor backlog (parked ideas)

Before expanding, check `anchors/backlog/` — record-store finds, passing thoughts, and other un-scoped anchor candidates park here. Each `<slug>.idea.md` carries frontmatter (`status`, `surfaced_on`, `source`, `candidate_anchor`) plus free-form notes (coverage signal, candidate focus axes, open decisions, research breadcrumbs). When the user says "let's record this idea for later" or surfaces an anchor without committing to expansion, write a new idea file there rather than starting a map. When greenlit, the idea file becomes the kickoff brief; flip its `status` to `in_progress` once `maps/<slug>.map.json` exists. Full schema: `anchors/backlog/README.md`.

---

## Map JSON structure

```json
{
  "map_id": "<anchor_slug>",
  "anchor_node_id": "<anchor_slug>",
  "spec_version": "0.2",
  "generated_at": "<ISO timestamp>",
  "expansion_notes": "",
  "node_ids": ["node-id-1", "node-id-2", ...],
  "edges": [
    {
      "id": "edge_...",
      "type": "direct_influence|same_era_dialogue|genealogical_descent|translation|hybridization|inversion|methodological_descent",
      "source_node_id": "...",
      "target_node_id": "...",
      "evidence": "...",
      "epistemic_layer": "fact|consensus|hypothesis",
      "sources": [...]
    }
  ]
}
```

---

## Anchor expansion workflow

1. **Load the spec.** Read `Foundations/sonic_cartography_spec_v0.4.md` fully.
2. **Load user tracks.** `from tools.coverage import load_tracks; tracks = load_tracks('data/user_tracks.json')`
3. **Confirm anchor.** Propose 2–4 candidates per spec §3.5 if user hasn't specified. Never auto-select.
4. **Expand map.** Three axes (upward/lateral/downward), depth caps 15/12/20, stopping rules §3.3.
5. **For each node:** check registry first → `put_node(enrich=True)` if exists, `put_node()` if new.
6. **Compute coverage.** `from tools.node_registry import update_coverage_for_node`. Run after each node is saved.
7. **Research.** ≤25 web searches, ≤15 web fetches. Cite epistemic tier per §4.3. Apply double-reference rule per sourcing principles (see above): fact-tier claims need ≥2 independent sources; downgrade or remove if unverifiable. Extra caution on chart positions, personnel, equipment, direct quotations.
8. **Narrative slots.** Priority: production_facts → member_dynamics → cultural_venue → instrumentation_details → release_circumstances.
9. **Self-check.** Run spec §9.3 checklist. Use `resolve_map()` to dereference node_ids for inspection.
10. **Write output.** `maps/<slug>.map.json` + `playlists/<slug>.playlist.md` + (if audio mode) `episodes/<slug>.episode.json` + `episodes/<slug>.episode.md`.

---

## User aesthetic mechanisms (spec §6)

- **M1 translation_aesthetic (基因穿外套):** two lineages audibly separable — prefer these nodes
- **M2 ancestor_visit_only:** one or two ancestor tracks confirms lineage — don't recommend deep dives
- **M3 member_period_attention:** populate `member_dynamics` when a specific band member drove the pivot
- **M4 frequency_hollowing (留白偏好):** sparse, deliberately incomplete frequency spectrum

---

## Slug convention

`<artist-slug>_<album-slug>_<primary-track-slug>` — lowercase, spaces → hyphens, drop special chars.
Example: `rolling-stones_some-girls_miss-you`

---

## Album cover assets

封面文件位于 `musicos-exhibition/public/covers/`，命名规则 `<NN>_<artist-slug>_<track-slug>.jpg`（NN 与节目曲序对应）。

**当某条曲目封面缺失时，允许联网搜索并下载补齐**：
1. 优先源：官方厂牌页、Wikipedia/Wikimedia、MusicBrainz Cover Art Archive、Discogs、Apple Music / Spotify 公开页、艺人官网。避免来源不明的二改图、粉丝拼贴、低分辨率缩略图。
2. 选图标准：原版专辑/单曲封面，正方形，长边 ≥ 1000px；若仅有竖版/横版海报，需注明来源后再用作降级方案。
3. 落盘：保存为 JPG（必要时由 PNG/WebP 转码），放入 `musicos-exhibition/public/covers/`，沿用现有命名规则；同步检查 `data/exhibition.json` 中对应条目的 `cover` 字段是否指向新文件。
4. **压缩**（必须）：运行 `bash tools/compress_cover.sh <file_path>` 或 `bash tools/compress_cover.sh musicos-exhibition/public/covers/` 批量处理。标准：长边 ≤ 1200px、JPEG q=82（过大自动降级至 q=75）、目标 ≤ 500KB。
5. 记录来源：在提交说明或 PR 描述中给出图片来源 URL，便于版权核查。无法找到合规来源时停下并报告，不要用占位图静默替换。

## Hard stops (spec §9.1)

Stop and report if: axis hits hard cap AND user hasn't extended budget; >30% hypothesis edges;
<60% playlist tracks have any platform link.

---

## Reference expansion

`maps/rolling-stones_some-girls_miss-you.map.json` + `playlists/rolling-stones_some-girls_miss-you.playlist.md`
are the calibration reference (spec §10). When in doubt about structure or density, check those files.
Miss You is the first expansion in a growing vault — future sessions expand from any anchor.

---

## Figma MCP Integration Rules

These rules apply whenever a Figma design (figma.com URL, FigJam, Figma Make, or screenshot referenced as a Figma frame) is being translated into the `musicos-exhibition/` React app. They override generic Figma plugin output to keep the codebase consistent with the existing focal/timeline component family.

### Stack the agent must target

- **Framework:** React 19 + TypeScript, Vite 8. No Next.js, no SSR.
- **State:** zustand stores in `musicos-exhibition/src/store/` (`exhibition.ts`, `tuning.ts`). Subscribe with selectors (`useExhibition((s) => s.exhibits)`), not destructured wholesale.
- **Routing:** `wouter`. Routes live in `musicos-exhibition/src/routes/`.
- **Animation:** `framer-motion`. Use `motion.*` + `AnimatePresence` for entrance/exit; reach for raw CSS transitions only when the property isn't layout-driven.
- **Languages:** TypeScript everywhere. Local relative imports MUST use the `.js` extension (e.g. `from '../../store/exhibition.js'`) — this is the project's ESM convention; do not strip it.
- **Path alias:** `@/` → `musicos-exhibition/src/` (configured in `vite.config.ts`).

### Required Figma flow (do not skip)

1. Run `get_design_context` on the exact node first. Record fileKey + nodeId.
2. If the response is truncated or too broad, call `get_metadata` for the high-level node tree, then re-fetch the leaf node(s) with `get_design_context`.
3. Run `get_screenshot` for visual reference of the variant being implemented. Keep it open while writing code.
4. If the node has assets (covers, illustrations, SVG glyphs), resolve them through the localhost source returned by the MCP server. **Never** invent placeholder URLs and never install a new icon package — assets come from the Figma payload or from `musicos-exhibition/public/`.
5. Translate the React+Tailwind output into this project's plain-CSS / BEM convention (see below). Tailwind utility classes are reference output, not final code.
6. Validate the rendered UI against the screenshot for 1:1 visual + behavior parity before declaring the task complete.

### Component organization

- Feature components live in feature folders: `src/components/focal/` (now-playing scene), `src/components/timeline/` (episode timeline), `src/routes/` (top-level views), and the cross-cutting `src/components/` root for shared shells (`Sidebar.tsx`, `GlobalPlayer.tsx`, `NowPlayingBar.tsx`).
- New Figma-derived components: pick the closest feature folder; create a new sibling folder only if the design clearly introduces a new surface family.
- File naming: components are `PascalCase.tsx`; their stylesheet sibling is `kebab-case.css` matching the component name (e.g. `FocalDisc.tsx` ↔ `focal-disc.css`, `MentionArcs.tsx` ↔ `mention-arcs.css`).
- Each component imports its own stylesheet at the top of the file: `import './focal-disc.css';`.
- Sub-helpers (layout math, presets) co-locate with the component: see `src/components/focal/layouts/` and `src/components/timeline/timeline-keyframes.ts`.
- Hooks go in `src/hooks/` (`useFusionSubtitle`, `useCurrentAndNext`, `useAudioAnalyser`). Pure logic + tests go in `src/lib/` next to a `.test.ts` sibling.

### Styling conventions

- **No Tailwind, no CSS Modules, no styled-components.** Plain `.css` per component.
- **Class names use BEM-ish selectors:**
  - block: `.focal-disc`
  - element: `.focal-disc__art`, `.focal-disc__spinner`, `.focal-disc__shimmer`
  - modifier: `.focal-disc--focal`, `.focal-disc--playing`, `.mention-arcs--dimmed`
- **Design tokens are CSS custom properties declared per-component**, not in a global tokens file. Use `var(--disc-size, 220px)` style fallbacks for sizing knobs. There is intentionally no `tokens.css`; do not create one without asking.
- **Color values:** the app surface is dark (`body { background: #000 }`). Whites and translucents use `rgba(255, 255, 255, …)`; gold accent for the "currently playing" state appears throughout the focal scene — match the existing hex/rgba in the same file when possible rather than introducing a new shade.
- **Type stack:** `'PingFang SC', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif` for narrative text; `ui-monospace, "SF Mono", monospace` for IDs and timestamps. Match these when translating Figma's font tokens.
- **Layering:** `z-index` is reserved for stacking known surfaces (mention arcs at 1100, popups higher). Don't introduce arbitrary z-index numbers — read the surrounding stylesheet first.
- **No `border-left`/`border-right` >1px as colored accent stripes** (project + design-system convention). No gradient text.
- **Comments in CSS** are encouraged when the why is non-obvious — see `focal-disc.css` for the precedent (Figma node references inline). Match that voice if the design has subtle craft decisions worth capturing.

### App shell (don't break these)

- `html, body, #root { height: 100%; overflow: hidden; overscroll-behavior: none; }` — the app is a fixed-frame surface, never a scrolling page. New Figma frames must respect this; long content scrolls inside its own container.
- `.app-content { margin-left: 52px }` — the collapsed sidebar reserves this gutter on viewports >640px. Do not add margins that fight it.
- Mobile breakpoint: `@media (max-width: 640px)` collapses the sidebar gutter. New responsive Figma variants should target the same breakpoint unless the design explicitly defines a new one.

### Asset handling

- **Cover images:** `musicos-exhibition/public/covers/<NN>_<artist-slug>_<track-slug>.jpg` (NN matches episode position). Naming convention is enforced — see "Album cover assets" above. Cropping policy: square, long edge ≤1200px, JPEG q=82, target ≤500KB; run `bash tools/compress_cover.sh` after dropping in new files.
- **Audio fusion:** `public/audio_fusion/<epN>/<NN>_<artist-slug>_<track-slug>.mp3` plus matching subtitle sidecars. Driven by `tools/batch_synthesize_episode.py`; the Figma agent should not hand-edit these.
- **Textures / static art** from Figma: drop into `public/focal-textures/` (or a new sibling folder under `public/` named for the surface), then reference with a leading `/` path. For audio assets that may switch to a CDN, route through `assetUrl()` from `src/lib/asset-url.ts` instead of a raw string — it respects `VITE_AUDIO_BASE`.
- **SVG/icon assets:** if the Figma payload returns a localhost source, use it directly. **Do not** add `lucide-react`, `react-icons`, `phosphor`, or any icon package — there is no icon library in this project, and a Figma-driven feature is not the place to introduce one.
- **No placeholder data URIs.** If the asset can't be resolved through Figma or already exists in `public/`, stop and report.

### Wiring + data shape

- Track / episode data flows through the zustand exhibition store. New surfaces that need track context subscribe via `useExhibition((s) => …)` rather than threading props from the route.
- Episode-specific aliases live in `src/data/ep<N>-aliases.ts` and are aggregated by `src/data/episode-aliases.ts`. New episodes follow the same file shape.
- Callback / mention detection runs through `src/lib/callback-phrase.ts` + `src/lib/callbackDetection.ts`. Re-use these — don't re-implement phrase matching in a component.
- Subtitle + transcript helpers: `src/lib/transcript-paragraphs.ts`, `src/hooks/useFusionSubtitle.ts`. Treat them as the single source of truth for "what's on screen at time t".

### Animation rules

- Layout-driven motion (entrance, exit, position swap) goes through framer-motion (`motion.div`, `AnimatePresence`, `layout` prop where appropriate).
- Continuous decorative motion (vinyl spin, shimmer) uses CSS `@keyframes` paused via a modifier class (see `.focal-disc--playing .focal-disc__spinner` for the precedent).
- Easing: ease-out exponentials for UI (`cubic-bezier(0.4, 0, 0.2, 1)` already used in `app.css`). No bounce, no elastic.
- Respect `prefers-reduced-motion` when the surface includes large or persistent motion (covers spinning, shaders pulsing).

### Validation

After a Figma-driven change, run from `musicos-exhibition/`:

```bash
npm run dev          # visual verification — open the changed surface, exercise focal/timeline interactions
npm test             # vitest run — must stay green; many lib helpers are tested
npm run build        # ensures TS + Vite both pass
```

If the change touches data shape (`exhibition.json`, episode aliases, callback rules), also run `npm run build-data` and `npm run sync-data` before manual verification.

### Don'ts (Figma-specific)

- Don't paste raw Tailwind classes into `.tsx` — the project has no Tailwind runtime.
- Don't add a global `tokens.css` or design-system theme file unless explicitly asked — the convention is per-component CSS custom properties.
- Don't introduce icon libraries, UI kits (MUI, Chakra, shadcn, etc.), or CSS-in-JS.
- Don't re-export Figma's auto-generated component names verbatim if they fight the existing BEM block names — rename to match the surface family (e.g. a Figma "DiscPlayer/Frame4" becomes `FocalDisc` here).
- Don't strip the `.js` extension from local imports during a Figma-driven refactor.
