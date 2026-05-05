# Spec 0.3 → 0.4 PR Plan

> **Status**: DRAFT — produced 2026-05-06; revised 2026-05-06 per `docs/INSTRUCTIONS_ROUND_3.md` (scope tightened: `musicological_signature` deferred to v0.4.1)
> **Author**: Claude Code (Opus 4.7)
> **Companion docs**: `Foundations/sonic_cartography_spec_v0.4-draft.md`, `docs/spec-0.4-decisions-log.md`
> **Scope**: this is a sequencing plan. No code is written here; each PR is a self-contained work package with explicit acceptance criteria. Target single-PR diff size: ≤ 300 lines.
> **R3 deltas**: PR-2A (node musicological_signature backfill) and PR-5C (validate_sound_cue_present.py) are **REMOVED from this round** and pushed to v0.4.1. Total PRs: 13 → 11.

---

## Sequence summary (waves)

```
Wave 0  Spec merge + version handshake             [serial, blocks all]
   └─→ Wave 1  Spec-only merge to main             [serial]

Wave 2  Data layer backfill                        [parallel, 2 PRs]
   ├─ PR-2B: tracklist narrative_weight
   └─ PR-2C: connections.json schema migration
   (PR-2A removed — musicological_signature node backfill deferred to v0.4.1)

Wave 3  Upstream skill revision                    [serial after Wave 2]
   ├─ PR-3A: connections-author foreshadow default
   └─ PR-3B: connections-author intrinsic_score
            (PR-3B may run parallel with PR-3A after PR-2C)

Wave 4  Downstream skill revision                  [serial after Wave 3]
   ├─ PR-4A: transcript-author SKILL rewrite
   ├─ PR-4B: focus_taxonomy.md restructure
   └─ PR-4C: Miss You ep 1 reference rebuild

Wave 5  Validator + exhibition sync                [parallel, 3 PRs]
   ├─ PR-5A: validate_episode_transcripts.py weight bands
   ├─ PR-5B: validate_episode_connections.py strong/archived semantics
   └─ PR-5D: musicos-exhibition build/test sync
   (PR-5C removed — validate_sound_cue_present.py deferred to v0.4.1)

Wave 6  v0.4 ratification                          [serial, last]
   └─ PR-6:  rename spec to v0.4 + delete v0.4-draft + bump artifacts
```

**Total PRs**: 11 (1 spec + 2 data + 2 upstream skill + 3 downstream skill + 3 validator/exhibition + 1 ratification). PR-2A and PR-5C deferred to v0.4.1.

---

## Wave 0/1 — Spec merge

### PR-1: Adopt v0.4 spec draft

**Changes**

- Promote `Foundations/sonic_cartography_spec_v0.4-draft.md` → `Foundations/sonic_cartography_spec_v0.4.md`.
- Add `Foundations/sonic_cartography_spec_v0.3.md` legacy banner: "frozen — see v0.4".
- Update `CLAUDE.md` reference path from v0.3 to v0.4.
- Add `docs/spec-0.4-decisions-log.md` (already drafted) and `docs/spec-0.3-to-0.4-pr-plan.md` (this file) to vault root index.

**Why**: nothing else has authority to change until the contract is adopted. spec is the upstream of all downstream waves.

**Depends on**: nothing.

**Risks**: low. No code paths affected. CLAUDE.md path update is the only execution-affecting change — agents in flight may have cached v0.3 behavior.

**Acceptance**:
- All three documents land on `main`.
- `grep -r "spec_v0.3" Foundations/ docs/` returns only the legacy banner reference.
- A test agent invoked via `/track-curator` or `/transcript-author` verifies it can read v0.4 spec successfully.

**Diff estimate**: ≤ 50 lines (path bumps + banner).

---

## Wave 2 — Data layer backfill

These two PRs are independent and can run in parallel. Wave 3 cannot start until both are merged.

> **R3 note**: PR-2A (node `musicological_signature` backfill) is removed from this round. In v0.4 the sound-cue OPENER is sourced via prompt elicitation (training knowledge → node facts → scene/motivation fallback). Data-layer backfill is deferred to v0.4.1.

### PR-2B: Add `narrative_weight` to tracklist + assign Miss You ep 1

**Changes**

