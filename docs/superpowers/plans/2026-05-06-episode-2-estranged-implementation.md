# Episode 2 — Estranged · aria↔solo dialectic — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Episode 2 — `双主角 — Estranged` — as a fully wired audio exhibit: anchor on Guns N' Roses *Estranged* (1991), trace the aria↔solo dialectic across ~18 stops, produce map / playlist / episode / fusion audio / exhibition wiring.

**Architecture:** Linear pipeline matching the Miss You / bassline_dna template. Five phases — Phase −1 (taxonomy registration), Phase 0 (track curation), Phase 1 (connections + map), Phase 2 (transcript), Phase 3 (audio production), Phase 4 (exhibition wiring) — each gated on the previous. Node selection follows lineage merit (per spec §4); user red-hearts are a `library_overlay` for closing-segment tone, not a filter. The audio pipeline is fixed (see `docs/episode_audio_pipeline.md`); only per-position style assignment changes.

**Tech Stack:** Python (`tools.batch_synthesize_episode`, `tools.batch_fusion`, `tools.fetch_audio_youtube`, `tools.node_registry`, `tools.coverage`); MiniMax `speech-02-hd` (voice `Chinese (Mandarin)_Gentleman`); `yt-dlp` + `ffmpeg`; the exhibition Vite/TS app at `musicos-exhibition/`.

**Spec:** `docs/superpowers/specs/2026-05-06-episode-2-estranged-design.md`

**Slug:** `guns-n-roses_use-your-illusion-ii_estranged`

**Episode title (locked):** `双主角 — Estranged`

**Opera ancestor decision (locked):** 19c aria–cabaletta (Bellini *Norma*) appears as **opening narration background**, not as a numbered stop. It does not consume a station slot.

---

## Locked design decisions (from spec §11)

1. Title: `双主角 — Estranged`
2. 19c aria–cabaletta (Bellini *Norma* "Casta Diva" + cabaletta "Ah! bello a me ritorna") referenced in the OPENING narration as background — not a stop.
3. November Rain (1991, double-red-heart) is the primary lateral / 同代对话 station.

---

## Phase −1 · Taxonomy registration

### Task 1: Register `aria_solo_dialectic` focus in taxonomy

**Files:**
- Modify: `Foundations/episode_focus_taxonomy.md` — append a new section after `bassline_dna`, before the `voicing` placeholder.

- [ ] **Step 1: Read the current taxonomy file**

```bash
sed -n '1,60p' Foundations/episode_focus_taxonomy.md
```

Expected: see the existing `bassline_dna` section as the template.

- [ ] **Step 2: Insert the new focus section**

Insert immediately before the line `## voicing (placeholder, not yet shipped)`:

```markdown
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
```

- [ ] **Step 3: Verify the insertion**

```bash
grep -n "^## " Foundations/episode_focus_taxonomy.md
```

Expected: shows `bassline_dna`, `aria_solo_dialectic`, `voicing (placeholder, not yet shipped)`, `frequency_hollowing (placeholder, not yet shipped)` in this order.

- [ ] **Step 4: Commit**

```bash
git add Foundations/episode_focus_taxonomy.md
git commit -m "feat(taxonomy): register aria_solo_dialectic focus for Episode 2

Adds the second canonical focus to the registry. Defines connection
kinds, narrative slot priority, OPENING/CLOSING seeds, and locks in
the cross-focus rule that node selection follows lineage merit, not
user red-heart hit status (see Episode 2 spec §4)."
```

---

## Phase 0 · Track curation

### Task 2: Run track-curator skill for Estranged

**Inputs to the skill:**
- `anchor_song`: Guns N' Roses — Estranged (Use Your Illusion II, 1991)
- `episode_focus`: `aria_solo_dialectic`
- `target_stop_count`: 18 (including anchor)
- `epistemic_caps`: spec §9.1 defaults — upward 15, lateral 12, downward 20; ≤30% hypothesis tier; ≥60% platform-link coverage
- `library_overlay_source`: `data/user_tracks.json`
- `seed_node_set` (must-include unless track-curator finds them spurious):
  - Upstream: Layla (Derek and the Dominos, 1970), Child in Time (Deep Purple, 1970), Stairway to Heaven (Led Zeppelin, 1971), Won't Get Fooled Again (The Who, 1971), Free Bird (Lynyrd Skynyrd, 1973), Bohemian Rhapsody (Queen, 1975)
  - Lateral: November Rain (GnR, 1991), Fade to Black (Metallica, 1984)
  - Downstream: Champagne Supernova (Oasis, 1995), 椎名林檎 — 丸ノ内サディスティック (1999), 黑豹乐队 — Don't Break My Heart (1991)
  - Discovery candidates: Welcome to the Black Parade (MCR, 2006), Knights of Cydonia (Muse, 2006), Nothing Else Matters (Metallica, 1991)

