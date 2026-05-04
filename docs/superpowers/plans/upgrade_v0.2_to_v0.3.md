# Claude Code Instructions: Upgrade Sonic Cartography Spec from v0.2 → v0.3

**Target file**: `sonic_cartography_spec_v0.2.md` (rename to `sonic_cartography_spec_v0.3.md` after edits)

**Scope of change**: Add audio episode deliverable as a new output form alongside the existing annotated playlist. The annotated playlist (§7) remains unchanged in structure but gains a sibling section §7B for audio. Several anchor sections need small updates to reflect the new deliverable.

**Editing principle**: Use precise string-anchored edits (search-and-replace with unique context), not whole-section rewrites. The user has local modifications to v0.2 that must be preserved.

---

## EDIT 1 — Update document header

**Find this exact block** at the top of the file:

```
> **Document type**: Engineering spec / agent handoff
> **Primary reader**: Claude Code agent (CLI-based coding agent)
> **Author intent**: Enable an agent to execute Sonic Cartography tasks autonomously, produce platform-neutral deliverables, and remain consistent across future invocations.
> **Last updated**: 2026-05-04
```

**Replace with**:

```
> **Document type**: Engineering spec / agent handoff
> **Primary reader**: Claude Code agent (CLI-based coding agent)
> **Author intent**: Enable an agent to execute Sonic Cartography tasks autonomously, produce platform-neutral deliverables, and remain consistent across future invocations.
> **Last updated**: 2026-05-05
> **Version**: 0.3
```

Also change the H1 heading from `# Sonic Cartography — Project Spec v0.2` to `# Sonic Cartography — Project Spec v0.3`.

---

## EDIT 2 — Update §1 deliverable list

**Find this exact block** in §1:

```
**Final deliverable form** (single-shot scope, v0.x):
A pair of files per anchor expansion:

- `<anchor_slug>.map.json` — the structural map (nodes + edges + coverage)
- `<anchor_slug>.playlist.md` — the user-facing annotated playlist derived from the map

Future deliverables (v1.0+, out of scope for v0.2): platform exports (Spotify, NetEase Cloud, YouTube), web-renderable map viewer, persistent vault for cross-anchor synthesis.
```

**Replace with**:

```
**Final deliverable form** (single-shot scope, v0.x):
A bundle of files per anchor expansion:

- `<anchor_slug>.map.json` — the structural map (nodes + edges + coverage)
- `<anchor_slug>.playlist.md` — the user-facing annotated playlist derived from the map (text/visual mode)
- `<anchor_slug>.episode.json` — the audio episode script and stitching manifest (audio mode, see §7B)
- `<anchor_slug>.episode.md` — human-readable rendering of the episode for review before synthesis

The annotated playlist (§7) and the audio episode (§7B) are two presentations of the same underlying map. They share track selection and ordering but differ in narration register, length budget, and consumption mode. Generating one does not require generating the other; they are independently triggerable.

Future deliverables (v1.0+, out of scope for v0.3): platform exports (Spotify, NetEase Cloud, YouTube), web-renderable map viewer, persistent vault for cross-anchor synthesis, TTS audio rendering pipeline, alternative voice profiles for multi-narrator episodes.
```

---

## EDIT 3 — Insert new §7B after §7

**Find this exact line** (the closing horizontal rule of §7, immediately before §8):

```
The agent does not silently drop tracks for availability reasons.

---

## 8. Epistemic annotation protocol
```

**Replace with** (the long block below — §7B inserted between §7's closing and §8's opening):

