"""
Match a node {artist, song, album} against the user's red-heart export
(`Foundations/网易云红心歌单_全量.md`) into three tiers:

  hit         — same artist + same song
  adjacent    — same artist (different song) OR same album
  blind_spot  — no artist match anywhere

Usage (programmatic):
    from tools.red_heart_match import match
    result = match({'artist': 'Chic', 'song': 'Good Times', 'album': 'Risque'})
    # → {'tier': 'hit'|'adjacent'|'blind_spot', 'matched_seeds': [...]}
"""
import re
from pathlib import Path
from functools import lru_cache

DEFAULT_RED_HEART_PATH = (
    Path(__file__).resolve().parent.parent / 'Foundations' / '网易云红心歌单_全量.md'
)


def _normalize(s: str) -> str:
    if s is None:
        return ''
    s = s.lower()
    s = re.sub(r'\([^)]*\)', '', s)
    s = re.sub(r'\[[^\]]*\]', '', s)
    s = re.sub(r'[^\w\s]', '', s, flags=re.UNICODE)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


@lru_cache(maxsize=1)
def _load_rows(path_str: str) -> tuple:
    rows: list[dict] = []
    path = Path(path_str)
    with path.open(encoding='utf-8') as f:
        for raw in f:
            line = raw.strip()
            if not line.startswith('|') or line.startswith('|---') or line.startswith('| #'):
                continue
            cells = [c.strip() for c in line.strip('|').split('|')]
            if len(cells) < 4:
                continue
            try:
                int(cells[0])
            except ValueError:
                continue
            rows.append({
                'song': cells[1],
                'artist': cells[2],
                'album': cells[3],
                'song_norm': _normalize(cells[1]),
                'artist_norm': _normalize(cells[2]),
                'album_norm': _normalize(cells[3]),
            })
    return tuple(rows)


def match(node: dict, red_heart_path=None) -> dict:
    path = Path(red_heart_path) if red_heart_path else DEFAULT_RED_HEART_PATH
    rows = _load_rows(str(path))

    artist_n = _normalize(node.get('artist', ''))
    song_n   = _normalize(node.get('song', ''))
    album_n  = _normalize(node.get('album', ''))

    if not artist_n:
        return {'tier': 'blind_spot', 'matched_seeds': []}

    same_artist = [r for r in rows if r['artist_norm'] == artist_n]
    if not same_artist:
        return {'tier': 'blind_spot', 'matched_seeds': []}

    for r in same_artist:
        if song_n and r['song_norm'] == song_n:
            return {
                'tier': 'hit',
                'matched_seeds': [{'type': 'song', 'value': f"{r['artist']} - {r['song']}"}],
            }

    seeds = []
    for r in same_artist:
        if album_n and r['album_norm'] == album_n:
            seeds.append({'type': 'album', 'value': f"{r['artist']} - {r['album']} ({r['song']})"})
    if not seeds:
        for r in same_artist[:3]:
            seeds.append({'type': 'artist', 'value': f"{r['artist']} - {r['song']}"})
    return {'tier': 'adjacent', 'matched_seeds': seeds}


if __name__ == '__main__':
    cases = [
        {'artist': 'Parliament', 'song': 'P-Funk (Wants To Get Funked Up)', 'album': 'Funked Up: The Very Best Of Parliament'},
        {'artist': 'Parliament', 'song': 'Give Up the Funk', 'album': 'Mothership Connection'},
        {'artist': 'Khruangbin', 'song': 'María También', 'album': 'Con Todo El Mundo'},
        {'artist': 'NobodySuchArtistExists', 'song': 'X', 'album': 'Y'},
    ]
    for c in cases:
        r = match(c)
        print(c['artist'], '·', c['song'], '→', r['tier'])
        for s in r['matched_seeds']:
            print('   ', s)
    assert match({'artist': 'NobodySuchArtistExists', 'song': 'X'})['tier'] == 'blind_spot', 'fake artist must blind_spot'
    assert match({'artist': 'Parliament', 'song': 'P-Funk (Wants To Get Funked Up)'})['tier'] == 'hit', 'Parliament P-Funk must hit'
    print('smoke ok')