- Add `narrative_weight` field to `playlists/<slug>.tracklist.json` schema.
- Assign weights to 18 Miss You ep 1 tracks:
  - `anchor`: position 6 (Miss You)
  - `pillar`: positions 1 (Cold Sweat), 9 (Good Times), 11 (Once in a Lifetime), 17 (María También) — `[NEEDS_USER_DECISION #5]` to confirm
  - `bridge`: position 8 (Devo Jocko Homo) — current `muted_this_episode: true`
  - `supporting`: all other 12 tracks
- Update `track-curator` skill (`~/.claude/skills/track-curator/SKILL.md`) to require `narrative_weight` assignment as part of Phase 0 output.
- Document the deprecation path for `muted_this_episode` (one-version legacy, removed in v0.5).

**Why**: spec 0.4 §2.4; D6.

**Depends on**: PR-1 merged.

**Risks**:
- Per-episode subjectivity: which tracks are "pillars" varies by curator judgment. Decision-log captures Miss You ep 1's assignment as a worked example.
- track-curator skill update may interact with concurrent Phase 0 work on other anchors. Land this PR before any new episode's Phase 0 is run.

**Acceptance**:
- `playlists/rolling-stones_some-girls_miss-you.tracklist.json` has all 18 tracks with valid `narrative_weight`.
- `tools/validate_tracklist.py` (existing) is extended to require `narrative_weight ∈ {anchor, pillar, supporting, bridge}` and exactly one `anchor`.
- Sum of bridge tracks ≤ 10% of total tracks (advisory check, warning not failure).

**Diff estimate**: ~80 lines (1 JSON file edit + skill text + validator extension).

### PR-2C: Migrate `connections.json` to v0.4 schema (foreshadow tri-state)

**Changes**

- Migrate `playlists/rolling-stones_some-girls_miss-you.connections.json`:
  - Drop `direction` field (deprecated; semantics moved to from/to position ordering + foreshadow modes).
  - Convert `narration_at_from` → `narration_modes.foreshadow_anonymous_at_from`. **Strip explicit song-name references**: e.g. "等会儿到 The Rolling Stones 的 Miss You,..." → "等会儿到 1978 年那次最公开的翻译,..." or similar anonymized form. This is a **content rewrite**, not a pure rename. Each pair will need editorial pass.
  - Convert `narration_at_to` → `narration_modes.callback_named_at_to`. Names are preserved (callback can name).
  - Add empty `narration_modes.foreshadow_named_at_from: null` for all pairs (only populated in PR-3A on demand).
  - Add `intrinsic_score: { value: null, ... }` placeholder objects for all pairs (filled in PR-3B).
- Update `playlists/<slug>.connections.json` schema in spec §7B.12.

**Why**: spec 0.4 §7B.12 / §7B.13; D2, D3.

**Depends on**: PR-1 merged. Independent of PR-2A and PR-2B.

**Risks**:
- **High editorial risk**: stripping song names from `voice_zh` is a per-pair content rewrite. Quality of anonymization affects whether downstream Phase 2 can still feel guided. Recommend doing this PR with the user reviewing 5–10 sample anonymizations before proceeding to all pairs.
- Potential conflict if `connections-author` is invoked on another anchor concurrently — but no other episode in flight at the time of writing.

**Acceptance**:
- All ConnectionPairs in Miss You ep 1's connections.json have:
  - No `direction` field.
  - Non-empty `narration_modes.foreshadow_anonymous_at_from.voice_zh` and `voice_en`.
  - Non-empty `narration_modes.callback_named_at_to.voice_zh` and `voice_en`.
  - `narration_modes.foreshadow_named_at_from = null`.
- A `grep` over `foreshadow_anonymous_at_from.voice_zh` returns ZERO future-position artist names.
- `intrinsic_score.value` is null on all pairs (PR-3B fills this).

**Diff estimate**: ~250–300 lines (connections.json is large; structural rewrite).

**Time estimate (R3)**: 3–5 hours. Sample-then-bulk: produce 5–10 anonymized samples first, gate on user review (R3 §6.2 stop-gate), then complete the bulk migration.

---

## Wave 3 — Upstream skill (connections-author)

### PR-3A: connections-author Phase 1 default behavior change

**Changes**

- Edit `~/.claude/skills/connections-author/SKILL.md`:
  - Default outbound narration mode changed from "name target track" to `foreshadow_anonymous_at_from`.
  - Document the `foreshadow_named_at_from` opt-in: produced ONLY on explicit request from Phase 2 for Opening/Interlude/Closing usage.
  - Add explicit examples of correct anonymized phrasing.
  - Add explicit prohibition of em-dash as primary connector, with examples of sentence-rhythm alternatives.

