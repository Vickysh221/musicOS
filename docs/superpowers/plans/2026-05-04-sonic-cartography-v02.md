# Sonic Cartography v0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Sonic Cartography execution environment in this vault (data layer + node registry + coverage engine + tooling) and produce the reference Miss You anchor expansion as the first live deliverable.

**Architecture:** Three-layer system — (1) Python tooling: normalize user track data, a permanent global node registry, and a coverage engine; (2) a CLAUDE.md SOP that teaches future Claude Code sessions how to run any anchor expansion; (3) the Miss You anchor expansion executed as the calibration reference. Nodes are global permanent entities (one file per node in `data/nodes/`); maps are subgraph views that store node ID references, not node copies. Miss You is the first expansion in what will grow into a multi-anchor vault.

**Tech Stack:** Python 3 (stdlib only — json, re, pathlib), JSON schema per spec §2, Markdown, Claude Code web research tools (WebSearch + WebFetch), Obsidian vault layout.

---

## File Structure

```
MusicOS/
├── data/
│   ├── convert_tracks.py          # one-time MD → JSON converter
│   ├── user_tracks.json           # normalized track data (1690 tracks)
│   └── nodes/                     # GLOBAL NODE REGISTRY — one .json per node, permanent
│       └── <node_id>.json
├── tools/
│   ├── coverage.py                # coverage computation per spec §4.2
│   └── node_registry.py           # node CRUD: exists / get / put / enrich / update_coverage
├── maps/
│   └── rolling-stones_some-girls_miss-you.map.json   # anchor + node_ids[] + edges[]
├── playlists/
│   └── rolling-stones_some-girls_miss-you.playlist.md
├── Foundations/
│   ├── sonic_cartography_spec_v0.2.md
│   └── 网易云红心歌单_全量.md
└── CLAUDE.md
```

**Node registry rule**: A song by an artist is one permanent node. Different versions of the same song share the same node unless a version has distinct historical significance as a separate cultural artifact. Before creating any node, call `node_exists(node_id)`. If it exists, call `put_node(node, enrich=True)` to add new data — never create a duplicate.

**Map schema**: Maps store `node_ids` (list of strings) and inline `edges` (list of edge objects). Full node data lives in `data/nodes/` — never embedded in the map.

---

## Task 1: Convert listening data to normalized JSON

**Files:**
- Create: `data/convert_tracks.py`
- Create: `data/user_tracks.json` (output)

- [ ] **Step 1: Write `data/convert_tracks.py`**

```python
import json
import re
from pathlib import Path

def parse_md_tracks(md_path):
    tracks = []
    with open(md_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line.startswith('|'):
                continue
            cells = [c.strip() for c in line.split('|')[1:-1]]
            if len(cells) < 8:
                continue
            idx_str = cells[0]
            if not idx_str.isdigit():
                continue
            idx, song, artist, album, duration, red_heart_date, inferred_genre, link_cell = cells[:8]
            url_match = re.search(r'\(\s*(https?://[^\s)]+)\s*\)', link_cell)
            platform_link = url_match.group(1) if url_match else None
            raw_artist = artist
            all_artists = [a.strip() for a in re.split(r'\s*/\s*', artist)]
            genre = inferred_genre if inferred_genre not in ('—', '?', '') else None
            tracks.append({
                "track_id": int(idx),
                "song": song,
                "artist": all_artists[0],
                "raw_artist": raw_artist,
                "all_artists": all_artists,
                "album": album,
                "duration": duration,
                "red_heart_date": red_heart_date,
                "inferred_genre": genre,
                "platform_link": platform_link
            })
    return tracks

if __name__ == '__main__':
    md_path = Path(__file__).parent.parent / 'Foundations' / '网易云红心歌单_全量.md'
    out_path = Path(__file__).parent / 'user_tracks.json'
    tracks = parse_md_tracks(md_path)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(tracks, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(tracks)} tracks to {out_path}")
```

- [ ] **Step 2: Run the converter**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 data/convert_tracks.py
```

Expected: `Wrote 1690 tracks to data/user_tracks.json`

- [ ] **Step 3: Spot-check**

```bash
python3 -c "
import json
tracks = json.load(open('data/user_tracks.json'))
print(f'Total: {len(tracks)}')
print('First:', json.dumps(tracks[0], ensure_ascii=False, indent=2))
multi = next((t for t in tracks if len(t['all_artists']) > 1), None)
print('Multi-artist example:', multi)
"
```

Expected: 1690 tracks, `all_artists` array present, multi-artist entry shows correct split.

---

## Task 2: Coverage engine

**Files:**
- Create: `tools/coverage.py`

- [ ] **Step 1: Write `tools/coverage.py`**

```python
"""
Coverage computation per sonic_cartography_spec_v0.2.md §4.2.

Usage:
    from tools.coverage import load_tracks, compute_coverage
    tracks = load_tracks('data/user_tracks.json')
    result = compute_coverage(node, tracks)
    # result: {"status": "activated"|"touched_unactivated"|"untouched",
    #           "evidence": [...], "confidence": "high"|"medium"}
"""
import json
import re
from pathlib import Path