```
The agent does not silently drop tracks for availability reasons.

---

## 7B. Audio episode spec (auditory museum mode)

### 7B.0 Purpose and metaphor

The audio mode is the same map (§3 output) presented as a guided exhibition rather than a written catalog. The metaphor is **auditory museum**: each track is an exhibit; each narration block is the wall-text beside it; the listener can choose to read the wall-text or skip it and let the exhibit speak.

This metaphor has direct schema consequences:

- Music and narration are **parallel content streams**, not nested. A consumer-side player must be able to mute narration while keeping music, or vice versa.
- Narration must be **independently meaningful per exhibit**. Each pre/post block stands as its own caption; it does not require the previous narration to be coherent.
- The episode has a curatorial sequence (exhibition order) but the listener's path is free.

### 7B.1 Narrator persona

Single voice. Stable across all episodes.

The narrator is not the user. The narrator is a stable virtual persona whose role is **expert museum docent**: a knowledgeable music enthusiast with grounding in music theory and music history, who explains exhibits with precision and warmth. Not a personal essayist (the narrator does not foreground "my feelings"). Not an academic (the narrator is enthused, not detached). Not a DJ (the narrator does not perform energy or banter).

Persona spec:

```json
{
  "persona_id": "docent_v1",
  "voice_register": "expert enthusiast",
  "knowledge_basis": "music theory + music history",
  "emotional_baseline": "warm, attentive, precise",
  "first_person_use": "rare, only when surfacing a curatorial choice (e.g. 'I've placed this track here because...')",
  "personal_anecdote_use": "never",
  "technical_vocabulary": "freely used when accurate, glossed when first introduced if technical",
  "tone_to_avoid": [
    "dramatic / theatrical / hype",
    "casual / chatty / conversational fillers",
    "academic / detached / hedged",
    "reverential / mythologizing"
  ]
}
```

The narrator addresses a listener who is interested but not yet expert. Technical terms are welcome but never thrown without grounding. When in doubt about register, default to "describing what is audibly happening" rather than "explaining what it means."

### 7B.2 Episode JSON schema

```json
{
  "episode_id": "string (e.g. 'rolling-stones_some-girls_miss-you__ep-01')",
  "spec_version": "0.3",
  "anchor_node_id": "string (links to the source map.json)",
  "title": "string (e.g. 'Miss You-1: 摇滚 × Funk 翻译血脉的 Studio 54 起点')",
  "subtitle": "string (optional)",
  "curatorial_thesis": "string (one sentence: what relational structure this episode demonstrates through its sequence)",
  "narrator_persona_id": "docent_v1",
  "ordering_principle": "chronological | thematic_arc | coverage_first | curatorial_custom",
  "ordering_rationale": "string (one paragraph: why this order serves the thesis)",
  "exhibits": [
    {
      "position": "integer (1-indexed)",
      "exhibit_type": "track | opening | closing | interlude",
      "track_ref": {
        "node_id": "string (links to map node)",
        "artist": "string",
        "song": "string",
        "album": "string",
        "year": "integer",
        "play_mode": "full | excerpt",
        "excerpt_range": {"start_sec": "integer", "end_sec": "integer"} ,
        "platform_links": {
          "spotify": "URL or null",
          "netease": "URL or null",
          "youtube": "URL or null",
          "apple_music": "URL or null"
        }
      },
      "pre_narration": "NarrationBlock or null",
      "post_narration": "NarrationBlock or null"
    }
  ],
  "duration_estimates": {
    "music_only_seconds": "integer (sum of all track durations or excerpt durations)",
    "narration_only_seconds": "integer (sum of all narration durations)",
    "full_episode_seconds": "integer (music + narration, assuming sequential playback)"
  },
  "expansion_notes": "string (caveats specific to the audio rendering: missing platform links, narration components dropped due to research gaps, etc.)",
  "generated_at": "ISO timestamp"
}
```

`exhibit_type` values:

- `opening` — narration-only, no track. Sets the episode's curatorial thesis. Required as position 1.
- `closing` — narration-only, no track. Closes with a forward-pointing observation (e.g. what this episode left unexplored). Required as the last position.
- `track` — a music exhibit with optional pre/post narration. The bulk of the episode.
- `interlude` — narration-only, mid-episode. Used sparingly to signal a structural pivot (e.g. "we now leave the ancestor lineage and enter the descendants"). Optional, max one or two per episode.

### 7B.3 NarrationBlock schema

```json
{
  "narration_id": "string (e.g. 'pre_03', 'post_07')",
  "text_for_tts": "string (the actual text to be synthesized; may include SSML break tags)",
  "estimated_duration_seconds": "integer (computed from text length / typical speaking pace ~ 250 chinese chars per minute)",
  "components_present": "array of component IDs (see §7B.4) actually used in this block",
  "voice_overrides": {
    "pace": "normal | slow | very_slow",
    "emotional_register": "neutral | contemplative | warm",
    "use_default_persona": true
  },
  "epistemic_layer": "fact | consensus | hypothesis | mixed",
  "sources_referenced": "array of source URLs or 'agent synthesis' tags inherited from the underlying node/edge"
}
```

### 7B.4 Narration components

A NarrationBlock is composed of one or more **components**. Each component is a specific kind of content with its own purpose, length budget, and trigger conditions.

#### Required components (must be present in every pre_narration except after opening)

**`lineage_position`** — Where this exhibit sits on the map.
- Length: 1–2 sentences (≈30–60 Chinese chars)
- Content: this node's `position_in_era.historical_role` distilled to museum-tag length, optionally with a one-phrase reference to the anchor or the larger lineage being walked.
- Example: "这是 1978 年 Stones 把 Studio 54 的 funk 节奏穿在他们 blues rock 骨架上的第一次完整尝试,也是这条「摇滚乐队学 funk」血脉的奠基节点。"

**At least one of these two relational components**:

**`relation_to_previous`** — Connects to the prior exhibit.
- Length: 1–2 sentences
- Content: the edge type and short evidence between this node and the prior. If the prior is `opening`, this component takes the form "we begin here because...".
- Example: "上一首 Chic 的 Good Times 给了 Studio 54 这条节奏语言的祖宗形态——这一首是这种语言被搬运到一个白人 blues rock 乐队手里的样子。"

**`relation_to_next`** — Forecasts the next exhibit (used in post_narration).
- Length: 1 sentence
- Content: prepares the listener for the upcoming relational move.
- Example: "接下来要听的 Queen 的 Another One Bites the Dust,是同一种翻译两年后由另一支英国乐队的 bass 手主导完成——但这次的源头更具体。"

**`musicological_connection`** — REQUIRED. Music-theory-level description of the connection to other exhibits or to the lineage.
- Length: 2–4 sentences (≈60–120 Chinese chars)
- Content: specific, audible, technical. Examples of valid material:
  - bass line construction (interval pattern, syncopation type, rhythmic relationship to kick drum)
  - drum pattern (backbeat placement, hi-hat subdivision, kick-snare relationship, four-on-the-floor vs syncopated kick)
  - chord progression and harmonic devices (modal interchange, tritone substitution, suspension)
  - meter and metric modulation
  - vocal phrasing (where syllables land relative to the beat, melisma vs declamation)
  - production technique (compression strategy, dry vs wet drum sound, mid-side processing, parallel compression, gated reverb)
  - instrumentation choices (specific synth model, specific guitar pedal, drum machine model)
  - song form / arrangement (intro length, verse-chorus ratio, breakdown structure)
- The component should explicitly relate the technical observation to **another exhibit on the map** (the prior one, the anchor, an ancestor, or a sibling) — i.e. it should not just describe this song's mechanics in isolation; it should describe how its mechanics dialogue with another node's mechanics.
- Use precise terminology. Gloss it once if introducing a term that listeners may not know.
- Example: "Bill Wyman 在 Miss You 里的 bass line 用的是 Chic 那种 octave-jumping 八度跳进——但他把每一拍的强重音错开了一个十六分音符,所以走起来比 Chic 的 locked groove 更晃,更像 Stones 一直以来的那种 swing。这不是 funk 的标准句法,这是 Wyman 在用 funk 词汇说 Stones 的话。"

#### Optional components

**`narrative_slot_excerpt`** — A pull from the node's `narrative_slots` (§5).
- Length: 1–3 sentences
- Content: one of `member_dynamics`, `cultural_venue`, `production_facts`, `instrumentation_details`, or `release_circumstances` — selected based on which best supports the exhibit's curatorial role.
- Strongly recommended for at least 50% of pre_narration blocks across the episode. Variety across components is encouraged.

**`lineage_anchor_recall`** — Reminder of the episode's overarching thesis or anchor.
- Length: 1 sentence
- Content: ties this exhibit back to the curatorial thesis or anchor node.
- Use sparingly: at most every 3–4 exhibits, and at the closing.

**`epistemic_disclosure`** — Inline tag of confidence layer.
- Length: 1 sentence or parenthetical phrase
- Content: explicit marker that the connection just described is `[fact]`, `[consensus]`, or `[hypothesis]`. Required when the NarrationBlock contains hypothesis-tier claims; optional otherwise.
- Example: "这条联系目前还没有被乐评界正式记录,是这次绘图过程中浮出来的工作假说。"

**`personal_resonance`** — User-facing personal connection (the user's, not the narrator's).
- Length: 1–2 sentences
- Content: surfaces the user's coverage status (e.g. "你的红心库里这首歌出现过,在 2026 年 1 月") or matches with user mechanism (e.g. "这是你审美机制 1「翻译美学」最干净的代表案例之一").
- Optional in v0.3. Use only when materially additive — avoid mechanical insertion.

#### Component composition rules

- Minimum pre_narration: `lineage_position` + (`relation_to_previous` OR `relation_to_next`) + `musicological_connection`. This is the floor.
- Typical pre_narration: floor + one of {`narrative_slot_excerpt`, `personal_resonance`}.
- post_narration is optional per exhibit. When present, typical content: a one-sentence summation of what the exhibit just demonstrated, plus `relation_to_next`.
- Components within a single block should flow as natural prose, not appear as labeled sections. The schema is internal scaffolding; the output is a paragraph.

### 7B.5 Length budgets

Per NarrationBlock:

- Target: **60–120 seconds** when read at typical pace
- In Chinese: ≈ 250–500 characters
- Hard cap: 150 seconds / 600 characters
- Floor: 30 seconds / 120 characters (below this the block lacks substance and should be merged with adjacent narration or dropped)

Per episode:

- Default exhibit count: 6–12 tracks (smaller than the playlist default in §7.4 because audio mode is more time-expensive to consume)
- Maximum: 15 tracks
- Total episode duration target: 45–75 minutes
- Total episode duration cap: 90 minutes

If the source map produces a track count outside these bounds, the agent should not auto-split into multiple episodes; it should produce one episode at the appropriate cap and flag the remaining material in `expansion_notes` for a potential follow-up episode.

### 7B.6 SSML and TTS-readiness markers

`text_for_tts` may include the following markers (kept platform-neutral; consumers can map to specific TTS engine syntax):

- `<break time="500ms"/>` — explicit pause; use for dramatic timing or to separate components within a block. Standard pauses (after periods, commas) should NOT be marked; trust the TTS engine's defaults.
- `<emphasis level="strong">term</emphasis>` — emphasize a key term. Use sparingly (max 2–3 per block).
- `<say-as interpret-as="characters">XYZ</say-as>` — for letter-by-letter pronunciation (rare, e.g. acronyms that should be spelled rather than pronounced).
- `<phoneme alphabet="ipa" ph="...">term</phoneme>` — for non-Chinese names or terms that the default Chinese TTS might mispronounce. RECOMMENDED for: artist names, album names, technical terms in English. The agent should populate phoneme tags for all proper nouns appearing in non-trivial frequency.
- `<lang xml:lang="en-US">English phrase</lang>` — for inline English that should be read in English voice. Use for full song titles or quoted phrases.

The agent must not invent SSML markers outside this list. Downstream rendering can be lossy if markers are unsupported by the chosen TTS engine; the markdown render (see §7B.8) preserves the original text without markers for human reading.

### 7B.7 Track playback configuration

Each track exhibit's `track_ref` includes `play_mode`:

- `full` — play the entire track. Default for tracks where the lineage discussion concerns the whole arc of the song or where the exhibit is one of the user's anchor activations.
- `excerpt` — play a specified range. Use when the musicological_connection focuses on a specific section (e.g. "the bass line that enters at 1:28 is what we're listening for").

When `excerpt` is used, `excerpt_range` must specify start_sec and end_sec. Recommended excerpt length: 60–120 seconds. Excerpts shorter than 30 seconds are too brief to be exhibits and should either be expanded or replaced with a `full` play.

The default ratio across an episode: ≥70% full plays, ≤30% excerpts. Audio mode rewards immersion; over-excerpting fragments the listening experience.

### 7B.8 Markdown rendering

The agent produces a human-readable markdown of the episode for review before TTS synthesis:

```markdown
# {title}
*{subtitle}*

