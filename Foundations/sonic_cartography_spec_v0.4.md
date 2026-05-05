# Sonic Cartography — Project Spec v0.4

> **Document type**: Engineering spec / agent handoff
> **Status**: RATIFIED 2026-05-06 — PR-1 through PR-5D landed; PR-4C reference transcript rebuild pending user gate per R3 §6.2. v0.4.1 backlog tracked in `docs/spec-0.4-decisions-log.md`.
> **Author**: Claude Code (Opus 4.7)
> **Diff base**: v0.3 (`Foundations/sonic_cartography_spec_v0.3.md`)
> **Companion docs**: `docs/spec-0.3-to-0.4-pr-plan.md`, `docs/spec-0.4-decisions-log.md`
> **Reading rule**: this document is a **diff against v0.3**. Sections not mentioned here are unchanged. Numbering follows v0.3 to keep cross-references stable; new sections take new numbers explicitly.

---

## 0. Changelog summary

| § changed | What changed | Why | Instr. § | Self-audit D# |
|---|---|---|---|---|
| §2.1 | Add `musicological_signature` to node schema as **OPTIONAL** (placeholder only — data-driven activation deferred to v0.4.1) | "声音先到" achieved via prompt guidance in v0.4 (see §7B.4 note); data layer is v0.4.1 work | R3 §3.1 | D5 (partial) |
| §7B.1 | Rewrite narrator persona: docent-grounded DJ, near-listener register | DJ scene 与 docent epistemic depth 共存 | 决断 #1 | report 5.3 §1 |
| §7B.4 | Promote `musicological_connection` to REQUIRED opener; split `relation_to_*` into foreshadow tri-state; demote `personal_resonance` from RESONANCE template | spec 写得对，SKILL 没接住；模板槽位污染叙事 | 3.1, 3.2, 3.4 | D1, D3, D5 |
| §7B.5 | Replace flat 250–500 char cap with per-`narrative_weight` bands | 篇幅平摊 | 3.3 | D6 |
| §7B.7 (existing: playback config) | Unchanged structurally; `excerpt_range` now optionally populated by Phase 2 (was empty) | D7 partial fix | — | D7 |
| §7B.10 (existing: out of scope) | No structural change; remove "music_window" from out-of-scope list | D7 partial activation | 4.3 | D7 |
| §7B.11 NEW | Interlude block type as first-class structural element | 篇章间过场去模板化 | 3.5 | D1 (HANDOFF) |
| §7B.12 NEW | ConnectionPair schema + per-track strength scoring + archived weak connections | 强/弱连接 + 单点叙事 | 决断 #2 | D2 |
| §7B.13 NEW | Foreshadow tri-state taxonomy + Phase-1 default behavior | 单向性强制 + 上游污染源切断 | 3.2 | D3 |
| (deprecation) | RESONANCE 模板（`focus_taxonomy.md` 中按 tier 绑死的句式）standardly废弃；HANDOFF 强制段废弃 | 模板槽位污染 | 3.5 | D1 |
| (deprecation) | `validate_episode_connections.py` 当前的"全量铺出"语义 standardly废弃；改为"selected_as_strong 必须出现 + 未选必须归档" | 校验器锁死 D2 解决路径 | 决断 #2 §validator | report 5.3 §3 |

---

## 1. Versioning convention update

v0.4 introduces the convention that **schema changes are gated by `spec_version` field on every produced artifact**. Producers tag with `0.4`; consumers (validators, exhibition build, future TTS pipeline) must declare which spec versions they accept. v0.3 artifacts remain readable; mixed-version vaults are explicitly supported during migration (see `docs/spec-0.3-to-0.4-pr-plan.md` Wave 0).

---

## 2. Core ontology — additions

### §2.1 Node schema — REVISED (additions only)

Add the following field to the node JSON schema as **OPTIONAL**. All other v0.3 fields unchanged.