def load_tracks(json_path: str) -> list:
    with open(json_path, encoding='utf-8') as f:
        return json.load(f)


def _normalize(s: str) -> str:
    return re.sub(r"[^\w\s]", "", s.lower()).strip()


def compute_coverage(node: dict, tracks: list) -> dict:
    """
    node must have:
      - node['artist']: str
      - node['works']: list of {"title": str, "type": "track"|"album"|"ep", ...}
    """
    node_artists = {_normalize(node['artist'])}
    works = node.get('works', [])
    work_titles = {_normalize(w['title']) for w in works if w.get('type') == 'track'}
    work_albums = {_normalize(w['title']) for w in works if w.get('type') in ('album', 'ep')}
    all_work_names = {_normalize(w['title']) for w in works}

    def artist_match(track):
        return any(
            _normalize(a) in node_artists
            for a in track.get('all_artists', [track['artist']])
        )

    artist_matches = [t for t in tracks if artist_match(t)]
    work_matches = [
        t for t in artist_matches
        if _normalize(t['song']) in work_titles
        or _normalize(t.get('album', '')) in work_albums
        or _normalize(t.get('album', '')) in all_work_names
    ]

    if work_matches:
        return {
            "status": "activated",
            "evidence": [f"红心 {t['red_heart_date']}: {t['song']}" for t in work_matches],
            "confidence": "high"
        }
    elif artist_matches:
        return {
            "status": "touched_unactivated",
            "evidence": [
                f"红心 {t['red_heart_date']}: {t['song']} (同艺人不同时期)"
                for t in artist_matches[:5]
            ],
            "confidence": "medium"
        }
    else:
        return {"status": "untouched", "evidence": [], "confidence": "high"}


if __name__ == '__main__':
    tracks = load_tracks(str(Path(__file__).parent.parent / 'data' / 'user_tracks.json'))
    test_node = {
        "artist": "The Rolling Stones",
        "works": [
            {"title": "Miss You", "type": "track"},
            {"title": "Some Girls", "type": "album"}
        ]
    }
    print("Miss You:", json.dumps(compute_coverage(test_node, tracks), ensure_ascii=False, indent=2))
    parliament_node = {
        "artist": "Parliament",
        "works": [{"title": "Mothership Connection", "type": "album"}]
    }
    print("Parliament (Mothership Connection):", json.dumps(compute_coverage(parliament_node, tracks), ensure_ascii=False, indent=2))
```

- [ ] **Step 2: Run smoke test**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 tools/coverage.py
```

Expected: Parliament shows `touched_unactivated` (spec §6.1 M2: user has 1 Parliament track since 2021).

---

## Task 3: Node registry

**Files:**
- Create: `tools/node_registry.py`
- Create: `data/nodes/` (directory, created by the tool)

- [ ] **Step 1: Write `tools/node_registry.py`**

