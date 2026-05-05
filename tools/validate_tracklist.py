"""Validate playlists/<slug>.tracklist.json against Phase 0 contract.

Usage: python3 tools/validate_tracklist.py <slug>

Asserts:
  - Exactly 18 rows (configurable later via episode_config.yaml)
  - Exactly one is_base_node = true
  - Every row.node_id resolves in data/nodes/
  - <=30% of non-muted rows have evidence_basis == 'hypothesis'
  - audio_url resolvable rate >=60% (heuristic: netease_song_id present)
  - focus_relevance_note non-empty on every non-muted row

Exits 0 on green, 1 with a printed diff on any failure.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPECTED_ROWS = 18
HYPOTHESIS_CAP = 0.30
AUDIO_RESOLVE_FLOOR = 0.60


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def main(slug: str) -> None:
    path = ROOT / "playlists" / f"{slug}.tracklist.json"
    if not path.exists():
        fail(f"missing {path}")
    rows = json.loads(path.read_text())
    if not isinstance(rows, list):
        fail("tracklist.json must be a JSON array")
    if len(rows) != EXPECTED_ROWS:
        fail(f"expected {EXPECTED_ROWS} rows, got {len(rows)}")

    positions = sorted([r["position"] for r in rows])
    if positions != list(range(1, EXPECTED_ROWS + 1)):
        fail(f"positions are not contiguous 1–{EXPECTED_ROWS}: got {positions}")

    bases = [r for r in rows if r.get("is_base_node")]
    if len(bases) != 1:
        fail(f"expected exactly one is_base_node, got {len(bases)}")

    nodes_dir = ROOT / "data" / "nodes"
    for r in rows:
        nid = r.get("node_id")
        if not nid or not (nodes_dir / f"{nid}.json").exists():
            fail(f"row position={r.get('position')} node_id={nid!r} not found in registry")
        if not r.get("muted_this_episode") and not r.get("focus_relevance_note"):
            fail(f"row position={r.get('position')} missing focus_relevance_note")

    map_path = ROOT / "maps" / f"{slug}.map.json"
    if map_path.exists():
        map_data = json.loads(map_path.read_text())
        map_node_ids = set(map_data.get("node_ids", []))
        for r in rows:
            nid = r.get("node_id")
            if nid and nid not in map_node_ids:
                fail(f"row position={r.get('position')} node_id={nid!r} not found in map node_ids")
    else:
        print(f"WARNING: map file {map_path} not found — skipping map cross-reference check", file=sys.stderr)

    non_muted = [r for r in rows if not r.get("muted_this_episode")]
    hyps = [r for r in non_muted if r.get("evidence_basis") == "hypothesis"]
    if non_muted and len(hyps) / len(non_muted) > HYPOTHESIS_CAP:
        fail(f"hypothesis-tier ratio {len(hyps)}/{len(non_muted)} exceeds {HYPOTHESIS_CAP:.0%}")

    resolvable = [r for r in rows if r.get("netease_song_id")]
    if len(resolvable) / len(rows) < AUDIO_RESOLVE_FLOOR:
        fail(
            f"audio resolvable rate {len(resolvable)}/{len(rows)} below {AUDIO_RESOLVE_FLOOR:.0%}"
        )

    print(f"OK: {slug} tracklist green ({len(rows)} rows)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python3 tools/validate_tracklist.py <slug>", file=sys.stderr)
        sys.exit(2)
    main(sys.argv[1])
