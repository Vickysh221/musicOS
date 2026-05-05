# MusicOS Vault — Agent SOP

This vault implements Sonic Cartography: a system for mapping music genealogy from a chosen
anchor outward, overlaying the user's listening data, and producing annotated playlists.

**Full spec:** `Foundations/sonic_cartography_spec_v0.4.md` — read it before starting any task.

**Sourcing principles:** `docs/superpowers/plans/sonic_cartography_sourcing_principles.md` — read it before any generative task (map expansion, playlist annotation, episode narration, fact-check pass). Core rule: every `fact`-tier claim requires ≥2 independent sources, at least 1 Tier 1–2. Run the §8 self-check before every delivery.

---

## Core architectural rule: nodes are permanent singletons

A song by an artist is **one permanent node** in this vault. It does not belong to any single
anchor expansion. Different versions of the same song share the same node unless a version has
distinct historical significance as a separate cultural artifact (e.g. a re-recording that
launched a separate movement).

**Before creating a node:**
```python
from tools.node_registry import node_exists, put_node
if node_exists(node_id):
    put_node(node, enrich=True)   # add new narrative data, never duplicate
else:
    put_node(node)                # create new
```

Never embed full node objects in a map file. Maps store `node_ids` (references).

---

## Data files

- `data/user_tracks.json` — 1690 red-heart tracks, normalized from NetEase Cloud export
- `data/nodes/<node_id>.json` — global node registry (one file per node)
- `tools/coverage.py` — coverage computation utility (spec §4.2)
- `tools/node_registry.py` — node CRUD: `node_exists`, `get_node`, `put_node`, `update_all_coverage`, `resolve_map`
- `maps/<anchor_slug>.map.json` — anchor + `node_ids[]` + inline `edges[]`
- `playlists/<anchor_slug>.playlist.md` — annotated playlist for each expansion (text/visual mode)
- `episodes/<anchor_slug>.episode.json` — audio episode script + stitching manifest (audio mode, spec §7B)
- `episodes/<anchor_slug>.episode.md` — human-readable episode for review before TTS synthesis

---

## Map JSON structure

```json
{
  "map_id": "<anchor_slug>",
  "anchor_node_id": "<anchor_slug>",
  "spec_version": "0.2",
  "generated_at": "<ISO timestamp>",
  "expansion_notes": "",
  "node_ids": ["node-id-1", "node-id-2", ...],
  "edges": [
    {
      "id": "edge_...",
      "type": "direct_influence|same_era_dialogue|genealogical_descent|translation|hybridization|inversion|methodological_descent",
      "source_node_id": "...",
      "target_node_id": "...",
      "evidence": "...",
      "epistemic_layer": "fact|consensus|hypothesis",
      "sources": [...]
    }
  ]
}
```

---

## Anchor expansion workflow

1. **Load the spec.** Read `Foundations/sonic_cartography_spec_v0.4.md` fully.
2. **Load user tracks.** `from tools.coverage import load_tracks; tracks = load_tracks('data/user_tracks.json')`
3. **Confirm anchor.** Propose 2–4 candidates per spec §3.5 if user hasn't specified. Never auto-select.
4. **Expand map.** Three axes (upward/lateral/downward), depth caps 15/12/20, stopping rules §3.3.
5. **For each node:** check registry first → `put_node(enrich=True)` if exists, `put_node()` if new.
6. **Compute coverage.** `from tools.node_registry import update_coverage_for_node`. Run after each node is saved.
7. **Research.** ≤25 web searches, ≤15 web fetches. Cite epistemic tier per §4.3. Apply double-reference rule per sourcing principles (see above): fact-tier claims need ≥2 independent sources; downgrade or remove if unverifiable. Extra caution on chart positions, personnel, equipment, direct quotations.
8. **Narrative slots.** Priority: production_facts → member_dynamics → cultural_venue → instrumentation_details → release_circumstances.
9. **Self-check.** Run spec §9.3 checklist. Use `resolve_map()` to dereference node_ids for inspection.
10. **Write output.** `maps/<slug>.map.json` + `playlists/<slug>.playlist.md` + (if audio mode) `episodes/<slug>.episode.json` + `episodes/<slug>.episode.md`.

---

## User aesthetic mechanisms (spec §6)

- **M1 translation_aesthetic (基因穿外套):** two lineages audibly separable — prefer these nodes
- **M2 ancestor_visit_only:** one or two ancestor tracks confirms lineage — don't recommend deep dives
- **M3 member_period_attention:** populate `member_dynamics` when a specific band member drove the pivot
- **M4 frequency_hollowing (留白偏好):** sparse, deliberately incomplete frequency spectrum

---

## Slug convention

`<artist-slug>_<album-slug>_<primary-track-slug>` — lowercase, spaces → hyphens, drop special chars.
Example: `rolling-stones_some-girls_miss-you`

---

## Album cover assets

封面文件位于 `musicos-exhibition/public/covers/`，命名规则 `<NN>_<artist-slug>_<track-slug>.jpg`（NN 与节目曲序对应）。

**当某条曲目封面缺失时，允许联网搜索并下载补齐**：
1. 优先源：官方厂牌页、Wikipedia/Wikimedia、MusicBrainz Cover Art Archive、Discogs、Apple Music / Spotify 公开页、艺人官网。避免来源不明的二改图、粉丝拼贴、低分辨率缩略图。
2. 选图标准：原版专辑/单曲封面，正方形，长边 ≥ 1000px；若仅有竖版/横版海报，需注明来源后再用作降级方案。
3. 落盘：保存为 JPG（必要时由 PNG/WebP 转码），放入 `musicos-exhibition/public/covers/`，沿用现有命名规则；同步检查 `data/exhibition.json` 中对应条目的 `cover` 字段是否指向新文件。
4. 记录来源：在提交说明或 PR 描述中给出图片来源 URL，便于版权核查。无法找到合规来源时停下并报告，不要用占位图静默替换。

## Hard stops (spec §9.1)

Stop and report if: axis hits hard cap AND user hasn't extended budget; >30% hypothesis edges;
<60% playlist tracks have any platform link.

---

## Reference expansion

`maps/rolling-stones_some-girls_miss-you.map.json` + `playlists/rolling-stones_some-girls_miss-you.playlist.md`
are the calibration reference (spec §10). When in doubt about structure or density, check those files.
Miss You is the first expansion in a growing vault — future sessions expand from any anchor.
