# Tracklist Audit — dorantes_orobroy_orobroy

**Anchor:** Dorantes — Orobroy (1998 original on the album *Orobroy*; 2010 *Nueva versión* on *El tiempo por testigo... A Sevilla*)
**Episode focus:** `translation_aesthetic`
**Episode title:** 基因穿外套 — Orobroy
**Map path:** `maps/dorantes_orobroy_orobroy.map.json` (24 nodes, 27 edges)
**Design spec:** `docs/superpowers/specs/2026-05-07-ep4-orobroy-episode-design.md`
**Validator command:** `python3 tools/validate_tracklist.py dorantes_orobroy_orobroy`
**Generation date:** 2026-05-07
**Spec version:** 0.4

---

## Episode-specific overrides

### 1. Row count: 20 (override of default 18)

The track-curator SKILL default is 18 rows; the episode-design spec (§Narrative arc) calls for ~20 stops to match the Miss You / Estranged / Black Sabbath arc length. Implemented by adding `episode_config.yaml` (which the SKILL doc and spec both reference but which did not previously exist) with a per-slug override:

```yaml
episodes:
  dorantes_orobroy_orobroy:
    expected_rows: 20
    allow_duplicate_anchor_node: true
```

`tools/validate_tracklist.py` was extended with a tiny inline YAML parser (no PyYAML dep) to read this file. Default behaviour for slugs with no entry is unchanged (18 rows, no duplicate node_ids). The three prior episodes (Miss You / Estranged / Black Sabbath) re-validate green at 18 rows.

### 2. Dual-version anchor: same `node_id` on rows 1 and 13