> **R3 scope note**: in v0.4, `musicological_signature` is a *reserved schema slot* — nodes MAY populate it but the field is not required, and no validator reads it. Backfilling 18 Miss You ep 1 nodes is **deferred to v0.4.1**. The "声音先到" goal in v0.4 is achieved via prompt guidance in `transcript-author` SKILL (see §7B.4 implementation note), not by reading this field. See `docs/spec-0.4-decisions-log.md` #14, #17 for rationale.

```json
{
  ...,
  "musicological_signature": {
    "primary_focus_dimension": "string (e.g. 'bass', 'voicing', 'frequency_hollowing'); aligns with focus taxonomy slug",
    "first_5_seconds_what_to_hear": "string (16-50 ZH chars: a literal cue the listener should focus on at song start — the kick pattern, the bass entry, the snare placement, the texture of the room sound)",
    "signature_move": "string (60-120 ZH chars: the distinctive musical action this node makes — interval pattern, syncopation type, rhythmic relationship to kick drum, modal interchange, production technique. Must be specific and audibly identifiable, not abstract role description)",
    "technical_glossary": [
      {"term": "string (technical term used in signature_move)", "gloss_zh": "string (≤30 ZH chars: lay-listener gloss)"}
    ],
    "epistemic_layer": "fact | consensus | hypothesis",
    "sources": ["string (URLs or 'agent listening' tag if derived from listening)"]
  }
}
```

**Field notes**:

- `first_5_seconds_what_to_hear` is the **load-bearing field for "声音先到"**. If you can't write it, the node is poorly observed and the FOCUS opening will degrade.
- `signature_move` is the data layer for `musicological_connection` component (§7B.4). It is **not** the same as `position_in_era.historical_role` — historical_role is structural ("this node did X in music history"); signature_move is sonic ("this node sounds like Y because Z").
- `technical_glossary` is the lookup table for §7B.4's "gloss once on first introduction" rule.
- `epistemic_layer` here is independent of node-level epistemic_layer because audio observations may differ in confidence from biographical claims.

**Migration (v0.4.1, not v0.4)**:

- Existing 18 Miss You episode nodes will be backfilled in v0.4.1.
- The dead reference `bass_dna_signature` in `Foundations/episode_focus_taxonomy.md` is removed in v0.4 (PR-4B); the replacement field `musicological_signature.signature_move` is reserved but not yet populated.

### §2.4 NEW — narrative_weight (track-level, lives in tracklist not node)

Define `narrative_weight` as a **track-level** property (in `playlists/<slug>.tracklist.json`, not in `data/nodes/`). It is per-episode, not per-node, because the same node may carry different weight in different episodes.

```json
{
  "position": N,
  ...,
  "narrative_weight": "anchor | pillar | supporting | bridge"
}
```

**Definitions**:

| value | when to assign |
|---|---|
| `anchor` | The episode's gravity center. Exactly one per episode. Identical to `is_base_node: true`. |
| `pillar` | Major waypoint. Stories of irreducible importance to the lineage (origin point, decisive translation, terminal node). Typically 3–5 per 18-track episode. |
| `supporting` | Standard node — present, narrated, but not load-bearing on its own. The bulk of an episode. |
| `bridge` | Minimal narration. Present in the lineage for completeness but does not advance the focus thesis. Typically <10% of an episode. Includes existing `muted_this_episode: true` cases. |

**Orthogonality with `tier`**: `tier` (hit/adjacent/blind_spot) describes user red-heart relationship; `narrative_weight` describes structural position in the episode's arc. They are independent — a `blind_spot` track can be a `pillar` (Cold Sweat in Miss You ep), a `hit` can be `supporting` (Fame in Miss You ep), an `adjacent` can be the `anchor` (Miss You itself).

**Mute rule**: `muted_this_episode` is now derived from `narrative_weight: "bridge"`. The two fields are not both authoritative; v0.4 makes `narrative_weight` authoritative and `muted_this_episode` becomes a deprecated alias kept for one version.

---

## 7. Annotated playlist (text mode) — unchanged

No structural changes. `narrative_weight` may be displayed in playlist markdown but is not required.

---

