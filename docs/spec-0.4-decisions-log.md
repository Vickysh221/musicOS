# Spec 0.4 Decisions Log

> **Status**: Living document, opened 2026-05-06 alongside `Foundations/sonic_cartography_spec_v0.4-draft.md` and `docs/spec-0.3-to-0.4-pr-plan.md`.
> **Author**: Claude Code (Opus 4.7)
> **Purpose**: capture the *why* behind non-obvious decisions in v0.4 + record items still pending user decision. Future revisions read this before re-litigating.
> **Convention**: each entry has a stable ID `#N` so other docs may cite it (e.g. `[NEEDS_USER_DECISION #4]`). User responses go below each entry, not in the spec/PR plan.

---

## Decisions made (with rationale)

### #1 — Activate `musicological_connection` instead of introducing `sound_cue`

**Decision**: D5 ("声音先到") is solved by making spec §7B.4's existing `musicological_connection` component REQUIRED in first-third position, backed by a new node-level field `musicological_signature`. We do **not** introduce a separate `sound_cue` field.

**Why**:
- spec §7B.4 already defined the right level of granularity ("Bill Wyman 在 Miss You 里的 bass line 用的是 Chic 那种 octave-jumping 八度跳进——但他把每一拍的强重音错开了一个十六分音符"). Adding a parallel `sound_cue` would create two fields competing for the same conceptual slot.
- The instruction file §3.4 itself prefers this path: "激活已有的 §7B.4 组件，而不是新增字段".
- One field, one place to update. Reduces schema sprawl across nodes / tracklist / transcript.

**Cost**: requires backfilling 18 nodes' `musicological_signature` (PR-2A). Expensive but necessary regardless of which name we choose.

---

### #2 — Anchor track has zero strong connections, not one

**Decision**: tracks with `narrative_weight: anchor` have `strong_connection_id: null`. The anchor's narration recalls multiple prior tracks via free callback prose (which is not constrained by the ≤1 strong-connection rule).

**Why**:
- An anchor is a convergence point, not a referencing point. All prior pillars and supporting tracks have already drawn lines toward it via their own outbound connections.
- Forcing the anchor to "use" one connection from its inbound set artificially privileges one ancestor over others. The anchor's role is to make all upstream lines visible at once.
- Mechanically: requiring a single inbound `selected_as_strong` for the anchor would force the validator to fail well-formed anchor narrations.

**Cost**: validator logic for `selected_as_strong` must special-case anchor (and bridge) tracks. Documented in spec §7B.12.

---

### #3 — `callback_named` does not count against the ≤1-strong-connection cap

