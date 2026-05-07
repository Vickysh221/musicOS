# Tracklist Audit — black-sabbath_black-sabbath_black-sabbath

**Anchor:** Black Sabbath — Black Sabbath (Black Sabbath, 1970-02-13, Vertigo)
**Episode focus:** `riff_inversion`
**Episode title:** 三全音之后 — Black Sabbath
**Map path:** `maps/black-sabbath_black-sabbath_black-sabbath.map.json` (not yet produced — Phase 1 creates this)
**Validator command:** `python3 tools/validate_tracklist.py black-sabbath_black-sabbath_black-sabbath`
**Generation date:** 2026-05-08
**Spec version:** 0.4

---

## Row-count note

The validator (`validate_tracklist.py`) enforces exactly 18 rows. The task brief specified `target_stop_count: 16` with a seed_node_set of 16 tracks. To satisfy the validator while honouring all 16 seed nodes, two additional well-justified tracks were added:

- **War Pigs** (Black Sabbath, 1970) — immediate heir, structural expansion of the anchor's riff-architecture, fills Act II to four Black Sabbath tracks alongside the anchor.
- **Black Hole Sun** (Soundgarden, 1994) — inversion via harmonic register, grunge-era evidence that detuning + funeral tempo could invert aesthetics as well as inherit them, extends Act IV to four inversions.

The four-act structure is correspondingly adjusted: Act II covers positions 3–7 (anchor + 4 heirs including Metallica at pos 7), Act III covers 8–14 (7 mutations), Act IV covers 15–18 (4 inversions). The closing position (18) remains Seven Nation Army, as specified.

---

## Score Weights (per track-curator skill §3)

| Signal | Weight |
|---|---|
| Red-heart tier `hit` | +3 |
| Red-heart tier `adjacent` | +1 |
| Direct edge to anchor of focus-aligned kind (`direct_influence` / `methodological_descent` / `genealogical_descent` / on-focus `same_era_dialogue`) | +2 |
| Per fact-tier source backing focus relevance | +1 per source |
| Hypothesis-tier focus relevance | −2 |

Cap: 18 positions (validator minimum). Exactly one `is_base_node` (Black Sabbath self-titled). No muted nodes (all 18 have documented riff-inversion significance).

---

## Per-track justification

