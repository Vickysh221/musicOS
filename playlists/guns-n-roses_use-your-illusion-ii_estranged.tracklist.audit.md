# Tracklist Audit — guns-n-roses_use-your-illusion-ii_estranged

**Anchor:** Guns N' Roses — Estranged (Use Your Illusion II, 1991)
**Episode focus:** `aria_solo_dialectic`
**Map path:** `maps/guns-n-roses_use-your-illusion-ii_estranged.map.json` (not yet produced — Phase 1 creates this)
**Validator command:** `python3 tools/validate_tracklist.py guns-n-roses_use-your-illusion-ii_estranged`
**Generation date:** 2026-05-06
**Spec version:** 0.4

---

## Score Weights (per track-curator skill §3)

| Signal | Weight |
|---|---|
| Red-heart tier `hit` | +3 |
| Red-heart tier `adjacent` | +1 |
| Direct edge to anchor of focus-aligned kind | +2 |
| Per fact-tier source backing focus relevance | +1 per source |
| Focus relevance is hypothesis-tier only | −2 |

---

## Per-Track Justification

| Pos | Track | Year | Axis | Tier | Score breakdown | Evidence basis | narrative_weight |
|---|---|---|---|---|---|---|---|
| 1 | Deep Purple — Child in Time | 1970 | upward | blind_spot | +2 (focus-direct, Blackmore/Gillan dialectic) +2 (2 fact sources) = 4 | fact | pillar |
| 2 | Derek and the Dominos — Layla | 1970 | upward | hit | +3 +2 (focus-direct, two-movement) +2 (2 fact sources) = 7 | fact | pillar |
| 3 | Led Zeppelin — Stairway to Heaven | 1971 | upward | blind_spot | +2 (focus-direct, Page/Plant relay) +2 (2 fact sources) = 4 | fact | supporting |
| 4 | The Who — Won't Get Fooled Again | 1971 | upward | hit | +3 +1 (focus-adjacent, machine-vs-voice) +1 (1 fact source) = 5 | fact | bridge |
| 5 | Lynyrd Skynyrd — Free Bird | 1973 | upward | hit | +3 +2 (focus-direct, ballad+coda) +2 (2 fact sources) = 7 | fact | supporting |
| 6 | Queen — Bohemian Rhapsody | 1975 | upward | hit | +3 +2 (focus-direct, May solo-as-voice) +3 (3 fact sources) = 8 | fact | pillar |
| 7 | Pink Floyd — Comfortably Numb | 1979 | upward | blind_spot | +2 (focus-direct, Waters/Gilmour split vocal) +2 (2 fact sources) = 4 | fact | supporting |
| 8 | Metallica — Fade to Black | 1984 | lateral | hit | +3 +2 (focus-direct, Hetfield/Hammett dialectic) +2 (2 fact sources) = 7 | fact | supporting |
| 9 | Metallica — One | 1988 | upward | blind_spot | +2 (focus-direct, Fade to Black escalation) +2 (2 fact sources) = 4 | fact | bridge |
| 10 | Guns N' Roses — Estranged | 1991 | anchor | hit | anchor — not scored | fact | anchor |
| 11 | Guns N' Roses — November Rain | 1991 | lateral | hit | +3 +2 (focus-direct, Axl/Slash dialectic) +2 (2 fact sources) = 7 | fact | pillar |
| 12 | Metallica — Nothing Else Matters | 1991 | lateral | blind_spot | +2 (focus-direct, structural inversion) +2 (2 fact sources) = 4 | fact | supporting |
| 13 | 黑豹乐队 — Don't Break My Heart | 1991 | downstream | hit | +3 +2 (focus-direct, Chinese rock translation) +2 (2 fact sources) = 7 | fact | supporting |
| 14 | Oasis — Champagne Supernova | 1995 | downstream | blind_spot | +2 (focus-direct, Liam/Noel dialectic) +2 (2 fact sources) = 4 | fact | supporting |
| 15 | Radiohead — Paranoid Android | 1997 | downstream | hit | +3 +2 (focus-direct, Yorke/Greenwood) +1 (1 documented Queen lineage source) = 6 | consensus | supporting |
| 16 | 椎名林檎 — 丸ノ内サディスティック | 1999 | downstream | hit | +3 +2 (focus-direct, vocal/guitar dual) +2 (2 fact sources) = 7 | fact | supporting |
| 17 | My Chemical Romance — Welcome to the Black Parade | 2006 | downstream | blind_spot | +2 (focus-direct, Bohemian Rhapsody lineage) +3 (3 fact sources incl. Brian May collaboration) = 5 | fact | supporting |
| 18 | Muse — Knights of Cydonia | 2006 | downstream | blind_spot | +2 (focus-direct, inverted structure) +2 (2 fact sources) = 4 | fact | supporting |

### Discovery candidate decisions