- [ ] **Step 1: Invoke track-curator skill**

Use the Skill tool with `track-curator`. Pass the inputs above as the skill arguments.

- [ ] **Step 2: Inspect the produced tracklist**

```bash
ls -la playlists/guns-n-roses_use-your-illusion-ii_estranged.tracklist.json
python3 -c "
import json
tl = json.load(open('playlists/guns-n-roses_use-your-illusion-ii_estranged.tracklist.json'))
print(f'tracks: {len(tl[\"tracks\"])}')
print(f'red-heart hits: {sum(1 for t in tl[\"tracks\"] if t.get(\"red_heart_tier\")==\"hit\")}')
print(f'platform-link coverage: {sum(1 for t in tl[\"tracks\"] if t.get(\"platform_link\")) / max(len(tl[\"tracks\"]),1):.0%}')
for t in tl['tracks']:
    print(f'  {t[\"position\"]:>2}  {t.get(\"red_heart_tier\",\"?\"):<5}  {t[\"artist\"]} — {t[\"song\"]} ({t.get(\"year\",\"?\")})')
"
```

Expected: ~18 tracks, ≥60% with `platform_link`, ≥3 red-heart `hit` tier nodes (will drive closing-segment tone).

- [ ] **Step 3: Hard-stop check (spec §9.1)**

If any axis hit cap AND ancestors not yet covered → STOP and report. If hypothesis-tier edges > 30% → STOP. If <60% have platform link → STOP.

- [ ] **Step 4: Commit**

```bash
git add playlists/guns-n-roses_use-your-illusion-ii_estranged.tracklist.json data/nodes/
git commit -m "feat(episode-2): tracklist + node registry entries from track-curator

Phase 0 output: ~18 stops anchored on Estranged, traversing the
aria↔solo dialectic from Layla/Child in Time/Stairway upstream
through Bohemian Rhapsody, lateral to November Rain & Fade to Black,
downstream to 丸ノ内サディスティック and Don't Break My Heart."
```

---

## Phase 1 · Connections + map

### Task 3: Run connections-author skill

**Inputs to the skill:**
- `tracklist`: `playlists/guns-n-roses_use-your-illusion-ii_estranged.tracklist.json`
- `focus_slug`: `aria_solo_dialectic`
- `connection_kinds_in_scope`: as defined in taxonomy (Task 1)
- `intrinsic_score_weight_overrides`: `concrete_carrier=0.30`, others default

- [ ] **Step 1: Invoke connections-author skill**

Use the Skill tool with `connections-author`.

- [ ] **Step 2: Inspect the map**

```bash
python3 -c "
from tools.node_registry import resolve_map
from collections import Counter
m = resolve_map('maps/guns-n-roses_use-your-illusion-ii_estranged.map.json')
print(f'nodes: {len(m[\"node_ids\"])}, edges: {len(m[\"edges\"])}')
tiers = Counter(e['epistemic_layer'] for e in m['edges'])
print(f'edge tiers: {dict(tiers)}')
print(f'hypothesis ratio: {tiers.get(\"hypothesis\",0)/max(sum(tiers.values()),1):.0%}')
kinds = Counter(e['type'] for e in m['edges'])
print(f'edge kinds: {dict(kinds)}')
print(f'selected_as_strong count: {len(m.get(\"selected_as_strong\", []))}')"
```

Expected: hypothesis ratio ≤ 30%; ≥ 1 edge of each `dual_protagonist_structure` / `aria_form_descent` / `extended_solo_as_movement`; ≥ 2 `selected_as_strong` edges that target `red_heart_tier: hit` nodes (needed for closing template per Task 1 step 2).

- [ ] **Step 3: Run coverage update**