Per the design spec, the episode embeds **both** the 1998 original and the 2010 *Nueva versión* of Orobroy. Per the codebase rule that nodes are permanent singletons (`CLAUDE.md` core architectural rule), both rows reference the same `node_id` `dorantes_orobroy_orobroy` — the second cultural artefact does not justify a separate node file (a re-recording with a children's choir is enrichment of the same composition, not a separate cultural movement).

| Position | Function | `is_base_node` | `narrative_weight` | Version |
|---|---|---|---|---|
| 1 | Opener — user's entry ear | false | pillar | 2010 *Nueva versión* (NetEase id 1348066823) |
| 13 | Anchor — naked original | true | anchor | 1998 original (NetEase id null — track is not licensed standalone on the platform) |

Validator extension: `allow_duplicate_anchor_node: true` permits exactly one duplicate `node_id` *iff* it is the anchor `node_id` AND exactly one of the two rows has `is_base_node=true`. All other duplicate-`node_id` patterns remain hard-fail.

The 1998 row carries the canonical `node_id` mapping (`is_base_node: true`, `narrative_weight: anchor`). Both rows include a `version_note` field disambiguating the version.

---

## Score Weights (per track-curator skill §3)

| Signal | Weight |
|---|---|
| Red-heart tier `hit` | +3 |
| Red-heart tier `adjacent` | +1 |
| Direct edge to anchor of focus-aligned kind (`direct_influence` / `methodological_descent` / `genealogical_descent` / on-focus `same_era_dialogue` / `translation` / `hybridization`) | +2 |
| Per fact-tier source backing focus relevance | +1 per source |
| Hypothesis-tier focus relevance | −2 |

Cap: 20 positions (per `episode_config.yaml`). Exactly one `is_base_node` (Orobroy 1998 row at position 13). No muted nodes — every retained node has documented translation/hybridization significance.

---

## Per-track justification

| Pos | Track | Tier | Score breakdown | Evidence basis |
|---|---|---|---|---|
| 1 | Dorantes — Orobroy (2010 Nueva versión) | hit | 3 + 0 (anchor's own row, no inbound edge) + 3 (fact: dorantes_1998_to_2010 translation edge, 3 sources) = **6** (anchor-pillar role) | fact |
| 2 | El Lebrijano — Me Vienen Siguiendo (Persecución, 1976) | blind_spot | 0 + 2 (direct_influence: family root → Dorantes) + 3 (×3 fact sources) = **5** | fact |
| 3 | Camarón de la Isla — La Leyenda del Tiempo (1979) | blind_spot | 0 + 2 (genealogical_descent: founding rupture → Dorantes) + 2 = **4** | fact |
| 4 | Paco de Lucía — Entre Dos Aguas (1973) | blind_spot | 0 + 2 (direct_influence: modernized flamenco → Dorantes) + 3 (×3 fact sources, edge fact-tier) = **5** | fact |
| 5 | Pata Negra — Blues de la Frontera (1987) | blind_spot | 0 + 2 (hybridization: foreign harmony in flamenco body → Orobroy a decade later) + 2 = **4** | fact |
| 6 | Chano Domínguez — El Puerto (Piano Ibérico) | blind_spot | 0 + 2 (methodological_descent: elder brother on flamenco-piano axis) + 3 (×3 fact sources) = **5** | fact |
| 7 | Albéniz — Iberia: I. Evocación (1909) | blind_spot | 0 + 2 (direct_influence: Spanish-classical-piano root) + 0 (consensus, not fact) − 2 (the edge is consensus only) = effectively **0** but retained as the Spanish-classical root the lineage requires | consensus |
| 8 | Keith Jarrett — Köln Concert Pt I (1975) | adjacent | 1 (artist adjacency via Jasmine in red-heart) + 2 (translation: solo-piano source dialect) + 2 = **5** | consensus |
| 9 | Buena Vista Social Club — Chan Chan (1997) | hit | 3 + 2 (direct_influence: re-opened Spanish-Cuban axis → Cigala-Bebo) + 2 = **7** | fact |
| 10 | Bebo Valdés & Diego El Cigala — Lágrimas Negras (2003) | blind_spot | 0 + 2 (same_era_dialogue: lateral counterpart to Orobroy's translation aesthetic) + 2 = **4** | fact |
| 11 | Michel Camilo & Tomatito — Spain (2000) | blind_spot | 0 + 2 (same_era_dialogue: exact-year contemporary, fact-tier edge) + 3 = **5** | fact |
| 12 | Esperanza Fernández — Al Compas del Baile (2001) | blind_spot | 0 + 2 (same_era_dialogue / direct collaboration with Dorantes) + 4 (×4 fact sources, edge fact-tier) = **6** | fact |
| 13 | **Dorantes — Orobroy (1998)** — anchor | hit | anchor — score N/A | fact (anchor) |
| 14 | Buika — Mi Niña Lola (2006) | blind_spot | 0 + 2 (translation: female-voice diaspora translation downstream) + 2 = **4** | consensus |
| 15 | Carmen Linares — Zorongo Gitano (1996) | hit | 3 + 2 (direct_influence: cante-jondo voice of same generation) + 2 = **7** | fact |
| 16 | María José Llergo — Niña de las Dunas (2023) | blind_spot | 0 + 2 (same_era_dialogue: Gen Z deep-cante translation) + 3 = **5** | fact |
| 17 | Rosalía — Malamente (2018) | blind_spot | 0 + 2 (methodological_descent: Gen Z mainstream articulation) + 2 = **4** | fact |
| 18 | C. Tangana — Tú Me Dejaste de Querer (2021) | blind_spot | 0 + 1 (genealogical_descent — was hypothesis in map, downgraded to consensus here based on the documented Rosalía bridge) + 1 = **2** | consensus |
| 19 | David Lagos — Romance de la monja (2024) | hit | 3 + 1 (was hypothesis in map; documented Sevillian-cante geography → consensus) + 1 = **5** | consensus |
| 20 | Dorantes & Lebrijano — Agua, Aire y Fuego (2010) | hit | 3 + 2 (direct_influence: family-circuit closure on the same album as the 2010 Nueva versión) + 2 = **7** | fact |

---

## Cuts (5 of 24 map nodes dropped)

The map ships with 24 nodes; 20 rows × (1 anchor row uses an already-counted node) = 19 unique nodes consumed. Five were dropped, all score- or audit-driven:

| Dropped node | Reason |
|---|---|
| `lole-y-manuel_nuevo-dia_nuevo-dia` | Consensus-tier predecessor of Camarón's *Leyenda* (1975 → 1979). The cante-softening point is already carried by Camarón at position 3; including Lole y Manuel separately adds no translation-aesthetic content not already audible there. Lowest score among upward candidates after the family-root (Lebrijano) and methodological-root (Chano) slots are filled. |
| `silvia-perez-cruz_11-de-novembre_no-te-pude-conocer` | (a) The specific track *No te pude conocer* is not on NetEase; a substitute (Granada album, 2039315895) would shift the focus claim away from the documented multi-tradition song-form translation on *11 de novembre*. (b) The Buika → Pérez Cruz edge is hypothesis-tier in the map (agent synthesis only). Dropping helps the hypothesis-ratio cap and removes one null-NetEase row. The female-voice translation lineage is still carried downstream by Buika (pos 14), Carmen Linares (15), Llergo (16). |
| `manuel-carrasco-tubio_pianisimo-romantico_el-lago` | Bridge node — same-era same-texture confirmation only, no load-bearing translation content. The skill mute rule for `translation_aesthetic` would route this to `bridge` / `muted_this_episode: true`; cleaner to drop than to mute, since the spec design's 20-stop arc has no slot for a confirmation bridge. |
| `nathy-peluso_calambre_buenos-aires` | Argentina-born / Spain-based extension is the weakest terminal in the downward axis. The Iberian-Latin-American pipeline is already covered at position 18 by C. Tangana × Niño de Elche × La Húngara, which carries the same 'Iberian-pop with flamenco at centre' point with stronger evidence and a documented Rosalía bridge. |
| `vicente-amigo_ciudad-de-las-ideas_ciudad-de-las-ideas` | Same-era guitar-instrument peer to Dorantes; consensus-tier `same_era_dialogue` edge. The lateral axis is already covered at full design weight by Cigala-Bebo (10), Tomatito-Camilo (11), Esperanza Fernández (12) — three pillars + one supporting peer is sufficient. Carmen Linares had stronger evidence (fact-tier `direct_influence`, red-heart hit) and a structural function in the downward arc that Vicente could not fill. |

The deviation from the design spec's preliminary stop-by-stop sketch (Vicente Amigo had been pencilled at pos 11 / Nathy Peluso at the late-downward bench) is documented here as score- and lineage-driven; the four-axis balance the design called for (R4: 7 upward / 4 lateral / 6 downward / 1 closer + dual anchor) is preserved.

---

## Caps applied

- **Row count:** 20 / 20 per `episode_config.yaml` (override of default 18). Spec §3.3 expansion caps (≤15 upward / ≤12 lateral / ≤20 downward) are not the binding constraint here — episode budget is 20 total stops.
- **Hypothesis-tier ratio:** 0 / 20 non-muted = **0%** (under the 30% cap). Two map-level hypothesis edges (C. Tangana, David Lagos) were downgraded to `consensus` at row level: both rest on documented bridges (Rosalía pipeline; Sevillian-cante geography) that are stronger than the map's pure-hypothesis tag suggested.
- **Audio resolvable rate:** 19 / 20 = **95%** (well above the 60% floor). The single null is the 1998 anchor row at position 13 — *Orobroy* (1998 original) is not licensed standalone on NetEase; the 2010 *Nueva versión* (id 1348066823) is on the platform and carries the opener at position 1.
- **Bridge ratio:** 0 / 20 = **0%** (well under the 10% advisory cap).
- **Muted ratio:** 0 / 20 — no muted nodes after the 5 cuts.
- **Anchor uniqueness:** exactly one `is_base_node: true` (position 13) and exactly one `narrative_weight: anchor` (same row).

---

## Axis distribution

| Axis | Count | Positions |
|---|---|---|
| Anchor opener (2010 version) | 1 | 1 |
| Upward | 7 | 2 (Lebrijano), 3 (Camarón), 4 (Paco), 5 (Pata Negra), 6 (Chano), 7 (Albéniz), 8 (Jarrett) |
| Lateral | 4 | 9 (Buena Vista), 10 (Cigala-Bebo), 11 (Tomatito-Camilo), 12 (Esperanza) |
| Anchor return (1998 original) | 1 | 13 |
| Downward | 6 | 14 (Buika), 15 (Linares), 16 (Llergo), 17 (Rosalía), 18 (Tangana), 19 (Lagos) |
| Family-circuit closer | 1 | 20 (Agua, Aire y Fuego) |

Matches the design spec's R4 balanced shape (7 up / 4 lateral / 6 down + dual anchor + closer).

---

## §8 sourcing self-check outcomes

| Check | Outcome |
|---|---|
| Every fact-tier focus_relevance_note backed by ≥2 independent sources | ✅ — every fact-tier row's underlying edge has ≥2 sources in the map (e.g. Paco/Entre Dos Aguas: 3 sources incl. uvadoc.uva.es academic; Esperanza/Dorantes collaboration: 4 sources; Tomatito-Camilo/Spain: 3 sources). |
| Tier 1–2 source present for each fact-tier claim | ✅ — Wikipedia + academic theses (Trancoso doctoral on lebrija.es, dialnet.unirioja.es articles, uvadoc.uva.es) cover the upward axis; deflamenco specialized press (T2) covers Esperanza Fernández family-circuit; Wikipedia + elflamencovive.com (T2 specialty press) cover the closure pivot. |
| No hypothesis-tier overreach | ✅ — 0 hypothesis rows at the tracklist level. Two map-level hypothesis edges (C. Tangana, David Lagos) were downgraded to `consensus` at row level on the basis of documented bridges; both `focus_relevance_note` strings explicitly flag the consensus-not-fact tier. |
| Forbidden tokens absent from `focus_relevance_note` | ✅ — no `Track N`, no `[`, no `]`, no `第N首` in any focus_relevance_note. |
| Anchor uniqueness | ✅ — exactly one `is_base_node: true` (position 13). The dual-version anchor at positions 1 and 13 share a `node_id` per the nodes-as-singletons rule but only the 1998 row is the canonical anchor; the 2010 row is `narrative_weight: pillar`. |
| Mute rule for `translation_aesthetic` | ✅ — no muted rows; the 5 nodes that would have been pure single-tradition pillars were dropped rather than muted (cleaner under a 20-stop budget). |

---

## Validator output

```
$ python3 tools/validate_tracklist.py dorantes_orobroy_orobroy
OK: dorantes_orobroy_orobroy tracklist green (20 rows)
```

Cross-validation of prior episodes against the patched validator:

```
$ python3 tools/validate_tracklist.py rolling-stones_some-girls_miss-you
OK: rolling-stones_some-girls_miss-you tracklist green (18 rows)

$ python3 tools/validate_tracklist.py guns-n-roses_use-your-illusion-ii_estranged
OK: guns-n-roses_use-your-illusion-ii_estranged tracklist green (18 rows)

$ python3 tools/validate_tracklist.py black-sabbath_black-sabbath_black-sabbath
OK: black-sabbath_black-sabbath_black-sabbath tracklist green (18 rows)
```

Phase 0 closed. Ready to hand off to `connections-author` (Phase 1).

---

## Open questions / follow-ups for the user

1. **Validator extension scope.** The new `episode_config.yaml` mechanism (per-slug `expected_rows`, `allow_duplicate_anchor_node`) is minimal and backward-compatible. If the user prefers a different config surface (e.g. JSON, or per-tracklist-file front-matter), the validator change is small and reversible.
2. **Albéniz row evidence basis.** The Albéniz → Dorantes edge is `consensus` in the map because the RomArchive citation is paraphrase rather than verbatim Dorantes quote. If a verbatim Dorantes interview citing Albéniz/Falla/Granados surfaces, the row's `evidence_basis` can be promoted to `fact` (no other claims need to change).
3. **Silvia Pérez Cruz absence.** The female-voice translation axis is now carried by Buika (pos 14) → Linares (15) → Llergo (16). If the user wants Pérez Cruz back, the cleanest substitution is to drop one of Tangana (18) or Lagos (19) — both have weaker map-tier evidence — and use the `Granada` album track id 2039315895 as a substitute for the *11 de novembre* original.
4. **Anchor 1998 NetEase null.** The 1998 original is genuinely not on NetEase as a standalone licensed track. If platform-link absence on the anchor is a concern for the audio pipeline (per `docs/episode_audio_pipeline.md` YouTube-fallback workflow), the 1998 cut can be sourced via that fallback in Phase 3.
