# Episode 3 — 三全音之后 · Riff Genealogy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Episode 3 — `三全音之后 — Black Sabbath` — as a fully wired audio exhibit: anchor on Black Sabbath's *Black Sabbath* (1970-02-13, debut self-titled), trace the inversion-axis riff genealogy across 16 stops (heirs / mutations / inversions), produce map / playlist / episode / fusion audio / exhibition wiring.

**Architecture:** Linear five-phase pipeline matching ep2 (Estranged) template. Phase −1 (taxonomy registration of new `riff_inversion` focus), Phase 0 (track curation), Phase 1 (connections + map), Phase 2 (transcript), Phase 3 (audio production), Phase 4 (exhibition wiring). Each gated on the previous. Node selection follows lineage merit; user red-hearts are a `library_overlay` for closing-segment tone, not a filter (per memory `feedback_episode_node_selection`). The audio pipeline is fixed (see `docs/episode_audio_pipeline.md`); only per-position style assignment changes.

**Tech Stack:** Python (`tools.batch_synthesize_episode`, `tools.batch_fusion`, `tools.fetch_audio_youtube`, `tools.node_registry`, `tools.coverage`); MiniMax `speech-02-hd` (voice `Chinese (Mandarin)_Gentleman`); `yt-dlp` + `ffmpeg`; the exhibition Vite/TS app at `musicos-exhibition/`.

**Spec:** `docs/superpowers/specs/2026-05-08-ep3-riff-genealogy-design.md`

**Slug:** `black-sabbath_black-sabbath_black-sabbath`

**Episode title (locked):** `三全音之后 — Black Sabbath`

**Inversion-axis decision (locked):** the anchor's tritone/slow/minimal/weight aesthetic is the unchanging reference. All non-anchor nodes carry `aesthetic_response ∈ {heir, mutation, inversion}` in their tracklist entry. Closing on Seven Nation Army (`inversion`) whose extreme minimalism loops back to the anchor's own minimalism — this loopback is the closing template's core image.

---

## Locked design decisions (from spec §1–§12)