```bash
python3 -c "
from tools.node_registry import update_all_coverage
update_all_coverage('data/user_tracks.json')
print('coverage updated')"
```

- [ ] **Step 4: Self-check per spec §9.3**

Inspect: epistemic distribution, the 19c→1970 jump explicitly tagged `consensus` (not `fact`), every node has at least one `evidence` field with sources, the Bellini ancestor is referenced in the map's `expansion_notes` as background-only (not a node).

- [ ] **Step 5: Commit**

```bash
git add maps/guns-n-roses_use-your-illusion-ii_estranged.map.json data/nodes/
git commit -m "feat(episode-2): map.json from connections-author

Phase 1 output: edges with epistemic tiers, dual-protagonist /
aria-form-descent / extended-solo-as-movement kinds populated,
selected_as_strong picked for closing template seed."
```

---

## Phase 2 · Transcript

### Task 4: Run transcript-author skill

**Inputs to the skill:**
- `map`: `maps/guns-n-roses_use-your-illusion-ii_estranged.map.json`
- `tracklist`: `playlists/guns-n-roses_use-your-illusion-ii_estranged.tracklist.json`
- `focus_slug`: `aria_solo_dialectic`
- `narrator_persona`: `near_listener_v1`
- `episode_title_zh`: `双主角 — Estranged`
- `opening_background_directive`: include 1–2 sentences referencing the Bellini *Norma* aria–cabaletta form as the formal ancestor of the dual-protagonist structure, but DO NOT add it as a numbered station; immediately follow with the anchor's concrete sonic micro-description per the OPENING seed
- `closing_seed_directive`: name the 2 `selected_as_strong` edges whose target nodes have `red_heart_tier: hit`

- [ ] **Step 1: Invoke transcript-author skill**

Use the Skill tool with `transcript-author`.

- [ ] **Step 2: Inspect the episode files**

```bash
ls -la episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.{json,md}
python3 -c "
import json
ep = json.load(open('episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json'))
print(f'exhibits: {len(ep[\"exhibits\"])}')
total = sum(len(e.get('transcript_zh','')) for e in ep['exhibits'])
print(f'total ZH chars: {total}, est narration sec at 4.16 chars/sec: {total/4.16:.0f}')
muted = [e for e in ep['exhibits'] if e.get('muted_this_episode')]
print(f'muted: {len(muted)}')
opening = next((e for e in ep['exhibits'] if e.get('kind')=='opening'), None)
if opening:
    print(f'opening contains \"Bellini\" or \"歌剧\" or \"咏叹\" → {any(k in opening[\"transcript_zh\"] for k in [\"Bellini\",\"歌剧\",\"咏叹\"])}')
"
```

Expected: 15–18 exhibits (1 opening + 13–16 tracks + ≤1 interlude + 1 closing); estimated total runtime 45–75 min; opening references the operatic ancestor; ≥70% tracks `play_mode: full`.

- [ ] **Step 3: Human review pass on the .md**

Open `episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.md` in the editor. Spot-check: does each station have a concrete dual-protagonist moment named (a specific timecode or phrase), not just abstract praise? If any station is abstract → flag and re-elicit that segment with a tighter directive before proceeding.

- [ ] **Step 4: Commit**

```bash
git add episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.md
git commit -m "feat(episode-2): transcript draft from transcript-author

Phase 2 output: episode.json + episode.md, near_listener_v1 persona,
opening references Bellini Norma aria-cabaletta as formal ancestor
without consuming a station slot."
```

---

## Phase 3 · Audio production

> Follows `docs/episode_audio_pipeline.md` runbook. Steps are fixed; only the per-position style table is per-episode.

### Task 5: Audit and source music files

**Files:**
- Inspect: `musicos-exhibition/public/audio/`
- May create: `tools/youtube_manifest.txt` (for fills)

- [ ] **Step 1: Generate the expected stem list from the tracklist**

```bash
python3 -c "
import json
tl = json.load(open('playlists/guns-n-roses_use-your-illusion-ii_estranged.tracklist.json'))
for t in tl['tracks']:
    pos = f\"{t['position']:02d}\"
    artist = t['artist'].lower().replace(' ','-').replace(\"'\",'').replace('&','and')
    song = t['song'].lower().replace(' ','-').replace(\"'\",'')
    print(f'{pos}_{artist}_{song}')
"
```