**Curatorial thesis**: {curatorial_thesis}
**Ordering**: {ordering_principle} — {ordering_rationale}
**Estimated total**: {full_episode_seconds in mm:ss} (music: {music_only_seconds}, narration: {narration_only_seconds})
**Narrator**: {narrator_persona_id}

---

## Opening
{opening narration text, SSML stripped}

---

## Exhibit 1: {artist} — {song} ({year})
*From {album}* · *play_mode: {full | excerpt at {range}}*

### Pre-narration
{pre_narration text, SSML stripped}

*[~{narration duration}s]*

### [Music plays]

### Post-narration
{post_narration text, SSML stripped, if present}

*[~{narration duration}s]*

[Listen on: {platform links}]

---

## Exhibit 2: ...

---

## Closing
{closing narration text, SSML stripped}
```

The markdown is for human verification before invoking TTS. The actual audio production pipeline reads from the JSON.

### 7B.9 Self-check questions before delivery (audio mode)

In addition to §9.3, before delivering an episode the agent verifies:

1. Does every track exhibit have a `musicological_connection` component in its pre_narration?
2. Does every track exhibit have at least one relational component (`relation_to_previous` or `relation_to_next`)?
3. Are all proper nouns (artists, albums, songs, technical terms in non-Chinese languages) wrapped in `<phoneme>` or `<lang>` tags?
4. Is total episode duration within the 45–75 minute target band, and not exceeding the 90-minute cap?
5. Does the opening narration state the curatorial thesis explicitly?
6. Does the closing narration include a forward-pointing observation (what this episode left unexplored)?
7. Are exhibits ordered in a way the `ordering_rationale` actually justifies?
8. Are hypothesis-tier claims (in narration) accompanied by `epistemic_disclosure`?

If any answer is no, fix or flag before delivering.

### 7B.10 Out of scope for v0.3 (audio mode)

- Actual TTS audio synthesis (the spec produces text + manifest; rendering is a downstream step)
- Background music / ambient beds under narration
- Multi-narrator episodes (single voice only in v0.3)
- Crossfade, ducking, or any audio mixing parameters beyond exhibit-level sequencing
- Listener-controlled branching (the episode is linear)

These are flagged in §11.

---

## 8. Epistemic annotation protocol
```