```python
"""
Global node registry for Sonic Cartography vault.

Rule: a song by an artist is ONE permanent node. Before creating a node,
call node_exists(). If it exists, use put_node(node, enrich=True) to add
data — never create a duplicate.

Different versions of the same song share the same node UNLESS a version
has distinct historical significance as a separate cultural artifact.
"""
import json
from pathlib import Path

NODES_DIR = Path(__file__).parent.parent / 'data' / 'nodes'


def node_exists(node_id: str) -> bool:
    return (NODES_DIR / f"{node_id}.json").exists()


def get_node(node_id: str) -> dict:
    path = NODES_DIR / f"{node_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Node not found in registry: {node_id}")
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def put_node(node: dict, enrich: bool = False) -> bool:
    """
    Save node to registry.
    Returns True if node was newly created, False if it already existed (enrich case).
    Raises ValueError if node exists and enrich=False.
    When enrich=True: merges narrative_slots (fills empty slots only) and sources (deduplicates).
    """
    node_id = node['id']
    path = NODES_DIR / f"{node_id}.json"
    is_new = not path.exists()

    if not is_new and not enrich:
        raise ValueError(
            f"Node '{node_id}' already exists in registry. "
            "Use put_node(node, enrich=True) to add data without duplication."
        )

    if not is_new and enrich:
        existing = get_node(node_id)
        existing_slots = existing.setdefault('narrative_slots', {})
        for slot, value in node.get('narrative_slots', {}).items():
            if value and not existing_slots.get(slot):
                existing_slots[slot] = value
        existing['sources'] = list(dict.fromkeys(
            existing.get('sources', []) + node.get('sources', [])
        ))
        node = existing

    NODES_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(node, f, ensure_ascii=False, indent=2)
    return is_new


def list_all_node_ids() -> list:
    if not NODES_DIR.exists():
        return []
    return [p.stem for p in sorted(NODES_DIR.glob('*.json'))]


def update_coverage_for_node(node_id: str, tracks: list) -> dict:
    """Recompute and persist coverage for a single node."""
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from coverage import compute_coverage
    node = get_node(node_id)
    node['user_coverage'] = compute_coverage(node, tracks)
    with open(NODES_DIR / f"{node_id}.json", 'w', encoding='utf-8') as f:
        json.dump(node, f, ensure_ascii=False, indent=2)
    return node['user_coverage']


def update_all_coverage(tracks: list):
    """Recompute coverage for every node in the registry."""
    node_ids = list_all_node_ids()
    for node_id in node_ids:
        update_coverage_for_node(node_id, tracks)
    print(f"Updated coverage for {len(node_ids)} nodes.")


def resolve_map(map_data: dict) -> dict:
    """
    Returns a copy of map_data with node_ids dereferenced into full node objects.
    Useful for playlist generation and self-checks.
    """
    resolved = dict(map_data)
    resolved['nodes'] = [get_node(nid) for nid in map_data.get('node_ids', [])]
    return resolved


if __name__ == '__main__':
    print("Registry nodes:", list_all_node_ids())
```

- [ ] **Step 2: Smoke test — round-trip a node**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 -c "
import sys; sys.path.insert(0, '.')
from tools.node_registry import node_exists, put_node, get_node, list_all_node_ids
test_node = {
    'id': '_smoke_test',
    'artist': 'Test',
    'period': {'label': 'test', 'year_start': 2000, 'year_end': 2001},
    'works': [],
    'position_in_era': {'primary_genre_lineage': '', 'geographic_locus': '', 'historical_role': 'smoke test'},
    'narrative_slots': {'member_dynamics': None, 'cultural_venue': None, 'production_facts': None, 'instrumentation_details': None, 'release_circumstances': None},
    'user_coverage': {'status': 'untouched', 'evidence': [], 'confidence': 'high'},
    'epistemic_layer': 'hypothesis',
    'sources': []
}
assert not node_exists('_smoke_test'), 'should not exist yet'
is_new = put_node(test_node)
assert is_new, 'should be new'
assert node_exists('_smoke_test'), 'should exist now'
fetched = get_node('_smoke_test')
assert fetched['id'] == '_smoke_test'

# enrich test
enriched = dict(test_node)
enriched['narrative_slots'] = {'production_facts': 'test enrichment'}
enriched['sources'] = ['http://example.com']
is_new2 = put_node(enriched, enrich=True)
assert not is_new2, 'should not be new'
fetched2 = get_node('_smoke_test')
assert fetched2['narrative_slots']['production_facts'] == 'test enrichment'
assert 'http://example.com' in fetched2['sources']

# duplicate guard test
try:
    put_node(test_node, enrich=False)
    assert False, 'should have raised'
except ValueError as e:
    print('Duplicate guard OK:', e)