Save the list — these are the required filename stems.

- [ ] **Step 2: Audit existing music durations**

```bash
for f in musicos-exhibition/public/audio/*.mp3; do
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" 2>/dev/null)
  printf "%6.1fs  %s\n" "$d" "$(basename "$f")"
done | sort -n
```

Anything `<120s` is a NetEase preview and must be refilled. Anything not present at all must be sourced.

- [ ] **Step 3: Build YouTube manifest for missing/short tracks**

Create `tools/youtube_manifest_estranged.txt`:

```
# <video_id>|<filename_stem>
# (one line per track to fill, look up canonical official-channel uploads)
```

Populate by searching YouTube for the official upload of each missing track. Prefer official-artist or label channels. For *Estranged* specifically: the official VEVO upload.

- [ ] **Step 4: Run the YouTube fetcher**

```bash
python3 -m tools.fetch_audio_youtube tools/youtube_manifest_estranged.txt
```

Existing files back up to `/tmp/audio_backup/`. Reruns are idempotent.

- [ ] **Step 5: Re-audit durations**

Repeat Step 2. Confirm all required stems are present and ≥120s (or ≥30s for tracks with `play_mode: excerpt` if any).

- [ ] **Step 6: Commit (audio files are gitignored, but manifest is tracked)**

```bash
git add tools/youtube_manifest_estranged.txt
git commit -m "chore(episode-2): youtube manifest for music sourcing"
```

### Task 6: Fetch missing cover art

**Files:**
- May create: `musicos-exhibition/public/covers/NN_<artist>_<song>.jpg`
- Modify: `data/exhibition.json` (cover field per episode-2 entries; will be regenerated by `build-exhibition-json.ts`, but verify after)

Per CLAUDE.md cover-asset rules:
- Source priority: official label, Wikipedia/Wikimedia, MusicBrainz Cover Art Archive, Discogs, Apple Music / Spotify, artist site
- ≥1000px square preferred; JPG; placed at `musicos-exhibition/public/covers/`
- Record source URLs in commit message

- [ ] **Step 1: List which covers are already present vs missing**

```bash
ls musicos-exhibition/public/covers/ | sort
```

Compare against the stem list from Task 5 Step 1 to find gaps.

- [ ] **Step 2: For each missing cover, search and download**

For each gap:
- Search official sources (label site, Wikipedia infobox, MusicBrainz CAA)
- Verify ≥1000px square; convert from PNG/WebP to JPG if needed (`magick input.png output.jpg`)
- Save as `NN_<artist-slug>_<song-slug>.jpg` matching the audio stem
- Record the source URL

- [ ] **Step 3: Verify all covers present**

```bash
python3 -c "
import os, json
tl = json.load(open('playlists/guns-n-roses_use-your-illusion-ii_estranged.tracklist.json'))
covers = set(os.listdir('musicos-exhibition/public/covers/'))
missing = []
for t in tl['tracks']:
    pos = f\"{t['position']:02d}\"
    artist = t['artist'].lower().replace(' ','-').replace(\"'\",'').replace('&','and')
    song = t['song'].lower().replace(' ','-').replace(\"'\",'')
    stem = f'{pos}_{artist}_{song}.jpg'
    if stem not in covers:
        missing.append(stem)
print(f'missing: {len(missing)}')
for m in missing: print(' ', m)
"
```

Expected: 0 missing.

- [ ] **Step 4: Commit covers with source URLs**

```bash
git add musicos-exhibition/public/covers/
git commit -m "$(cat <<'EOF'
chore(episode-2): cover art for Estranged episode tracks

Sources:
- 02_artist_song.jpg: <URL>
- 03_artist_song.jpg: <URL>
...
EOF
)"
```

### Task 7: Synthesize narration

**Files:**
- Create: `episodes/audio/narration/<stem>.mp3` for each exhibit
- Append: `episodes/audio/narration/synthesis_log.jsonl`

- [ ] **Step 1: Verify .env.local has working MiniMax credentials**

```bash
grep -q '^MINIMAX_API_KEY=sk-api-' .env.local && echo "OK" || echo "MISSING sk-api- key"
```

If MISSING → stop and ask user. The endpoint requires the `sk-api-` (pay-as-you-go) key, not a JWT.