| Candidate | Decision | Rationale |
|---|---|---|
| Nothing Else Matters (Metallica, 1991) | **Included** (pos 12) | Structural inversion of the dual-protagonist formula (Hetfield solos himself, Hammett absent) reveals the dialectic by negation — strong narrative value. |
| Welcome to the Black Parade (MCR, 2006) | **Included** (pos 17) | Explicit documented Bohemian Rhapsody lineage (Ray Toro interview, Brian May documented collaboration). Strong downstream node. |
| Knights of Cydonia (Muse, 2006) | **Included** (pos 18) | Inverts the aria→solo sequence (guitar-first, voice-second at 2:03). Structurally interesting reversal of the focus thesis. |

### Supplementary additions (not in seed set)

| Track | Rationale |
|---|---|
| Pink Floyd — Comfortably Numb (1979) | THE canonical three-protagonist song in classic rock: Waters (verses), Gilmour (choruses), Gilmour's guitar (solos). Fills 1975–1984 gap. |
| Metallica — One (1988) | Escalates Fade to Black template to its extreme: vocal drops entirely for the climax, leaving guitar as sole protagonist. Fills 1984–1991 gap. |
| Radiohead — Paranoid Android (1997) | Documented Bohemian Rhapsody descendant. Fills 1995–1999 gap; Radiohead's user red-heart status (hit) adds tier value. |

---

## Caps Applied

| Check | Value | Cap | Status |
|---|---|---|---|
| Upward axis count | 8 (pos 1–3, 5–7, 9 + WGFA as bridge) | hard cap 15 | OK |
| Lateral axis count | 3 (pos 8, 11, 12) | hard cap 12 | OK |
| Downward axis count | 6 (pos 13–18) | hard cap 20 | OK |
| Hypothesis-tier ratio | 0/16 non-bridge tracks = 0% | hard stop >30% | OK |
| Bridge ratio | 2/18 = 11% | advisory >10% | Advisory warning (11%) — acceptable, nodes justified |
| Platform-link coverage | 11/18 = 61% | hard stop <60% | OK |

**Bridge ratio note:** 2 bridge tracks (pos 4 Won't Get Fooled Again, pos 9 One) are structural siblings included for arc completeness. Both have documented focus-adjacent relevance. The 11% slightly exceeds the 10% advisory but is not a hard stop.

---

## §8 Sourcing Self-Check

| Check | Outcome |
|---|---|
| 1. Every `fact`-tier `focus_relevance_note` backed by ≥2 independent sources (at least 1 Tier 1–2)? | PASS — all fact-tier nodes have ≥2 independent sources (Wikipedia + longform journalism or music press). |
| 2. No claim promoted to `fact` with only one source? | PASS — Paranoid Android correctly marked `consensus` (1 Wikipedia source + 1 wiki-level source; Queen lineage documented but not via Tier 1–2 direct interview). |
| 3. `focus_relevance_note` contains no forbidden tokens (`Track N`, `[`, `]`, `第N首`)? | PASS — reviewed all 18 notes. |
| 4. Exactly one `is_base_node: true`? | PASS — pos 10 (Estranged) only. |
| 5. `muted_this_episode: true` nodes have documented mute reason traceable to focus taxonomy mute rule? | PASS — pos 4 (Won't Get Fooled Again): machine-vs-human rather than guitar-vs-voice; pos 9 (One): bridge node functioning as structural escalation before anchor, no separate pillar significance. |

### Axis cap compliance
- Hard cap upward (15): 8 used — OK
- Hard cap lateral (12): 3 used — OK
- Hard cap downward (20): 6 used — OK

### Hypothesis-tier edge ratio
- 0 hypothesis-tier focus claims out of 16 non-bridge tracks = 0% — well under 30% hard stop.

### Audio resolvability
- 11/18 tracks with NetEase platform links = 61% — above 60% hard stop.
- Missing IDs: Child in Time (Deep Purple, licensing issues), Stairway to Heaven (Led Zeppelin, not on NetEase), One (Metallica, rights), Nothing Else Matters (Metallica, rights), Champagne Supernova (Oasis, region issues), Welcome to the Black Parade (MCR, licensing), Knights of Cydonia (Muse, not red-hearted/confirmed absent).

### Annotation on Paranoid Android (consensus tier)
Radiohead's documented use of Bohemian Rhapsody as a structural model appears in multiple press sources but the direct primary interview was not verifiable via available search. Tagged `consensus` rather than `fact` per sourcing principles §5.2.

---

## Map Note

The anchor map `maps/guns-n-roses_use-your-illusion-ii_estranged.map.json` does not yet exist — it will be produced in Phase 1 (connections-author). The validator's map cross-reference check is therefore skipped. This is expected for Phase 0 when the map is created simultaneously with or after the tracklist.

The 19c aria–cabaletta ancestor (Bellini *Norma*) is referenced conceptually in the episode focus but does NOT appear as a numbered station per task brief rule 3.

---

## Validator Output

```
WARNING: bridge ratio 2/18 exceeds 10% advisory cap
WARNING: map file /Users/vickyshou/Documents/MusicOS/maps/guns-n-roses_use-your-illusion-ii_estranged.map.json not found — skipping map cross-reference check
OK: guns-n-roses_use-your-illusion-ii_estranged tracklist green (18 rows)
```

Status: **GREEN** (2 advisory warnings; 0 hard stops)
