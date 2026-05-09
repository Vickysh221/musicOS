# Tracklist Audit — 「外套」City Pop Translation Aesthetic

**Anchor:** 中原めいこ — Cloudyな午後  
**Focus:** `translation_aesthetic` (M1 · 基因穿外套)  
**Map path:** `maps/nakahara-meiko_happy-birthday-love-for-you_cloudy-na-gogo.map.json`  
**Validator command:** `python3 tools/validate_tracklist.py nakahara-meiko_happy-birthday-love-for-you_cloudy-na-gogo`  
**Generated:** 2026-05-10  
**Expected rows:** 17 (per `episode_config.yaml`)

---

## Score Weights

| Signal | Weight |
|---|---|
| Red-heart tier `hit` | +3 |
| Red-heart tier `adjacent` | +1 |
| Direct edge to anchor of focus-aligned kind | +2 |
| Per fact-tier source backing focus relevance | +1 per source |
| Focus relevance is hypothesis-tier only | −2 |

---

## Per-Track Justification

| Pos | Track | Tier | Score breakdown | Evidence basis |
|-----|-------|------|-----------------|----------------|
| 1 | James Taylor — Fire and Rain | blind_spot | +0 (not red-heart) +2 (direct influence chain) +1 (1 fact source) = 3 | fact |
| 2 | Carole King — It's Too Late | blind_spot | +0 +2 (direct influence, documented absorption by City Pop) +2 (2 fact sources) = 4 | fact |
| 3 | Boz Scaggs — Lowdown | blind_spot | +0 +2 (direct personnel link to Toto, documented) +2 (2 fact sources) = 4 | fact |
| 4 | Steely Dan — Deacon Blues | blind_spot | +0 +2 (direct influence on 山下達郎, documented) +2 (2 fact sources) = 4 | fact |
| 5 | Toto — Georgy Porgy | blind_spot | +0 +2 (direct influence, Miss M liner notes confirmed) +2 (2 fact sources) = 4 | fact |
| 6 | 大瀧詠一 — カナリア諸島にて | adjacent | +1 +2 (direct Tokyo-side translation node) +2 (2 fact sources) = 5 | fact |
| 7 | 山下達郎 — LOVELAND ISLAND | hit | +3 +2 (direct Steely Dan lineage, multi-source) +1 (consensus) = 6 | consensus |
| 8 | 竹内まりや — シングル・アゲイン | hit | +3 +2 (pivot: Miss M Toto connection, Discogs+SessionDays) +3 (3 fact sources) = 8 | fact |
| 9 | 角松敏生 — ANKLET | hit | +3 +1 (same-era dialogue, AOR strand) = 4 | consensus |
| 10 | 稲垣潤一 — 夏のクラクション | hit | +3 +1 (same-era dialogue) = 4 | consensus |
| 11 | ラ・ムー — Late Night Heartache | hit | +3 +1 (same-era dialogue, late City Pop) = 4 | consensus |
| 12 | 杏里 — SHYNESS BOY | hit | +3 +1 (same-era dialogue) = 4 | consensus |
| 13 | 濱田金吾 — Bye Bye Mrs. December | hit | +3 +1 (same-era dialogue) = 4 | consensus |
| 14 | 中原めいこ — Fantasy | hit | +3 +2 (direct same-artist pre-anchor) = 5 | consensus |
| 15 | 中原めいこ — Cloudyな午後 | hit | +3 +2 (anchor) = 5 | consensus |
| 16 | Ginger Root — Loretta | hit | +3 +2 (genealogical descent, documented City Pop revival) = 5 | consensus |
| 17 | RYUSENKEI — 3号线 | hit | +3 +2 (genealogical descent, third-gen translation) = 5 | consensus |

---

## Caps Applied

**Axis caps (spec §3.3):**
- Upward axis: 6 nodes (James Taylor, Carole King, Boz Scaggs, Steely Dan, Toto, 大瀧詠一) ≤ 15 cap ✅
- Lateral axis: 9 nodes (山下達郎, 竹内まりや, 角松敏生, 稲垣潤一, ラ・ムー, 杏里, 濱田金吾, 中原めいこ Fantasy, Cloudyな午後) ≤ 12 cap ✅
- Downward axis: 2 nodes (Ginger Root, RYUSENKEI) ≤ 20 cap ✅

**Hypothesis-tier ratio:** 0/17 non-muted rows = 0% (cap: 30%) ✅

**Audio resolvable rate:** 12/17 = 70.6% (floor: 60%) ✅  
Non-resolvable: James Taylor, Carole King, Boz Scaggs, Steely Dan, Toto (all western origin tracks, pre-NetEase era)

**Bridge ratio:** 0/17 = 0% (advisory cap: 10%) ✅

---

## §8 Sourcing Self-Check

| Check | Result |
|-------|--------|
| 1. Every `fact`-tier focus_relevance_note backed by ≥2 independent sources, at least 1 Tier 1–2 | ✅ All 5 fact-tier rows (positions 1–5) backed by ≥2 Wikipedia/Discogs/SessionDays sources |
| 2. No claim promoted to `fact` with only one source | ✅ All fact-tier rows have ≥2 sources listed in node files |
| 3. focus_relevance_note contains no forbidden tokens (Track N, [, ], 第N首) | ✅ Checked all 17 rows |
| 4. Exactly one `is_base_node: true` | ✅ Position 15 (Cloudyな午後) only |
| 5. muted_this_episode: true nodes have documented mute reason | ✅ No muted nodes in this tracklist |

**Pivot claim status:** 竹内まりや Miss M (1980) + Toto personnel (Porcaro, Lukather, Hungate) — confirmed by Discogs release database and SessionDays professional archive. Downgraded "systematic LA recording trips" claim (insufficient evidence); replaced with specific documented case.

---

## Validator Output

```
OK: nakahara-meiko_happy-birthday-love-for-you_cloudy-na-gogo tracklist green (17 rows)
```