- [ ] **Step 2: Run batch synthesis**

```bash
python3 -m tools.batch_synthesize_episode \
  --episode episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json \
  --voice 'Chinese (Mandarin)_Gentleman' \
  --output-dir episodes/audio/narration
```

Idempotent — skips outputs that already exist. Watch for `Auth 2049` (wrong endpoint or wrong key class).

- [ ] **Step 3: Verify all narration files produced**

```bash
ls episodes/audio/narration/ | grep -c '\.mp3$'
```

Expected count = exhibit count from Task 4 Step 2.

- [ ] **Step 4: Inspect billing log**

```bash
tail -1 episodes/audio/narration/synthesis_log.jsonl | python3 -m json.tool
```

Note the `usage_characters` total for cost tracking.

### Task 8: Per-position fusion style assignment + batch fusion

**Files:**
- Modify: `tools/batch_fusion.py` — update `STYLE_BY_POSITION` for this episode

- [ ] **Step 1: Read the current STYLE_BY_POSITION block**

```bash
grep -n "STYLE_BY_POSITION" tools/batch_fusion.py
sed -n '1,60p' tools/batch_fusion.py | grep -A 30 "STYLE_BY_POSITION"
```

- [ ] **Step 2: Define the style table for Episode 2**

Default rule of thumb:
- Position 1 (opening), interlude (if any), closing → `PASSTHROUGH`
- Anchor (Estranged station) → `C` (preroll + ducked bed) — the intro IS the point
- Long-narration stations (>350 ZH chars) → `C`
- Short-narration stations (≤350 ZH chars) → `A`
- Muted-bridge stations → `C_SHORT`

Run this helper to compute a draft assignment:

```bash
python3 -c "
import json
ep = json.load(open('episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json'))
for e in ep['exhibits']:
    pos = e['position']
    kind = e.get('kind','track')
    is_anchor = e.get('is_anchor', False)
    nlen = len(e.get('transcript_zh','') or e.get('bridge_narration_zh',''))
    muted = e.get('muted_this_episode', False)
    if kind in ('opening','interlude','closing'):
        style = 'PASSTHROUGH'
    elif muted:
        style = 'C_SHORT'
    elif is_anchor or nlen > 350:
        style = 'C'
    else:
        style = 'A'
    print(f'  {pos}: {style!r},  # {kind} {nlen}ch {\"[ANCHOR]\" if is_anchor else \"\"} {\"[MUTED]\" if muted else \"\"}')"
```

- [ ] **Step 3: Update `STYLE_BY_POSITION` in `tools/batch_fusion.py`**

Replace the previous episode's dict with the Episode 2 dict produced in Step 2. Keep the previous one in a comment block above for diff visibility.

- [ ] **Step 4: Run batch fusion**

```bash
python3 -m tools.batch_fusion \
  --episode episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json \
  --narration-dir episodes/audio/narration \
  --music-dir musicos-exhibition/public/audio \
  --output-dir episodes/audio/fusion
```

Refuses to truncate. If a track's music is too short for the assigned style → loud failure pointing at the gap → go back to Task 5 and refill that source.

- [ ] **Step 5: Verify all fusion outputs**

```bash
for f in episodes/audio/fusion/*.mp3; do
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  printf "%7.2fs  %s\n" "$d" "$(basename "$f")"
done | sort -n
```

Sanity: every output > 30s; no failures in the fusion log.

- [ ] **Step 6: Commit the style table**

```bash
git add tools/batch_fusion.py
git commit -m "feat(episode-2): STYLE_BY_POSITION assignments for Estranged

Anchor (Estranged) gets C. Long-narration stations C. Short A.
PASSTHROUGH for opening/interlude/closing."
```

---

## Phase 4 · Exhibition wiring

### Task 9: Sync fusion audio + rebuild exhibition JSON

**Files:**
- Modify: `musicos-exhibition/public/audio_fusion/` (full replace from `episodes/audio/fusion/`)
- Modify: `musicos-exhibition/data/exhibition.json` (regenerated by build script)

- [ ] **Step 1: Sync fusion mp3s into the exhibition public dir**

```bash
rm -rf musicos-exhibition/public/audio_fusion
cp -r episodes/audio/fusion musicos-exhibition/public/audio_fusion
ls musicos-exhibition/public/audio_fusion | wc -l
```