# cleanup
import os; os.remove('data/nodes/_smoke_test.json')
print('Smoke test PASSED')
"
```

Expected: `Duplicate guard OK: Node '_smoke_test' already exists...` then `Smoke test PASSED`.

---

## Task 4: CLAUDE.md — agent SOP for future sessions

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# MusicOS Vault — Agent SOP

This vault implements Sonic Cartography: a system for mapping music genealogy from a chosen
anchor outward, overlaying the user's listening data, and producing annotated playlists.

**Full spec:** `Foundations/sonic_cartography_spec_v0.2.md` — read it before starting any task.

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
- `playlists/<anchor_slug>.playlist.md` — annotated playlist for each expansion

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
      "type": "direct_influence|same_era_dialogue|...",
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

1. **Load the spec.** Read `Foundations/sonic_cartography_spec_v0.2.md` fully.
2. **Load user tracks.** `from tools.coverage import load_tracks; tracks = load_tracks('data/user_tracks.json')`
3. **Confirm anchor.** Propose 2–4 candidates per spec §3.5 if user hasn't specified. Never auto-select.
4. **Expand map.** Three axes (upward/lateral/downward), depth caps 15/12/20, stopping rules §3.3.
5. **For each node:** check registry first → `put_node(enrich=True)` if exists, `put_node()` if new.
6. **Compute coverage.** `from tools.node_registry import update_coverage_for_node`. Run after each node is saved.
7. **Research.** ≤25 web searches, ≤15 web fetches. Cite epistemic tier per §4.3.
8. **Narrative slots.** Priority: production_facts → member_dynamics → cultural_venue → instrumentation_details → release_circumstances.
9. **Self-check.** Run spec §9.3 checklist. Use `resolve_map()` to dereference node_ids for inspection.
10. **Write output.** `maps/<slug>.map.json` (node_ids + edges) + `playlists/<slug>.playlist.md`.

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

## Hard stops (spec §9.1)

Stop and report if: axis hits hard cap AND user hasn't extended budget; >30% hypothesis edges;
<60% playlist tracks have any platform link.

---

## Miss You reference expansion

`maps/rolling-stones_some-girls_miss-you.map.json` + `playlists/rolling-stones_some-girls_miss-you.playlist.md`
are the calibration reference (spec §10). When in doubt about structure or density, check those files.
```

- [ ] **Step 2: Verify file is at vault root**

```bash
ls /Users/vickyshou/Documents/MusicOS/CLAUDE.md
```

Expected: file exists.

---

## Task 5: Miss You map — upward axis (ancestors)

**Files:**
- Create: `maps/rolling-stones_some-girls_miss-you.map.json` (skeleton)
- Create: `data/nodes/<node_id>.json` for each ancestor node (via `put_node`)

- [ ] **Step 1: Write map skeleton**

```python
import json
from datetime import datetime

map_data = {
    "map_id": "rolling-stones_some-girls_miss-you",
    "anchor_node_id": "rolling-stones_some-girls_miss-you",
    "spec_version": "0.2",
    "generated_at": datetime.utcnow().isoformat() + "Z",
    "expansion_notes": "",
    "node_ids": [],
    "edges": []
}
with open('maps/rolling-stones_some-girls_miss-you.map.json', 'w', encoding='utf-8') as f:
    json.dump(map_data, f, ensure_ascii=False, indent=2)
print("Map skeleton written.")
```

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -c "<above code>"`

- [ ] **Step 2: Create anchor node from spec §10.1 and save to registry**

The anchor node is pre-written in the spec — copy it verbatim. No research needed; it is already `fact`-tier.

```python
import json, sys; sys.path.insert(0, '.')
from tools.node_registry import put_node, node_exists

anchor = {
    "id": "rolling-stones_some-girls_miss-you",
    "artist": "The Rolling Stones",
    "period": {"label": "Some Girls era / 1976–1981 disco-funk pivot", "year_start": 1977, "year_end": 1978},
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
        "instrumentation_details": "Harmonica: Sugar Blue (James Whiting), 22-year-old American street musician discovered by Sandy Whitelaw in the Paris Metro. Saxophone: Mel Collins, brought in because Bobby Keys' relationship with Jagger was strained.",
        "release_circumstances": "Released 19 May 1978 as Some Girls' first single. Hit US #1 on 5 August, ending Andy Gibb's 'Shadow Dancing' seven-week reign. Stones' eighth and final US number-one. Reached UK #3."
    },
    "user_coverage": {"status": "untouched", "evidence": [], "confidence": "high"},
    "epistemic_layer": "fact",
    "sources": [
        "https://en.wikipedia.org/wiki/Miss_You_(Rolling_Stones_song)",
        "https://en.wikipedia.org/wiki/Some_Girls",
        "https://www.salon.com/2017/08/19/rolling-stones-33-13-excerpt/",
        "https://ultimateclassicrock.com/the-rolling-stones-miss-you/"
    ]
}

if not node_exists(anchor['id']):
    put_node(anchor)
    print("Anchor node created.")
else:
    put_node(anchor, enrich=True)
    print("Anchor node enriched (already existed).")
```

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -c "<above code>"`

- [ ] **Step 3: Research and create the 6 upward ancestor nodes**

For each node below, use WebSearch + WebFetch to populate all fields, then call `put_node()`. Save the node_id to the map's `node_ids` list after creation.

