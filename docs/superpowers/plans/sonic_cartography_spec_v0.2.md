# Sonic Cartography — Project Spec v0.2

> **Document type**: Engineering spec / agent handoff
> **Primary reader**: Claude Code agent (CLI-based coding agent)
> **Author intent**: Enable an agent to execute Sonic Cartography tasks autonomously, produce platform-neutral deliverables, and remain consistent across future invocations.
> **Last updated**: 2026-05-04

---

## 0. Document purpose

This document is a **specification**, not a manifesto. It defines:

- The ontology of the Sonic Cartography project (what entities exist and how they relate)
- The data schemas for nodes, edges, and deliverables
- The protocols agents follow when executing tasks (anchor expansion, narrative composition, list generation)
- The quality bars and termination conditions

It is **not**:

- An essay about why this project exists
- A discussion of the user's aesthetic identity
- A meta-reflection on the human–agent collaboration

Background context (the user's aesthetic mechanisms, prior conversations, the Miss You case study) is included only where it materially affects agent behavior. When in doubt, prefer rules over narrative.

**Versioning convention**:
- v0.x = single-shot handoff documents (current scope)
- v1.0+ = persistent SOP (future scope, see §11)

---

## 1. Project goal

**One-line definition**:
Sonic Cartography is a system for mapping music genealogy from a chosen anchor (an artist–period–work node) outward across influence relationships, overlaying a user's listening data as coverage markers, and producing annotated playlists as the user-facing deliverable.

**Final deliverable form** (single-shot scope, v0.x):
A pair of files per anchor expansion:

- `<anchor_slug>.map.json` — the structural map (nodes + edges + coverage)
- `<anchor_slug>.playlist.md` — the user-facing annotated playlist derived from the map

Future deliverables (v1.0+, out of scope for v0.2): platform exports (Spotify, NetEase Cloud, YouTube), web-renderable map viewer, persistent vault for cross-anchor synthesis.

---

## 2. Core ontology

### 2.1 Node definition

**A node is a triple**: `(artist, period, work_or_works)`

Not an artist alone (too coarse). Not a single song alone (too fine; doesn't capture period-bound exploration). The node represents an artist's exploration in a specific period, instantiated through one or a small set of works.

**Node JSON schema**:

```json
{
  "id": "string (slug, e.g. 'rolling-stones_some-girls_miss-you')",
  "artist": "string (canonical artist name)",
  "period": {
    "label": "string (e.g. 'Some Girls era', 'Berlin trilogy', '1976-1981 disco pivot')",
    "year_start": "integer",
    "year_end": "integer"
  },
  "works": [
    {
      "title": "string",
      "type": "track | album | ep",
      "year": "integer",
      "release_id": "string (optional MBID, ISRC, or platform-specific id)"
    }
  ],
  "position_in_era": {
    "primary_genre_lineage": "string (e.g. 'rock x funk/disco translation')",
    "geographic_locus": "string (e.g. 'NYC Studio 54 / London')",
    "historical_role": "string (one sentence: what this node did in its time)"
  },
  "narrative_slots": {
    "member_dynamics": "string | null",
    "cultural_venue": "string | null",
    "production_facts": "string | null",
    "instrumentation_details": "string | null",
    "release_circumstances": "string | null"
  },
  "user_coverage": {
    "status": "activated | touched_unactivated | untouched",
    "evidence": ["string (citations from user's red-heart data, e.g. '红心 2026-05-04')"],
    "confidence": "high | medium | low"
  },
  "epistemic_layer": "fact | consensus | hypothesis (overall)",
  "sources": ["string (URL or citation)"]
}
```

**Field notes**:

- `position_in_era.historical_role`: single-sentence answer to "what did this node accomplish in music history?" — this is the **load-bearing field** for map navigation. If you can't write this sentence cleanly, the node is poorly defined.
- `narrative_slots`: §5 defines what goes in each slot. These are optional but populating them is what makes the playlist annotations interesting.
- `user_coverage.status`: §4.2 defines how to compute this.

### 2.2 Edge definition

**An edge connects two nodes** with a typed relationship. Edges are directional unless explicitly bidirectional.

**Edge type enum**:

| Edge type | Direction | Definition |
|---|---|---|
| `direct_influence` | A → B | B's creators have stated A as direct influence; or documented quotation/sampling/cover |
| `same_era_dialogue` | A ↔ B | Same period (within ~3 years), same broad lineage, mutually aware |
| `genealogical_descent` | A → B | B continues A's lineage through one or more intermediate generations |
| `translation` | A → B | B applies A's genetic material under a different stylistic envelope (the "基因穿外套" relationship) |
| `hybridization` | (A, B) → C | C combines genetic material from A and B |
| `inversion` | A → B | B is an explicit reaction against or inversion of A |
| `methodological_descent` | A → B | B inherits A's working method (recording technique, composition approach), not A's surface sound |

**Edge JSON schema**:

```json
{
  "id": "string",
  "type": "enum (see above)",
  "source_node_id": "string",
  "target_node_id": "string (or array for hybridization)",
  "evidence": "string (one or two sentences: what makes this edge real)",
  "epistemic_layer": "fact | consensus | hypothesis",
  "sources": ["string (URLs)"],
  "notes": "string (optional)"
}
```

**Critical rule**: every edge must declare its `epistemic_layer`. An agent should never write an edge as `fact` without a citable source. When in doubt, mark as `hypothesis`.

### 2.3 What nodes are NOT

- Not "an artist" (e.g. "Queen") — too coarse. Use period-bound nodes (e.g. "Queen / The Game era / Another One Bites the Dust").
- Not "a genre" (e.g. "disco") — genres are not nodes. They are lineage labels used in `position_in_era.primary_genre_lineage`.
- Not "a fan's favorite song list" — coverage is a property of the user's relationship to nodes, not a node itself.

---

## 3. Anchor expansion protocol

Given an anchor node, the agent produces a map by expanding outward in three directions.

### 3.1 The three axes

**Axis 1 — Upward (ancestors)**
Direct influences and ancestral lineage. Bounded by genre origin or by the point where further ancestry becomes archaeological rather than musically meaningful.

**Axis 2 — Lateral (siblings)**
Same-era nodes (within ~5 years of anchor) operating in adjacent or overlapping lineages. Includes both convergent (same translation, different artist) and contrastive (same era, different choice) siblings.

**Axis 3 — Downward (descendants)**
Nodes that inherit from the anchor across decades. Continue until reaching present-day endpoints or until the lineage dilutes beyond recognition.

### 3.2 Depth limits per axis

To prevent unbounded expansion:

| Axis | Default node count | Hard cap |
|---|---|---|
| Upward | 6–10 | 15 |
| Lateral | 5–8 | 12 |
| Downward | 8–12 | 20 |

If a hard cap is reached, the agent stops adding nodes on that axis and notes the truncation in the map output's `expansion_notes` field.

### 3.3 Stopping rules

The agent stops expanding (even before hitting caps) when:

1. **Lineage dilution**: the next candidate node's connection to the anchor goes through more than 3 intermediate nodes AND the influence is contested rather than documented.
2. **Genre drift**: the candidate node belongs to a fundamentally unrelated lineage (e.g. expanding from a rock anchor into pure classical baroque).
3. **Saturation**: the user's coverage on this axis is already comprehensive and adding more nodes provides no new exploration value.
4. **Citation failure**: the agent cannot find a source for the proposed edge above `hypothesis` quality, AND already has 3+ hypothesis-tier edges in the current expansion.

### 3.4 Coverage overlay

After structural expansion, the agent overlays user red-heart data:

- For each node, check if the artist + works appear in the user's `tracks.json` (§4.1).
- Mark `user_coverage.status` per §4.2 rules.
- Flag nodes where coverage is dense (≥3 tracks) — these are candidate **secondary anchors** for future expansions.

### 3.5 Anchor selection criteria (when user has not specified one)

When the user requests a map but does not name an anchor, the agent suggests anchors using these criteria, in order of preference:

1. **Anchor strength**: a node where the user has high concentration (≥0.7 tracks share on a single album/period) AND the period is musically pivotal (well-documented genre transitions).
2. **Map yield**: nodes whose lineages have rich documentation (more available facts → richer map).
3. **Non-overlap**: avoid anchors whose maps would duplicate existing ones.

The agent **never auto-selects an anchor and proceeds**. It always proposes 2–4 candidates with rationale and waits for user confirmation.

---

## 4. Data sources

### 4.1 User red-heart data

**Format**: markdown table or CSV, with columns:

```
idx | song | artist | album | duration | red_heart_date | inferred_genre | platform_link
```

**Canonical location** (current scope): `/data/user_tracks.{md,csv,json}`. Agent should accept all three formats and normalize to JSON internally:

```json
{
  "track_id": "integer (idx)",
  "song": "string",
  "artist": "string (may contain '/' for collaborations)",
  "album": "string",
  "duration": "string (mm:ss)",
  "red_heart_date": "ISO date",
  "inferred_genre": "string or null",
  "platform_link": "URL"
}
```

**Multi-artist normalization**: when `artist` contains `/`, split and create a coverage entry for each artist. Keep the original string in a `raw_artist` field for traceability.

### 4.2 Coverage status decision rules

Given a node `N` with artists `A_N` and works `W_N`, and the user's track set `T`:

```
matches = T.filter(t => t.artist ∈ A_N)
work_matches = matches.filter(t => t.song ∈ W_N OR t.album ∈ W_N.albums)

if len(work_matches) ≥ 1:
    status = "activated"
    evidence = [f"红心 {t.red_heart_date}: {t.song}" for t in work_matches]
    confidence = "high"
elif len(matches) ≥ 1:
    status = "touched_unactivated"
    evidence = [f"红心 {t.red_heart_date}: {t.song} (同艺人不同时期)" for t in matches]
    confidence = "medium"
else:
    status = "untouched"
    evidence = []
    confidence = "high"  # absence is well-defined
```

**Edge case**: if an artist has many tracks but none match the node's specific period/works, status is `touched_unactivated` (not `activated`) — the user knows the artist but has not specifically explored this node.

### 4.3 Web research priority and trust levels

When researching nodes, the agent prefers sources in this order:

| Tier | Source type | Default epistemic layer | Examples |
|---|---|---|---|
| 1 | Primary sources (artist interviews in major outlets, official documentation) | `fact` | Rolling Stone interviews, Pitchfork features, official liner notes |
| 2 | Authoritative aggregators | `fact` for biographical data, `consensus` for interpretation | Wikipedia, AllMusic, Discogs |
| 3 | Music journalism | `consensus` | Stereogum, Pitchfork reviews, Far Out Magazine |
| 4 | Forum / fan content | `hypothesis` | Reddit, Genius annotations, fan wikis |
| 5 | Agent's own synthesis | `hypothesis` | Connections drawn by the agent without a citing source |

**Citation rule**: the `sources` field on every node and edge must include URLs at the highest tier the agent could find. If only Tier 4-5 sources exist, the entire node/edge must be marked `hypothesis`.

### 4.4 Web research scope limits per anchor expansion

To keep tasks bounded:

- Default: ≤ 25 web searches per anchor expansion
- Default: ≤ 15 web fetches per anchor expansion
- If the agent approaches these limits, it stops research and produces output with current data, noting incompleteness in `expansion_notes`.

---

## 5. Narrative pool (解说素材库)

The narrative slots in §2.1 are not decoration. They are the raw material from which the playlist annotations (§7) are composed. Each slot has a defined purpose, recommended length, and example.

### 5.1 Slot definitions

**`member_dynamics`** — Internal band/group politics that drove the period or work
- Length: 1–3 sentences
- Triggers: lineup changes, member-driven stylistic pivots, internal disagreements documented in interviews
- Example: "John Deacon, the bassist usually framed as Queen's quiet member, drove the band's funk pivot. He hung out at Chic's studio while Bernard Edwards recorded *Good Times*, and brought back the bassline that became *Another One Bites the Dust* — a song Brian May and Roger Taylor were initially skeptical of."
- Source requirement: must cite a member or producer interview.

**`cultural_venue`** — Physical place / scene / institution that shaped the work
- Length: 1–3 sentences
- Triggers: a documented venue, scene, or movement materially shaped the recording
- Example: "Mick Jagger was a regular at New York's Studio 54 during 1977 — the four-on-the-floor pulse of *Miss You* came from those nights. Bill Wyman reportedly went 'to quite a few clubs' to dial in the bassline before recording in Paris."
- Source requirement: cite the venue name in conjunction with the work.

**`production_facts`** — Studio choices, engineer/producer decisions, technical context
- Length: 1–3 sentences
- Triggers: notable engineer, mix decisions, recording technique, equipment that defined the sound
- Example: "Engineered by Chris Kimsey at Pathé Marconi Studios in Paris. The dry, sparse drum sound — what Charlie Watts called 'Philadelphia-style drumming' — was a deliberate departure from the band's earlier cavernous productions."
- Source requirement: cite engineer/producer's own statements when possible.

**`instrumentation_details`** — Specific instruments, performers, technical playing details
- Length: 1–3 sentences
- Triggers: a session player, an unusual instrument, a specific technique that distinguishes the recording
- Example: "The harmonica is played by Sugar Blue (born James Whiting), a 22-year-old American street musician Stones associate Sandy Whitelaw discovered in the Paris Metro. Blue plays in a key the song's nominal tonality (A minor) wouldn't suggest — that tension is part of why the part sounds untethered."
- Source requirement: cite musician identification at minimum.

**`release_circumstances`** — Surrounding events at release: chart performance, controversies, reception
- Length: 1–2 sentences
- Triggers: notable chart impact, controversy, critical reception inflection point
- Example: "Released May 1978 as Some Girls' first single, it became Stones' eighth and final US number-one — knocking Andy Gibb off the top after a seven-week reign and ending alongside punk's commercial peak."
- Source requirement: cite chart data or contemporary reviews.

### 5.2 Slot population priority

When researching a node, the agent populates slots in this priority order:

1. `production_facts` — usually the most concrete and citable
2. `member_dynamics` — high yield for band-based nodes
3. `cultural_venue` — strongest for nodes tied to specific scenes
4. `instrumentation_details` — strongest for nodes with distinctive sound design
5. `release_circumstances` — usually shortest, fills gaps

A node with only 1–2 populated slots is acceptable. A node with 0 populated slots is a structural placeholder and should be flagged for re-research.

### 5.3 What goes in narrative_slots vs. what goes in position_in_era

- `position_in_era.historical_role`: structural ("this node did X in music history")
- `narrative_slots`: anecdotal/textural ("here's the story of how X happened")

Same content should not appear in both. If forced to choose: structural fact in `historical_role`, story-form in `narrative_slots`.

---

## 6. User aesthetic profile

These mechanisms describe the user's listening preferences, derived from prior conversations and validated against listening data. Agents use them as **decision support** when:

- Selecting which descendant nodes to recommend
- Choosing which ancestor to highlight in playlist annotations
- Adjudicating between equally valid expansion candidates

### 6.1 Mechanism enum and test functions

**M1 — `translation_aesthetic` (基因穿外套)**

Definition: the user prefers nodes where genetic material from one lineage is performed in the stylistic envelope of another lineage, with the two layers remaining distinguishable rather than dissolved into each other.

Test function:
```
input: node N
output: (boolean match, float confidence)

match = (
  N has genealogical_descent edge from lineage L1
  AND N has translation edge to/from lineage L2
  AND L1 ≠ L2
  AND L1 and L2 remain audibly separable in N's surface texture
)
```

Strong examples: Stones / Some Girls / Miss You; Bowie / Young Americans / Fame; Talking Heads / Remain in Light.

**M2 — `ancestor_visit_only` (祖宗访问仅一次)**

Definition: the user does not deeply listen to lineage ancestors. One or two tracks suffice to confirm the lineage; further immersion goes to descendant or hybrid nodes.

Test function: this is a **profile-level constraint**, not a per-node test. When recommending, do not propose deep dives into nodes the user has marked at this level — they are confirmed, not under-explored.

Verified instances: Parliament (1 track since 2021), Stevie Wonder (1 track), James Brown (0 tracks), Bee Gees (1 track in pre-disco era only).

**M3 — `member_period_attention` (成员级颗粒度识别)**

Definition: the user attends to within-band variation driven by individual members' aesthetic pulls (e.g. recognizing John Deacon's role in Queen's funk pivot vs. Brian May's resistance).

Test function:
```
input: node N
output: (boolean useful, float confidence)

useful = (
  N belongs to a band/group (not solo)
  AND there exists a documented member who drove this node's stylistic direction
  AND that member's role is distinguishable from other members' aesthetic
)
```

When `useful = true`, populate `narrative_slots.member_dynamics` with priority. The user will read it.

**M4 — `frequency_hollowing` (留白偏好 / 频谱掏空)**

Definition: the user prefers nodes where the frequency spectrum is deliberately incomplete — bass-heavy with treble space, or treble-floating with bass void, or rhythm-clear with mid-range scrubbed. Opposed to "full-spectrum" maximalism.

Test function:
```
input: node N
output: (boolean match, float confidence)

match = (
  N's production is documented as employing dub-style space, sparse arrangement,
  drum-and-bass focus, or vocal-prominent-with-instrumentation-stripped
)
```

Strong examples: Fishmans / 宇宙日本世田谷; King Tubby / Augustus Pablo dub; Cocteau Twins late period; PiL / Metal Box; Khruangbin (any).

### 6.2 How mechanisms feed playlist composition

When generating an annotated playlist (§7), each track's annotation should explicitly reference at least one mechanism the agent identifies as matching. This both serves the user's interpretive interest and provides feedback signal for future profile refinement.

---

## 7. Output spec — annotated playlist

The end-user deliverable. Generated from a completed map (§3 output).

### 7.1 Playlist JSON schema

```json
{
  "playlist_id": "string",
  "title": "string",
  "subtitle": "string (optional)",
  "anchor_node_id": "string",
  "lineage_path": "string (one sentence: what story does this playlist tell)",
  "recommended_listening_order": "as_listed | shuffled_okay | thematic_arc",
  "track_count": "integer",
  "duration_estimate": "string (e.g. '~78 min')",
  "tracks": [
    {
      "position": "integer",
      "node_id": "string (links back to map)",
      "artist": "string",
      "song": "string",
      "album": "string",
      "year": "integer",
      "platform_links": {
        "spotify": "URL or null",
        "netease": "URL or null",
        "youtube": "URL or null",
        "apple_music": "URL or null"
      },
      "annotation": {
        "structural_position": "string (1–2 sentences: where in the map this sits)",
        "narrative_hook": "string (1–3 sentences: the most compelling story-fact)",
        "user_relevance": "string (1 sentence: why this matches user's profile, citing mechanism if applicable)",
        "epistemic_layer": "fact | consensus | hypothesis"
      }
    }
  ],
  "expansion_notes": "string (optional: caveats, gaps, hypotheses to verify)",
  "generated_at": "ISO timestamp",
  "spec_version": "0.2"
}
```

### 7.2 Markdown rendering

The agent also produces a human-readable markdown version with the following structure:

```markdown
# {title}
*{subtitle}*

**This playlist is**: {lineage_path}
**Total tracks**: {n} · **Estimated time**: {duration}

---

## Track 1: {artist} — {song} ({year})
*From {album}*

{structural_position}

{narrative_hook}

{user_relevance}

[Listen on: {available platform links}]

---

## Track 2: ...
```

### 7.3 Track ordering principles

Default order is **chronological by node era** (oldest ancestor first, newest descendant last) — this lets the listener experience the lineage as it unfolded.

Alternative orders the agent may use (and must declare in `recommended_listening_order`):
- `thematic_arc`: emotional/textural arc, regardless of chronology
- `coverage_first`: user's already-activated tracks first, then descents into untouched territory

The agent never sorts arbitrarily. The chosen order must be justifiable.

### 7.4 Length defaults

- Single-anchor playlist: 12–20 tracks
- Hard cap: 25 tracks
- Minimum: 8 tracks (below this, the map is too thin to warrant a playlist)

### 7.5 Annotation length budget

Per track, the three annotation fields combined: **target 80–150 words**, hard cap 200 words. The playlist is meant to be listenable while reading, not a lecture.

### 7.6 Track availability and degraded delivery

If a track has no platform link found by the agent:
- Include the track anyway (the structural position matters)
- Set all `platform_links` to null
- Note in the markdown rendering: `[Track not located on standard platforms — see [discogs link] for reference]`

The agent does not silently drop tracks for availability reasons.

---

## 8. Epistemic annotation protocol

### 8.1 Three-tier system

Every claim the agent produces is implicitly or explicitly tagged with one of:

- **`[fact]`** — Claim has a primary or Tier-2 source citation. Could be defended in court.
- **`[consensus]`** — Claim is agreed across multiple Tier-3 sources. The kind of thing music journalists treat as background knowledge.
- **`[hypothesis]`** — Claim is the agent's synthesis, or an inference connecting documented facts in a way no source has stated. **Includes any claim sourced only from forum/fan content.**

### 8.2 Where tags appear

- Node-level: `epistemic_layer` field (overall node confidence)
- Edge-level: `epistemic_layer` field (each relationship)
- Annotation prose: inline parenthetical tags `[fact]` `[consensus]` `[hypothesis]` after specific claims when mixed within a single annotation

Inline tags are **required** when a single annotation paragraph mixes layers. Optional when the entire paragraph is one layer (declare it once in the annotation's `epistemic_layer` field).

### 8.3 Anti-fabrication rules

- Never write a fact-tier claim without a sources URL.
- Never attribute a quote to an artist/producer/etc. without a citable interview source.
- When uncertain whether to mark `consensus` or `hypothesis`, mark `hypothesis`.
- The phrase "[lineage / connection / influence] not previously documented in published sources" must appear when the agent makes a synthesis-level connection.

---

## 9. Termination and self-check signals

The agent stops working and reports back to the user when:

### 9.1 Hard stops

- All hard caps in §3.2 reached AND user has not extended budget
- Web research budget (§4.4) exhausted
- More than 30% of edges are `hypothesis`-tier (map quality too speculative)
- Cannot find ≥1 platform link for ≥40% of tracks (deliverable becomes degraded)

### 9.2 Soft signals (agent should report and ask)

- A candidate node has unusually rich documentation but doesn't fit the current axis cleanly — could be its own anchor; ask the user.
- The user's coverage on this lineage is so dense that adding new nodes provides minimal exploration value — confirm before continuing.
- Two equally valid expansion paths diverge significantly — present both and let user choose.

### 9.3 Self-check questions before delivery

Before producing final output, the agent verifies:

1. Does every node have a defensible `position_in_era.historical_role`?
2. Does every edge have an `epistemic_layer` and ≥1 source (or is explicitly marked `hypothesis`)?
3. Is the user coverage overlay correct (re-run §4.2 against latest data)?
4. Are at least 60% of tracks in the playlist available on at least one platform?
5. Does the playlist as a whole tell a coherent story (does `lineage_path` accurately describe what's there)?

If any answer is no, fix or flag before delivering.

---

## 10. Reference example — Miss You anchor execution

This section walks through the spec on a real case. It serves as a calibration target: agents producing output for new anchors should match this example's structure and density.

### 10.1 Anchor node

```json
{
  "id": "rolling-stones_some-girls_miss-you",
  "artist": "The Rolling Stones",
  "period": {
    "label": "Some Girls era / 1976–1981 disco-funk pivot",
    "year_start": 1977,
    "year_end": 1978
  },
  "works": [
    {"title": "Miss You", "type": "track", "year": 1978},
    {"title": "Some Girls", "type": "album", "year": 1978}
  ],
  "position_in_era": {
    "primary_genre_lineage": "rock × disco/funk translation",
    "geographic_locus": "Paris (recording) / NYC Studio 54 (cultural locus)",
    "historical_role": "Stones' first disco-influenced single, knocking Saturday Night Fever soundtrack from US #1 — became the canonical case of a major rock band performing disco's genetic material under rock's stylistic envelope, ahead of Queen's similar pivot two years later."
  },
  "narrative_slots": {
    "member_dynamics": "Recorded during Keith Richards' drug-trial distraction — Mick Jagger took unusual artistic control. The 'four-on-the-floor' pulse came from Billy Preston demoing it to Mick at El Mocambo Toronto, March 1977. Bill Wyman went 'to quite a few clubs' (per engineer Chris Kimsey) to dial in the bassline. Keith's resistance to disco is documented but he later said the song 'was a damn good disco record; it was calculated to be one'.",
    "cultural_venue": "Studio 54 (1977–1980 NYC) is the song's cultural locus. Jagger was a regular with then-wife-being-divorced Bianca and incoming partner Jerry Hall. The disco-rock fusion was reverse-imported from Black/queer/Latino dance culture into the white rock elite.",
    "production_facts": "Engineered by Chris Kimsey at Pathé Marconi Studios, Paris. The dry drum sound — what Charlie Watts called 'Philadelphia-style drumming' — was deliberate. The 12-inch single (8+ minutes) was mixed by an up-and-coming Bob Clearmountain, Stones' first 12-inch.",
    "instrumentation_details": "Harmonica: Sugar Blue (James Whiting), 22-year-old American street musician discovered by Sandy Whitelaw in the Paris Metro. Saxophone: Mel Collins, brought in because Bobby Keys' relationship with Jagger was strained — Keith reportedly 'completely blanked' Collins in the studio.",
    "release_circumstances": "Released 19 May 1978 as Some Girls' first single. Hit US #1 on 5 August, ending Andy Gibb's 'Shadow Dancing' seven-week reign. Stones' eighth and final US number-one. Reached UK #3."
  },
  "epistemic_layer": "fact",
  "sources": [
    "https://en.wikipedia.org/wiki/Miss_You_(Rolling_Stones_song)",
    "https://en.wikipedia.org/wiki/Some_Girls",
    "https://www.salon.com/2017/08/19/rolling-stones-33-13-excerpt/",
    "https://ultimateclassicrock.com/the-rolling-stones-miss-you/"
  ]
}
```

### 10.2 Sample edges (abbreviated)

```json
[
  {
    "id": "edge_chic-good-times_to_miss-you",
    "type": "direct_influence",
    "source_node_id": "chic_risque_good-times",
    "target_node_id": "rolling-stones_some-girls_miss-you",
    "evidence": "Chronologically Good Times (1979) is later than Miss You (1978), but Chic's earlier work and Bernard Edwards' bass approach were already on the Studio 54 floor when Miss You was being shaped. The relationship is not literal sampling but shared idiom.",
    "epistemic_layer": "consensus",
    "sources": ["https://www.salon.com/2017/08/19/rolling-stones-33-13-excerpt/"]
  },
  {
    "id": "edge_miss-you_to_aobtd",
    "type": "same_era_dialogue",
    "source_node_id": "rolling-stones_some-girls_miss-you",
    "target_node_id": "queen_the-game_another-one-bites-the-dust",
    "evidence": "Two years apart. Both are major rock bands' disco-funk pivots driven by a bass-focused band member (Wyman / Deacon respectively). Deacon's case is documented as derived from Chic; Wyman's is documented as derived from Studio 54 immersion. Same translation, different routing.",
    "epistemic_layer": "hypothesis",
    "sources": ["agent synthesis — connection not previously documented in published sources"],
    "notes": "Worth the user verifying by listening to Another One Bites the Dust (which is not in user's red-heart data despite the album being known)."
  },
  {
    "id": "edge_remain-in-light_methodology",
    "type": "methodological_descent",
    "source_node_id": "talking-heads_remain-in-light_full-album",
    "target_node_id": "khruangbin_con-todo-el-mundo",
    "evidence": "Talking Heads / Eno's 1980 method: drum loop foundation, layered live jam over the loop, post-arrangement. Khruangbin's documented method (per Mark Speer interviews): identical — Laura Lee starts with a drum loop, records bass over it, sends to Speer for guitar overdubs.",
    "epistemic_layer": "hypothesis",
    "sources": [
      "https://analoguefoundation.com/voice/khruangbin/",
      "agent synthesis — methodology lineage not previously documented"
    ],
    "notes": "Strong but speculative. The connection is via working method, not surface sound. If true, it positions Khruangbin's Thai/Iranian funk material as content layered onto a Talking Heads/Eno formal scaffold."
  }
]
```

### 10.3 Sample playlist track (one entry)

```json
{
  "position": 7,
  "node_id": "rolling-stones_some-girls_miss-you",
  "artist": "The Rolling Stones",
  "song": "Miss You",
  "album": "Some Girls",
  "year": 1978,
  "platform_links": {
    "spotify": "https://open.spotify.com/track/...",
    "netease": "https://music.163.com/...",
    "youtube": "https://youtube.com/watch?v=...",
    "apple_music": null
  },
  "annotation": {
    "structural_position": "The anchor of this playlist's lineage. Not because it's the user's favorite but because it's the cleanest case of major-rock-band performing disco's genetic material without dissolving into disco — funk inside, Stones outside, layers visibly separate.",
    "narrative_hook": "The four-on-the-floor pulse came from Billy Preston demoing it to Mick at a Toronto club in March 1977. Bill Wyman then went out to 'quite a few clubs' (per engineer Chris Kimsey) to internalize the Studio 54 bass language before recording in Paris. The harmonica is by Sugar Blue, a 22-year-old American street musician found busking in the Paris Metro.",
    "user_relevance": "Maps onto M1 (translation aesthetic) — the song's appeal isn't disco itself but the specific tension of disco-as-imported-style sitting on top of Stones' blues-rock musculature.",
    "epistemic_layer": "fact"
  }
}
```

### 10.4 Map summary statistics (Miss You expansion as actually executed)

- Total nodes: ~30
- Coverage breakdown: 18 activated, 4 touched-unactivated, 8 untouched
- Edge count: ~40
- Edge epistemic distribution: 22 fact, 12 consensus, 6 hypothesis (15% — within healthy range, well below 30% trigger)
- Cross-anchor candidates flagged: King Tubby/Augustus Pablo (dub anchor), Talking Heads/Remain in Light (post-punk × non-Western anchor)

---

## 11. Out of scope (v0.2) / future spec items

Items the current spec deliberately does not address, deferred to v1.0+:

- **Cross-anchor synthesis**: how to merge multiple anchor maps into a unified vault
- **Profile evolution**: how the user's aesthetic profile (§6) updates as new listening data arrives
- **Live coverage updates**: how to incorporate red-heart data added after a map was generated
- **Platform export adapters**: Spotify API integration, NetEase Cloud API integration, YouTube playlist generation
- **Visual map renderer**: web-renderable graph view over `*.map.json`
- **Recommendation feedback loop**: how user's response to recommended tracks updates the profile
- **Conflict resolution**: when new research contradicts earlier nodes/edges, how to version and update
- **Mechanism test refinement**: §6.1 test functions (especially M1 `translation_aesthetic` and M4 `frequency_hollowing`) require auditory judgment the agent cannot perform directly. Current implementation degrades to "is this node described as such-and-such hybrid in the critical literature?" This is lossy. Future version should incorporate user-curated example sets per mechanism so the agent can pattern-match more reliably.

When v0.2 hits any of these areas in execution, the agent flags as out-of-scope and proceeds with current-version behavior.

---

## 12. Glossary

- **Anchor**: a chosen starting node from which a map is expanded
- **Node**: an `(artist, period, work_or_works)` triple representing a position in music history
- **Edge**: a typed directed relationship between nodes
- **Map**: a graph of nodes and edges produced by anchor expansion
- **Coverage**: the user's listening relationship to a node (activated / touched-unactivated / untouched)
- **Lineage**: a chain of nodes connected primarily by `genealogical_descent` and `direct_influence` edges
- **Translation** (基因穿外套): a node-level relationship where one lineage's genetic material is performed in another lineage's stylistic envelope
- **Hollowing** (频谱掏空): a production aesthetic of deliberately incomplete frequency spectrum
- **Mechanism**: a documented user preference pattern (§6) used as decision support

---

*End of spec.*
