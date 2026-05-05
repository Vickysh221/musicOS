# Episode Pipeline Stabilization Plan

> End-to-end workflow from "user gives anchor + focus" to "shippable episode with TTS-ready transcripts and validated audio." Replaces the ad-hoc handoffs that produced the Miss You episode.

**Goal:** Lock down a repeatable, auditable pipeline so that every new episode (next anchor, next focus) is produced by the same sequence of stages, each with explicit inputs / outputs / validators / commit gates — and so each fragility we hit during Miss You is fixed at the stage where it occurs.

**Architecture:** Six phases (0 → 5). Each phase has a dedicated skill + validator. Phase boundaries are commit gates: nothing advances until the prior phase's validator is green. Two-layer data model preserved (`maps/*.map.json` immutable lineage / `playlists/*.connections.json` per-episode narratable).

**Tech stack:** Python (registry / matching / validators) + TypeScript (build + check + fetch) + Markdown (human-authored connections, episode, playlist). Skills under `superpowers:` namespace.

---

## Phase 0 — Track Curation `superpowers:track-curator` (NEW)

**Trigger:** User provides `(anchor_song, episode_focus)` — e.g. `(rolling-stones/some-girls/miss-you, bassline_dna)`. Focus is a named theme defined in `Foundations/episode_focus_taxonomy.md` (to be created — bassline_dna, voicing, frequency_hollowing, etc.).

**Inputs (machine-pulled):**

| Source | Path | Used for |
|---|---|---|
| User red-heart export | `Foundations/网易云红心歌单_全量.md` | `hit` tier seed — affinity grounding |
| Anchor map | `maps/<anchor_slug>.map.json` | Upward / lateral / downward neighbors |
| Node registry | `data/nodes/*.json` | Cataloged candidates (already-researched) |
| Episode focus taxonomy | `Foundations/episode_focus_taxonomy.md` | Filter rule for "is this track on-focus?" |
| Sourcing principles | `docs/superpowers/plans/sonic_cartography_sourcing_principles.md` | Tier rules for any new node introduced |

**Algorithm:**

1. Anchor lookup → load `maps/<anchor_slug>.map.json` (build it via spec §3 if missing).
2. Candidate pool: union of (a) all `node_ids` in the map, (b) red-heart hits/adjacents within ±2 hops in the map's edges, (c) catalog nodes whose `tags`/`bass_dna_signature` (or focus-equivalent field) match the focus.
3. Score each candidate:
   - `+3` red-heart hit, `+1` adjacent
   - `+2` direct edge to anchor of type matching focus (e.g. bassline_dna → `direct_influence`/`methodological_descent`)
   - `+1` per fact-tier source backing focus relevance (e.g. interview citing bassline lineage)
   - `−2` if focus relevance is hypothesis-tier only
4. Apply spec §3.3 caps: ≤15 upward, ≤12 lateral, ≤20 downward — but for an *episode* the working budget is 18 tracks (configurable in `episode_config.yaml`).
5. Mark `is_base_node` (anchor), `muted_this_episode` (track present in lineage but not on-focus), and assign `position` (1..N) using the arc rules in `Foundations/sonic_cartography_spec_v0.3.md` §7B.
6. If <60% of selected tracks have `audio_url` resolvable via NetEase → hard stop; ask user to extend research budget.

**Output:**

- `playlists/<slug>.tracklist.json` — 18-row table: `{position, node_id, artist, song, year, tier, is_base_node, muted_this_episode, focus_relevance_note}`
- `playlists/<slug>.tracklist.audit.md` — per-track justification + score breakdown (sourcing self-check §8 applied)

**Validator:** `tools/validate_tracklist.py`
- Asserts: 18 rows, exactly one `is_base_node`, ≤30% hypothesis-tier focus claims, every row resolves to a node in registry, `audio_url` resolvable rate ≥60%, focus tag present on every non-muted row.

**Commit gate:** `feat(<slug>): tracklist for <focus> episode`. No advancement until validator green and user signs off on the audit doc.

**Fragility this phase fixes:** "How were these 18 tracks chosen?" was never written down for Miss You — the score/cap logic above makes it reproducible.