Nodes to build:
1. `chic_risque_good-times` — Chic / Risqué / Good Times (1979)
2. `james-brown_funky-drummer-era_super-bad` — James Brown / Super Bad (1970)
3. `sly-family-stone_riot_family-affair` — Sly & the Family Stone / There's a Riot Goin' On (1971)
4. `parliament_mothership-connection_give-up-the-funk` — Parliament / Mothership Connection (1975–76)
5. `barry-white_cant-get-enough_never-never` — Barry White / Can't Get Enough (1974)
6. `bee-gees_saturday-night-fever_stayin-alive` — Bee Gees / Saturday Night Fever (1977)

For each, produce a full node JSON. Minimum required per node:
- `position_in_era.historical_role` — one sentence, load-bearing
- At least 1 populated `narrative_slots` field
- `epistemic_layer` declared
- At least 1 URL in `sources`

After all 6 are created, update the map file:

```python
import json, sys; sys.path.insert(0, '.')

upward_node_ids = [
    "james-brown_funky-drummer-era_super-bad",
    "sly-family-stone_riot_family-affair",
    "parliament_mothership-connection_give-up-the-funk",
    "barry-white_cant-get-enough_never-never",
    "chic_risque_good-times",
    "bee-gees_saturday-night-fever_stayin-alive",
    "rolling-stones_some-girls_miss-you"
]

map_data = json.load(open('maps/rolling-stones_some-girls_miss-you.map.json'))
for nid in upward_node_ids:
    if nid not in map_data['node_ids']:
        map_data['node_ids'].append(nid)
with open('maps/rolling-stones_some-girls_miss-you.map.json', 'w', encoding='utf-8') as f:
    json.dump(map_data, f, ensure_ascii=False, indent=2)
print("Map node_ids updated:", map_data['node_ids'])
```

- [ ] **Step 4: Compute coverage for all nodes so far**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 -c "
import sys; sys.path.insert(0, '.')
from tools.coverage import load_tracks
from tools.node_registry import update_all_coverage
tracks = load_tracks('data/user_tracks.json')
update_all_coverage(tracks)
"
```

Expected: prints count of nodes updated.

---

## Task 6: Miss You map — lateral axis (siblings)

**Files:**
- Modify: `maps/rolling-stones_some-girls_miss-you.map.json`
- Create: `data/nodes/<node_id>.json` for each lateral node

- [ ] **Step 1: Research and create lateral nodes**

Same-era (~1976–1981), adjacent or overlapping lineages. Target 5–8 nodes. For each: check `node_exists()` first.

Suggested nodes:
1. `bowie_young-americans_fame` — David Bowie / Young Americans / Fame (1975) — rock × Philly soul translation
2. `queen_the-game_another-one-bites-the-dust` — Queen / The Game (1980)
3. `blondie_parallel-lines_heart-of-glass` — Blondie / Parallel Lines (1978)
4. `rod-stewart_blondes-have-more-fun_do-ya-think-im-sexy` — Rod Stewart (1978)
5. `talking-heads_remain-in-light_once-in-a-lifetime` — Talking Heads / Remain in Light (1980)
6. `devo_q-are-we-not-men_jocko-homo` — Devo / Q: Are We Not Men? (1978) — contrastive sibling (inversion)

After creation, add all new IDs to `map_data['node_ids']` using the same pattern as Task 5 Step 3.

- [ ] **Step 2: Re-run coverage overlay**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 -c "
import sys; sys.path.insert(0, '.')
from tools.coverage import load_tracks
from tools.node_registry import update_all_coverage, list_all_node_ids, get_node
tracks = load_tracks('data/user_tracks.json')
update_all_coverage(tracks)
nodes = [get_node(nid) for nid in list_all_node_ids()]
counts = {s: sum(1 for n in nodes if n['user_coverage']['status'] == s) for s in ['activated','touched_unactivated','untouched']}
print('Coverage counts:', counts)
"
```

---

## Task 7: Miss You map — downward axis (descendants)

**Files:**
- Modify: `maps/rolling-stones_some-girls_miss-you.map.json`
- Create: `data/nodes/<node_id>.json` for each descendant node

- [ ] **Step 1: Research and create descendant nodes**

Inheritors of the disco-rock / rock×funk translation lineage, 1981 to present. Target 8–12 nodes.

Suggested nodes:
1. `prince_purple-rain_when-doves-cry` — Prince / Purple Rain (1984)
2. `rhcp_blood-sugar_give-it-away` — Red Hot Chili Peppers / Blood Sugar Sex Magik (1991)
3. `jamiroquai_return-of-space-cowboy_space-cowboy` — Jamiroquai (1994)
4. `lcd-soundsystem_sound-of-silver_all-my-friends` — LCD Soundsystem (2007)
5. `daft-punk_random-access-memories_get-lucky` — Daft Punk / Random Access Memories (2013)
6. `khruangbin_con-todo-el-mundo_maria-tambien` — Khruangbin (2019)
7. `tame-impala_currents_the-less-i-know` — Tame Impala / Currents (2015)
8. `mkgee_two-star_you-dreamed-of-me` — Mk.gee / Two Star & the Dream Police (2024)

