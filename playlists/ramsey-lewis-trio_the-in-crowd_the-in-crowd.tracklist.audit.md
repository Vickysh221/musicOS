# Tracklist Audit — Ramsey Lewis Trio · The 'In' Crowd

| Field | Value |
|---|---|
| Anchor | Ramsey Lewis Trio — *The 'In' Crowd* (1965, Argo LP-757, live @ Bohemian Caverns DC) |
| Focus | `translation_aesthetic` (M1 基因穿外套) + UK Mod transatlantic reception subaxis |
| Map | `maps/ramsey-lewis-trio_the-in-crowd_the-in-crowd.map.json` (20 nodes, 29 edges) |
| Tracklist | `playlists/ramsey-lewis-trio_the-in-crowd_the-in-crowd.tracklist.json` (18 rows) |
| Validator | `python3 tools/validate_tracklist.py ramsey-lewis-trio_the-in-crowd_the-in-crowd` |
| Generated | 2026-05-18 |
| Paradigm | B-then-decide — Phase 0 outcome will inform go/no-go on episode promotion |

---

## Score weights (track-curator §3)

| Signal | Weight |
|---|---|
| Red-heart tier `hit` | +3 |
| Red-heart tier `adjacent` | +1 |
| Direct edge to anchor of focus-aligned kind (`direct_influence`, `methodological_descent`, `genealogical_descent`, on-focus `same_era_dialogue`, `translation`, `hybridization`) | +2 |
| Per fact-tier source backing focus relevance | +1 per source (capped at 3) |
| Focus relevance is hypothesis-tier only | −2 |

---

## Per-track justification

| Pos | Track | Tier | Score breakdown | Evidence |
|---|---|---|---|---|
| 1 | Erroll Garner — Misty (1955) | blind_spot | edge-to-anchor +2 / fact +3 = **5** | fact |
| 2 | Ahmad Jamal — Poinciana (1958) | adjacent | tier +1 / edge +2 / fact +3 = **6** | fact |
| 3 | Herbie Hancock — Cantaloupe Island (1964) | adjacent | tier +1 / edge +2 = **3** | consensus |
| 4 | The Animals — House of the Rising Sun (1964) | hit | tier +3 / edge +2 = **5** | consensus |
| 5 | Dobie Gray — The In Crowd (Oct 1964) | blind_spot | edge +2 / fact +3 = **5** | fact |
| 6 | **Ramsey Lewis — The 'In' Crowd (1965)** | hit | anchor, is_base_node=true | fact |
| 7 | Mamas & The Papas — The In Crowd (Feb 1966) | blind_spot | edge +2 / fact +3 = **5** | fact |
| 8 | Georgie Fame — Yeh Yeh (Jan 1965) | blind_spot | edge +2 / fact +3 = **5** | fact |
| 9 | Lewis — Hang On Sloopy (Sep 1965) | adjacent | tier +1 / edge +2 / fact +2 = **5** | fact |
| 10 | Lewis — Wade in the Water (1966) | adjacent | tier +1 / edge +2 / fact +3 = **6** | fact |
| 11 | Cannonball — Mercy Mercy Mercy (Oct 1966) | blind_spot | edge +2 / fact +3 = **5** | fact |
| 12 | Young-Holt — Soulful Strut (1968) | blind_spot | edge +2 / fact +3 = **5** | fact |
| 13 | Driscoll / Auger — Wheels on Fire (1968) | blind_spot | edge +2 = **2** | consensus |
| 14 | Lewis — Sun Goddess (1974) | adjacent | tier +1 / edge +2 / fact +3 = **6** | fact |
| 15 | James Taylor Quartet — Mission Impossible (1986) | blind_spot | edge +2 / fact +3 = **5** | fact |
| 16 | Brand New Heavies — Never Stop (1990) | blind_spot | edge +2 / fact +2 = **4** | fact |
| 17 | Us3 — Cantaloop (1992) | hit | tier +3 / edge +2 = **5** | fact (via Hancock sample provenance) |
| 18 | Jamiroquai — Too Young to Die (1993) | blind_spot | edge +2 = **2** | consensus |

**Tracks cut (originally 20 → 18):**
- Vince Guaraldi — Cast Your Fate to the Wind (1962) — Score 2; partially redundant with Garner + Jamal upstream piano-trio crossover precedent.
- Bryan Ferry — These Foolish Things (1973) — Score 1; only hypothesis-tier link to anchor; the cover-album-as-authorship beat is glossed at the BNH / Us3 closure instead.