**Why**: spec 0.4 §7B.13; D3 root cause is in Phase 1.

**Depends on**: PR-2C merged (schema must accept the new fields).

**Risks**:
- Skill editing is per-user-account. Verification that skill updates apply (no caching) is needed.
- Quality of anonymized prose depends on LLM judgment. Provide 3–4 worked examples in the skill text as anchors.

**Acceptance**:
- A test invocation of `connections-author` on a synthetic anchor produces a connections.json where 100% of `foreshadow_anonymous_at_from.voice_zh` entries pass a grep for forward-position artist names (zero leaks).
- Em-dash usage in `voice_zh` < 1 per 200 chars (advisory).

**Diff estimate**: ~150 lines (skill text + examples).

### PR-3B: connections-author intrinsic_score generation

**Changes**

- Edit `~/.claude/skills/connections-author/SKILL.md`:
  - Add Stage 1.X: for each ConnectionPair, score on four dimensions (story_drive, concrete_carrier, evidential_strength, focus_relevance) and aggregate into `intrinsic_score.value`.
  - Document the rubric for each dimension with concrete examples.
- Backfill `intrinsic_score` for all 67(?) ConnectionPairs in Miss You ep 1's connections.json. (Exact count to be confirmed when PR is opened.)

**Why**: spec 0.4 §7B.12; precondition for D2 fix in Wave 4.

**Depends on**: PR-2C merged (schema must accept). PR-3A is independent and may run concurrently.

**Risks**:
- LLM scoring is subjective. Decision-log captures the four-dimensional rubric with examples to constrain drift.
- Score weights (0.30/0.25/0.20/0.25) may need tuning after first usage. Locked for v0.4; reviewable for v0.4.1.

**Acceptance**:
- All ConnectionPairs in Miss You ep 1 have non-null `intrinsic_score.value` in [0, 1].
- Manual spot-check on 5 pairs: scoring rationale matches the four-dimensional rubric.
- Distribution check: scores are not bimodal (all 0 or all 1) — a healthy spread suggests the LLM engaged the rubric.

**Diff estimate**: ~200 lines (skill text + JSON backfill).

---

## Wave 4 — Downstream skill (transcript-author)

### PR-4A: transcript-author SKILL rewrite

**Changes**

- Edit `~/.claude/skills/transcript-author/SKILL.md`:
  - Remove Stage 2.2 5-part TTS template (OPENING/FOCUS/NETWORK/RESONANCE/HANDOFF).
  - Replace with the 6-layer logical order from spec §7B.5: sonic identification → scene → motivation → action → one echo → restraint.
  - Per-track length budget: read `narrative_weight` from tracklist, apply weight-conditioned char band (anchor 600–900, pillar 350–500, supporting 220–340, bridge 60–150).
  - Strong-connection rule: per non-anchor non-bridge track, select exactly one ConnectionPair as `selected_as_strong: true`, drawn from the LLM-ranked top-3 candidate list. Other inbound/outbound pairs land in `archived_weak_connections[]`.
  - Forbid `foreshadow_named` in track narration. Allowed only in Opening / Interlude / Closing.
  - Persona: bind to `near_listener_v1`. Document the do's and don'ts from spec §7B.1.
  - Punctuation: discourage em-dash as primary connector; trust sentence-internal rhythm.
  - Forbid "下一首,..." and similar template handoff at end of every block.

**Why**: spec 0.4 §7B.4 / §7B.5 / §7B.13; D1, D2, D4, D6.

**R3 §3.2 prompt guidance (additional requirements)**:
- Author the OPENER sound cue via three-tier prompt elicitation: (1) LLM training knowledge of the recording, (2) `production_facts` / `instrumentation_details` from the node JSON, (3) scene/motivation fallback if neither yields a concrete cue. Hard prohibition on abstract role openings ("作为锚点…" / "这首歌建立了…").
- Surface no `musicological_signature` field reads in v0.4 (deferred). Skill must work from prompt elicitation alone.

**R3 §5 strengthening (must include in skill text)**:
- Anti-examples block: 3–5 paired bad/good narration snippets covering em-dash overuse, abstract role opening, named foreshadow leak, multi-strong connection, "下一首,..." template handoff.
- Explicit `near_listener_v1` persona boundaries: do's (docent-grounded, peer-tone, sentence rhythm) and don'ts (ironic distance, lecture tone, bullet recap).
- Dry-run gate: PR is not complete until the skill produces a passable mini-episode dry-run (R3 §6.2 stop-gate, before PR-4C).