For each: check `node_exists()` first (some may already be in registry from other expansions). Flag nodes where `activated` evidence count ≥ 3 as secondary anchor candidates by adding `"secondary_anchor_candidate": true` to the node file.

After creation, add all new IDs to `map_data['node_ids']`.

- [ ] **Step 2: Re-run coverage overlay and flag secondary anchor candidates**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 -c "
import sys, json; sys.path.insert(0, '.')
from tools.coverage import load_tracks
from tools.node_registry import update_all_coverage, list_all_node_ids, get_node, put_node
tracks = load_tracks('data/user_tracks.json')
update_all_coverage(tracks)
candidates = []
for nid in list_all_node_ids():
    node = get_node(nid)
    if len(node['user_coverage']['evidence']) >= 3:
        node['secondary_anchor_candidate'] = True
        put_node(node, enrich=True)
        candidates.append(nid)
nodes = [get_node(nid) for nid in list_all_node_ids()]
counts = {s: sum(1 for n in nodes if n['user_coverage']['status'] == s) for s in ['activated','touched_unactivated','untouched']}
print(f'Total nodes: {len(nodes)} | {counts}')
print('Secondary anchor candidates:', candidates)
"
```

---

## Task 8: Miss You map — edges

**Files:**
- Modify: `maps/rolling-stones_some-girls_miss-you.map.json`

Edges are inline in the map (not in the global registry). Each edge must have: `id`, `type`, `source_node_id`, `target_node_id`, `evidence`, `epistemic_layer`, `sources`.

- [ ] **Step 1: Write upward-axis edges**

Add to `map_data['edges']`. Include these minimum edges (evidence from research in Tasks 5–7):

```python
import json

map_data = json.load(open('maps/rolling-stones_some-girls_miss-you.map.json'))

upward_edges = [
    {
        "id": "edge_chic_to_miss-you",
        "type": "direct_influence",
        "source_node_id": "chic_risque_good-times",
        "target_node_id": "rolling-stones_some-girls_miss-you",
        "evidence": "Chronologically Good Times (1979) postdates Miss You (1978), but Chic's earlier work and Bernard Edwards' bass approach were already on the Studio 54 floor when Miss You was being shaped. Relationship is shared idiom, not literal sampling.",
        "epistemic_layer": "consensus",
        "sources": ["https://www.salon.com/2017/08/19/rolling-stones-33-13-excerpt/"]
    },
    {
        "id": "edge_james-brown_to_chic",
        "type": "genealogical_descent",
        "source_node_id": "james-brown_funky-drummer-era_super-bad",
        "target_node_id": "chic_risque_good-times",
        "evidence": "<fill from research>",
        "epistemic_layer": "fact",
        "sources": ["<fill from research>"]
    },
    {
        "id": "edge_sly_to_james-brown",
        "type": "same_era_dialogue",
        "source_node_id": "sly-family-stone_riot_family-affair",
        "target_node_id": "james-brown_funky-drummer-era_super-bad",
        "evidence": "<fill from research>",
        "epistemic_layer": "consensus",
        "sources": ["<fill from research>"]
    },
    {
        "id": "edge_bee-gees_to_miss-you",
        "type": "same_era_dialogue",
        "source_node_id": "bee-gees_saturday-night-fever_stayin-alive",
        "target_node_id": "rolling-stones_some-girls_miss-you",
        "evidence": "<fill from research>",
        "epistemic_layer": "consensus",
        "sources": ["<fill from research>"]
    }
]

for e in upward_edges:
    if not any(x['id'] == e['id'] for x in map_data['edges']):
        map_data['edges'].append(e)

with open('maps/rolling-stones_some-girls_miss-you.map.json', 'w', encoding='utf-8') as f:
    json.dump(map_data, f, ensure_ascii=False, indent=2)