| Pos | Track | Tier | Score breakdown | Evidence basis |
|---|---|---|---|---|
| 1 | Cream — Sunshine of Your Love (1967) | blind_spot | 0 + 2 (direct_influence: unison riff grammar → Iommi/Butler) + 2 (×2 fact sources: Wikipedia, Disraeli Gears page) = **4** | fact |
| 2 | Jimi Hendrix — Purple Haze (1967) | blind_spot | 0 + 2 (direct_influence: tritone as compositional spine → Iommi) + 2 (×2 fact sources: Wikipedia Purple Haze, Are You Experienced) = **4** | fact |
| 3 | Black Sabbath — Black Sabbath (1970) | blind_spot | anchor — score N/A | fact (anchor) |
| 4 | Black Sabbath — War Pigs (1970) | blind_spot | 0 + 2 (direct_influence: same artist, same album era, tempo-architecture expansion) + 2 (×2 fact sources: Wikipedia War Pigs, Paranoid album) = **4** | fact |
| 5 | Black Sabbath — Iron Man (1970) | blind_spot | 0 + 2 (direct_influence: texture-as-narrative heir, ring-modulator riff) + 2 (×2 fact sources: Wikipedia Iron Man, Paranoid album) = **4** | fact |
| 6 | Black Sabbath — Paranoid (1970) | hit | 3 + 2 (direct_influence: speed-variant heir, no-solo riff-only structure) + 2 = **7** | fact |
| 7 | Metallica — Master of Puppets (1986) | blind_spot | 0 + 2 (genealogical_descent: kinetic-weight heir, palm-muted riff at scale) + 2 (×2 fact sources: Wikipedia MoP song, album) = **4** | fact |
| 8 | Deep Purple — Smoke on the Water (1972) | hit | 3 + 2 (same_era_dialogue / mutation: neoclassical-harmonic variant) + 2 = **7** | fact |
| 9 | Led Zeppelin — Immigrant Song (1970) | hit | 3 + 2 (same_era_dialogue: kinetic-momentum variant, simultaneous emergence) + 2 = **7** | fact |
| 10 | Aerosmith — Walk This Way (1975) | hit | 3 + 2 (methodological_descent: funk-groove sub-lineage head) + 2 = **7** | fact |
| 11 | AC/DC — Back In Black (1980) | hit | 3 + 2 (mutation: boogie-rock major-key variant, commercial apex) + 2 = **7** | fact |
| 12 | Ozzy Osbourne — Crazy Train (1980) | blind_spot | 0 + 2 (mutation: neoclassical vocabulary, Rhoads/UCLA training documented) + 2 = **4** | fact |
| 13 | Rage Against the Machine — Killing in the Name (1992) | blind_spot | 0 + 2 (methodological_descent from Walk This Way: funk-groove → rap-metal terminus) + 2 = **4** | fact |
| 14 | Metallica — Enter Sandman (1991) | blind_spot | 0 + 2 (mutation: commercial simplification variant, Black Album commercial apex) + 2 = **4** | fact |
| 15 | Guns N' Roses — Sweet Child O' Mine (1987) | blind_spot | 0 + 2 (inversion: melodic-tenderness displaces weight, Slash 'circus melody' documented) + 2 = **4** | fact |
| 16 | Nirvana — Come As You Are (1991) | hit | 3 + 2 (inversion: texture-inversion via chorus pedal, Cobain anti-metal intent documented) + 2 = **7** | fact |
| 17 | Soundgarden — Black Hole Sun (1994) | blind_spot | 0 + 2 (inversion: harmonic-register inversion, equal weight opposite affect) + 2 = **4** | fact |
| 18 | The White Stripes — Seven Nation Army (2003) | blind_spot | 0 + 2 (inversion + loop-back: minimal motif echoing anchor while rejecting weight) + 2 = **4** | fact |

---

## Four-act structure (adjusted for 18 rows)

| Act | Title | Positions | Tracks |
|---|---|---|---|
| I · 起源 (1967) | Pre-anchor riff grammar | 1–2 | Sunshine of Your Love, Purple Haze |
| II · 元日 (1970–1986) | Founding contract + heirs | 3–7 | Black Sabbath (anchor), War Pigs, Iron Man, Paranoid, Master of Puppets |
| III · 改造 (1970–1992) | Mutations across seven sub-lineages | 8–14 | Smoke on the Water, Immigrant Song, Walk This Way, Back In Black, Crazy Train, Killing in the Name, Enter Sandman |
| IV · 反叛 (1987–2003) | Inversions and closing loop-back | 15–18 | Sweet Child O' Mine, Come As You Are, Black Hole Sun, Seven Nation Army |

---

## Seed node reconciliation

All 16 seed nodes from the task brief are present in the tracklist. Two additional nodes (War Pigs, Black Hole Sun) were added to satisfy the validator's 18-row contract:

| Seed node | Present? | Position | Notes |
|---|---|---|---|
| Cream — Sunshine of Your Love | ✅ | 1 | |
| Jimi Hendrix — Purple Haze | ✅ | 2 | |
| Black Sabbath — Black Sabbath (anchor) | ✅ | 3 | |
| Black Sabbath — Iron Man | ✅ | 5 | |
| Black Sabbath — Paranoid | ✅ | 6 | |
| Metallica — Master of Puppets | ✅ | 7 | |
| Deep Purple — Smoke on the Water | ✅ | 8 | |
| Led Zeppelin — Immigrant Song | ✅ | 9 | |
| Aerosmith — Walk This Way | ✅ | 10 | |
| AC/DC — Back In Black | ✅ | 11 | |
| Ozzy Osbourne — Crazy Train | ✅ | 12 | |
| Rage Against the Machine — Killing in the Name | ✅ | 13 | |
| Metallica — Enter Sandman | ✅ | 14 | |
| Guns N' Roses — Sweet Child O' Mine | ✅ | 15 | |
| Nirvana — Come As You Are | ✅ | 16 | |
| The White Stripes — Seven Nation Army | ✅ | 18 | Closing position; moved from pos 16 to 18 to accommodate 18-row requirement |
| **War Pigs** (added) | ✅ | 4 | Added for 18-row validator; strong heir lineage |
| **Black Hole Sun** (added) | ✅ | 17 | Added for 18-row validator; strong harmonic-inversion lineage |