## 7B. Audio episode spec — REVISED

### §7B.1 Narrator persona — REWRITTEN

```json
{
  "persona_id": "near_listener_v1",
  "scene": "DJ booth / late-night radio / a knowledgeable companion sitting beside the listener with a song playing at low volume",
  "voice_register": "knowledgeable docent-like DJ with a soul of music love, passion, and storytelling",
  "knowledge_basis": "music theory + music history + recording lore (unchanged from v0.3 docent_v1)",
  "emotional_baseline": "warm, attentive, precise; passion is felt as gravity not as performance",
  "first_person_use": "occasional, for guidance — '我想让你注意一件事', '我们到了' (guidance form ALLOWED). Autobiographical first-person ('I think', 'I love this song') NEVER.",
  "personal_anecdote_use": "never",
  "direct_address_use": "encouraged at sonic cues — '听这条贝斯', '你听这个鼓', '你想想这件事'. Forbidden as filler chatter.",
  "tone_to_avoid": [
    "performed energy / hype / theatrical excitement",
    "DJ banter / radio jingles / song-name announcement formats",
    "false intimacy ('hey friends', '我跟你说啊' as filler)",
    "academic / detached / hedged",
    "reverential / mythologizing"
  ],
  "boundary_principles": [
    "Like a docent but NOT a docent — closer, more spoken-language, allows guiding second-person",
    "Like a DJ but NOT a typical DJ — does not announce song titles, does not perform energy, does not banter",
    "Like an essayist but NOT an essayist — judgment is embedded in narrative; '我认为', '我觉得' do not appear in text"
  ]
}
```

**Persona scope**: applies to **all** NarrationBlocks — Opening, Track narration, Interlude, Closing. There is one voice across an episode.

**Persona ID change**: `docent_v1` is renamed to `near_listener_v1`. Episode JSON's `narrator_persona_id` field migrates accordingly. `docent_v1` is accepted as a legacy alias for one version then removed.

**What this persona does NOT change from v0.3**:

- Single voice across an episode.
- Knowledge basis (music theory + history + recording lore).
- Refusal of personal anecdotes.
- Refusal of mythologizing.

**What this persona explicitly enables**:

- Imperative second-person ("听这条贝斯") at sonic cue moments.
- Guiding first-person plural / first-person ("我们到了", "我想让你注意") at structural pivots.
- Sentence rhythm closer to speech than to museum wall-text — fewer em-dashes, more sentence-internal cadence.

### §7B.4 Narration components — REVISED

#### Required component changes

**`musicological_connection` — PROMOTED to "声音先到" OPENER for every Track NarrationBlock (soft requirement in v0.4).**

- Position in block: **should appear in the first 1/3 of narration text length** (soft, prompt-driven, not validator-enforced in v0.4).
- Source in v0.4: **prompt-elicited** from LLM's own knowledge of the track + node JSON's `production_facts` / `instrumentation_details` / `historical_role` fields. The structured `musicological_signature` field is reserved (§2.1) but not yet populated; data-driven sourcing is v0.4.1 work.
- Length: 2–4 sentences (≈60–120 Chinese chars, can extend up to 180 for `anchor`-weight tracks).
- Function: identifies what the listener is currently hearing in concrete sonic terms before any historical or relational claim.
- **Hard prohibition**: opening with abstract role description ("建立 X 哲学" / "奠定 Y 模型" / "定义 Z 语法") is forbidden. If a concrete sonic element cannot be elicited, fall back to scene/situation opening (where they were, what year, what was happening) — never to abstract function.
- Example (unchanged from v0.3, retained as docent-grain reference): "Bill Wyman 在 Miss You 里的 bass line 用的是 Chic 那种 octave-jumping 八度跳进——但他把每一拍的强重音错开了一个十六分音符,所以走起来比 Chic 的 locked groove 更晃,更像 Stones 一直以来的那种 swing。"
- v0.4 enforcement: human review at PR-4C (transcript rebuild) catches abstract-role openings. No automated `validate_sound_cue_present.py` in v0.4 (deferred to v0.4.1 once `musicological_signature` is populated).