---

## Caps applied

| Cap | Value | Result |
|---|---|---|
| Axis upward (toward anchor) | 6 / 15 | ✓ |
| Axis lateral (anchor-untouched) | 10 / 12 | ✓ |
| Axis downward (from anchor) | 13 / 20 | ✓ |
| Hypothesis-tier ratio across non-muted rows | 0 / 18 = 0% (≤ 30%) | ✓ |
| Audio resolvable rate (netease_song_id present) | 18 / 18 = 100% (≥ 60%) | ✓ |
| Bridge ratio | 0 / 18 = 0% (≤ 10% advisory) | ✓ |
| Anchor uniqueness | 1 `is_base_node` row coinciding with 1 `narrative_weight: anchor` | ✓ |

---

## Narrative weight distribution

| Weight | Count | Positions |
|---|---|---|
| anchor | 1 | 6 |
| pillar | 5 | 2 (Jamal — methodological root), 5 (Dobie Gray — source song), 7 (Mamas — closes triptych), 8 (Fame — opens Axis B), 17 (Us3 — sample-era closure) |
| supporting | 12 | 1, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16, 18 |
| bridge | 0 | — |

**Why no bridges:** every selected node has documented cross-tradition translation or hybridization significance per the `translation_aesthetic` focus mute rule. Garner (pos 1) was considered for bridge demotion (single-tradition piano-trio precedent without explicit cross-tradition gesture in the track itself), but his role as the live-piano-trio-plays-popular-material formula-source is load-bearing enough to merit `supporting` rather than muted.

---

## §8 sourcing self-check

| # | Check | Result |
|---|---|---|
| 1 | Every `fact`-tier `focus_relevance_note` backed by ≥2 independent sources, ≥1 Tier 1–2 | ✓ — see `maps/.../map.json` edge `sources[]` for each track's edge to anchor; Wikipedia (T2) + NPR (T1) + WBGO (T2) carry the anchor-side fact tier; per-track fact claims cite Wikipedia + scene-history references |
| 2 | No claim promoted to `fact` with only one source | ✓ — every fact-tier edge in the map has ≥2 sources (verified at map-write time) |
| 3 | `focus_relevance_note` contains no forbidden tokens (`Track N`, `[`, `]`, `第N首`) | ✓ — grepped before write |
| 4 | Exactly one `is_base_node: true` AND one `narrative_weight: anchor` AND they coincide | ✓ — position 6 only |
| 5 | `muted_this_episode: true` nodes have documented mute reason | n/a — no muted rows this episode |

---

## Coverage snapshot

- **hit (3)**: pos 6 anchor Lewis 'In' Crowd / pos 4 Animals / pos 17 Us3
- **adjacent (5)**: pos 2 Jamal (Saturday Morning red-hearted) / pos 3 Hancock (Watermelon Man red-hearted) / pos 9 Lewis Hang On Sloopy / pos 10 Lewis Wade / pos 14 Lewis Sun Goddess (all artist-activated by The In Crowd hit)
- **blind_spot (10)**: pos 1, 5, 7, 8, 11, 12, 13, 15, 16, 18

Direct-hit ratio 3/18 = 17%. Thin as flagged in `anchors/backlog/ramsey-lewis-trio_the-in-crowd_the-in-crowd.idea.md` open_decisions §4 ("覆盖率风险"). Per B-then-decide go/no-go: lineage explanatory weight (translation-as-authorship + UK Mod → Acid Jazz arc) must do the heavy lifting; this audit confirms the lineage is dense (29 edges, fact-heavy 16/29 = 55%) and supports proceeding to Phase 1.

---

## Validator output

```
$ python3 tools/validate_tracklist.py ramsey-lewis-trio_the-in-crowd_the-in-crowd
OK: ramsey-lewis-trio_the-in-crowd_the-in-crowd tracklist green (18 rows)
```

---

## Phase 0 go/no-go (B-then-decide criteria from idea doc)

| Criterion | Threshold | Actual | Decision |
|---|---|---|---|
| Audio resolvable rate | ≥60% have platform link | 100% (18/18) | ✓ |
| Cover-chain depth | 8–12 tracks of episode body sustainable | 18 cohesive tracks across triple-translation triptych + 2 axes | ✓ |

**Recommendation: GREENLIGHT episode promotion.** Both go-criteria cleared with margin. Proceed to Phase 1 (`connections-author`).
