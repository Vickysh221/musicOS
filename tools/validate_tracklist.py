"""Validate playlists/<slug>.tracklist.json against Phase 0 contract.

Usage: python3 tools/validate_tracklist.py <slug>

Asserts:
  - Exact row count per episode_config.yaml (default 18; per-slug override allowed)
  - Exactly one is_base_node = true
  - Every row.node_id resolves in data/nodes/
  - <=30% of non-muted rows have evidence_basis == 'hypothesis'
  - audio_url resolvable rate >=60% (heuristic: netease_song_id present)
  - focus_relevance_note non-empty on every non-muted row
  - Duplicate node_ids forbidden unless episode_config.yaml sets
    allow_duplicate_anchor_node: true for that slug AND exactly one of the duplicate
    rows carries is_base_node=true (dual-version anchor pattern, e.g. ep4 Orobroy
    1998↔2010).

Exits 0 on green, 1 with a printed diff on any failure.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_EXPECTED_ROWS = 18
HYPOTHESIS_CAP = 0.30
AUDIO_RESOLVE_FLOOR = 0.60
VALID_WEIGHTS = {"anchor", "pillar", "supporting", "bridge"}
BRIDGE_RATIO_WARN = 0.10


def _load_config(slug: str) -> dict:
    """Read episode_config.yaml (lightweight inline parser; no PyYAML dep).

    Supported shape:
        defaults:
          expected_rows: 18
        episodes:
          <slug>:
            expected_rows: 20
            allow_duplicate_anchor_node: true
    """
    cfg_path = ROOT / "episode_config.yaml"
    result = {"expected_rows": DEFAULT_EXPECTED_ROWS, "allow_duplicate_anchor_node": False}
    if not cfg_path.exists():
        return result
    text = cfg_path.read_text()
    # Tiny YAML subset parser: tracks indentation of two anchor blocks.
    section = None  # 'defaults' | 'episodes' | None
    current_slug = None
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        stripped = line.strip()
        if indent == 0 and stripped.endswith(":"):
            section = stripped[:-1]
            current_slug = None
            continue
        if section == "defaults" and indent == 2 and ":" in stripped:
            k, v = [s.strip() for s in stripped.split(":", 1)]
            if k == "expected_rows":
                try:
                    result["expected_rows"] = int(v)
                except ValueError:
                    pass
        elif section == "episodes":
            if indent == 2 and stripped.endswith(":"):
                current_slug = stripped[:-1]
            elif indent == 4 and current_slug == slug and ":" in stripped:
                k, v = [s.strip() for s in stripped.split(":", 1)]
                if k == "expected_rows":
                    try:
                        result["expected_rows"] = int(v)
                    except ValueError:
                        pass
                elif k == "allow_duplicate_anchor_node":
                    result["allow_duplicate_anchor_node"] = v.lower() in ("true", "yes", "1")
    return result


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def main(slug: str) -> None:
    config = _load_config(slug)
    expected_rows = config["expected_rows"]
    allow_dup_anchor = config["allow_duplicate_anchor_node"]

    path = ROOT / "playlists" / f"{slug}.tracklist.json"
    if not path.exists():
        fail(f"missing {path}")
    rows = json.loads(path.read_text())
    if not isinstance(rows, list):
        fail("tracklist.json must be a JSON array")
    if len(rows) != expected_rows:
        fail(f"expected {expected_rows} rows, got {len(rows)}")

    positions = sorted([r["position"] for r in rows])
    if positions != list(range(1, expected_rows + 1)):
        fail(f"positions are not contiguous 1–{expected_rows}: got {positions}")

    bases = [r for r in rows if r.get("is_base_node")]
    if len(bases) != 1:
        fail(f"expected exactly one is_base_node, got {len(bases)}")

    # Duplicate node_id rule
    seen: dict[str, list[int]] = {}
    for r in rows:
        seen.setdefault(r["node_id"], []).append(r["position"])
    duplicates = {nid: ps for nid, ps in seen.items() if len(ps) > 1}
    if duplicates:
        if not allow_dup_anchor:
            fail(
                f"duplicate node_ids forbidden by default: {duplicates}. Set "
                f"allow_duplicate_anchor_node: true in episode_config.yaml to permit "
                f"a dual-version anchor pattern."
            )
        # Allowed only when the duplicates are exactly the anchor node and exactly one
        # of the duplicate rows is the is_base_node.
        anchor_node_id = bases[0]["node_id"]
        for nid, ps in duplicates.items():
            if nid != anchor_node_id:
                fail(
                    f"duplicate node_id={nid!r} at positions {ps} is not the anchor "
                    f"node ({anchor_node_id!r}); only the anchor may appear twice."
                )
            anchor_rows = [r for r in rows if r["node_id"] == nid and r.get("is_base_node")]
            if len(anchor_rows) != 1:
                fail(
                    f"dual-version anchor: exactly one of the duplicate {nid!r} rows "
                    f"must have is_base_node=true; got {len(anchor_rows)}."
                )

    # narrative_weight (spec v0.4 §2.4)
    for r in rows:
        w = r.get("narrative_weight")
        if w not in VALID_WEIGHTS:
            fail(
                f"row position={r.get('position')} narrative_weight={w!r} "
                f"not in {sorted(VALID_WEIGHTS)}"
            )
    anchors = [r for r in rows if r.get("narrative_weight") == "anchor"]
    if len(anchors) != 1:
        fail(f"expected exactly one narrative_weight='anchor', got {len(anchors)}")
    anchor_row = anchors[0]
    if not anchor_row.get("is_base_node"):
        fail(
            f"anchor (position={anchor_row.get('position')}) must also have is_base_node=true"
        )
    bridges = [r for r in rows if r.get("narrative_weight") == "bridge"]
    if len(bridges) / len(rows) > BRIDGE_RATIO_WARN:
        print(
            f"WARNING: bridge ratio {len(bridges)}/{len(rows)} exceeds "
            f"{BRIDGE_RATIO_WARN:.0%} advisory cap",
            file=sys.stderr,
        )

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
