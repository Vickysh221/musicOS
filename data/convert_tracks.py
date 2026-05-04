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