---

## EDIT 4 — Update §11 out-of-scope list

**Find this block** in §11:

```
- **Mechanism test refinement**: §6.1 test functions (especially M1 `translation_aesthetic` and M4 `frequency_hollowing`) require auditory judgment the agent cannot perform directly. Current implementation degrades to "is this node described as such-and-such hybrid in the critical literature?" This is lossy. Future version should incorporate user-curated example sets per mechanism so the agent can pattern-match more reliably.

When v0.2 hits any of these areas in execution, the agent flags as out-of-scope and proceeds with current-version behavior.
```

**Replace with**:

```
- **Mechanism test refinement**: §6.1 test functions (especially M1 `translation_aesthetic` and M4 `frequency_hollowing`) require auditory judgment the agent cannot perform directly. Current implementation degrades to "is this node described as such-and-such hybrid in the critical literature?" This is lossy. Future version should incorporate user-curated example sets per mechanism so the agent can pattern-match more reliably.
- **TTS audio synthesis**: §7B produces TTS-ready text + stitching manifest. The actual audio rendering (calling a TTS API, downloading music files, mixing via ffmpeg/pydub, exporting final mp3/wav) is a downstream pipeline not covered here.
- **Background ambience and audio mixing**: §7B sequences exhibits but does not specify ambient music beds, ducking curves, crossfades, or any post-production mixing.
- **Multi-narrator episodes**: §7B specifies a single persona (`docent_v1`). Episodes with multiple voices (e.g. one narrator per era, or dialogue-style) are out of scope.
- **Episode interactivity**: branching paths, listener choice points, or non-linear consumption are out of scope; v0.3 episodes are linear.

When v0.3 hits any of these areas in execution, the agent flags as out-of-scope and proceeds with current-version behavior.
```