print(f"Edges now: {len(map_data['edges'])}")
```

Fill `<fill from research>` fields from Task 5 research results.

- [ ] **Step 2: Write lateral and downward edges**

Add remaining edges following the same pattern. Include the two pre-written sample edges from spec §10.2 verbatim:
- `edge_miss-you_to_aobtd` (`same_era_dialogue`, `hypothesis`) — from spec §10.2
- `edge_remain-in-light_methodology` (`methodological_descent`, `hypothesis`) — from spec §10.2

- [ ] **Step 3: Epistemic audit**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 -c "
import json
map_data = json.load(open('maps/rolling-stones_some-girls_miss-you.map.json'))
edges = map_data['edges']
dist = {}
for e in edges:
    dist[e['epistemic_layer']] = dist.get(e['epistemic_layer'], 0) + 1
total = len(edges)
hyp_pct = dist.get('hypothesis', 0) / total * 100 if total else 0
print(f'Edges: {total} | {dist} | Hypothesis: {hyp_pct:.1f}%')
if hyp_pct >= 30:
    print('HARD STOP: hypothesis% >= 30 — reduce speculative edges before delivery')
else:
    print('Epistemic audit: PASS')
"
```

Expected: hypothesis% < 30.

---

## Task 9: Playlist generation

**Files:**
- Create: `playlists/rolling-stones_some-girls_miss-you.playlist.md`

- [ ] **Step 1: Select 12–20 tracks from the map**

```python
import sys, json; sys.path.insert(0, '.')
from tools.node_registry import resolve_map

map_data = json.load(open('maps/rolling-stones_some-girls_miss-you.map.json'))
resolved = resolve_map(map_data)
nodes = resolved['nodes']

# Sort chronologically by works[0].year
nodes_sorted = sorted(nodes, key=lambda n: min(w['year'] for w in n['works']))

# Print candidate tracks with coverage status for manual selection
for n in nodes_sorted:
    primary_work = n['works'][0]
    status = n['user_coverage']['status']
    m1_match = 'translation' in n['position_in_era'].get('primary_genre_lineage', '').lower()
    print(f"[{status}] {n['artist']} — {primary_work['title']} ({primary_work['year']}) {'[M1]' if m1_match else ''}")
```

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -c "<above code>"`

Selection criteria (apply in order):
1. Include anchor (`rolling-stones_some-girls_miss-you`) — mandatory
2. At least 4 `activated` or `touched_unactivated` nodes — user can verify immediately
3. At least 4 `untouched` nodes — discovery recommendations
4. Prefer M1 (`translation_aesthetic`) nodes — two lineages audibly separable
5. Apply M4 preference where documented in `position_in_era`
6. Do not propose deep ancestor dives for M2-flagged artists (Parliament, Stevie Wonder, James Brown, Bee Gees)

- [ ] **Step 2: Write `playlists/rolling-stones_some-girls_miss-you.playlist.md`**

Structure per spec §7.2. Chronological order (oldest ancestor first). Per-track annotation: 80–150 words total across three fields.

```markdown
# The Rock × Funk Translation: From Harlem to Studio 54 and Beyond
*Anchored at The Rolling Stones · Miss You · 1978*

**This playlist is**: a genealogy of the moment rock musicians began translating funk and disco's
genetic material without fully becoming those genres — two layers audibly present, neither
dissolved into the other.
**Total tracks**: [N] · **Estimated time**: [~XX min]

---

## Track 1: [artist] — [song] ([year])
*From [album]*

[structural_position — 1–2 sentences: where in the map this sits]

[narrative_hook — 1–3 sentences: most compelling story-fact from narrative_slots]

[user_relevance — 1 sentence citing mechanism M1/M2/M3/M4]

[Listen on: [NetEase](url) · [YouTube](url)]