**v0.4 implementation guidance (operationalized in `transcript-author` SKILL.md PR-4A)**:

The SKILL must instruct the LLM with the following elicitation order:
1. **Primary**: extract a specific sonic element from the LLM's own training knowledge of the track (commonly works for well-known tracks).
2. **Secondary**: derive a concrete sonic description from `production_facts` / `instrumentation_details` / `historical_role` (instrument, effect, rhythm, mix position).
3. **Fallback**: if neither yields a concrete sonic anchor, open from scene (people / place / year / situation) or motivation (why this decision was made). **Never** retreat to abstract role/philosophy/grammar/model phrasing.

**`relation_to_previous` and `relation_to_next` — SPLIT into foreshadow tri-state.**

These two component names are deprecated; replaced by three explicit components:

- `callback_named` — referencing a previously-narrated track by name. Can appear anywhere in the block.
- `foreshadow_anonymous` — hinting at a future track without naming it ("会有另一支英国乐队三年后做同样的事"). Can appear anywhere.
- `foreshadow_named` — naming a future track explicitly. **DEFAULT FORBIDDEN in Track narration**. Allowed only in Opening / Interlude / Closing blocks.

See §7B.13 for the full tri-state taxonomy and Phase-1 implications.

**`relation_to_previous` (legacy field)** is mapped to `callback_named` during migration. **`relation_to_next` (legacy field)** is mapped to `foreshadow_anonymous` (NOT `foreshadow_named`) during migration — the migration default is the safe behavior, even though many existing v0.3 productions used the unsafe one.

#### Optional components

**`narrative_slot_excerpt`** — unchanged from v0.3.

**`lineage_anchor_recall`** — unchanged from v0.3, but usage frequency reduced. Use at most every 4–5 tracks (was 3–4) and at the closing.

**`epistemic_disclosure`** — unchanged from v0.3.

**`personal_resonance` — DOWNGRADED from RESONANCE template.**