---

## Phase 1 — Connections Authoring `superpowers:connections-author`

**Trigger:** Phase 0 commit landed.

**Inputs:** `playlists/<slug>.tracklist.json` + `maps/<slug>.map.json` (edges) + `Foundations/sonic_cartography_spec_v0.3.md` §6 (connection_kinds_in_scope) + episode focus taxonomy.

**Process:**

1. For each ordered position pair (i, j) where the map has an edge OR thematic kinship within focus, draft a `ConnectionPair` (schema in `musicos-exhibition/scripts/lib/parse-connections.ts`).
2. Caps: ≤5 pairs per non-anchor, ≤7 per anchor, 0 muted (spec §6.x).
3. Each pair: `narration_at_from` + `narration_at_to`, both `voice_zh ≤80 chars`, `voice_en ≤30 words`, no `Track N|[|]|第N首`.
4. Set `evidence_basis` (fact|consensus|hypothesis) and `backed_by_edge_id` (must resolve to an `edges[].id` in the map).

**Output:** `playlists/<slug>.connections.json` — full schema validated by `parseConnections()`.

**Validator:** `npm run check-connections` (existing `musicos-exhibition/scripts/check-connections.ts`)
- Caps, schema, forbidden tokens, every `backed_by_edge_id` resolves.

**Commit gate:** `feat(<slug>): connections.json with N pairs`. Re-run `parseConnections` from a test that asserts validation passes.

**Fragility fixed:** the `position_labels` cast / `Array.isArray` guard from Miss You — both already in `parse-connections.ts`. Future episodes inherit those guards.

---

## Phase 2 — Transcript Workflow `superpowers:transcript-author`

**Trigger:** Phase 1 commit landed.

**The 6 stages (locked, from prior brief):**

### 2.0 Trigger preconditions
- `tracklist.json` + `connections.json` present and validated.
- Episode focus YAML loaded (decides RESONANCE template variant).

### 2.1 Input collection (per track)
Pull into the prompt context:

| Field | Source |
|---|---|
| `position`, `artist`, `song`, `year`, `tier` | `tracklist.json` |
| `is_base_node`, `muted_this_episode` | `tracklist.json` |
| `bass_dna_signature` (or focus-equivalent) | `data/nodes/<id>.json` |
| `member_dynamics`, `production_facts`, `cultural_venue` | `data/nodes/<id>.json` narrative slots |
| Inbound + outbound `ConnectionPair`s | `connections.json` filtered by `from_position`/`to_position` |
| Edge `evidence` text + `epistemic_layer` | `maps/<slug>.map.json` via `backed_by_edge_id` |
| Focus-template scaffolding | `Foundations/episode_focus_taxonomy.md` |
| Red-heart context for OPENING | `tools/build_calibration_digest.py` |

### 2.2 Per-track prompt assembly
Five-part TTS template — OPENING / FOCUS / NETWORK / RESONANCE / HANDOFF (spec §4). Caps: 250–400 ZH chars per track; 40–80 chars for muted-track bridges. Tier injects RESONANCE phrasing (hit / adjacent / blind_spot variants). Opening / Interlude / Closing use dedicated templates from the focus taxonomy.

### 2.3 Write to two files
- `episodes/<slug>.episode.md` — human-readable, `## Track N: Artist — Song (Year)` headers, transcript body verbatim.
- `episodes/<slug>.episode.json` — machine mirror with `episode_number`, `episode_focus`, `episode_arc`, per-track `narration_zh` / `narration_en` / `bridge_narration_zh` / `transcript_zh_status`.

### 2.4 Validation
- Per-track: `tools/validate_episode_transcripts.py` — char counts, forbidden tokens, focus-tag presence.
- Episode-level: `tools/validate_episode_connections.py` — every connection pair's other-side artist/song appears in the corresponding `## Track N` section (this catches the pos 4 silent-fallback bug class).
- Build-level: `npm run build-data && npm test` (the `exhibition-json.test.ts` suite).