---

## EDIT 5 — Update §12 glossary

**Find this exact line** in §12:

```
- **Mechanism**: a documented user preference pattern (§6) used as decision support
```

**Replace with**:

```
- **Mechanism**: a documented user preference pattern (§6) used as decision support
- **Episode**: an audio mode rendering of a map (§7B), structured as a sequence of exhibits with narration
- **Exhibit**: one item in an episode — typically a track with optional pre/post narration; can also be opening/closing/interlude (narration-only)
- **NarrationBlock**: the text-for-TTS unit attached to an exhibit (pre or post), composed of one or more components (§7B.4)
- **Docent**: the narrator persona for audio episodes (§7B.1) — single voice, expert enthusiast register
- **Auditory museum**: the metaphor governing audio mode design — exhibits and wall-text as parallel content streams
```

---

## EDIT 6 — Rename file

After all edits applied: rename `sonic_cartography_spec_v0.2.md` to `sonic_cartography_spec_v0.3.md`.

---

## Verification checklist

After applying all edits, verify:

1. The H1 line reads `# Sonic Cartography — Project Spec v0.3`
2. The header block contains both `**Last updated**: 2026-05-05` and `**Version**: 0.3`
3. §1 lists four deliverable files (map.json, playlist.md, episode.json, episode.md)
4. §7B exists in full between §7 and §8
5. §7B.4 lists `musicological_connection` as REQUIRED in the floor composition rule
6. §7B.5 specifies 60–120 second / 250–500 Chinese character target per NarrationBlock
7. §11 includes the four new audio-related out-of-scope items
8. §12 glossary has 5 new audio-mode entries
9. No content from v0.2 has been removed (this upgrade is purely additive plus minor anchor edits in §1 and §12)
10. The file is renamed to `sonic_cartography_spec_v0.3.md`

---

## Notes for Claude Code

- The user has local modifications to v0.2 that may include rewordings or additions in any section. The string-anchored edits above target unique text blocks that the user is unlikely to have modified. If any anchor string fails to match, **do not proceed** with that edit — instead surface the mismatch to the user and ask how to reconcile.
- Do not change §6 (User aesthetic profile), §3 (Anchor expansion protocol), §4 (Data sources), or §5 (Narrative pool) — these are referenced from §7B but their content is correctly inherited.
- The `narrator_persona_id: "docent_v1"` value is the start of a persona registry that may grow in v1.0+. Treat it as a stable identifier.
- Where the spec previously said "v0.2" in self-references (e.g. §7.1's `"spec_version": "0.2"` example), do NOT auto-rewrite these to v0.3. The v0.2 example reflects a legitimate v0.2 output; only the new audio episode JSON example uses v0.3.

End of instructions.
