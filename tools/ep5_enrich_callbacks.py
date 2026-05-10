"""
EP5 callback-arc enrichment. Adds entries to per-track
`archived_weak_connections` to lift the per-track callback density to the
target tier distribution defined in
`docs/superpowers/specs/2026-05-10-ep5-callback-density-design.md`.

Idempotent: re-running on already-enriched data is a no-op.
"""
import json
import re
from pathlib import Path

EP5_PATH = Path("musicos-exhibition/data/exhibition-ep5.json")

# (focal_pos, from_pos, edge_type)
NEW_ARCS = [
    (3, 1, "same_era_dialogue"),
    (4, 2, "same_era_dialogue"),
    (5, 4, "same_era_dialogue"),
    (6, 2, "direct_influence"),
    (7, 3, "direct_influence"),
    (8, 4, "direct_influence"),
    (9, 7, "direct_influence"),
    (10, 7, "direct_influence"),
    (13, 8, "same_era_dialogue"),
    (16, 7, "genealogical_descent"),
    (16, 8, "genealogical_descent"),
    (17, 7, "genealogical_descent"),
]


def conn_id(from_pos: int, to_pos: int, edge_type: str) -> str:
    return f"conn_{from_pos:03d}_to_{to_pos:03d}_{edge_type}"


def parse(cid: str | None) -> tuple[int, int] | None:
    if not cid:
        return None
    m = re.match(r"^conn_(\d+)_to_(\d+)", cid)
    return (int(m.group(1)), int(m.group(2))) if m else None


def callback_targets(tracks: list[dict], focal_pos: int) -> set[int]:
    """Mirror of findCallbackTargets() in callback-phrase.ts."""
    ids: set[str] = set()
    for t in tracks:
        sc = t.get("strong_connection_id")
        if sc:
            ids.add(sc)
        if t.get("position") == focal_pos:
            for a in t.get("archived_weak_connections") or []:
                cid = a.get("connection_id")
                if cid:
                    ids.add(cid)
    out: set[int] = set()
    for cid in ids:
        p = parse(cid)
        if not p:
            continue
        f, to = p
        if to != focal_pos or f == focal_pos or f <= 0:
            continue
        out.add(f)
    return out


def report(tracks: list[dict], label: str) -> None:
    counts = []
    for t in tracks:
        n = len(callback_targets(tracks, t["position"]))
        counts.append(n)
    n = len(counts)
    tier0 = sum(1 for x in counts if x == 0)
    tier1 = sum(1 for x in counts if x == 1)
    tier2 = sum(1 for x in counts if x == 2)
    tier3 = sum(1 for x in counts if x >= 3)
    print(
        f"[{label}] 0:{tier0} 1:{tier1} 2:{tier2} 3+:{tier3} "
        f"(of {n}) → ≥1:{(n-tier0)/n:.0%} ≥2:{(tier2+tier3)/n:.0%} ≥3:{tier3/n:.0%}"
    )
    return counts


def main() -> None:
    raw = json.loads(EP5_PATH.read_text())
    tracks = [x for x in raw if x.get("kind") == "track"]

    print("BEFORE:")
    report(tracks, "before")

    # Index by position for fast in-place mutation.
    by_pos = {t["position"]: t for t in tracks}

    added = 0
    for focal_pos, from_pos, edge_type in NEW_ARCS:
        focal = by_pos[focal_pos]
        archived = focal.setdefault("archived_weak_connections", [])
        new_id = conn_id(from_pos, focal_pos, edge_type)
        existing_ids = {a.get("connection_id") for a in archived}
        # Also skip if any other already-extant connection_id (regardless of
        # type suffix) covers the same (from→to) pair.
        existing_pairs = {parse(cid) for cid in existing_ids if cid}
        existing_pairs |= {parse(t.get("strong_connection_id")) for t in tracks}
        if (from_pos, focal_pos) in existing_pairs:
            print(f"  skip pos {focal_pos} ← {from_pos}: pair already wired")
            continue
        archived.append({
            "connection_id": new_id,
            "archive_reason": "redundant_with_strong",
        })
        added += 1
        print(f"  + pos {focal_pos} ← {from_pos} ({edge_type})")

    print(f"\nAdded {added} new arcs.")
    print("AFTER:")
    counts = report(tracks, "after")
    print()
    for t in tracks:
        pos = t["position"]
        n = len(callback_targets(tracks, pos))
        print(f"  pos {pos:>2}: {n}")

    EP5_PATH.write_text(json.dumps(raw, indent=2, ensure_ascii=False) + "\n")
    print(f"\nWrote {EP5_PATH}")


if __name__ == "__main__":
    main()
