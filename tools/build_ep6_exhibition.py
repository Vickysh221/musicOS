"""
Build musicos-exhibition/data/exhibition-ep6.json from ep6 source files.

Sources:
  playlists/ramsey-lewis-trio_the-in-crowd_the-in-crowd.tracklist.json
  playlists/ramsey-lewis-trio_the-in-crowd_the-in-crowd.connections.json
  episodes/ramsey-lewis-trio_the-in-crowd_the-in-crowd.episode.json

Run from vault root:
  python3 -m tools.build_ep6_exhibition
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLUG = "ramsey-lewis-trio_the-in-crowd_the-in-crowd"
AUDIO_FUSION_DIR = ROOT / "musicos-exhibition/public/audio_fusion/ep6"
COVERS_DIR = ROOT / "musicos-exhibition/public/covers"
OUT = ROOT / "musicos-exhibition/data/exhibition-ep6.json"

ANCHOR_YEAR = 1965
ANCHOR_POSITION = 6
CLOSING_POSITION = 19
TRACK_RANGE = range(1, 19)  # 18 tracks


def load_json(path: Path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


def fusion_stem_for_position(pos: int) -> str | None:
    prefix = f"{pos:02d}_"
    if not AUDIO_FUSION_DIR.exists():
        return None
    for entry in AUDIO_FUSION_DIR.iterdir():
        if entry.name.startswith(prefix) and entry.name.endswith(".mp3"):
            return entry.stem
    return None


def cover_exists(stem: str) -> bool:
    return (COVERS_DIR / f"{stem}.jpg").exists()


def exhibit_type(pos: int, year: int, is_base: bool) -> str:
    if is_base:
        return "anchor"
    if year < ANCHOR_YEAR:
        return "ancestor"
    if pos > ANCHOR_POSITION:
        return "descendant"
    return "lateral"


def index_connections(pairs: list[dict], labels: dict[str, str]) -> tuple[
    dict[int, list], dict[int, list]
]:
    inbound: dict[int, list] = {}
    outbound: dict[int, list] = {}

    for p in pairs:
        fp = p["from_position"]
        tp = p["to_position"]
        modes = p["narration_modes"]

        fwd_mode = modes.get("foreshadow_named_at_from") or modes["foreshadow_anonymous_at_from"]
        back_mode = modes["callback_named_at_to"]

        out_ref = {
            "id": p["id"],
            "other_position": tp,
            "other_label": labels.get(str(tp), ""),
            "kind": p["kind"],
            "evidence_basis": p["evidence_basis"],
            "narration_zh": fwd_mode["voice_zh"],
            "narration_en": fwd_mode["voice_en"],
        }
        in_ref = {
            "id": p["id"],
            "other_position": fp,
            "other_label": labels.get(str(fp), ""),
            "kind": p["kind"],
            "evidence_basis": p["evidence_basis"],
            "narration_zh": back_mode["voice_zh"],
            "narration_en": back_mode["voice_en"],
        }

        outbound.setdefault(fp, []).append(out_ref)
        inbound.setdefault(tp, []).append(in_ref)

    return inbound, outbound


def main() -> None:
    tracklist = load_json(ROOT / f"playlists/{SLUG}.tracklist.json")
    conn_file = load_json(ROOT / f"playlists/{SLUG}.connections.json")
    ep_json = load_json(ROOT / f"episodes/{SLUG}.episode.json")

    ep_by_pos: dict[int, dict] = {ex["position"]: ex for ex in ep_json["exhibits"]}

    labels = conn_file.get("position_labels", {})
    inbound, outbound = index_connections(conn_file["connection_pairs"], labels)

    exhibits = []

    # Position 0 — opening
    opening = ep_by_pos[0]
    stem0 = fusion_stem_for_position(0)
    exhibits.append({
        "kind": "narration",
        "position": 0,
        "exhibit_type": "opening",
        "transcript_zh": opening.get("transcript_zh"),
        "transcript_en": opening.get("transcript_en"),
        "transcript_zh_status": opening.get("transcript_zh_status", "missing"),
        "transcript_en_status": opening.get("transcript_en_status", "missing"),
        "narrator_persona_zh": None,
        "narrator_persona_en": None,
        "fusion_audio_url": f"/audio_fusion/ep6/{stem0}.mp3" if stem0 else None,
    })

    # Positions 1..18 — tracks
    tl_by_pos = {row["position"]: row for row in tracklist}
    for pos in TRACK_RANGE:
        row = tl_by_pos[pos]
        ex = ep_by_pos[pos]

        stem = fusion_stem_for_position(pos)
        audio_url = f"/audio/ep6/{stem}.mp3" if stem else None
        fusion_url = f"/audio_fusion/ep6/{stem}.mp3" if stem else None
        cover_url = f"/covers/{stem}.jpg" if stem and cover_exists(stem) else None

        etype = exhibit_type(pos, row["year"], row.get("is_base_node", False))

        exhibits.append({
            "kind": "track",
            "position": pos,
            "node_id": row["node_id"],
            "year": row["year"],
            "artist": row["artist"],
            "song": row["song"],
            "album": ex.get("album", ""),
            "exhibit_type": etype,
            "is_base_node": row.get("is_base_node", False),
            "mechanism_tags": [],
            "netease_song_id": str(row["netease_song_id"]) if row.get("netease_song_id") else None,
            "audio_url": audio_url,
            "fusion_audio_url": fusion_url,
            "album_cover_url": cover_url,
            "duration_seconds": None,
            "unavailable": False,
            "transcript_zh": ex.get("transcript_zh"),
            "transcript_en": ex.get("transcript_en"),
            "transcript_zh_status": ex.get("transcript_zh_status", "missing"),
            "transcript_en_status": ex.get("transcript_en_status", "missing"),
            "narrator_persona_zh": None,
            "narrator_persona_en": None,
            "genre": ex.get("genre"),
            "episode_focus": ex.get("episode_focus", "translation_aesthetic"),
            "red_heart_tier": ex.get("red_heart_tier", "blind_spot"),
            "red_heart_matched_seeds": ex.get("red_heart_matched_seeds", []),
            "muted_this_episode": row.get("muted_this_episode", False),
            "bridge_narration_zh": ex.get("bridge_narration_zh"),
            "bridge_narration_en": ex.get("bridge_narration_en"),
            "narrative_weight": ex.get("narrative_weight", row.get("narrative_weight")),
            "strong_connection_id": ex.get("strong_connection_id"),
            "archived_weak_connections": ex.get("archived_weak_connections", []),
            "connections_in": inbound.get(pos, []),
            "connections_out": outbound.get(pos, []),
            "connections_lateral": [],
        })

    # Position 19 — closing
    closing = ep_by_pos[CLOSING_POSITION]
    stem_close = fusion_stem_for_position(CLOSING_POSITION)
    exhibits.append({
        "kind": "narration",
        "position": CLOSING_POSITION,
        "exhibit_type": "thematic_closure",
        "transcript_zh": closing.get("transcript_zh"),
        "transcript_en": closing.get("transcript_en"),
        "transcript_zh_status": closing.get("transcript_zh_status", "missing"),
        "transcript_en_status": closing.get("transcript_en_status", "missing"),
        "narrator_persona_zh": None,
        "narrator_persona_en": None,
        "fusion_audio_url": f"/audio_fusion/ep6/{stem_close}.mp3" if stem_close else None,
    })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(exhibits, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(exhibits)} exhibits to {OUT}")

    track_count = sum(1 for e in exhibits if e["kind"] == "track")
    with_fusion = sum(1 for e in exhibits if e.get("fusion_audio_url"))
    print(f"  tracks: {track_count}, with fusion audio: {with_fusion}")


if __name__ == "__main__":
    main()
