"""
Aggregate every `user_overrides[]` entry across all
`playlists/*.connections.json` files into
`Foundations/user_calibration_corpus.md`.

Run:
    python3 -m tools.build_calibration_digest
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLAYLISTS = ROOT / 'playlists'
OUT = ROOT / 'Foundations' / 'user_calibration_corpus.md'

HEADER = """# User Calibration Corpus

This file is the accumulated digest of every `user_overrides[]` entry across all
`playlists/*.connections.json` files. It is consumed by generative agents during
future map expansions as a record of how this user's ear has corrected the
system's previous narration choices.

This file is **machine-generated** — do not edit by hand. Run:

    python3 -m tools.build_calibration_digest

to regenerate.

---

## Entries

"""


def collect():
    entries = []
    for f in sorted(PLAYLISTS.glob('*.connections.json')):
        data = json.loads(f.read_text(encoding='utf-8'))
        slug = data.get('playlist_slug', f.stem)
        for pair in data.get('connection_pairs', []):
            for ov in pair.get('user_overrides', []):
                entries.append({
                    'playlist_slug': slug,
                    'pair_id': pair.get('id'),
                    'created_at': ov.get('created_at', ''),
                    'type': ov.get('type'),
                    'applies_to': ov.get('applies_to'),
                    'user_note': ov.get('user_note', '').strip(),
                })
    entries.sort(key=lambda e: e['created_at'])
    return entries


def render(entries):
    if not entries:
        return HEADER + '_(none yet)_\n'
    lines = [HEADER]
    for e in entries:
        lines.append(f"### {e['created_at']} · {e['playlist_slug']} · {e['pair_id']}")
        lines.append(f"- type: `{e['type']}` · applies_to: `{e['applies_to']}`")
        lines.append(f"- note: {e['user_note']}")
        lines.append('')
    return '\n'.join(lines)


def main():
    entries = collect()
    OUT.write_text(render(entries), encoding='utf-8')
    print(f'wrote {OUT} ({len(entries)} entries)')


if __name__ == '__main__':
    main()
