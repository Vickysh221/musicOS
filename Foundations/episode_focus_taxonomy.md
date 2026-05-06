# Episode Focus Taxonomy

A *focus* is the thematic lens an episode applies on top of the lineage map. It controls:

1. **Which connection kinds count as on-focus** during Phase 0 track curation (`connection_kinds_in_scope`).
2. **Which node fields drive prompt assembly** during Phase 2 transcript writing.
3. **OPENING / CLOSING template seeds** for the framing blocks in the episode.
4. **Optional `intrinsic_score_weight_overrides`** for Phase 1 connection scoring.

> **v0.4 changes**: per-tier RESONANCE template phrasing has been removed. Tier-conditioned narration was a rigid, low-signal layer that produced uniform hit/adjacent/blind_spot phrasing across episodes; it is replaced by the 6-layer logical order in spec §7B.5 + the `near_listener_v1` persona, both of which constrain voice without constraining one specific sentence per tier. Field references to `bass_dna_signature` are dropped (the node-level signature schema is deferred to v0.4.1; v0.4 sources OPENER cues via prompt elicitation per decision-log #17).

This file is the canonical registry. Add a new focus by appending a section below.

---

## bassline_dna

- **Slug:** `bassline_dna`
- **Episode title pattern (ZH):** `贝斯线索 — <anchor song>`
- **`connection_kinds_in_scope`:** `bassline_prototype`, `groove_dna`, `personnel_bridge_bass`, `gear_lineage_bass`, plus `direct_influence` / `methodological_descent` / `genealogical_descent` / `same_era_dialogue` when the dialogue is a bass-side conversation.
- **Node fields the prompt should read** (Phase 2): `production_facts`, `member_dynamics`, `instrumentation_details`, `cultural_venue`, `release_circumstances` (in spec §8 priority order). The OPENER sound cue is sourced via prompt elicitation (transcript-author SKILL Stage 2.2 R3 §3.2 three-tier fallback), not from a node field, in v0.4.
- **Mute rule:** if the node has no documented bass-line significance → assign `narrative_weight: bridge` and `muted_this_episode: true` in tracklist.
- **OPENING template seed:** one concrete sonic micro-description of the anchor's first riff (16–30 ZH chars), then "今天这一集我们沿着这条贝斯线索往外走", then one arc-overview sentence (track count + year span).
- **CLOSING template seed:** loop back to the anchor's bass figure with one fresh adjective; name the two `selected_as_strong` connections that are also `red_heart_tier: hit` (the strongest already-loved echoes the episode surfaced).
- **`intrinsic_score_weight_overrides`:** none in v0.4 (use defaults: story_drive 0.30 / concrete_carrier 0.25 / evidential_strength 0.20 / focus_relevance 0.25).

---

## aria_solo_dialectic

- **Slug:** `aria_solo_dialectic`
- **Episode title pattern (ZH):** `双主角 — <anchor song>`
- **`connection_kinds_in_scope`:** `dual_protagonist_structure`, `aria_form_descent`, `extended_solo_as_movement`, plus `direct_influence` / `methodological_descent` / `genealogical_descent` / `same_era_dialogue` when the dialogue is about the dual-protagonist structure itself.
- **Node fields the prompt should read** (Phase 2): `production_facts`, `member_dynamics`, `release_circumstances`, `instrumentation_details`, `cultural_venue` (in spec §8 priority order). The OPENER sound cue is sourced via prompt elicitation per the same three-tier fallback used in `bassline_dna`.
- **Mute rule:** if the node has no documented dual-protagonist structural significance → assign `narrative_weight: bridge` and `muted_this_episode: true` in tracklist.
- **OPENING template seed:** one concrete sonic micro-description of the anchor's aria–solo collision moment (16–30 ZH chars, e.g. the 7:30–9:00 stretch of *Estranged* where Slash's solo and Axl's final plea share the foreground); then "今天这一集我们沿着这种'两个主角同时在场'的写法往外走"; then one arc-overview sentence (track count + year span). The 19c aria–cabaletta ancestor MAY be referenced in this background block but does not occupy a station.
- **CLOSING template seed:** loop back to the anchor's aria–solo moment with one fresh adjective; name the two `selected_as_strong` connections that are also `red_heart_tier: hit` (the strongest already-loved echoes the episode surfaced).
- **`intrinsic_score_weight_overrides`:** raise `concrete_carrier` to 0.30 (dual-protagonist structure is structural fact and needs concrete-moment carriers); leave others at default (story_drive 0.30 / evidential_strength 0.20 / focus_relevance 0.20).
- **Node selection rule (cross-cuts entire spec):** inclusion is by lineage merit, NOT by user red-heart hit. `red_heart_tier` is metadata for closing-template tone-shaping only. (Mirrors the rule applied to all focuses; documented here because Episode 2 is the first to formalize it.)

---

## voicing (placeholder, not yet shipped)

- **Slug:** `voicing`
- Reserved. Define before first voicing-focused episode.
- Provisional `connection_kinds_in_scope`: `voicing_lineage`, `chord_language_descent`, `harmonic_signature_share`.

---

## frequency_hollowing (placeholder, not yet shipped)

- **Slug:** `frequency_hollowing`
- Reserved. Maps to user aesthetic mechanism M4 (spec §6).
- Provisional `connection_kinds_in_scope`: `spectrum_choice`, `arrangement_subtraction`, `room_aesthetic_share`.
- Provisional `intrinsic_score_weight_overrides`: raise `concrete_carrier` to 0.30 (sparse mixes need a concrete pointer to register).
