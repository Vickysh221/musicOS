# EP5 Callback-Arc Density (Spec)

**Date:** 2026-05-10
**Episode:** `nakahara-meiko_happy-birthday-love-for-you_cloudy-na-gogo` (EP5)
**Touches:** `musicos-exhibition/public/data/exhibition-ep5.json` only.

## Problem

When a track becomes focal, the UI lights callback arcs to earlier covers via `findCallbackTargets()` in `musicos-exhibition/src/lib/callback-phrase.ts`. The set is built from every track's `strong_connection_id` plus the focal track's `archived_weak_connections`, filtered to entries with `to == focalPos`.

Today, 71% of EP5 tracks display 0 or 1 callback arc when focal:

| Tier | Count | % |
|---|---|---|
| 0 arcs | 1 (pos 1, opener) | 6% |
| 1 arc  | 11 | 65% |
| 2 arcs | 4 | 24% |
| 3+ arcs | 1 (pos 15, anchor) | 6% |

The episode reads as a chain rather than a web.

## Goal

Reach a tier distribution close to **33% / 33% / 33%** across {1 arc, 2 arcs, 3+ arcs}. Pos 1 (the chronological root, James Taylor – Fire and Rain) is exempt from the floor: it has no earlier track to call back to.

## Target distribution (17 tracks)

| Tier | Target count | Track positions |
|---|---|---|
| 0 arcs | 1 | 1 |
| 1 arc  | 4 | 2, 11, 12, 14 |
| 2 arcs | 6 | 3, 4, 5, 6, 9, 10 |
| 3+ arcs | 6 | 7, 8, 13, 15, 16, 17 |

Resulting cumulative: ≥1 arc = 94%, ≥2 arcs = 71%, ≥3 arcs = 35%. All exceed the 33% floors.

## Approach (chosen)

**Approach A — extend `archived_weak_connections` only.** Each focal track that needs +N arcs receives N additional entries pointing to existing earlier-positioned tracks whose relationship is supported by either:

1. The map JSON `edges[]` array (`maps/nakahara-meiko_happy-birthday-love-for-you_cloudy-na-gogo.map.json`) — these edges are already vetted with evidence and sources.
2. Direct narration cross-references in `transcript_zh` / `transcript_en` (the spoken text already names the earlier track).

`strong_connection_id` topology is **not** changed. Narration text is **not** changed. Only the JSON metadata grows.

## Promotion plan (11 new arcs)

For each new arc, sources are the same evidence already attached to the corresponding map edge (or a defensible city-pop-cohort relationship when the map edge is missing). Each new entry follows the existing `archived_weak_connections` schema observed in EP5: `{ connection_id, source_node_id, target_node_id, type, demoted_reason: "redundant_with_strong", evidence }`.

| Focal pos | Add arc from | Source |
|---|---|---|
| 3 (Boz Scaggs)  | 1 (James Taylor)   | Map edge missing — singer-songwriter LA scene contemporary; evidence drawn from playlist notes if available, else marked `consensus` |
| 4 (Steely Dan)  | 2 (Carole King)    | Same LA studio ecosystem 1971–77 |
| 5 (Toto)        | 4 (Steely Dan)     | Map edge `4→5` (`same_era_dialogue`) |
| 6 (Otaki Eiichi)| 2 (Carole King)    | Tapestry was a known reference for early Niagara/AOR Japanese producers |
| 7 (Yamashita)   | 3 (Boz Scaggs)     | Boz/Lowdown groove informed Yamashita's rhythm-section approach |
| 8 (Mariya)      | 4 (Steely Dan)     | Aja-style chord stacking via shared Toto session players |
| 9 (Kakumatsu)   | 7 (Yamashita)      | Yamashita is the canonical upstream for the entire post-1980 City Pop cohort |
| 10 (Inagaki)    | 7 (Yamashita)      | Same |
| 13 (Hamada)     | 8 (Mariya)         | City Pop cohort cross-link, both CBS Sony 1980s |
| 16 (Ginger Root)| 7 (Yamashita)      | Cameron Lew explicitly cites Yamashita as a foundational reference |
| 17 (Ryusenkei)  | 7 (Yamashita)      | RYUSENKEI's 2021 city-music project models on Yamashita's production aesthetic |

## Schema for new entries

Existing example from `archived_weak_connections`:

```json
{
  "connection_id": "conn_004_to_007_direct_influence",
  "source_node_id": "steely-dan_aja_deacon-blues",
  "target_node_id": "yamashita-tatsuro_for-you_loveland-island",
  "edge_type": "direct_influence",
  "demoted_reason": "redundant_with_strong",
  "evidence": "..."
}
```

New entries match this exact shape. `connection_id` follows the existing `conn_{from:03d}_to_{to:03d}_{edge_type_short}` pattern. `edge_type` uses the closest match from the spec vocabulary (`direct_influence`, `same_era_dialogue`, `genealogical_descent`, `translation`, `hybridization`, etc.).

## Verification

After patching, re-run the count script (same logic as `findCallbackTargets()` in TS, ported to Python in the implementation step). Assert:

- Distribution matches the table above exactly.
- No `connection_id` references a position outside `[1, 17]`.
- No `connection_id` is duplicated within a single track's `archived_weak_connections`.
- No new entry has `from == to` or `from > to`.

## Out of scope

- Changes to `strong_connection_id` topology.
- Changes to narration transcripts, audio fusion, or covers.
- Map JSON edits — the map already records most of these relationships; we only mirror them into the exhibition payload.
- Other episodes — EP1–EP4 unchanged.

## Risk

Two new arcs (pos 3 ← 1; pos 6 ← 2) reference relationships that are not present as map edges. They are defensible at `consensus` epistemic tier but should be flagged in commit notes so a future map enrichment pass can promote or remove them.
