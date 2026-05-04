"""
Verify that every `connection_pair` in a playlist's connections.json is
referenced (by the other-side track's `artist + song` substring) in the
corresponding episode markdown.

This catches the "narrator forgot to mention this pair" failure mode.

Run:
    python3 -m tools.validate_episode_connections \
        playlists/rolling-stones_some-girls_miss-you.connections.json \
        episodes/rolling-stones_some-girls_miss-you.episode.md
"""
import json
import re
import sys
from pathlib import Path


def _track_label_to_artist_song(label: str):
    # "James Brown — Cold Sweat (1967)" → ("James Brown", "Cold Sweat")
    m = re.match(r'^(.*?)\s*[—\-]\s*(.*?)\s*\(\d{4}\)\s*$', label)
    if not m:
        return label, label
    return m.group(1).strip(), m.group(2).strip()


def _split_episode_by_track(md: str):
    # Track sections begin with headers like:
    #   ## Track 9 · Chic — Good Times
    # OR (legacy)
    #   ## Track 9: Chic — Good Times
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


def validate(connections_path: Path, episode_md_path: Path):
    conn = json.loads(connections_path.read_text(encoding='utf-8'))
    md = episode_md_path.read_text(encoding='utf-8')
    sections = _split_episode_by_track(md)

    position_labels = {
        int(k): v for k, v in conn.get('position_labels', {}).items()
    }
    if not position_labels:
        return ['connections.json missing position_labels map']

    errors = []
    for pair in conn['connection_pairs']:
        from_pos = pair['from_position']
        to_pos = pair['to_position']

        for cur_pos, other_pos in [(from_pos, to_pos), (to_pos, from_pos)]:
            section = sections.get(cur_pos, '')
            if not section:
                errors.append(f'pair {pair["id"]}: no episode section for position {cur_pos}')
                continue
            other_label = position_labels.get(other_pos, '')
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


def main():
    if len(sys.argv) != 3:
        print('usage: python3 -m tools.validate_episode_connections '
              '<connections.json> <episode.md>')
        sys.exit(2)
    errs = validate(Path(sys.argv[1]), Path(sys.argv[2]))
    if errs:
        print(f'FAIL ({len(errs)} errors)')
        for e in errs:
            print(' -', e)
        sys.exit(1)
    print('OK')


if __name__ == '__main__':
    main()