- The current per-tier RESONANCE template ("强调用户对这条贝斯线索的熟悉感,落点在身体记忆" → fixed句式) is **deprecated**.
- `personal_resonance` survives as a fully optional component, used only when a specific user-relevance fact is materially additive (e.g. the user's red-heart timestamp is part of why the track is on the list). Its phrasing is not template-driven.
- "Translation" of `tier` into a fixed sentence pattern is **prohibited**. The author may consult `tier` to decide whether to include `personal_resonance` at all, but the resulting prose is freely written.
- `episode_focus_taxonomy.md` is restructured: the per-tier RESONANCE phrasing block is removed; the per-focus OPENING / CLOSING seeds remain.

#### Component composition rules — REWRITTEN

For Track NarrationBlocks (regardless of weight):

- **Required**: `musicological_connection` (in first 1/3) + at least one **callback_named** OR **foreshadow_anonymous** component.
- **Forbidden** in Track blocks: `foreshadow_named` (move to Interlude/Opening/Closing).
- **Hard cap**: ≤1 `callback_named` referencing a ConnectionPair marked `selected_as_strong` (§7B.12). Other callbacks are unrestricted prose recall and do not count against this cap.

For Opening / Interlude / Closing:

- Free composition. `foreshadow_named` allowed here (this is where structural roadmap work happens).
- `musicological_connection` is encouraged (the opening should describe the anchor's signature sound) but not strictly required.

#### Removed components / removed rules

- The HANDOFF mandatory closing per Track is **removed**. End-of-block phrasing like "下一首,..." is no longer required and should be avoided as a default. Closing thoughts are emergent from narrative tension, not template.
- The "5-part template" structure in `transcript-author` SKILL Stage 2.2 (OPENING/FOCUS/NETWORK/RESONANCE/HANDOFF) is **deprecated**. Replaced by the 6-layer logical order (described in §7B.5 below).

### §7B.5 Length budgets — REWRITTEN

#### Per-track NarrationBlock by `narrative_weight`

| weight | ZH char band | Internal structure (6-layer order) | Strong connection limit |
|---|---|---|---|
| `anchor` | 600–900 | All 6 layers fully expanded: ① 声音先到 (musicological_connection, can extend to 180 chars) → ② 处境/画面 → ③ 动机/张力 → ④ 行动/具体决定 → ⑤ 多条 callback_named 汇流 + 允许的 foreshadow_anonymous → ⑥ 留白 | 0 (anchor is the destination of all connections; it does not "reference" — it is referenced) |
| `pillar` | 350–500 | All 6 layers, each compressed | 1 |
| `supporting` | 220–340 | May omit 1–2 layers (typically ② shortened to one phrase, or ⑥ implicit) | 1 |
| `bridge` | 60–150 | One or two sentences. Carries structural function only ("贝斯的对话在这里短暂沉默") | 0 or 1 |

**6-layer logical order** (descriptive, not enforced as section boundaries — the prose is one continuous paragraph or two):

1. **Sonic identification** — what is currently audible. Drawn from `musicological_signature`.
2. **Scene / situation** — who, where, when. Concrete, not abstract.
3. **Motivation / tension** — why this decision was made; what the constraint or pressure was.
4. **Action / specific move** — what they did. Concrete sonic decisions, not abstract roles.
5. **One echo** — at most one `callback_named` strong connection; optional `foreshadow_anonymous`.
6. **Restraint / silence** — leave space for the music. May be implicit (sentence ending that opens) or explicit (a beat).

This is a logical sequence, not a template. The author may compress or reorder for prose flow — but `musicological_connection` MUST come early (per §7B.4), and `callback_named` (if present) comes late in the block.

**Per-episode length** (unchanged from v0.3): 45–75 minutes target, 90 minutes cap.

**Migration impact on validator**: `validate_episode_transcripts.py` current 250–400 char-band must be replaced with weight-conditioned bands. See PR plan Wave 5.

### §7B.7 Track playback configuration — minor extension

No structural change. v0.4 clarifies:

- `excerpt_range` is now expected to be **populated by Phase 2** when a `musicological_connection` references a specific timestamp range (e.g. "the bass line that enters at 1:28"). v0.3 left this empty.
- A new optional field `music_window_hint` is added to each exhibit:
  ```json
  "music_window_hint": {
    "kind": "let_music_breathe | underline_specific_section | fade_under_narration",
    "approximate_duration_seconds": "integer (10-30 typical, 60 max)",
    "narration_cue_zh": "string (optional: '停顿,让贝斯独自走 15 秒')"
  }
  ```
- `music_window_hint` is **advisory** for downstream TTS / mixing pipelines; it is not enforced by transcript validators in v0.4. (`docs/spec-0.4-decisions-log.md` records why this was chosen as advisory rather than mandatory.)

### §7B.10 Out of scope — REVISED

Remove from the v0.3 out-of-scope list:

- "Music windows" / "let-music-breathe markers" — partially in-scope as advisory `music_window_hint` (see §7B.7).

Remaining v0.3 out-of-scope items unchanged.

### §7B.11 NEW — Interlude block type

[NEEDS_USER_DECISION — see decisions-log #11]

Promoted from "optional mid-episode break" (v0.3 §7B.2 exhibit_type enum) to **first-class structural element** with its own composition rules. Detailed schema deferred to v0.4.1; placeholder commitments here:

- `interlude` exhibit_type retains its v0.3 definition.
- New rule: Interludes are the **only** place `foreshadow_named` is encouraged in mid-episode (Opening and Closing also allow it, but Interlude is where structural pivots get explicit roadmap statements).
- Interludes may be 80–250 ZH chars; longer interludes are discouraged (they break listening immersion).
- An episode may have 0–2 interludes. Position is flexible but typical placements are: after the anchor (post-anchor pivot) and/or before a long descending tail.

Detailed component composition for Interludes is deferred to v0.4.1 to avoid scope creep.

### §7B.12 NEW — ConnectionPair schema and per-track strength scoring

This section formalizes what `playlists/<slug>.connections.json` produces (Phase 1 output) and how Phase 2 consumes it.

#### ConnectionPair schema (Phase 1 output, revised)

```json
{
  "id": "string (e.g. 'conn_001_to_006_groove_dna')",
  "from_position": "integer",
  "to_position": "integer",
  "kind": "string (focus-defined: groove_dna, personnel_bridge_bass, gear_lineage_bass, etc.)",
  "evidence_basis": "historical | musicological | hypothetical",
  "backed_by_edge_id": "string | null (link to map.json edge if applicable)",
  "system_sensory_note": "string (Phase 1 reasoning trace, not user-facing)",

  "intrinsic_score": {
    "value": "float in [0, 1]",
    "story_drive": "float in [0, 1]",
    "concrete_carrier": "float in [0, 1]",
    "evidential_strength": "float in [0, 1]",
    "focus_relevance": "float in [0, 1]",
    "scoring_rationale_zh": "string (one sentence: why this score)"
  },

  "narration_modes": {
    "callback_named_at_to": "NarrationVariant (used when the to_position track is being narrated and references back)",
    "foreshadow_anonymous_at_from": "NarrationVariant (DEFAULT outbound usage at from_position)",
    "foreshadow_named_at_from": "NarrationVariant | null (only generated for explicit Interlude/Opening use; null for typical track-to-track pairs)"
  },

  "user_overrides": []
}
```

Where `NarrationVariant` is:

```json
{
  "voice_zh": "string",
  "voice_en": "string",
  "produced_by": "phase1_default | author_override"
}
```

**Schema deprecations from v0.3**:

- `direction: "from_inspires_to"` field is **removed**. Direction is implicit in `from_position` < `to_position`. Three foreshadow modes carry the previously-implicit semantics.
- `narration_at_from` / `narration_at_to` (flat fields) are replaced by `narration_modes.{callback_named_at_to, foreshadow_anonymous_at_from, foreshadow_named_at_from}`. Migration writes existing `narration_at_from` into `foreshadow_anonymous_at_from` after stripping any explicit song-naming; existing `narration_at_to` writes into `callback_named_at_to`. See PR plan Wave 3.

#### Strength scoring criteria (LLM scores each ConnectionPair on these dimensions)

Based on instruction §决断 #2:

1. **Story drive** (`story_drive`) — Does this connection have action / motive / outcome, or is it a flat correlation? "Billy Preston 把贝斯线带进 Miss You" has story drive. "Cold Sweat 也影响了 Miss You 的低频" doesn't.
2. **Concrete carrier** (`concrete_carrier`) — Is there a specific person, place, recording, or instrument the connection rides on? Billy Preston / Sigma Sound / Bernard Edwards's particular guitar / John Deacon sitting next to Edwards.
3. **Evidential strength** (`evidential_strength`) — Documented in interview / liner notes / documentary, or merely plausible? Aligned with `evidence_basis` field but more granular.
4. **Focus relevance** (`focus_relevance`) — Does this connection serve the episode's focus (e.g. bassline DNA), or is it a tangent (lyrical theme, album art, etc.)?

`intrinsic_score.value` = weighted aggregate, default weights 0.30 / 0.25 / 0.20 / 0.25 (story / concrete / evidential / focus). Weights MAY be overridden per-focus in `episode_focus_taxonomy.md`.

#### Per-track strength resolution (Phase 2 input assembly)

Strength is **not a global property** of a ConnectionPair. It is computed per-track:

```
strength_in_track(pair, track) =
    intrinsic_score.value
  - already_used_penalty(pair, prior_tracks)
  - redundancy_penalty(pair, prior_strong_connections_in_episode)
```

Where:

- `already_used_penalty` — if the ConnectionPair was `selected_as_strong` in a prior track in the same episode, penalty = 0.6. (Once told, telling again is redundant.)
- `redundancy_penalty` — if the same `kind` (e.g. `groove_dna`) was the `selected_as_strong` kind in the immediately preceding track, penalty = 0.2. (Variety in connection types within an episode is a value.)

Both penalties are advisory weights, not hard exclusions. The author makes the final call.

**Anchor-position special rule**: tracks marked `narrative_weight: anchor` do NOT select a strong ConnectionPair. The anchor is the convergence point; its narration recalls multiple prior tracks (multiple callbacks allowed, see §7B.5 anchor band) but does not "use" any single ConnectionPair as a structural backbone.

#### selected_as_strong + archived_weak (Phase 2 output)

For each track in `episodes/<slug>.episode.json`:

```json
{
  "position": N,
  ...,
  "transcript_zh": "...",
  "strong_connection_id": "string | null (null only for anchor or bridge tracks)",
  "archived_weak_connections": [
    {
      "connection_id": "conn_xxx_to_N",
      "intrinsic_score": 0.7,
      "archive_reason": "redundant_with_strong | low_focus_relevance | no_concrete_anchor | already_told | off_topic_for_episode",
      "archive_note_zh": "string (optional: one sentence why this didn't make the cut)"
    }
  ]
}
```

**Critical invariant**: every ConnectionPair in `connections.json` whose `from_position == N` or `to_position == N` MUST appear either as `strong_connection_id` or in `archived_weak_connections[]`. **No silent dropping.**

#### Decision flow (LLM proposes, author terminally decides)

1. **LLM auto-scoring**: produces `intrinsic_score` for each ConnectionPair (Phase 1 connections-author).
2. **LLM ranking** (Phase 2 input prep): for each track, computes `strength_in_track` and produces a top-3 ranked candidate list with story-core summaries.
3. **Author terminal decision**: human selects ONE ConnectionPair as `strong_connection_id` per track (or `null` for anchor/bridge). Author may override the LLM's ranking.
4. **Auto-archive**: remaining ConnectionPairs land in `archived_weak_connections` with `archive_reason` set by the LLM (author may override).
5. **Validator enforcement**: `validate_episode_connections.py` verifies the strong_connection_id surfaces in narration; verifies all other pairs are archived.

#### Validator semantics — REWRITTEN

`validate_episode_connections.py` v0.3 behavior: every ConnectionPair's other-side artist+song must appear in the referenced track section.

**v0.4 behavior**:

- For each ConnectionPair where `selected_as_strong == true` for a given track: that track's narration MUST contain the other-side artist + song name (preserves anti-silent-fallback).
- For each ConnectionPair where `selected_as_strong == false`: presence in narration is FORBIDDEN. (Forces single-strong-callback discipline.)
- Every ConnectionPair must appear in either path (selected or archived). No orphans.

This restoration of "anti-silent-fallback" via `archived_weak_connections` means **no information is lost**, only narrationally suppressed.

### §7B.13 NEW — Foreshadow tri-state taxonomy and Phase-1 default

Three legitimate modes of cross-track reference:

| Mode | Description | Names target track? | Allowed where |
|---|---|---|---|
| `callback_named` | At track N, references a previously-narrated track M (M < N) by name. | Yes (already heard) | Any track — required at anchor; allowed elsewhere |
| `foreshadow_anonymous` | At track N, hints at a future event without naming the target. ("会有另一支英国乐队三年后做同样的事") | **No** | Any track |
| `foreshadow_named` | At track N, names a future track M (M > N) explicitly. | Yes | **DEFAULT FORBIDDEN in Track narration**. Allowed only in Opening / Interlude / Closing blocks. |

**Phase-1 (connections-author) default behavior change**:

The current Phase 1 generates `narration_at_from.voice_zh` that names the future track ("等会儿到 The Rolling Stones 的 Miss You,..."). v0.4 changes this default:

- `narration_modes.foreshadow_anonymous_at_from` is the **default-generated** outbound narration for every ConnectionPair.
- `narration_modes.foreshadow_named_at_from` is **only generated when explicitly requested** by Phase 2 for use in Opening/Interlude/Closing blocks.

This is the **critical pollution-source fix**: as long as Phase 1 default produces named foreshadowing, Phase 2 cannot escape it via prompt changes alone.

**Author override**: in cases where the LLM judges a foreshadow_named is structurally necessary in track narration (rare; e.g. the next track is the anchor and this track is its immediate setup), the author may explicitly request `foreshadow_named_at_from`. The override is logged in `narration_modes.foreshadow_named_at_from.produced_by = "author_override"`.

---

## 8. Epistemic annotation — unchanged

No structural change.

---

## 9. Termination and self-check — additions

Add to §9.3 self-check questions before delivery:

10. Does every Track NarrationBlock contain a `musicological_connection` in its first 1/3?
11. Does every Track NarrationBlock have exactly one `selected_as_strong` ConnectionPair surfaced (or zero for anchor/bridge tracks)?
12. Are all non-selected ConnectionPairs accounted for in `archived_weak_connections` with `archive_reason` set?
13. Does any Track narration contain `foreshadow_named` content? (Should be zero.)
14. Does the narration's character count fall within the band defined by the track's `narrative_weight`?
15. Is the episode's `narrator_persona_id` set to `near_listener_v1`?

---

## 10. Reference example — Miss You anchor execution

The v0.3 §10 example remains a valid calibration target **structurally**. It is **not** a calibration target for v0.4 narration prose (the v0.3 transcript is the artifact whose deficiencies prompted this revision).

A new reference rendering of Miss You ep 1 under v0.4 will be produced as part of PR plan Wave 4. Until then, treat v0.3 §10 as schema-level reference only.

---

## 11. Out of scope (v0.4) — REVISED

Items the v0.4 spec deliberately does not address:

- **Cross-anchor synthesis** (deferred from v0.3)
- **Profile evolution** (deferred from v0.3)
- **Live coverage updates** (deferred from v0.3)
- **Platform export adapters** (deferred from v0.3)
- **Visual map renderer** (deferred from v0.3)
- **Recommendation feedback loop** (deferred from v0.3)
- **Conflict resolution** (deferred from v0.3)
- **TTS audio synthesis** (deferred from v0.3)
- **Background ambience and audio mixing** (deferred from v0.3)
- **Multi-narrator episodes** (deferred from v0.3)
- **Episode interactivity** (deferred from v0.3)
- **Detailed Interlude composition rules** — v0.4.1 (§7B.11 placeholder)
- **`music_window_hint` enforcement / mixing semantics** — advisory only in v0.4
- **Cross-episode ConnectionPair reuse / archival exposure to listener** — archived weak connections are stored but their consumer interface is undefined in v0.4. v0.4.1 may surface them via exhibition front-end.
- **`musicological_signature` agent-listening tier** — v0.4 allows `sources` to include `"agent listening"` tag for cases where no published audio analysis exists, but does not specify how the agent listens. This is `[NEEDS_USER_DECISION]` in decisions-log #4.

---

## 12. Glossary additions

- **Narrative weight** (`narrative_weight`): per-track structural-importance label (anchor/pillar/supporting/bridge) used to govern length and structure. Orthogonal to `tier`.
- **Sonic identification / 声音先到**: the requirement that a Track narration begins by indicating what is currently audible, in concrete sonic terms.
- **Strong connection / 强连接**: the single ConnectionPair narrated explicitly per track, selected via `selected_as_strong: true`.
- **Archived weak connection**: a ConnectionPair recorded in episode metadata but not surfaced in narration prose.
- **Foreshadow tri-state**: the three legitimate cross-track reference modes (callback_named / foreshadow_anonymous / foreshadow_named) governing whether a future track may be named.
- **Near-listener register / 近距离讲述**: the v0.4 narrator persona — a docent-grounded DJ at low volume beside the listener. Replaces `docent_v1`.

---

*End of v0.4. Sections not listed are unchanged from v0.3. See `docs/spec-0.3-to-0.4-pr-plan.md` for migration sequencing and `docs/spec-0.4-decisions-log.md` for non-obvious decisions, deferrals to v0.4.1, and the v0.5 backlog.*