### 2.5 Commit
`feat(<slug>): episode transcripts (N tracks, focus=<focus>)`.

**Fragility fixed:**

| # | Was | Now |
|---|---|---|
| 1 | md ↔ json hand-synced | Both written from one prompt run; cross-validator forbids drift |
| 2 | char/forbidden/coverage manual | `validate_episode_transcripts.py` runs in CI |
| 3 | `findEpisodeNarration` brittle on subtitled songs | Bidirectional `startsWith` (already landed) + validator asserts every position resolves |
| 4 | RESONANCE not tier-injected at build | Template bound to tier in prompt assembler, not at build time |
| 5 | TTS template inline in author's head | `Foundations/episode_focus_taxonomy.md` holds canonical per-focus templates |
| 6 | No skill | `superpowers:transcript-author` defined, gating on the validators above |

---

## Phase 3 — Build Pipeline (existing, hardened)

**Trigger:** Phase 2 commit landed.

**Steps:**

1. `npm --prefix musicos-exhibition run build-data` — runs `build-exhibition-json.ts`:
   - Reads `playlists/<slug>.connections.json` + `episodes/<slug>.episode.md` + `data/nodes/*.json`.
   - Preserves `audio_url` / `album_cover_url` / `duration_seconds` / `unavailable` from previous build via `prevAudio` Map (already landed — fragility fix from Miss You audio outage).
   - Emits `musicos-exhibition/data/exhibition.json`.
2. `npm --prefix musicos-exhibition test` — `exhibition-json.test.ts` (16 assertions, includes audio-preservation check).
3. `npm --prefix musicos-exhibition run fetch-audio` — only if any track has `audio_url === null` AND `netease_song_id !== null`. Idempotent; safe to skip.

**Validator:** test suite + manual smoke (`npm --prefix musicos-exhibition run dev`, click track 1, confirm audio plays).

**Commit gate:** `chore(<slug>): rebuild exhibition.json` if any data fields changed.

---

## Phase 4 — Validation Harness (consolidated)

A single `make validate-episode SLUG=<slug>` target that runs, in order:

1. `tools/validate_tracklist.py <slug>` (Phase 0)
2. `npm run check-connections <slug>` (Phase 1)
3. `tools/validate_episode_transcripts.py <slug>` (Phase 2)
4. `tools/validate_episode_connections.py <slug>` (Phase 2)
5. `npm --prefix musicos-exhibition run build-data && npm test` (Phase 3)

CI runs this on PR. No episode merges without green.

---

## Phase 5 — Skill Consolidation

Three new skills under `superpowers:`:

- `track-curator` — owns Phase 0. Inputs: `(anchor, focus)`. Output: `tracklist.json` + audit.
- `connections-author` — owns Phase 1. Inputs: `tracklist.json` + map. Output: `connections.json`.
- `transcript-author` — owns Phase 2. Inputs: `connections.json` + nodes. Output: `episode.md` + `episode.json`.

Each skill:
- Loads its phase's spec section + sourcing principles §8 self-check.
- Refuses to start if the prior phase's commit gate isn't green.
- Ends by running its own validator and reporting result before handing off.

A meta-skill `episode-pipeline` orchestrates 0 → 5 for a one-shot `(anchor, focus) → shipped episode` run, dispatching the per-phase skills as subagents.

---

## What this plan does NOT include (deliberate)

- **Audio mastering / TTS synthesis** — out of scope; episode.json is the handoff to the TTS service.
- **Map authoring** (`maps/<slug>.map.json`) — already covered by `Foundations/sonic_cartography_spec_v0.3.md` §3 anchor-expansion workflow. Phase 0 *consumes* the map; building it is upstream of this plan.
- **Frontend rendering** — exhibition.json is the contract; UI changes are independent.

---

## Migration / next action

Miss You is the reference episode and has retroactively been carried through phases 1–3. To validate the new plan:

1. Pick the next anchor + focus the user wants to ship.
2. Run Phase 0 from scratch with `track-curator`.
3. Confirm the validators catch the same fragilities Miss You hit (re-run with synthetic broken inputs).
4. If green, this plan is locked.