**Depends on**: PR-2B, PR-2C, PR-3A, PR-3B all merged. (PR-2A removed.)

**Risks**:
- Skill rewrite is the highest-leverage change. Get 1–2 dry-runs before declaring it complete (see PR-4C).
- Author-side judgment on which connection is "strong" introduces variance. Mitigation: LLM produces top-3 candidate list with rationale; author selects.

**Acceptance**:
- Skill text references spec v0.4 sections accurately.
- Spec-to-skill cross-reference table appears at the top of SKILL.md (easier debugging).
- Dry run on a fictional 4-track mini-episode produces output that passes all v0.4 validators (PR-5A/B). Dry-run gate (R3 §6.2) confirmed by user before progressing to PR-4C.

**Diff estimate**: ~250 lines (substantial rewrite of Stage 2.2 + 2.3).

### PR-4B: focus_taxonomy.md restructure

**Changes**

- Edit `Foundations/episode_focus_taxonomy.md`:
  - Remove `bass_dna_signature` reference (replaced by `musicological_signature` per node, indexed by `primary_focus_dimension`).
  - **Remove the per-tier RESONANCE template phrasing block** (the `hit/adjacent/blind_spot` → fixed句式 mapping).
  - Keep OPENING template seed and CLOSING template seed (these still serve structural roles).
  - Add a `connection_kinds_in_scope` field per focus (already exists in connections.json; surface here as the canonical list).
  - Add `intrinsic_score_weight_overrides` optional block per focus (defaults: 0.30/0.25/0.20/0.25).

**Why**: spec 0.4 §7B.4 demoting `personal_resonance`; D1.

**Depends on**: PR-1 merged (spec authority). May run parallel with PR-4A.

**Risks**:
- Future foci (voicing, frequency_hollowing) defined as placeholders in v0.3 — keep their placeholder structure but update field names to v0.4.

**Acceptance**:
- `bassline_dna` section in focus_taxonomy.md has no per-tier RESONANCE phrasing.
- `grep "bass_dna_signature" -r .` returns zero matches.
- OPENING / CLOSING seeds remain functional and match spec §7B.5 expectations.

**Diff estimate**: ~80 lines.

### PR-4C: Miss You ep 1 v0.4 reference rebuild

**Changes**

- Re-execute `transcript-author` skill on Miss You ep 1's tracklist + connections.json (post-Wave 3 state).
- Produce new `episodes/rolling-stones_some-girls_miss-you.episode.{md,json}` files.
- Archive v0.3 transcript as `episodes/rolling-stones_some-girls_miss-you.episode.v0.3.{md,json}` (same convention as existing `.v0.1.*` files).
- Verify against all v0.4 validators (PR-5A/B) before merge.
- Update spec §10 reference example pointer to the new file.

**Why**: spec 0.4 §10; provides the calibration target for future episodes.

**Depends on**: PR-4A and PR-4B merged. Wave 5 validators ideally landed first; if not, hold this PR until they exist.

**Risks**:
- The new transcript becomes the de facto template for future episodes. Quality bar matters. Recommend at least 2 rounds of author review before merge.
- exhibition-json.test.ts might fail on the new transcript even after validators pass. PR-5D handles this.

**Acceptance**:
- All Phase 0–3 validators pass: `make validate-episode SLUG=rolling-stones_some-girls_miss-you`.
- Manual qualitative review against `INSTRUCTIONS_ROUND_1.md` 4.2 sample structural targets:
  - 声音先到 (✓)
  - 一首 ≤ 1 强连接 (✓)
  - 无"下一首,..." (✓)
  - 无 track 段落内的 foreshadow_named (✓)
  - 篇幅按 weight 分级 (✓)
- `archived_weak_connections` non-empty for non-anchor non-bridge tracks.

**Diff estimate**: ~600 lines (full episode rewrite + archived files).

---

## Wave 5 — Validator + exhibition sync

These four PRs are largely independent and can run in parallel.

### PR-5A: `validate_episode_transcripts.py` weight-conditioned bands

**Changes**

- Replace flat 250–400 char check with per-`narrative_weight` band:
  - anchor: 600–900
  - pillar: 350–500
  - supporting: 220–340
  - bridge: 60–150