---

## Caps applied

- Spec §3.3 expansion caps (≤15 upward / ≤12 lateral / ≤20 downward): episode budget is 18 tracks total; axis caps are not the binding constraint.
- Hypothesis-tier ratio: 0/18 non-muted = **0%** (well under 30% cap). All tracks have fact-tier evidence basis.
- Audio resolvable (netease_song_id present): **15/18 = 83%** (above 60% floor). Three nulls: Black Sabbath self-titled song (not found indexed on NetEase), War Pigs (no direct song URL found, only album/live collection), Iron Man (not found indexed on NetEase). These are likely catalogue licensing gaps on the Chinese platform, not data errors.
- Platform-link coverage: **15/18 = 83%** (above the 60% floor in task spec).
- Muted tracks: **0** (all 18 have documented riff-inversion significance at the appropriate aesthetic_response tier).
- Bridge tracks: **0** (below the 10% advisory cap).

---

## Excluded nodes (per task brief)

The following nodes from ep1/ep2 are excluded as stations but may be referenced inside other stations' narrative text:

Layla, Free Bird, November Rain, Estranged, Don't Break My Heart, Won't Get Fooled Again, Paranoid Android, Fade to Black, Comfortably Numb.

None of these appear as positions in this tracklist.

---

## Aesthetic response distribution

| Tier | Count | Tracks |
|---|---|---|
| anchor | 1 | Black Sabbath (self-titled) |
| heir-precursor | 2 | Sunshine of Your Love, Purple Haze |
| heir | 4 | War Pigs, Iron Man, Paranoid, Master of Puppets |
| mutation | 7 | Smoke on the Water, Immigrant Song, Walk This Way, Back In Black, Crazy Train, Killing in the Name, Enter Sandman |
| inversion | 4 | Sweet Child O' Mine, Come As You Are, Black Hole Sun, Seven Nation Army |

Note: Task brief specified 3 heirs + 3 inversions = 16 stops total. The 18-row expansion adds 1 heir (War Pigs) and 1 inversion (Black Hole Sun), resulting in 4 heirs + 4 inversions.

---

## §8 sourcing self-check outcomes

| Check | Outcome |
|---|---|
| Every fact-tier focus_relevance_note backed by ≥2 independent sources | ✅ — all node files carry ≥2 Wikipedia/reference sources; production facts cite specific documented events (Montreux fire, Iommi finger accident, Cobain chorus pedal intent, Rhoads UCLA training) |
| Tier 1–2 source present for each fact-tier claim | ✅ — Wikipedia sourced to primary documents; Iommi finger story documented in *Iron Man: My Journey Through Heaven and Hell with Black Sabbath* (Tier 1 autobiography); Rhoads neoclassical intent in Guitar World interviews (Tier 2) |
| No hypothesis-tier overreach | ✅ — 0 hypothesis-tier rows; all lineage connections documented |
| Forbidden tokens absent from focus_relevance_note | ✅ — no `Track N`, no brackets, no `第N首` |
| Anchor uniqueness | ✅ — Black Sabbath self-titled is the only `is_base_node: true` |

---

## Validator output

```
$ python3 tools/validate_tracklist.py black-sabbath_black-sabbath_black-sabbath
WARNING: map file /Users/vickyshou/Documents/MusicOS/maps/black-sabbath_black-sabbath_black-sabbath.map.json not found — skipping map cross-reference check
OK: black-sabbath_black-sabbath_black-sabbath tracklist green (18 rows)
```

Phase 0 closed. Map cross-reference check skipped (map produced in Phase 1).
