# Episode Focus Taxonomy

A *focus* is the thematic lens an episode applies on top of the lineage map. It controls:

1. **Which connection kinds count as on-focus** during Phase 0 track curation.
2. **Which node fields drive prompt assembly** during Phase 2 transcript writing.
3. **The RESONANCE template phrasing per red-heart tier** in the TTS template.

This file is the canonical registry. Add a new focus by appending a section below — every field is required.

---

## bassline_dna

- **Slug:** `bassline_dna`
- **Episode title pattern (ZH):** `贝斯线索 — <anchor song>`
- **On-focus connection kinds:** `direct_influence`, `methodological_descent`, `genealogical_descent`, `same_era_dialogue` (only when the dialogue is a bass-side conversation)
- **Required node fields for prompt:** `bass_dna_signature`, `production_facts`, `member_dynamics`
- **Mute rule:** if the node has no documented bass-line significance → `muted_this_episode = true`
- **RESONANCE template:**
  - `hit`: 强调用户对这条贝斯线索的熟悉感,落点在身体记忆
  - `adjacent`: 指出与已知红心的相邻关系,描述贝斯手法的家族相似
  - `blind_spot`: 提示这是用户尚未点亮的节点,用一句话锚定它在贝斯谱系中的位置
- **OPENING template seed:** anchor song's bass riff micro-description (16-30 ZH chars), then "今天这一集我们沿着这条贝斯线索往外走"
- **CLOSING template seed:** loop back to anchor's bass figure, name the two strongest tier-`hit` resonances surfaced in the episode

---

## voicing (placeholder, not yet shipped)

- **Slug:** `voicing`
- Reserved. Define before first voicing-focused episode.

---

## frequency_hollowing (placeholder, not yet shipped)

- **Slug:** `frequency_hollowing`
- Reserved. Maps to user aesthetic mechanism M4 (spec §6).