1. Title: `三全音之后 — Black Sabbath`
2. Track count: 16 (S1+2 added pair). Acceptance reason: Walk This Way (1975) → Killing in the Name (1992) form a self-contained groove sub-lineage with explicit `methodological_descent` pairing — adding both strengthens the inversion axis rather than diluting it.
3. Crazy Train sits in **mutations** (not inversions): Rhoads's neoclassical vocabulary preserves "riff governs the song"; only the language is replaced. M3 member_period_attention applies (Ozzy's choice of Rhoads = active move away from Iommi's tritone vocabulary).
4. Walk This Way (1975) is **not** pre-anchor (it's post-anchor by 5 years); it sits in mutations as the head of the funk-rock groove sub-lineage, paired with Killing in the Name (1992) by `methodological_descent`.
5. Closing track: Seven Nation Army.
6. Ep2-already-consumed nodes are **not** re-narrated even when in user library: Layla, Free Bird, November Rain, Estranged, Don't Break My Heart, Won't Get Fooled Again, Paranoid Android, Fade to Black, Comfortably Numb. May be referenced in passing inside other nodes' transcripts but never as their own station.

---

## Phase −1 · Taxonomy registration

### Task 1: Register `riff_inversion` focus in taxonomy

**Files:**
- Modify: `Foundations/episode_focus_taxonomy.md` — append a new section after `aria_solo_dialectic`, before the `voicing` placeholder.

- [ ] **Step 1: Verify current section order**

```bash
grep -n "^## " Foundations/episode_focus_taxonomy.md
```

Expected: lines for `bassline_dna`, `aria_solo_dialectic`, `voicing (placeholder, not yet shipped)`, `frequency_hollowing (placeholder, not yet shipped)`.

- [ ] **Step 2: Insert the new focus section**

Insert immediately before the line `## voicing (placeholder, not yet shipped)` (and the `---` separator above it):

```markdown
## riff_inversion

- **Slug:** `riff_inversion`
- **Episode title pattern (ZH):** `三全音之后 — <anchor song>` (or, when anchor is not tritone-based, substitute the anchor's own riff-defining gesture; the template name remains `riff_inversion`).
- **`connection_kinds_in_scope`:** `riff_aesthetic_inheritance`, `riff_aesthetic_mutation`, `riff_aesthetic_inversion`, plus `direct_influence` / `methodological_descent` / `genealogical_descent` / `same_era_dialogue` / `hybridization` / `inversion` when the dialogue is about the riff aesthetic itself.
- **`aesthetic_response` field (required for this focus):** every non-anchor tracklist entry carries one of `heir | mutation | inversion`. This drives Act assignment in Phase 2.
- **Node fields the prompt should read** (Phase 2): `instrumentation_details`, `production_facts`, `member_dynamics`, `release_circumstances`, `cultural_venue` (in spec §8 priority order, with `instrumentation_details` promoted to first because riff identity is gear-and-technique-driven). The OPENER sound cue is sourced via prompt elicitation per the same three-tier fallback used in `bassline_dna`.
- **Mute rule:** if the node has no documented riff-aesthetic significance → assign `narrative_weight: bridge` and `muted_this_episode: true` in tracklist.
- **OPENING template seed:** one concrete sonic micro-description of the anchor's defining riff gesture (16–30 ZH chars; e.g. for *Black Sabbath* the slow tritone climb under thunder/bell); then "今天这一集我们沿着这条 riff 谱系往外走，看后来的人怎么继承、改造、又怎么反叛它"; then one arc-overview sentence (track count + year span + four-act structure).
- **CLOSING template seed:** name the closing track's inversion gesture; explicitly call out the loopback (closing's minimalism vs. anchor's minimalism, when applicable); name the two `selected_as_strong` connections that are also `red_heart_tier: hit`.
- **`intrinsic_score_weight_overrides`:** raise `concrete_carrier` to 0.30 (riff identity needs a concrete moment — exact timestamp, exact key, exact technique); leave others at default-minus-0.05 (story_drive 0.30 / evidential_strength 0.20 / focus_relevance 0.20).
- **Node selection rule (carries forward from Episode 2):** inclusion is by lineage merit, NOT by user red-heart hit.

---
```

- [ ] **Step 3: Verify the insertion**

```bash
grep -n "^## " Foundations/episode_focus_taxonomy.md
```

Expected: `bassline_dna`, `aria_solo_dialectic`, `riff_inversion`, `voicing (placeholder, not yet shipped)`, `frequency_hollowing (placeholder, not yet shipped)` in this order.

- [ ] **Step 4: Commit**

```bash
git add Foundations/episode_focus_taxonomy.md
git commit -m "feat(taxonomy): register riff_inversion focus for Episode 3

Adds the third canonical focus to the registry. Defines connection
kinds, the new aesthetic_response field (heir|mutation|inversion),
narrative slot priority (instrumentation_details promoted), and
OPENING/CLOSING seeds keyed to the anchor's riff gesture and the
closing inversion's loopback to it (see Episode 3 spec §2)."
```

---

## Phase 0 · Track curation

### Task 2: Run track-curator skill for Episode 3

**Inputs to the skill:**
- `anchor_song`: Black Sabbath — *Black Sabbath* (Black Sabbath debut, 1970)
- `episode_focus`: `riff_inversion`
- `target_stop_count`: 16 (including anchor)
- `epistemic_caps`: spec §9.1 defaults — upward 15, lateral 12, downward 20; ≤30% hypothesis tier; ≥60% platform-link coverage
- `library_overlay_source`: `data/user_tracks.json`
- `seed_node_set` (must-include unless track-curator finds them spurious; tagged with provisional `aesthetic_response`):
  - **Pre-anchor (upward):** Cream — *Sunshine of Your Love* (1967, `heir-precursor`); Jimi Hendrix Experience — *Purple Haze* (1967, `heir-precursor`)
  - **Anchor:** Black Sabbath — *Black Sabbath* (1970)
  - **Heirs (downward, direct):** Black Sabbath — *Iron Man* (1970, `heir`); Black Sabbath — *Paranoid* (1970, `heir`); Metallica — *Master of Puppets* (1986, `heir`)
  - **Mutations (downward + lateral):** Deep Purple — *Smoke on the Water* (1972, `mutation`); Led Zeppelin — *Immigrant Song* (1970, `mutation`, also `same_era_dialogue`); Aerosmith — *Walk This Way* (1975, `mutation`); AC/DC — *Back In Black* (1980, `mutation`); Ozzy Osbourne — *Crazy Train* (1980, `mutation`); Rage Against the Machine — *Killing in the Name* (1992, `mutation`); Metallica — *Enter Sandman* (1991, `mutation`)
  - **Inversions (downward):** Guns N' Roses — *Sweet Child O' Mine* (1987, `inversion`); Nirvana — *Come As You Are* (1991, `inversion`); The White Stripes — *Seven Nation Army* (2003, `inversion`, **closing**)
- `excluded_nodes` (already used in ep1/ep2 — must not be promoted to a station; may appear as in-text reference inside another station's transcript): Layla, Free Bird, November Rain, Estranged, Don't Break My Heart, Won't Get Fooled Again, Paranoid Android, Fade to Black, Comfortably Numb.

- [ ] **Step 1: Invoke track-curator skill**

Use the Skill tool with `track-curator`. Pass the inputs above as the skill arguments.

- [ ] **Step 2: Inspect the produced tracklist**

```bash
ls -la playlists/black-sabbath_black-sabbath_black-sabbath.tracklist.json
python3 -c "
import json
tl = json.load(open('playlists/black-sabbath_black-sabbath_black-sabbath.tracklist.json'))
print(f'tracks: {len(tl[\"tracks\"])}')
print(f'red-heart hits: {sum(1 for t in tl[\"tracks\"] if t.get(\"red_heart_tier\")==\"hit\")}')
print(f'platform-link coverage: {sum(1 for t in tl[\"tracks\"] if t.get(\"platform_link\")) / max(len(tl[\"tracks\"]),1):.0%}')
from collections import Counter
ar = Counter(t.get('aesthetic_response','-') for t in tl['tracks'])
print(f'aesthetic_response: {dict(ar)}')
for t in tl['tracks']:
    print(f'  {t[\"position\"]:>2}  {t.get(\"red_heart_tier\",\"?\"):<5}  {t.get(\"aesthetic_response\",\"-\"):<18}  {t[\"artist\"]} — {t[\"song\"]} ({t.get(\"year\",\"?\")})')
"
```

Expected:
- 16 tracks
- ≥ 5 red-heart hits (★ list from spec §6: Paranoid, SOTW, Immigrant Song, Back In Black, Walk This Way, Come As You Are — at least 5 should pass the curator's library overlay)
- platform-link coverage ≥ 60%
- `aesthetic_response` distribution: 1 anchor + 2 heir-precursor + 3 heir + 7 mutation + 3 inversion
- closing position 16 = Seven Nation Army with `aesthetic_response: inversion`

- [ ] **Step 3: If curator deviates from seed set, reconcile**

If any seed is dropped or any non-seed is added, write a reconciliation note to `playlists/black-sabbath_black-sabbath_black-sabbath.tracklist.audit.md` documenting why (curator's lineage-merit reasoning), then continue. If a seed is dropped without sufficient lineage-merit reasoning, restore it manually before commit.

- [ ] **Step 4: Commit tracklist**

```bash
git add playlists/black-sabbath_black-sabbath_black-sabbath.tracklist.json playlists/black-sabbath_black-sabbath_black-sabbath.tracklist.audit.md 2>/dev/null
git commit -m "feat(ep3): track-curator output — 16 stops, riff_inversion focus

16-stop tracklist anchored on Black Sabbath (1970), structured as
2 pre-anchor + 1 anchor + 3 heirs + 7 mutations + 3 inversions.
Closes on Seven Nation Army (2003)."
```

---

## Phase 1 · Connections + map

### Task 3: Run connections-author skill for Episode 3

**Inputs to the skill:**
- `tracklist_path`: `playlists/black-sabbath_black-sabbath_black-sabbath.tracklist.json`
- `episode_focus`: `riff_inversion`
- `edge_type_budget` (per spec §5):
  - `direct_influence` ≈ 5 (Cream→Sabbath, Hendrix→Sabbath tritone-transmission, Sabbath→Iron Man, Sabbath→Paranoid, Sabbath→Master of Puppets)
  - `hybridization` ≈ 7 (each mutation → anchor or anchor-aesthetic)
  - `inversion` ≈ 3 (each inversion → anchor)
  - `methodological_descent` = 1 (Walk This Way → Killing in the Name; canonical classification for this pair)
  - `same_era_dialogue` 1–2 (1970 Sabbath ↔ Immigrant Song; optionally Iron Man ↔ Whole Lotta Love-era heaviness if tightly sourceable)
- `hypothesis_cap`: 15% of edges (spec §5; spec §9.1 hard stop is 30%)
- `sourcing_red_lines`: per spec §8 — fact-tier double-source for anchor release date (1970-02-13, Vertigo, Friday-the-13th branding), Iommi accident (1965, age 17, right-hand middle+ring fingertips, prosthetic thimbles), Crazy Train key F♯m + Rhoads classical lineage (Musonia / Dolores Rhoads), riff key/mode for any analytic claim.

- [ ] **Step 1: Invoke connections-author skill**

Use the Skill tool with `connections-author`.

- [ ] **Step 2: Inspect the produced connections + map**

```bash
python3 -c "
import json
conn = json.load(open('playlists/black-sabbath_black-sabbath_black-sabbath.connections.json'))
m = json.load(open('maps/black-sabbath_black-sabbath_black-sabbath.map.json'))
from collections import Counter
print(f'edges: {len(m[\"edges\"])}')
print('edge types:', dict(Counter(e['type'] for e in m['edges'])))
print('epistemic tiers:', dict(Counter(e['epistemic_layer'] for e in m['edges'])))
print(f'hypothesis ratio: {sum(1 for e in m[\"edges\"] if e[\"epistemic_layer\"]==\"hypothesis\")/len(m[\"edges\"]):.0%}')
print(f'node_ids: {len(m[\"node_ids\"])}')
"
```

Expected:
- ~16–18 edges total
- edge type distribution roughly matching budget (±1 per type acceptable)
- hypothesis ratio ≤ 15% (hard stop ≤ 30%)
- node_ids = 16

- [ ] **Step 3: Hard-stop check (spec §11)**

If `hypothesis ratio > 30%` OR `platform-link coverage < 60%` OR any axis cap exceeded → STOP, report to user, do not proceed to Phase 2.

- [ ] **Step 4: Verify per-node coverage was updated**

```bash
python3 -c "
from tools.node_registry import get_node, resolve_map
import json
m = json.load(open('maps/black-sabbath_black-sabbath_black-sabbath.map.json'))
missing = [nid for nid in m['node_ids'] if not get_node(nid)]
print(f'missing nodes: {missing}')
print(f'present: {len(m[\"node_ids\"]) - len(missing)}/{len(m[\"node_ids\"])}')
"
```

Expected: 0 missing.

- [ ] **Step 5: Commit map + connections + nodes**

```bash
git add maps/black-sabbath_black-sabbath_black-sabbath.map.json \
        playlists/black-sabbath_black-sabbath_black-sabbath.connections.json \
        data/nodes/
git commit -m "feat(ep3): connections-author output — map + 16 nodes + edges

Riff-genealogy edges for the inversion-axis episode: direct_influence
(precursor + heir lineage), hybridization (mutation layer), inversion
(reject-weight layer), methodological_descent for Walk This Way →
Killing in the Name. Hypothesis ratio under spec §5 cap."
```

---

## Phase 2 · Transcript

### Task 4: Run transcript-author skill for Episode 3

**Inputs to the skill:**
- `tracklist_path`: `playlists/black-sabbath_black-sabbath_black-sabbath.tracklist.json`
- `connections_path`: `playlists/black-sabbath_black-sabbath_black-sabbath.connections.json`
- `map_path`: `maps/black-sabbath_black-sabbath_black-sabbath.map.json`
- `episode_focus`: `riff_inversion`
- `episode_title`: `三全音之后 — Black Sabbath`
- `four_act_structure` (override the default flat tracklist→transcript mapping):
  - Act I · 起源 (1967): positions 1–2 (Sunshine of Your Love, Purple Haze)
  - Act II · 元日 (1970): positions 3–6 (Black Sabbath anchor, Iron Man, Paranoid, Master of Puppets)
  - Act III · 改造 (1972–1992): positions 7–13 (SOTW, Immigrant Song, Walk This Way, Back In Black, Crazy Train, Killing in the Name, Enter Sandman)
  - Act IV · 反叛 (1987–2003): positions 14–16 (Sweet Child O' Mine, Come As You Are, Seven Nation Army)
- `opening_seed_image`: anchor's first 30 seconds — distant rain + tolling bell + the slow tritone climb on Iommi's downtuned guitar; describe in 16–30 ZH chars before the standard "今天这一集我们沿着…" template.
- `closing_seed_image`: Seven Nation Army's bass-line single-note motif looping back to the anchor's own four-note tritone phrase — both are minimal; one descends into doom, the other rises into stadium chant. Closing must explicitly cite this loopback.
- `m1_translation_aesthetic_hooks` (spec §7): in Crazy Train station, name the basis-genes-in-jacket frame explicitly — "新古典外套包重金属基因"; in Killing in the Name station, the parallel frame — "funk 外套包 metal 重量". One sentence per station; do not labor the point.
- `crazy_train_member_dynamics_hook` (M3): write into the Crazy Train station — Ozzy choosing Rhoads (classically-trained, mother Dolores ran Musonia school) was a deliberate move *away* from Iommi's tritone vocabulary; this is *why* Crazy Train sounds opposite to *Black Sabbath* despite the shared vocalist.
- `walk_this_way_to_killing_hook`: write the methodological_descent into the Killing in the Name station — Tom Morello explicitly cited Aerosmith's funk-rock groove pivot as a riff-vocabulary ancestor; do not let the station read as anchor→station only.

- [ ] **Step 1: Invoke transcript-author skill**

Use the Skill tool with `transcript-author`.

- [ ] **Step 2: Inspect the produced episode files**

```bash
ls -la episodes/black-sabbath_black-sabbath_black-sabbath.episode.md episodes/black-sabbath_black-sabbath_black-sabbath.episode.json
python3 -c "
import json
ep = json.load(open('episodes/black-sabbath_black-sabbath_black-sabbath.episode.json'))
print(f'segments: {len(ep[\"segments\"])}')
print(f'has opening: {any(s.get(\"role\")==\"opening\" for s in ep[\"segments\"])}')
print(f'has closing: {any(s.get(\"role\")==\"closing\" for s in ep[\"segments\"])}')
print(f'narration char total: {sum(len(s.get(\"text\",\"\")) for s in ep[\"segments\"])}')
"
```

Expected: opening + 16 station segments + closing; closing references both the anchor's tritone climb and Seven Nation Army's single-note line.

- [ ] **Step 3: Human review of `.episode.md`**

Read `episodes/black-sabbath_black-sabbath_black-sabbath.episode.md` end-to-end. Check that:
- Act boundaries land at positions 2/6/13 as specified
- Crazy Train station carries the M3 member_dynamics hook
- Killing in the Name station carries the methodological_descent reference to Walk This Way
- Closing carries the explicit loopback image (Seven Nation Army single note ↔ anchor tritone)
- No fact-tier claim is unsourced (sourcing-principles §8 self-check)
- No ep1/ep2-consumed track is promoted to a station (excluded list above)

If any check fails, surface to user before proceeding; do NOT commit.

- [ ] **Step 4: Commit transcript**

```bash
git add episodes/black-sabbath_black-sabbath_black-sabbath.episode.md \
        episodes/black-sabbath_black-sabbath_black-sabbath.episode.json
git commit -m "feat(ep3): transcript-author output — four-act riff-genealogy script

Acts: 起源(1967) / 元日(1970) / 改造(72-92) / 反叛(87-2003). Closing
loops Seven Nation Army's single-note line back to the anchor's
tritone climb. Crazy Train carries the Ozzy→Rhoads M3 hook;
Killing in the Name cites Walk This Way as groove ancestor."
```

---

## Phase 3 · Audio production

### Task 5: Source music tracks for fusion

**Files:**
- Create: `musicos-exhibition/public/audio_fusion/ep3/01..16_<artist-slug>_<track-slug>.mp3` (16 files)

**Source policy (per `docs/episode_audio_pipeline.md`):**
- First try: NetEase Cloud Music via existing fetcher
- Fallback: YouTube via `tools.fetch_audio_youtube`
- Each source URL recorded in episode.json `segments[].music_source` field

- [ ] **Step 1: Build the per-track sourcing manifest**

```bash
python3 -c "
import json
tl = json.load(open('playlists/black-sabbath_black-sabbath_black-sabbath.tracklist.json'))
for t in tl['tracks']:
    pos = f\"{t['position']:02d}\"
    slug = f\"{pos}_{t['artist_slug']}_{t['track_slug']}.mp3\"
    print(slug, '|', t.get('platform_link','NO_LINK'))
"
```

Expected: 16 lines with NetEase or YouTube URLs.

- [ ] **Step 2: Fetch each track**

For each of the 16 positions, run the appropriate fetcher (per pipeline doc). Save to `musicos-exhibition/public/audio_fusion/ep3/`.

- [ ] **Step 3: Verify all 16 files present and non-empty**

```bash
ls -la musicos-exhibition/public/audio_fusion/ep3/ | tail -20
find musicos-exhibition/public/audio_fusion/ep3/ -name '*.mp3' -size -100k -print
```

Expected: 16 mp3 files, none under 100kb.

- [ ] **Step 4: Commit**

```bash
git add musicos-exhibition/public/audio_fusion/ep3/
git commit -m "chore(ep3): source music tracks for 16-stop fusion"
```

### Task 6: Synthesize narration TTS

- [ ] **Step 1: Run batch synthesizer**

```bash
python3 -m tools.batch_synthesize_episode \
  --episode episodes/black-sabbath_black-sabbath_black-sabbath.episode.json \
  --voice "Chinese (Mandarin)_Gentleman" \
  --model speech-02-hd
```

Expected: TTS mp3 stems under episodes/audio/ep3/ matching segment ids.

- [ ] **Step 2: Verify all narration stems present**

```bash
python3 -c "
import json, pathlib
ep = json.load(open('episodes/black-sabbath_black-sabbath_black-sabbath.episode.json'))
audio_dir = pathlib.Path('episodes/audio/ep3')
missing = [s['id'] for s in ep['segments'] if not (audio_dir/f\"{s['id']}.mp3\").exists()]
print(f'missing: {missing}')
"
```

Expected: empty missing list.

- [ ] **Step 3: Commit narration stems**

```bash
git add episodes/audio/ep3/
git commit -m "chore(ep3): synthesize narration stems via MiniMax speech-02-hd"
```

### Task 7: Run fusion pipeline

- [ ] **Step 1: Run batch_fusion**

```bash
python3 -m tools.batch_fusion \
  --episode episodes/black-sabbath_black-sabbath_black-sabbath.episode.json \
  --music-dir musicos-exhibition/public/audio_fusion/ep3 \
  --output-dir musicos-exhibition/public/audio_fusion/ep3
```

Note: `--music-dir` MUST be `ep3/` so the narration-stem `_anchor-aligned` outputs land beside the per-track music in the same per-episode directory (ref. recent commit ce52a90 — narration stems track per-episode subdirs).

Expected: fused mp3s replace or sit beside source mp3s; PASSTHROUGH outputs preserve narration stems (ref. commit a1fea8c).

- [ ] **Step 2: Spot-check fusion**

Manually play 3 random tracks (e.g. positions 03 anchor, 09 Walk This Way, 16 Seven Nation Army) — verify narration is audible, music is audible, ducking is correct, narration timing aligns with the segment.

- [ ] **Step 3: Commit fused audio**

```bash
git add musicos-exhibition/public/audio_fusion/ep3/
git commit -m "chore(ep3): fuse narration + music for 16 stops"
```

---

## Phase 4 · Exhibition wiring

### Task 8: Source and compress cover art

**Files:**
- Create: `musicos-exhibition/public/covers/01..16_<artist-slug>_<track-slug>.jpg` (16 files)

- [ ] **Step 1: Inventory existing covers**

```bash
ls musicos-exhibition/public/covers/ | grep -E '^(0[1-9]|1[0-6])_' | head -20
```

Note any covers already named with ep3-style numbering. Re-check these match the ep3 tracklist; if not, the names belong to a different episode and ep3 needs its own files.

- [ ] **Step 2: Source missing covers**

For each track lacking a cover, source per CLAUDE.md "Album cover assets" rules: official label / Wikipedia / MusicBrainz / Discogs / Apple Music. Square, ≥1000px long edge.

- [ ] **Step 3: Compress all 16 covers**

```bash
bash tools/compress_cover.sh musicos-exhibition/public/covers/
```

Verify each ep3 cover is ≤500KB.

- [ ] **Step 4: Commit covers**

```bash
git add musicos-exhibition/public/covers/
git commit -m "chore(ep3): cover art for 16 stops, compressed per CLAUDE.md spec"
```

### Task 9: Wire ep3 into exhibition data

**Files:**
- Modify: `musicos-exhibition/data/exhibition.json` (or wherever the exhibition app reads its episode list — discover via grep at execution time)

- [ ] **Step 1: Locate the exhibition episode index**

```bash
grep -rn "miss-you\|estranged" musicos-exhibition/data/ musicos-exhibition/src/ 2>/dev/null | grep -iE 'json|ts' | head
```

Expected: identifies the file that lists ep1 + ep2 entries.

- [ ] **Step 2: Add ep3 entry**

Append a new entry mirroring the ep2 schema. Required fields (verify against actual ep2 entry shape):
- `id`: `ep3`
- `slug`: `black-sabbath_black-sabbath_black-sabbath`
- `title`: `三全音之后 — Black Sabbath`
- `episode_json`: `episodes/black-sabbath_black-sabbath_black-sabbath.episode.json`
- `audio_dir`: `audio_fusion/ep3`
- `covers_prefix`: ep3 covers naming pattern
- `tracks`: 16 entries with position / artist / song / cover / audio

- [ ] **Step 3: Run the exhibition app locally and verify ep3 plays end-to-end**

```bash
cd musicos-exhibition && npm run dev
```

Open the local URL, click into ep3, play through. Verify: covers render, audio plays, narration audible, navigation between stops works, closing renders.

If anything breaks, fix and re-verify before committing.

- [ ] **Step 4: Commit exhibition wiring**

```bash
git add musicos-exhibition/
git commit -m "feat(exhibition): wire Episode 3 — 三全音之后 — Black Sabbath

16-stop riff-genealogy exhibit anchored on Black Sabbath (1970)."
```

---

## Final acceptance check

- [ ] Spec self-check (sourcing-principles §8): every fact-tier claim in the transcript is traceable to two independent sources, ≥1 from Tier 1–2.
- [ ] Hard stops (spec §11) clear: hypothesis ratio ≤30%, platform-link coverage ≥60%, no axis cap exceeded.
- [ ] Browser end-to-end pass on ep3 (Task 9 Step 3).
- [ ] All commits on `main` (or current working branch); no uncommitted ep3 work.
- [ ] Memory hygiene: if anything surprising emerged during execution that future episodes should know, write a memory entry (e.g. a new sourcing constraint, a recurring failure mode in the audio pipeline). Don't write generic "ep3 done" memories.