- Read `narrative_weight` from tracklist.json.
- Forbidden tokens unchanged (Track N, [, ], 第N首) plus new entries: explicit forbidden `foreshadow_named` patterns? Flagged as `[NEEDS_USER_DECISION #7]` — pattern detection vs LLM judgment.
- Add a new check: every track's narration first-third must contain at least one keyword from `musicological_signature.first_5_seconds_what_to_hear` OR `signature_move` (delegated to PR-5C if separated).

**Why**: spec 0.4 §7B.5; D6.

**Depends on**: PR-2A, PR-2B merged.

**Risks**: regex complexity for forbidden-token expansion. Keep regex simple; defer fuzzy detection to PR-5C.

**Acceptance**:
- All v0.3 transcripts that previously passed now classified correctly per their (newly-assigned) weight.
- Test fixtures: 4 sample transcripts (one per weight) pass; deliberately-malformed ones fail with clear messages.

**Diff estimate**: ~120 lines.

### PR-5B: `validate_episode_connections.py` strong/archived semantics

**Changes**

- Replace the v0.3 "every ConnectionPair's other-side artist+song must appear" check with:
  - For each ConnectionPair where (in `episode.json`'s exhibit) `selected_as_strong == true`: assert other-side artist+song appears in target track's narration (preserves anti-silent-fallback for selected pairs).
  - For each ConnectionPair where `selected_as_strong == false`: assert other-side artist+song does NOT appear in narration (forces single-strong discipline). **Edge case**: callback prose recall (anchor's汇流回顾) may name multiple prior artists; the check should distinguish "named because of ConnectionPair" from "named in free callback prose". `[NEEDS_USER_DECISION #8]` — exact discrimination algorithm.
  - Every ConnectionPair must appear in either `strong_connection_id` (target track) or `archived_weak_connections[]` (some track). No orphans.

**Why**: spec 0.4 §7B.12 validator section; D2 unblock.

**Depends on**: PR-2C merged.

**Risks**:
- Decision #8 is genuinely thorny. If LLM judgment is needed, validator becomes slow. Suggested fallback: in v0.4, only assert "selected_as_strong implies presence" + "every pair archived or selected" — drop the "selected_as_strong false implies absence" assertion. This keeps validator simple at the cost of allowing well-intentioned multiple namings.

**Acceptance**:
- Miss You ep 1 v0.4 transcript (PR-4C output) passes the new validator.
- Test fixtures: a deliberately-stuffed transcript (multiple connections fully named per track) FAILS with a clear "non-selected pair surfaced in narration" message.
- A transcript missing `archived_weak_connections` for orphan pairs FAILS.

**Diff estimate**: ~150 lines.

### PR-5C: `validate_sound_cue_present.py` (NEW)

**Changes**

- New validator: for each non-bridge track in episode.md/json:
  - Compute first-third of narration text by char count.
  - Extract keywords from node's `musicological_signature.first_5_seconds_what_to_hear` and `signature_move`.
  - Assert at least one keyword (or near-synonym) appears in first-third.
- Tolerance: keyword stemming / partial match permitted; LLM judgment fallback when keyword overlap is zero (advisory escalation).

**Why**: spec 0.4 §7B.4 musicological_connection enforcement; D5.

**Depends on**: PR-2A merged.

**Risks**:
- Keyword extraction quality varies. Initial implementation: simple noun/term extraction with stopword removal. LLM judgment fallback adds cost; gate behind `--strict` flag.

**Acceptance**:
- Miss You ep 1 v0.4 transcript passes.
- A deliberately-abstract narration (e.g. "建立锚点哲学" without sonic terms) FAILS with a clear message naming the missing keywords.

**Diff estimate**: ~180 lines (new file + test fixtures).

### PR-5D: musicos-exhibition build/test sync

**Changes**

- Update `musicos-exhibition/scripts/build-exhibition-json.ts`:
  - Read new fields: `strong_connection_id`, `archived_weak_connections`, `narrative_weight`.
  - Continue rendering connection callouts in front-end, but switch source from "all ConnectionPairs" to "selected_as_strong only", with a separate "更多连接" expandable section pulling from `archived_weak_connections`.
  - Persona ID change: accept both `docent_v1` (legacy) and `near_listener_v1` (v0.4).
- Update `musicos-exhibition/tests/exhibition-json.test.ts`:
  - 16 assertions adjusted: any assertion that depended on "every ConnectionPair surfaces" must instead test "every selected_as_strong surfaces".
  - New assertions: `archived_weak_connections` length matches expected, `narrative_weight` valid.

**Why**: report 5.3 §8 — exhibition is a hidden floor for transcript schema.

**Depends on**: PR-4C merged (needs concrete v0.4 transcript to test against).

**Risks**:
- 16 assertions may interact in non-obvious ways. Plan for 2 rounds of refinement.
- Front-end UX of "更多连接" expandable section is a product decision; minimum-viable implementation is fine for v0.4.

**Acceptance**:
- `npm run build-data && npm test` passes on Miss You ep 1 v0.4 transcript.
- Visual regression check on the exhibition page (manual eyeball).

**Diff estimate**: ~200 lines.

---

## Wave 6 — Ratification

### PR-6: Final v0.4 promotion

**Changes**

- Rename `Foundations/sonic_cartography_spec_v0.4-draft.md` → `Foundations/sonic_cartography_spec_v0.4.md` (if not already done in PR-1; PR-1 did this — this PR removes any leftover -draft references).
- Bump `spec_version` field to `"0.4"` in all v0.4 producers (validators, skill outputs).
- Update `Foundations/sonic_cartography_spec_v0.3.md` legacy banner to "frozen — v0.4 supersedes; this file is read-only reference".
- Add a "v0.5 ideas" section to `docs/spec-0.4-decisions-log.md` with deferred items (Interlude detail, cross-anchor reuse, agent-listening tier, etc.).

**Why**: closes the migration cycle.

**Depends on**: all prior PRs merged.

**Risks**: none beyond tag/version mismatches in stale clones.

**Acceptance**:
- `make validate-episode SLUG=rolling-stones_some-girls_miss-you` green.
- All v0.4 producer artifacts declare `spec_version: "0.4"`.
- v0.5 backlog written.

**Diff estimate**: ~30 lines.

---

## Parallelization map

```
Wave 0/1: PR-1                                       [t0]
Wave 2:   PR-2A | PR-2B | PR-2C       (parallel)     [t1, after PR-1]
Wave 3:   PR-3A | PR-3B               (parallel)     [t2, after Wave 2]
Wave 4:   PR-4A → PR-4C               (serial)
          PR-4B                       (parallel)     [t3, after Wave 3]
Wave 5:   PR-5A | PR-5B | PR-5C | PR-5D (parallel)   [t4, after Wave 4 (5D after 4C)]
Wave 6:   PR-6                                       [t5, after all]
```

**Critical path**: PR-1 → PR-2C → PR-3A → PR-4A → PR-4C → PR-5D → PR-6 (7 serial PRs).

**Maximum parallel breadth**: 4 (Wave 5).

---

## Cross-cutting risks

| Risk | Mitigation |
|---|---|
| Skill edits (Wave 3, 4A) take effect per-user-account; verification needs explicit re-invocation | Document a "skill cache reset" step in each skill PR's acceptance criteria |
| `connections.json` editorial rewrite (PR-2C) is content-heavy and depends on author judgment | Land 5–10 sample anonymizations first for user review before bulk migration |
| `archived_weak_connections` schema may be re-litigated when first cross-anchor reuse comes up | Decisions-log #6 acknowledges this; v0.5 expected to revisit |
| `validate_episode_connections.py` PR-5B Decision #8 (named-because-of-pair vs free-callback) | Fallback to simpler "selected→present + all archived" if discrimination too fragile |
| Exhibition front-end UX of "更多连接" affects whether `archived_weak_connections` provides value to listener | PR-5D minimum-viable; v0.5 may iterate on UX |
| v0.3 transcript currently in `episodes/` is the calibration reference for any in-flight work; renaming it to `.v0.3.*` archives it | Land PR-4C atomically — old + new transcripts must coexist briefly |

---

## Out-of-plan items (deferred to v0.4.1 or v0.5)

These are NOT in this plan; track in decisions-log:

- Interlude block detailed composition (spec §7B.11 placeholder)
- Cross-anchor ConnectionPair reuse semantics
- `archived_weak_connections` consumer interfaces (front-end "更多连接" beyond minimum-viable)
- Multi-focus `musicological_signature` arrays (per-node multi-dimension)
- `music_window_hint` enforcement (currently advisory)
- Agent-listening epistemic tier (when `sources` includes "agent listening" tag)

---

*End of PR plan. Revisions to this file welcome as PRs land and reality intervenes.*