Expected count = exhibits from Task 4.

- [ ] **Step 2: Rebuild exhibition.json**

```bash
cd musicos-exhibition
npx tsx scripts/build-exhibition-json.ts
cd ..
```

Expected log: each exhibit picks up `fusion_audio_url` from disk.

- [ ] **Step 3: Verify the new episode is in exhibition.json**

```bash
python3 -c "
import json
ex = json.load(open('musicos-exhibition/data/exhibition.json'))
eps = [e for e in ex.get('episodes', []) if 'estranged' in e.get('episode_id','').lower()]
print(f'estranged episodes in data: {len(eps)}')
if eps:
    e = eps[0]
    print(f'exhibits: {len(e.get(\"exhibits\",[]))}')
    print(f'all have fusion_audio_url: {all(x.get(\"fusion_audio_url\") for x in e[\"exhibits\"])}')
"
```

Expected: 1 episode, all exhibits have `fusion_audio_url`.

- [ ] **Step 4: Commit**

```bash
git add musicos-exhibition/public/audio_fusion musicos-exhibition/data/exhibition.json
git commit -m "feat(exhibition): wire Episode 2 (Estranged · 双主角) fusion audio"
```

### Task 10: Browser smoke test

**Files:** none modified

- [ ] **Step 1: Start the dev server**

```bash
cd musicos-exhibition
npx vite
```

Note the local URL (typically `http://localhost:5173`).

- [ ] **Step 2: Manual verification in browser**

Open the URL. Navigate to the new Estranged episode timeline. Click each exhibit tile and verify:
- Cover image loads (not a broken-image icon)
- The fusion audio plays (narration + music, not bare music)
- The opening narration references Bellini / opera within first ~20s
- The anchor exhibit (Estranged) plays the `C` style: 8s music intro → narration on ducked bed → music returns → 60s post-roll
- The closing narration names two red-heart `hit` receivers

- [ ] **Step 3: Capture issues, if any**

If any exhibit fails any check → add a follow-up task with the specific exhibit position + the observed failure. Do not claim the episode is done.

- [ ] **Step 4: Final commit (if no issues)**

```bash
git commit --allow-empty -m "chore(episode-2): browser smoke test passed

Manually verified all exhibits play fusion audio with covers,
opening references the operatic ancestor, anchor exhibit follows
style C, closing names red-heart hit receivers."
```

---

## Hard stops (per spec §9.1)

If at any task you hit:
- An axis cap with required ancestors uncovered, OR
- > 30% hypothesis-tier edges, OR
- < 60% platform-link coverage in tracklist —

STOP, do not proceed to next phase, surface the gap to the user.

If music sourcing repeatedly fails for the same track (region locks, no public official upload, etc.), STOP and ask whether to swap the node for a substitute or drop it (and renumber).

If MiniMax synthesis fails with `Auth 2049`, do NOT retry — the credential or endpoint is wrong. Surface to user.

---

## Self-review (run after writing this plan, before handoff)

- [x] Spec coverage:
  - §1 form (single anchor long chain) → Phase 0–2 produce one tracklist + one map + one episode
  - §2 new focus registration → Task 1
  - §3 anchor justification → carried as input to Task 2 (track-curator); not separately re-litigated
  - §4 node selection by lineage merit → Task 1 step 2 inserts the rule into the taxonomy; reinforced as Task 2 input directive
  - §5 lineage sketch → Task 2 `seed_node_set`
  - §6 budget caps → embedded in Task 2 inputs and "Hard stops" section
  - §7 M-mechanism mapping → not directly executable; taxonomy entry preserves §7B.5 priority order
  - §8 out-of-scope → enforced via the seed_node_set excluding Initials B.B. / How Soon Is Now? / standalone Crazy Train segment
  - §9 self-check → Task 3 Step 4
  - §10 pipeline path → Phases 0/1/2/3/4 mirror the runbook
  - §11 user decisions → locked at top of plan
- [x] Placeholder scan: no TBD/TODO; every step has executable content
- [x] Type/name consistency: slug `guns-n-roses_use-your-illusion-ii_estranged` used throughout; focus `aria_solo_dialectic` used throughout; episode title `双主角 — Estranged` used throughout