**Decision**: per spec §7B.4, the ≤1 cap applies only to ConnectionPairs flagged `selected_as_strong`. Free callback prose (e.g. anchor's "Cold Sweat 的鼓贝斯哲学、Sly 的鼓机、Bowie 的塑料灵魂、Parliament 的贝斯飞船、Bee Gees 的舞池贝斯——它们在 1978 年这间纽约的录音棚里汇到了一起") is unrestricted.

**Why**:
- Free callback prose is **narrative recap** — it doesn't claim a structural connection, it recapitulates ones already established in prior tracks.
- Constraining recap to ≤1 callback would prevent the anchor from doing its job (汇流回顾).
- The validator can still distinguish: "Cold Sweat" appearing in anchor narration is a callback (prior track, position < anchor's), validates against existing prior-position callback rules. It's not a new ConnectionPair use.

**Cost**: Decision #8 (validator algorithm to distinguish "named because of selected_as_strong pair" from "named in free callback") becomes thornier. Acknowledged in PR-5B risks.

---

### #4 — `musicological_signature.sources` allows `"agent listening"` tag — DEFERRED to v0.4.1

**R3 status (2026-05-06)**: Deferred to v0.4.1 alongside the rest of the `musicological_signature` data backfill (PR-2A removed). v0.4 sources the OPENER sound cue via prompt elicitation only (see #17). The original rationale below is preserved for v0.4.1 reference.

---


**Decision**: For nodes where no published source explicitly characterizes the bass move (or other focus dimension), agents may produce `musicological_signature` based on careful listening, with `sources: ["agent listening"]` and `epistemic_layer: "hypothesis"`.

**Why**:
- spec §4.3's existing tier-5 ("agent's own synthesis") covers this, but synthesis from listening is a different epistemic act than synthesis from cross-source inference. Marking it explicitly enables future review.
- Without this, many nodes (especially less-documented ones) cannot have a populated `musicological_signature` at all, which defeats the D5 fix.

**Limit**: If a node has `musicological_signature.epistemic_layer: "hypothesis"`, the FOCUS段 in transcript should signal this with light hedging ("听起来像是" / "我们听到的是" — sparingly). Not via an inline `[hypothesis]` tag, which would break narrative flow.

**Pending**: how the agent actually listens — playing audio in agent runtime is out of scope; agents currently rely on training-data familiarity + careful reading of listenable transcripts. Decision-log #14 (open) tracks this gap.

---

### #5 — Miss You ep 1 narrative_weight assignments — RESOLVED (R3, 2026-05-06)

**Final assignment (per R3 user guidance)**: Bowie / Fame upgraded to `pillar` (it is the anchor's direct US precedent and structural enough to anchor an arc beat). Mk.gee remains `supporting (coda)`. Pillar set: positions 1, 3, 9, 11, 17.

| Position | Track | weight |
|---|---|---|
| 1 | James Brown — Cold Sweat | pillar |
| 3 | David Bowie — Fame | **pillar** (R3) |
| 6 | The Rolling Stones — Miss You | anchor |
| 8 | Devo — Jocko Homo | bridge |
| 9 | Chic — Good Times | pillar |
| 11 | Talking Heads — Once in a Lifetime | pillar |
| 17 | Khruangbin — María También | pillar |
| (all others) | | supporting |

---

### #5 (legacy proposal, kept for context)

**Decision (provisional, `[NEEDS_USER_DECISION]`) — superseded by R3 resolution above**:

| Position | Track | weight |
|---|---|---|
| 1 | James Brown — Cold Sweat | pillar |
| 2 | Sly & the Family Stone — Family Affair | supporting |
| 3 | David Bowie — Fame | supporting |
| 4 | Parliament — Give Up the Funk | supporting |
| 5 | Bee Gees — Stayin' Alive | supporting |
| 6 | The Rolling Stones — Miss You | **anchor** |
| 7 | Blondie — Heart of Glass | supporting |
| 8 | Devo — Jocko Homo | bridge |
| 9 | Chic — Good Times | pillar |
| 10 | Joy Division — Isolation | supporting |
| 11 | Talking Heads — Once in a Lifetime | pillar |
| 12 | Queen — Another One Bites the Dust | supporting |
| 13 | Prince — When Doves Cry | supporting |
| 14 | Red Hot Chili Peppers — Give It Away | supporting |
| 15 | Daft Punk — Get Lucky | supporting |
| 16 | Tame Impala — The Less I Know the Better | supporting |
| 17 | Khruangbin — María También | pillar |
| 18 | Mk.gee — You Dreamed of Me | supporting (coda) |

**Why this proposal**:
- `anchor`: 6 (Miss You) — by definition
- `pillar`: 1 (origin), 9 (Chic — most-cited disco bass; Miss You's direct sibling), 11 (Talking Heads — methodological pivot point), 17 (Khruangbin — terminal of the bass-first method) — these are the four nodes whose absence would break the lineage's logic
- `bridge`: 8 (Devo — currently muted; structural pivot)
- `supporting`: everything else

**Pending user response**:
- Should Bowie (3, Fame) be a pillar? Argument for: Fame is the anchor's direct US precedent. Argument against: it's listed because it's a hit, not because it's a structural pillar. Currently leaving as supporting.
- Should Mk.gee (18) be `bridge` (since it's a coda, not part of the main arc) or `supporting`? Currently supporting.

**`[NEEDS_USER_DECISION #5]`**: confirm pillar set + edge cases (Bowie, Mk.gee).

---

### #6 — `archived_weak_connections` has no listener-facing consumer in v0.4

**Decision**: archived weak connections live in `episode.json` metadata. Front-end exhibition (PR-5D) gets a minimum-viable "更多连接" expandable section. Detailed UX, cross-anchor reuse, and listener-facing presentation are deferred to v0.5.

**Why**:
- The archived-weak system's primary purpose in v0.4 is to free narration prose from "must surface every connection". Avoiding information loss is secondary but mandatory.
- Building a sophisticated consumer (e.g. recommendation feedback, cross-episode synthesis) is a separate product effort.
- v0.4 is already large; deferring consumer UX keeps scope tractable.

**Risk**: If listener never sees archived connections, was Phase 1's investment in `system_sensory_note` and dual-voice narration worth it? Yes — because: (a) Phase 2 ranks against archived candidates; (b) cross-episode reuse is real (a connection archived in ep 1 may be selected in ep 4); (c) data persists for unforeseen consumers.

---

### #7 — Em-dash discouragement is advisory, not validator-enforced

**Decision**: spec §7B.4 + transcript-author SKILL.md discourage em-dash as primary connector. No validator counts em-dashes.

**Why**:
- D4's root cause is partly stylistic LLM default + partly upstream contagion from Phase 1's `system_sensory_note`. Fixing both upstream prompt hygiene + downstream prompt instruction should mostly suffice.
- A counting validator would be brittle (em-dash inside quoted material, em-dash for dialogue, etc.). Stylistic constraints fight regex.

**If problem persists post-PR-3A/4A**: revisit; consider adding a soft validator (warning, not failure) that flags >5 em-dashes per 200 chars.

---

### #8 — Validator distinguishing "selected_as_strong named" vs "free callback named" — DEFERRED

**Decision**: PR-5B's algorithm to distinguish "this artist+song is named because the ConnectionPair is selected_as_strong" from "this artist+song is named in free callback prose" is **deferred to a fallback simpler rule**: validator only enforces "selected_as_strong implies presence" + "every pair is selected or archived". It does NOT enforce "selected_as_strong false implies absence".

**Why**:
- Distinguishing the two kinds of mention requires either:
  - Explicit anchor-tag annotation in markdown (intrusive on prose flow), or
  - LLM judgment per pair (slow + non-deterministic), or
  - Heuristic position-based matching (brittle)
- The fallback (only enforce "selected → present" + "every pair archived or selected") leaves a soft loophole: an author could still surface a non-selected pair in narration. But: (a) the author is not adversarial; (b) the SKILL prompt instruction handles 95%; (c) qualitative author review handles the rest.

**Trade-off accepted**: validator catches missing strong connections + missing archive entries (objective) but not "stuffed prose" (judgment).

**Future (v0.4.1)**: if stuffing becomes an actual problem, revisit with markdown annotation or LLM judgment fallback.

---

### #9 — Persona rename `docent_v1` → `near_listener_v1`

**Decision**: rename for clarity. Old name accepted as legacy alias for one version (v0.4) then removed in v0.5.

**Why**:
- The instruction file's persona description explicitly contradicts v0.3's "Not a DJ" boundary while preserving docent's epistemic depth. The persona is genuinely a different thing.
- Keeping the old name would invite confusion in future cross-version audits.

---

### #10 — Length budgets are hard caps, not soft guides

**Decision**: validator enforces narrative_weight bands strictly (anchor 600–900, pillar 350–500, supporting 220–340, bridge 60–150). Out-of-band fails the build.

**Why**:
- Loose caps in v0.3 (250–400 flat) were ignored anyway and produced平摊篇幅. Enforcement is what makes the dimension visible.
- Bands are wide enough (200+ char span for non-bridge) to allow prose flexibility.
- Author can re-classify weight if narration genuinely demands more space — this is a deliberate authorial decision, not a band-cheating workaround.

---

### #11 — Interlude block type — design deferred to v0.4.1

**Decision**: spec §7B.11 declares Interlude as first-class but defers detailed composition to v0.4.1.

**Why**:
- v0.4 already large; designing detailed Interlude composition (which components, what length, how many per episode, where they may appear) is a substantial sub-spec.
- v0.3 already permitted Interlude as a NarrationBlock type — current usage is enough to validate the v0.4 features.
- The Miss You ep 1 v0.3 transcript actually uses one Interlude (between Khruangbin and Mk.gee). That serves as a working example until v0.4.1 codifies rules.

---

### #12 — `intrinsic_score` weight defaults

**Decision**: `intrinsic_score.value` aggregates with weights `story_drive: 0.30 / concrete_carrier: 0.25 / evidential_strength: 0.20 / focus_relevance: 0.25`. Weights overridable per-focus in `episode_focus_taxonomy.md`.

**Why**:
- `story_drive` weighted highest because the user's primary unmet need is narrative flow.
- `concrete_carrier` second-highest because it's what makes a connection narratable at all.
- `evidential_strength` and `focus_relevance` roughly equal — both gate inclusion but neither solely determines strength.

**Tunable**: revisit after first run on Miss You ep 1 v0.4 (PR-4C). If output skews toward "story-driven but loosely-evidenced" connections, raise `evidential_strength` weight.

---

### #13 — Phase 1 connections-author rewrite is content-heavy, not just schema

**Decision**: PR-2C is editorial — every existing `narration_at_from.voice_zh` must be rewritten to anonymize forward references. This is not a pure rename.

**Why**:
- The pollution is in the prose, not just in the field name. Renaming `narration_at_from` to `foreshadow_anonymous_at_from` without rewriting the prose still leaves "等会儿到 The Rolling Stones 的 Miss You" in the file.
- Recommend landing 5–10 sample anonymizations for user approval before bulk migration. This is captured in PR-2C risks.

**Effort estimate**: ~67 ConnectionPairs × ~1 minute editorial review each = 1–2 hours of focused author/reviewer work, plus LLM-assisted drafting.

---

## Pending user decisions

These are open questions where this draft has chosen a default but explicitly invites override.

### `[NEEDS_USER_DECISION #5]` — Miss You ep 1 narrative_weight assignment

See decision #5 above. Particularly:
- Bowie / Fame: pillar or supporting?
- Mk.gee / You Dreamed of Me: bridge or supporting?
- Any other tracks the user wants reclassified?

### #14 — How does the agent "listen" for `musicological_signature`? — DEFERRED to v0.4.1

**R3 status (2026-05-06)**: Deferred together with #4 / PR-2A. v0.4 routes around this by prompt-eliciting the OPENER sound cue (see #17). The four options below remain on the table for v0.4.1.

**Original `[NEEDS_USER_DECISION #14]` — preserved**:

For 18 Miss You ep 1 nodes, populating `first_5_seconds_what_to_hear` and `signature_move` requires *some* form of audio knowledge. Options:

1. **Training-data familiarity only** — agent writes from what it already knows about widely-known tracks. Fails for less-known nodes.
2. **Author-provided listening notes** — user writes one-line listening notes per track; agent expands. Highest quality, highest user effort.
3. **Cross-source synthesis** — agent reads multiple existing音乐评论 / interviews and triangulates a sonic description. Medium quality, no user effort but risks abstraction creep.
4. **External audio analysis** — Spotify API audio_features / madmom segmentation. Numeric, not narratable directly.

**Provisional default**: 3 (cross-source synthesis), with `epistemic_layer: hypothesis` and `sources: ["agent listening"]` for cases where synthesis falls short.

**Pending**: user preference.

### #15 — `archived_weak_connections.archive_reason` enum closure — RESOLVED (R3)

**Decision**: closed enum in v0.4: `redundant_with_strong | low_focus_relevance | no_concrete_anchor | already_told | off_topic_for_episode`. Validator enforces membership. Enum may be reopened or extended in v0.5 if real cases overflow.

**Why**: analyzability for cross-episode reuse outweighs author flexibility cost; the five values cover the cases observed in Miss You ep 1.

### #16 — Persona alias retention period — RESOLVED (R3)

**Decision**: `docent_v1` retained as legacy alias for `near_listener_v1` for one version only (v0.4). Removed in v0.5. Producers (validators, exhibition build) accept both during v0.4; new artifacts emit `near_listener_v1` exclusively.

**Why**: only the exhibition build references the persona ID. One version is sufficient runway for the migration; longer alias retention would invite drift.

---

### #17 — `musicological_connection` v0.4 sourcing: prompt-elicited (NEW, R3)

**Decision**: In v0.4 the OPENER sound cue is produced via three-tier prompt elicitation in transcript-author, not from a node-level data field:

1. LLM training-data familiarity with the recording (preferred when available).
2. Node JSON `production_facts` / `instrumentation_details` / `member_dynamics` (already present).
3. Scene/motivation fallback (NOT abstract role description) when neither yields a concrete cue.

Hard prohibition (skill-enforced): no abstract role openings ("作为锚点…", "这首歌建立了…").

Soft requirement (skill instruction, no validator in v0.4): every non-bridge track's first-third should contain a concrete sonic referent. `validate_sound_cue_present.py` is NOT introduced in v0.4 (PR-5C removed).

**Why**:
- Backfilling 18 nodes' `musicological_signature` was the largest remaining lift in the round; deferring it to v0.4.1 keeps v0.4 shippable.
- Prompt elicitation captures most of the D5 fix at zero data cost. Quality varies node-by-node; PR-4C transcript review is the gate.
- A future v0.4.1 PR can backfill `musicological_signature` and switch the skill from prompt-elicited to data-driven without breaking the contract.

**Trade-off accepted**: lower-floor on cue quality for less-known nodes; partial reliance on author review during PR-4C.

---

### #18 — PR-2C revised time estimate (NEW, R3)

**Decision**: PR-2C is 3–5 hours of focused work (not the 1–2h previously estimated). Approach: produce 5–10 anonymized samples first, gate on user review (R3 §6.2 stop-gate), then complete bulk migration. ~67 ConnectionPairs require per-pair editorial rewrite of `voice_zh` to anonymize forward references.

**Why**: anonymization is judgment-heavy per pair; pure rename is insufficient (decision #13). Sample-then-bulk reduces rework risk if early samples need calibration.

---

## Revisions to the self-audit report (corrections from working through the spec)

The self-audit report stands largely correct. Two clarifications that emerged during spec drafting:

### Clarification A — D2 difficulty was rated "困难"; revising to "中等-困难"

The self-audit said D2 fix requires:
- (a) ConnectionPair priority field
- (b) validator change
- (c) decide where unused connections go

Working through this in spec §7B.12, the actual lift is more contained because:
- The instruction file decision #2 already settled (c) — archive in episode.json metadata.
- Validator change semantics are well-defined (PR-5B), only Decision #8 is genuinely thorny and has a documented fallback.
- Priority field design is straightforward (four-dimension rubric).

So D2 is more "中等-困难" than pure "困难". Migration cost remains real (PR-2C is content-heavy) but the design is settled.

### Clarification B — D7 partial fix is more accessible than reported

Self-audit said music windows need either external audio analysis or author-provided hints. Working through it:
- spec §7B.7's existing `excerpt_range` (sec-precise) was already in v0.3 but unused. Phase 2 simply needs to populate it when narration references a specific timestamp ("the bass line at 1:28").
- The new `music_window_hint` field captures the looser case ("let bass breathe 15 sec") without requiring sec-precise data.
- Both are advisory in v0.4; this avoids the "either Spotify API or nothing" dichotomy.

D7 partial activation is in PR scope (spec §7B.7 update); fuller mixing-pipeline integration remains v0.5.

---

## v0.4.1 backlog (R3 deferrals)

Items deferred from v0.4 by R3 scope tightening:

- `musicological_signature` node-schema field activation + 18-node backfill for Miss You ep 1 (was PR-2A)
- `validate_sound_cue_present.py` (was PR-5C)
- Switch transcript-author OPENER sourcing from prompt-elicited to data-driven once `musicological_signature` is populated (decision #17 transition)
- Decision #4 (agent-listening sources tag) and Decision #14 (how the agent listens) finalization

## v0.5 backlog (for later)

Items deferred:

- Detailed Interlude composition rules
- `archived_weak_connections` listener-facing UX (cross-episode reuse, recommendation feedback)
- Multi-focus `musicological_signature` arrays per node (when same node appears in different focus episodes)
- `music_window_hint` enforcement / mixing-pipeline integration
- Cross-anchor synthesis (deferred from v0.3)
- Profile evolution / live coverage updates (deferred from v0.3)
- Multi-narrator episode support
- Remove `docent_v1` legacy alias (Decision #16 fulfillment)
- Reopen `archived_weak_connections.archive_reason` enum if real cases overflow (decision #15)

---

*End of decisions log. Append new entries with monotonically-increasing IDs. User responses go below the relevant entry.*
