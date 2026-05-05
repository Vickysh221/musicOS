"""
Verify connection-narration coverage for an episode.

v0.4 mode (when episode.json exhibits declare `strong_connection_id` and
`archived_weak_connections`):
  - Each non-anchor, non-bridge track exhibit has at most one
    `strong_connection_id` (or null). The anchor exhibit has
    `strong_connection_id: null` (anchor uses free callback prose).
  - Every `strong_connection_id` resolves to a pair in connections.json,
    one of whose endpoints is the declaring track's position.
  - The other-side artist or song from a strong pair appears in the
    declaring track's `## Track N` section in episode.md.
  - Every pair in connections.json is either (a) some track's
    strong_connection_id OR (b) listed in some track's
    archived_weak_connections[]. No pair is silently dropped.
  - Every entry in archived_weak_connections[] has a closed-enum
    `archive_reason` from the v0.4 set.

v0.3 fallback (when no exhibit declares strong_connection_id): retain
legacy surface-all behavior — every pair's other-side artist/song must
appear in the section at both endpoints.

Run:
    python3 tools/validate_episode_connections.py <slug>
        # resolves playlists/<slug>.connections.json
        #          episodes/<slug>.episode.md
        #          episodes/<slug>.episode.json

    python3 -m tools.validate_episode_connections \
        playlists/<slug>.connections.json \
        episodes/<slug>.episode.md
        # legacy 2-arg form; uses sibling episode.json if present
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

VALID_ARCHIVE_REASONS = {
    "redundant_with_strong",
    "low_focus_relevance",
    "no_concrete_anchor",
    "already_told",
    "off_topic_for_episode",
}


def _track_label_to_artist_song(label: str):
    m = re.match(r'^(.*?)\s*[—\-]\s*(.*?)\s*\(\d{4}\)\s*$', label)
    if not m:
        return label, label
    return m.group(1).strip(), m.group(2).strip()


def _split_episode_by_track(md: str):
    sections = {}
    cur_pos = None
    cur_buf = []
    for line in md.splitlines():
        m = re.match(r'^##\s+Track\s+(\d+)\b', line)
        if m:
            if cur_pos is not None:
                sections[cur_pos] = '\n'.join(cur_buf)
            cur_pos = int(m.group(1))
            cur_buf = [line]
        else:
            cur_buf.append(line)
    if cur_pos is not None:
        sections[cur_pos] = '\n'.join(cur_buf)
    return sections


def _is_v04_episode(episode_json_data) -> bool:
    if not episode_json_data:
        return False
    for ex in episode_json_data.get("exhibits", []):
        if ex.get("kind") != "track":
            continue
        if "strong_connection_id" in ex or "archived_weak_connections" in ex:
            return True
    return False


def _validate_v04(conn, episode_data, sections, position_labels):
    errors = []
    pairs_by_id = {p["id"]: p for p in conn["connection_pairs"]}
    track_exhibits = [ex for ex in episode_data["exhibits"] if ex.get("kind") == "track"]

    referenced_pair_ids: set[str] = set()

    for ex in track_exhibits:
        pos = int(ex["position"])
        weight = ex.get("narrative_weight")
        muted = ex.get("muted_this_episode", False)
        strong_id = ex.get("strong_connection_id")
        archived = ex.get("archived_weak_connections", []) or []

        # Anchor + bridge/muted: strong must be null
        if weight == "anchor" or muted or weight == "bridge":
            if strong_id is not None:
                errors.append(
                    f"position {pos} (weight={weight}, muted={muted}): "
                    f"strong_connection_id must be null, got {strong_id!r}"
                )

        # Strong link must resolve and have this position as an endpoint
        if strong_id is not None:
            pair = pairs_by_id.get(strong_id)
            if pair is None:
                errors.append(
                    f"position {pos}: strong_connection_id {strong_id!r} "
                    f"not in connections.json"
                )
            else:
                if pos not in (pair["from_position"], pair["to_position"]):
                    errors.append(
                        f"position {pos}: strong_connection_id {strong_id} "
                        f"endpoints are {pair['from_position']}↔{pair['to_position']}, "
                        f"position {pos} is not one of them"
                    )
                else:
                    referenced_pair_ids.add(strong_id)
                    other_pos = (
                        pair["to_position"] if pair["from_position"] == pos
                        else pair["from_position"]
                    )
                    other_label = position_labels.get(other_pos, "")
                    artist, song = _track_label_to_artist_song(other_label)
                    section = sections.get(pos, "")
                    if section and artist not in section and song not in section:
                        errors.append(
                            f"position {pos}: strong pair {strong_id} but section "
                            f"does not mention '{artist}' or '{song}'"
                        )

        # Archived list: ids must resolve, reasons must be in enum
        for entry in archived:
            if not isinstance(entry, dict):
                errors.append(
                    f"position {pos}: archived_weak_connections entry must be object, "
                    f"got {type(entry).__name__}"
                )
                continue
            aid = entry.get("connection_id")
            reason = entry.get("archive_reason")
            if aid is None:
                errors.append(f"position {pos}: archived entry missing connection_id")
                continue
            if aid not in pairs_by_id:
                errors.append(
                    f"position {pos}: archived connection_id {aid!r} "
                    f"not in connections.json"
                )
                continue
            pair = pairs_by_id[aid]
            if pos not in (pair["from_position"], pair["to_position"]):
                errors.append(
                    f"position {pos}: archived pair {aid} endpoints "
                    f"{pair['from_position']}↔{pair['to_position']} "
                    f"do not include {pos}"
                )
            if reason not in VALID_ARCHIVE_REASONS:
                errors.append(
                    f"position {pos}: archived pair {aid} has archive_reason "
                    f"{reason!r}, must be one of {sorted(VALID_ARCHIVE_REASONS)}"
                )
            referenced_pair_ids.add(aid)

    # Coverage: every pair is either strong or archived somewhere
    all_pair_ids = set(pairs_by_id)
    orphans = sorted(all_pair_ids - referenced_pair_ids)
    for oid in orphans:
        errors.append(
            f"pair {oid} is neither any track's strong_connection_id "
            f"nor in any archived_weak_connections list"
        )

    return errors


def _validate_v03_legacy(conn, sections, position_labels):
    errors = []
    for pair in conn["connection_pairs"]:
        from_pos = pair["from_position"]
        to_pos = pair["to_position"]
        for cur_pos, other_pos in [(from_pos, to_pos), (to_pos, from_pos)]:
            section = sections.get(cur_pos, "")
            if not section:
                errors.append(f'pair {pair["id"]}: no episode section for position {cur_pos}')
                continue
            other_label = position_labels.get(other_pos, "")
            if not other_label:
                errors.append(f'pair {pair["id"]}: no label for position {other_pos}')
                continue
            artist, song = _track_label_to_artist_song(other_label)
            if artist not in section and song not in section:
                errors.append(
                    f'pair {pair["id"]}: position {cur_pos} section does not '
                    f'mention "{artist}" or "{song}"'
                )
    return errors


def validate(connections_path: Path, episode_md_path: Path, episode_json_path: Path | None = None):
    conn = json.loads(connections_path.read_text(encoding="utf-8"))
    md = episode_md_path.read_text(encoding="utf-8")
    sections = _split_episode_by_track(md)

    position_labels = {int(k): v for k, v in conn.get("position_labels", {}).items()}
    if not position_labels:
        return ["connections.json missing position_labels map"]

    if episode_json_path is None:
        # Try sibling: episodes/<slug>.episode.json next to .md
        candidate = episode_md_path.with_suffix("").with_suffix(".json")
        # episode_md_path = episodes/<slug>.episode.md → stem "<slug>.episode"
        candidate = episode_md_path.parent / (episode_md_path.stem + ".json")
        if candidate.exists():
            episode_json_path = candidate

    episode_data = None
    if episode_json_path and episode_json_path.exists():
        episode_data = json.loads(episode_json_path.read_text(encoding="utf-8"))

    if _is_v04_episode(episode_data):
        return _validate_v04(conn, episode_data, sections, position_labels)
    return _validate_v03_legacy(conn, sections, position_labels)


def main():
    args = sys.argv[1:]
    if len(args) == 1:
        slug = args[0]
        connections_path = ROOT / "playlists" / f"{slug}.connections.json"
        episode_md_path = ROOT / "episodes" / f"{slug}.episode.md"
        episode_json_path = ROOT / "episodes" / f"{slug}.episode.json"
    elif len(args) == 2:
        connections_path = Path(args[0])
        episode_md_path = Path(args[1])
        episode_json_path = None
    else:
        print(
            "usage: python3 tools/validate_episode_connections.py <slug>\n"
            "   or: python3 -m tools.validate_episode_connections "
            "<connections.json> <episode.md>",
            file=sys.stderr,
        )
        sys.exit(2)

    errs = validate(connections_path, episode_md_path, episode_json_path)
    if errs:
        print(f"FAIL ({len(errs)} errors)")
        for e in errs:
            print(" -", e)
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
