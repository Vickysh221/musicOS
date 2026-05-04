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
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", "", s.lower())).strip()


def compute_coverage(node: dict, tracks: list) -> dict:
    """
    node must have:
      - node['artist']: str
      - node['works']: list of {"title": str, "type": "track"|"album"|"ep", ...}
    """
    node_artists = {_normalize(node['artist'])} if node.get('artist', '').strip() else set()
    works = node.get('works', [])
    work_titles = {_normalize(w['title']) for w in works if w.get('type') == 'track' and w.get('title', '').strip()}
    work_albums = {_normalize(w['title']) for w in works if w.get('type') in ('album', 'ep') and w.get('title', '').strip()}
    all_work_names = {_normalize(w['title']) for w in works if w.get('title', '').strip()}

    def artist_match(track):
        return any(
            _normalize(a) in node_artists
            for a in track.get('all_artists', [track.get('artist', '')])
            if a
        )

    artist_matches = [t for t in tracks if artist_match(t)]
    work_matches = [
        t for t in artist_matches
        if _normalize(t.get('song', '')) in work_titles
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