---
```

Populate every track annotation from the `narrative_slots` in the node file. The `narrative_hook` field should draw directly from whichever slot is most compelling for that node.

- [ ] **Step 3: Platform link check**

```bash
python3 -c "
import re
content = open('playlists/rolling-stones_some-girls_miss-you.playlist.md').read()
tracks = re.findall(r'## Track \d+:', content)
no_link = re.findall(r'not located on standard platforms', content)
pct = (len(tracks) - len(no_link)) / len(tracks) * 100 if tracks else 0
print(f'Tracks: {len(tracks)} | No-link: {len(no_link)} | Platform coverage: {pct:.0f}%')
print('PASS' if pct >= 60 else 'FAIL — must reach 60%')
"
```

---

## Task 10: Self-check and finalize

**Files:**
- Modify: `maps/rolling-stones_some-girls_miss-you.map.json` (fix any gaps)
- Modify: `playlists/rolling-stones_some-girls_miss-you.playlist.md` (fix any gaps)

- [ ] **Step 1: Run spec §9.3 self-check**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 -c "
import json, re, sys; sys.path.insert(0, '.')
from tools.node_registry import resolve_map

map_data = json.load(open('maps/rolling-stones_some-girls_miss-you.map.json'))
resolved = resolve_map(map_data)
nodes = resolved['nodes']
edges = map_data['edges']

# Check 1: every node has historical_role
missing_role = [n['id'] for n in nodes if not n.get('position_in_era', {}).get('historical_role', '').strip()]
print(f'1. Missing historical_role: {missing_role}')

# Check 2: every edge has epistemic_layer and >=1 source
bad_edges = [e['id'] for e in edges if not e.get('epistemic_layer') or not e.get('sources')]
print(f'2. Bad edges: {bad_edges}')

# Check 3: coverage overlay present on all nodes
missing_cov = [n['id'] for n in nodes if 'user_coverage' not in n]
print(f'3. Missing coverage: {missing_cov}')

# Check 4: platform link coverage
content = open('playlists/rolling-stones_some-girls_miss-you.playlist.md').read()
t_count = len(re.findall(r'## Track \d+:', content))
no_link = len(re.findall(r'not located on standard platforms', content))
pct = (t_count - no_link) / t_count * 100 if t_count else 0
print(f'4. Platform coverage: {pct:.0f}% ({t_count-no_link}/{t_count}) — ', 'PASS' if pct >= 60 else 'FAIL')

# Check 5: lineage_path declared
has_lineage = 'This playlist is' in content
print(f'5. Lineage path: {\"PASS\" if has_lineage else \"FAIL\"}')
"
```

Expected: all lists empty, platform ≥60%, lineage PASS.

- [ ] **Step 2: Write expansion_notes to map**

```python
import json, sys; sys.path.insert(0, '.')
from tools.node_registry import resolve_map, list_all_node_ids, get_node

map_data = json.load(open('maps/rolling-stones_some-girls_miss-you.map.json'))
resolved = resolve_map(map_data)
nodes = resolved['nodes']
edges = map_data['edges']
cov = {s: sum(1 for n in nodes if n['user_coverage']['status'] == s) for s in ['activated','touched_unactivated','untouched']}
edge_dist = {}
for e in edges:
    edge_dist[e['epistemic_layer']] = edge_dist.get(e['epistemic_layer'], 0) + 1
candidates = [n['id'] for n in nodes if n.get('secondary_anchor_candidate')]
map_data['expansion_notes'] = (
    f"Total nodes: {len(nodes)}. "
    f"Coverage: {cov['activated']} activated, {cov['touched_unactivated']} touched-unactivated, {cov['untouched']} untouched. "
    f"Edges: {len(edges)} ({edge_dist}). "
    f"Secondary anchor candidates: {candidates}."
)
with open('maps/rolling-stones_some-girls_miss-you.map.json', 'w', encoding='utf-8') as f:
    json.dump(map_data, f, ensure_ascii=False, indent=2)
print("Final:", map_data['expansion_notes'])
```

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -c "<above code>"`

- [ ] **Step 3: Verify final output**

```bash
ls -lh /Users/vickyshou/Documents/MusicOS/maps/rolling-stones_some-girls_miss-you.map.json
ls -lh /Users/vickyshou/Documents/MusicOS/playlists/rolling-stones_some-girls_miss-you.playlist.md
ls /Users/vickyshou/Documents/MusicOS/data/nodes/ | wc -l
```

Expected: both output files exist, map.json > 5KB (node_ids + edges), node count ≥ 15.

---

## Spec Coverage Checklist

| Spec section | Task |
|---|---|
| §2.1 Node schema | Tasks 5–7 (every node built to schema, saved to registry) |
| §2.2 Edge schema | Task 8 |
| §3.1–3.3 Anchor expansion axes | Tasks 5, 6, 7 |
| §3.4 Coverage overlay | Tasks 5 step 4, 6 step 2, 7 step 2 |
| §4.1 User track data | Task 1 |
| §4.2 Coverage status rules | Task 2 |
| §4.3–4.4 Web research tiers + budget | Tasks 5–7 (epistemic layer on every node/edge) |
| §5 Narrative slots | Tasks 5–7 (populated during research) |
| §6 Aesthetic mechanisms | Task 9 step 1 (selection), annotation user_relevance |
| §7 Playlist output spec | Task 9 |
| §8 Epistemic annotation | Task 8 step 3, Task 10 step 1 |
| §9 Termination + self-check | Task 10 |
| §10 Miss You reference | Tasks 5–10 |
| Global node registry (arch rule) | Task 3 + enforced in Tasks 5–7 |

---

*Plan version: 1.1 · Spec version: 0.2 · Generated: 2026-05-04*
