# Bassline DNA TTS Narrative — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Miss You · Episode 1 · Bassline DNA narrative pipeline — a per-playlist `connections.json` layer that drives TTS-spoken in-network references, red-heart resonance tagging, and a user override calibration loop.

**Architecture:** Two-layer separation: `maps/*.map.json` stays the immutable lineage layer; a new `playlists/*.connections.json` holds episode-scoped, TTS-renderable connection pairs. The exhibition build script joins this layer into `exhibition.json`. New Python tools handle red-heart matching and override-corpus aggregation. Episode and playlist markdown are regenerated under the bass DNA lens.

**Tech Stack:** TypeScript + Vitest (exhibition + build tooling), Python 3 (vault tools, no test framework — use `__main__` smoke blocks per repo convention), Markdown (playlist + episode + corpus).

**Spec:** `docs/superpowers/specs/2026-05-05-bassline-dna-tts-design.md`

---

## File Structure

### New files
| Path | Responsibility |
|------|---------------|
| `playlists/rolling-stones_some-girls_miss-you.connections.json` | Episode metadata + bidirectional connection pairs with bilingual narration |
| `tools/red_heart_match.py` | Match a node {artist,song,album} against `Foundations/网易云红心歌单_全量.md` → tier + matched seeds |
| `tools/build_calibration_digest.py` | Aggregate all `connections.json` `user_overrides[]` → `Foundations/user_calibration_corpus.md` |
| `tools/validate_episode_connections.py` | Verify each track's regenerated transcript references the connections declared in `connections.json` |
| `Foundations/user_calibration_corpus.md` | Initial empty file with header explaining the file's role |
| `episodes/rolling-stones_some-girls_miss-you.episode.v0.1.md` | Archive of pre-rewrite episode markdown |
| `episodes/rolling-stones_some-girls_miss-you.episode.v0.1.json` | Archive of pre-rewrite episode JSON |
| `playlists/rolling-stones_some-girls_miss-you.playlist v0.3.md` | New bass DNA framing (current `.playlist v0.2.md` retained as archive) |

### Modified files
| Path | Change |
|------|--------|
| `musicos-exhibition/src/types.ts` | Add fields to `TrackExhibit`: `genre`, `episode_focus`, `red_heart_tier`, `red_heart_matched_seeds`, `muted_this_episode`, `bridge_narration_zh`, `bridge_narration_en`, `connections_in`, `connections_out`, `connections_lateral` |
| `musicos-exhibition/scripts/build-exhibition-json.ts` | Read `connections.json`, run `red_heart_match.py`, populate new fields |
| `musicos-exhibition/scripts/build-exhibition-json.ts` | Switch `PLAYLIST` constant from `v0.2` to the new `v0.3` markdown |
| `musicos-exhibition/tests/exhibition-json.test.ts` | Add assertions for new fields |
| `episodes/rolling-stones_some-girls_miss-you.episode.md` | Rewrite all 18 track transcripts using §4 TTS template |
| `episodes/rolling-stones_some-girls_miss-you.episode.json` | Add top-level `episode_number`, `episode_focus`, `episode_arc`; regenerate per-track transcripts |

### Untouched
- `maps/rolling-stones_some-girls_miss-you.map.json`
- `data/nodes/*.json`
- `tools/node_registry.py`, `tools/coverage.py`

---

## Task 1: Extend `TrackExhibit` schema

**Files:**
- Modify: `musicos-exhibition/src/types.ts`
- Test: `musicos-exhibition/tests/types.test.ts`

- [ ] **Step 1: Read existing types.ts**

Run: read `musicos-exhibition/src/types.ts` to confirm current `TrackExhibit` interface.

- [ ] **Step 2: Write a failing test**

Append to `musicos-exhibition/tests/types.test.ts` (or create a new `types.bassdna.test.ts` if the existing test asserts overall keyset):

```ts
import { describe, it, expectTypeOf } from 'vitest';
import type { TrackExhibit, RedHeartTier, ConnectionRef } from '../src/types';

describe('TrackExhibit bass DNA fields', () => {
  it('includes the new fields with correct shapes', () => {
    expectTypeOf<TrackExhibit>().toHaveProperty('genre').toEqualTypeOf<string | null>();
    expectTypeOf<TrackExhibit>().toHaveProperty('episode_focus').toEqualTypeOf<string>();
    expectTypeOf<TrackExhibit>().toHaveProperty('red_heart_tier').toEqualTypeOf<RedHeartTier>();
    expectTypeOf<TrackExhibit>().toHaveProperty('muted_this_episode').toEqualTypeOf<boolean>();
    expectTypeOf<TrackExhibit>().toHaveProperty('bridge_narration_zh').toEqualTypeOf<string | null>();
    expectTypeOf<TrackExhibit>().toHaveProperty('connections_in').toEqualTypeOf<ConnectionRef[]>();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd musicos-exhibition && npx vitest run tests/types.bassdna.test.ts`
Expected: FAIL — `RedHeartTier` and `ConnectionRef` not exported, properties missing.

- [ ] **Step 4: Implement schema in types.ts**

Edit `musicos-exhibition/src/types.ts`. Add to top:

```ts
export type RedHeartTier = 'hit' | 'adjacent' | 'blind_spot';

export interface RedHeartSeed {
  type: 'song' | 'artist' | 'album';
  value: string;
}

export type ConnectionKind =
  | 'bassline_prototype'
  | 'groove_dna'
  | 'personnel_bridge_bass'
  | 'gear_lineage_bass';

export type ConnectionDirection =
  | 'from_inspires_to'
  | 'lateral_dialogue'
  | 'inversion_counterpoint';

export type EvidenceBasis = 'musicological' | 'historical' | 'sensory';

export interface ConnectionRef {
  id: string;
  other_position: number;
  other_label: string;        // "Bee Gees — Stayin' Alive (1977)"
  kind: ConnectionKind;
  evidence_basis: EvidenceBasis;
  narration_zh: string;       // the side relevant to THIS track (from or to)
  narration_en: string;
}
```

Extend `TrackExhibit` (after the existing `unavailable: boolean;` line):

```ts
  genre: string | null;
  episode_focus: string;                       // "bassline_dna"
  red_heart_tier: RedHeartTier;
  red_heart_matched_seeds: RedHeartSeed[];
  muted_this_episode: boolean;
  bridge_narration_zh: string | null;
  bridge_narration_en: string | null;
  connections_in: ConnectionRef[];             // upstream (this track inspired by these)
  connections_out: ConnectionRef[];            // downstream (this track inspired these)
  connections_lateral: ConnectionRef[];        // same-era dialogue / inversion counterpoint
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd musicos-exhibition && npx vitest run tests/types.bassdna.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add musicos-exhibition/src/types.ts musicos-exhibition/tests/types.bassdna.test.ts
git commit -m "feat(exhibition): extend TrackExhibit with bass DNA + red-heart fields"
```

---

## Task 2: Define `connections.json` schema with a Vitest validator

**Files:**
- Create: `musicos-exhibition/scripts/lib/parse-connections.ts`
- Test: `musicos-exhibition/tests/parse-connections.test.ts`

- [ ] **Step 1: Write the failing test**

Create `musicos-exhibition/tests/parse-connections.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseConnections, type ConnectionsFile } from '../scripts/lib/parse-connections';

const MIN_VALID = {
  playlist_slug: 'rolling-stones_some-girls_miss-you',
  episode_number: 1,
  episode_focus: 'bassline_dna',
  episode_title_zh: 'Miss You · 第 1 期 · bassline DNA 谱系',
  episode_title_en: 'Miss You · Episode 1 · The Bassline DNA Lineage',
  episode_arc: {
    from: { position: 1, label: 'James Brown — Cold Sweat (1967)' },
    to:   { position: 17, label: 'Khruangbin — María También (2018)' },
  },
  connection_kinds_in_scope: ['bassline_prototype'],
  muted_positions: [],
  connection_pairs: [
    {
      id: 'conn_001_to_009_groove_dna',
      from_position: 1,
      to_position: 9,
      direction: 'from_inspires_to',
      kind: 'groove_dna',
      evidence_basis: 'historical',
      backed_by_edge_id: null,
      system_sensory_note: 'JB drum/bass interlock 是 Edwards 直接继承的语法。',
      narration_at_from: { voice_zh: '等会儿到 Chic 的 Good Times 你会再撞见这种锁死。', voice_en: '...' },
      narration_at_to:   { voice_zh: '你刚才在 James Brown 的 Cold Sweat 已经听到这种逻辑。', voice_en: '...' },
      user_overrides: [],
    },
  ],
};

describe('parseConnections', () => {
  it('accepts a minimal valid file', () => {
    const result: ConnectionsFile = parseConnections(MIN_VALID);
    expect(result.connection_pairs).toHaveLength(1);
    expect(result.episode_number).toBe(1);
  });

  it('rejects pair where from_position == to_position', () => {
    const bad = structuredClone(MIN_VALID);
    bad.connection_pairs[0].to_position = 1;
    expect(() => parseConnections(bad)).toThrow(/self-reference/);
  });

  it('rejects pair with kind outside connection_kinds_in_scope', () => {
    const bad = structuredClone(MIN_VALID);
    bad.connection_pairs[0].kind = 'gear_lineage_bass';
    expect(() => parseConnections(bad)).toThrow(/not in scope/);
  });

  it('rejects narration_at_from.voice_zh exceeding 80 chars', () => {
    const bad = structuredClone(MIN_VALID);
    bad.connection_pairs[0].narration_at_from.voice_zh = '一'.repeat(81);
    expect(() => parseConnections(bad)).toThrow(/voice_zh.*80/);
  });

  it('rejects narration mentioning "Track N" or square brackets', () => {
    const bad = structuredClone(MIN_VALID);
    bad.connection_pairs[0].narration_at_from.voice_zh = '到 Track 9 你会撞见';
    expect(() => parseConnections(bad)).toThrow(/forbidden token/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd musicos-exhibition && npx vitest run tests/parse-connections.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `parse-connections.ts`**

Create `musicos-exhibition/scripts/lib/parse-connections.ts`:

```ts
import type { ConnectionKind, ConnectionDirection, EvidenceBasis } from '../../src/types.js';

export interface ConnectionPair {
  id: string;
  from_position: number;
  to_position: number;
  direction: ConnectionDirection;
  kind: ConnectionKind;
  evidence_basis: EvidenceBasis;
  backed_by_edge_id: string | null;
  system_sensory_note: string;
  narration_at_from: { voice_zh: string; voice_en: string };
  narration_at_to:   { voice_zh: string; voice_en: string };
  user_overrides: UserOverride[];
}

export interface UserOverride {
  type: 'append' | 'replace' | 'reject';
  applies_to: 'narration_at_from' | 'narration_at_to' | 'sensory_note';
  user_note: string;
  created_at: string;
}

export interface ConnectionsFile {
  playlist_slug: string;
  episode_number: number;
  episode_focus: string;
  episode_title_zh: string;
  episode_title_en: string;
  episode_arc: {
    from: { position: number; label: string };
    to:   { position: number; label: string };
    coda?: { position: number; label: string };
  };
  connection_kinds_in_scope: ConnectionKind[];
  muted_positions: number[];
  connection_pairs: ConnectionPair[];
}

const FORBIDDEN_TOKEN_RE = /(Track\s+\d+|第\s*\d+\s*首|\[|\])/;

function validatePair(pair: ConnectionPair, scope: ConnectionKind[]): void {
  if (pair.from_position === pair.to_position) {
    throw new Error(`pair ${pair.id}: self-reference (from_position == to_position)`);
  }
  if (!scope.includes(pair.kind)) {
    throw new Error(`pair ${pair.id}: kind "${pair.kind}" not in scope ${JSON.stringify(scope)}`);
  }
  for (const side of ['narration_at_from', 'narration_at_to'] as const) {
    const zh = pair[side].voice_zh ?? '';
    const en = pair[side].voice_en ?? '';
    if ([...zh].length > 80) {
      throw new Error(`pair ${pair.id}: ${side}.voice_zh exceeds 80 chars (got ${[...zh].length})`);
    }
    if (en.split(/\s+/).filter(Boolean).length > 30) {
      throw new Error(`pair ${pair.id}: ${side}.voice_en exceeds 30 words`);
    }
    if (FORBIDDEN_TOKEN_RE.test(zh) || FORBIDDEN_TOKEN_RE.test(en)) {
      throw new Error(`pair ${pair.id}: ${side} contains forbidden token (Track N / brackets / 第N首)`);
    }
  }
}

export function parseConnections(raw: unknown): ConnectionsFile {
  const f = raw as ConnectionsFile;
  if (!f.connection_pairs || !Array.isArray(f.connection_pairs)) {
    throw new Error('missing connection_pairs[]');
  }
  for (const pair of f.connection_pairs) {
    validatePair(pair, f.connection_kinds_in_scope);
  }
  return f;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd musicos-exhibition && npx vitest run tests/parse-connections.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add musicos-exhibition/scripts/lib/parse-connections.ts musicos-exhibition/tests/parse-connections.test.ts
git commit -m "feat(exhibition): connections.json schema + validator"
```

---

## Task 3: `tools/red_heart_match.py`

**Files:**
- Create: `tools/red_heart_match.py`
- Test: smoke `__main__` block + `tools/test_red_heart_match.py` (pytest-optional)

- [ ] **Step 1: Inspect 红心 file format**

Already known: `Foundations/网易云红心歌单_全量.md` is a Markdown table:
```
| # | 歌名 | 艺人 | 专辑 | 时长 | 红心日期 | 推断流派 | 链接 |
```

Header band ends ~line 9 (data starts after `|---|...|` separator).

- [ ] **Step 2: Write the implementation**

Create `tools/red_heart_match.py`:

```python
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
    # Strip parenthetical version annotations: (Remastered), (2019 Mix), etc.
    s = re.sub(r'\([^)]*\)', '', s)
    s = re.sub(r'\[[^\]]*\]', '', s)
    s = re.sub(r'[^\w\s]', '', s, flags=re.UNICODE)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


@lru_cache(maxsize=1)
def _load_rows(path_str: str) -> list[dict]:
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
                int(cells[0])           # confirms data row
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
    return rows


def match(node: dict, red_heart_path: Path | str | None = None) -> dict:
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

    # tier hit: same artist + same song
    for r in same_artist:
        if song_n and r['song_norm'] == song_n:
            return {
                'tier': 'hit',
                'matched_seeds': [{'type': 'song', 'value': f"{r['artist']} - {r['song']}"}],
            }

    # tier adjacent: same album OR same artist different song
    seeds = []
    for r in same_artist:
        if album_n and r['album_norm'] == album_n:
            seeds.append({'type': 'album', 'value': f"{r['artist']} - {r['album']} ({r['song']})"})
    if not seeds:
        for r in same_artist[:3]:
            seeds.append({'type': 'artist', 'value': f"{r['artist']} - {r['song']}"})
    return {'tier': 'adjacent', 'matched_seeds': seeds}


if __name__ == '__main__':
    # Smoke test against the real red-heart file.
    import json
    cases = [
        {'artist': 'Parliament', 'song': 'P-Funk (Wants To Get Funked Up)', 'album': 'Funked Up'},  # hit
        {'artist': 'Parliament', 'song': 'Give Up the Funk', 'album': 'Mothership Connection'},      # adjacent
        {'artist': 'Khruangbin', 'song': 'María También', 'album': 'Con Todo El Mundo'},             # ?
        {'artist': 'NobodySuchArtistExists', 'song': 'X', 'album': 'Y'},                              # blind_spot
    ]
    for c in cases:
        r = match(c)
        print(c['artist'], '·', c['song'], '→', r['tier'])
        for s in r['matched_seeds']:
            print('   ', s)
    assert match({'artist': 'NobodySuchArtistExists', 'song': 'X'})['tier'] == 'blind_spot'
    print('smoke ok')
```

- [ ] **Step 3: Run smoke test**

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -m tools.red_heart_match`
Expected: prints tier results + `smoke ok`. The Parliament hit case must print `→ hit`. Blind-spot case must print `→ blind_spot`.

- [ ] **Step 4: Manually verify two known nodes**

Run the smoke and confirm:
- `Parliament · P-Funk (Wants To Get Funked Up) → hit` (this song appears at row 15 of `网易云红心歌单_全量.md`)
- The fake artist must produce `blind_spot`

If either fails, debug normalization (likely whitespace or parenthetical handling) before continuing.

- [ ] **Step 5: Commit**

```bash
git add tools/red_heart_match.py
git commit -m "feat(tools): red_heart_match — three-tier resonance matcher"
```

---

## Task 4: `tools/build_calibration_digest.py`

**Files:**
- Create: `tools/build_calibration_digest.py`
- Create: `Foundations/user_calibration_corpus.md` (initial)

- [ ] **Step 1: Create the initial corpus file**

Create `Foundations/user_calibration_corpus.md`:

```markdown
# User Calibration Corpus

This file is the accumulated digest of every `user_overrides[]` entry across all
`playlists/*.connections.json` files. It is consumed by generative agents during
future map expansions as a record of how this user's ear has corrected the
system's previous narration choices.

This file is **machine-generated** — do not edit by hand. Run:

    python3 -m tools.build_calibration_digest

to regenerate.

---

## Entries

_(none yet)_
```

- [ ] **Step 2: Implement the digest builder**

Create `tools/build_calibration_digest.py`:

```python
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


def collect() -> list[dict]:
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


def render(entries: list[dict]) -> str:
    if not entries:
        return HEADER + '_(none yet)_\n'
    lines = [HEADER]
    for e in entries:
        lines.append(f"### {e['created_at']} · {e['playlist_slug']} · {e['pair_id']}")
        lines.append(f"- type: `{e['type']}` · applies_to: `{e['applies_to']}`")
        lines.append(f"- note: {e['user_note']}")
        lines.append('')
    return '\n'.join(lines)


def main() -> None:
    entries = collect()
    OUT.write_text(render(entries), encoding='utf-8')
    print(f'wrote {OUT} ({len(entries)} entries)')


if __name__ == '__main__':
    main()
```

- [ ] **Step 3: Run the builder against current (empty) state**

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -m tools.build_calibration_digest`
Expected: `wrote .../user_calibration_corpus.md (0 entries)` and the file ends with `_(none yet)_`.

- [ ] **Step 4: Commit**

```bash
git add tools/build_calibration_digest.py Foundations/user_calibration_corpus.md
git commit -m "feat(tools): build_calibration_digest + initial empty corpus"
```

---

## Task 5: `tools/validate_episode_connections.py`

**Files:**
- Create: `tools/validate_episode_connections.py`

- [ ] **Step 1: Implement the validator**

Create `tools/validate_episode_connections.py`:

```python
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

ROOT = Path(__file__).resolve().parent.parent


def _track_label_to_artist_song(label: str) -> tuple[str, str]:
    # "James Brown — Cold Sweat (1967)" → ("James Brown", "Cold Sweat")
    m = re.match(r'^(.*?)\s*[—\-]\s*(.*?)\s*\(\d{4}\)\s*$', label)
    if not m:
        return label, label
    return m.group(1).strip(), m.group(2).strip()


def _split_episode_by_track(md: str) -> dict[int, str]:
    # Track sections in current episode.md begin with headers like:
    #   ## Track 9 · Chic — Good Times
    sections: dict[int, str] = {}
    cur_pos: int | None = None
    cur_buf: list[str] = []
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


def validate(connections_path: Path, episode_md_path: Path) -> list[str]:
    conn = json.loads(connections_path.read_text(encoding='utf-8'))
    md = episode_md_path.read_text(encoding='utf-8')
    sections = _split_episode_by_track(md)
    arc = conn.get('episode_arc', {})

    # position → label map (from arc + connection_pair labels would be nice,
    # but pairs only carry positions. We infer labels from the playlist .md OR
    # require connections.json to embed a position→label table.)
    # Convention: connections.json includes `position_labels: {pos: label}`.
    position_labels: dict[int, str] = {
        int(k): v for k, v in conn.get('position_labels', {}).items()
    }
    if not position_labels:
        return [f'connections.json missing position_labels map']

    errors: list[str] = []
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


def main() -> None:
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
```

- [ ] **Step 2: Quick syntax check**

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -c "from tools.validate_episode_connections import validate; print('imports ok')"`
Expected: `imports ok`.

- [ ] **Step 3: Commit**

```bash
git add tools/validate_episode_connections.py
git commit -m "feat(tools): validate_episode_connections — catch unmentioned pairs"
```

---

## Task 6: Author `connections.json`

**Files:**
- Create: `playlists/rolling-stones_some-girls_miss-you.connections.json`

This is the largest content task. It is generative work, not algorithmic — the
"test" is the validator from Task 2 (parseConnections in TS) which the agent
must run to confirm shape compliance.

- [ ] **Step 1: Read the spec sections that bind authoring**

Re-read `docs/superpowers/specs/2026-05-05-bassline-dna-tts-design.md` §3.2,
§3.3, §4.3. Internalize:
- ≤2 upstream + ≤2 downstream + ≤1 lateral per non-anchor track; anchor (Miss You, position 6) ≤7
- All `kind` values must be in `connection_kinds_in_scope` (4 values listed below)
- Both narrations must use full "artist + song" attribution, no `Track N` / brackets
- voice_zh ≤80 chars, voice_en ≤30 words

- [ ] **Step 2: Read the playlist to ground each pair in real evidence**

Read `playlists/rolling-stones_some-girls_miss-you.playlist.md` end to end.
Note who actually has bass-relevant facts (Edwards/Chic, Hook/Joy Division,
Deacon/Queen, Bootsy/Parliament, etc.) and who is bass-thin (Devo, Bowie's
"Fame" — both are voicing/production stories, not bass stories).

- [ ] **Step 3: Build the position_labels table first**

Write a stub `playlists/rolling-stones_some-girls_miss-you.connections.json` containing only the metadata + position_labels — no pairs yet:

```json
{
  "playlist_slug": "rolling-stones_some-girls_miss-you",
  "episode_number": 1,
  "episode_focus": "bassline_dna",
  "episode_title_zh": "Miss You · 第 1 期 · bassline DNA 谱系",
  "episode_title_en": "Miss You · Episode 1 · The Bassline DNA Lineage",
  "episode_arc": {
    "from": { "position": 1, "label": "James Brown — Cold Sweat (1967)" },
    "to":   { "position": 17, "label": "Khruangbin — María También (2018)" },
    "coda": { "position": 18, "label": "Mk.gee — You Dreamed of Me (2024)" }
  },
  "connection_kinds_in_scope": [
    "bassline_prototype",
    "groove_dna",
    "personnel_bridge_bass",
    "gear_lineage_bass"
  ],
  "muted_positions": [8],
  "position_labels": {
    "1": "James Brown — Cold Sweat (1967)",
    "2": "Sly & the Family Stone — Family Affair (1971)",
    "3": "David Bowie — Fame (1975)",
    "4": "Parliament — Give Up the Funk (1976)",
    "5": "Bee Gees — Stayin' Alive (1977)",
    "6": "The Rolling Stones — Miss You (1978)",
    "7": "Blondie — Heart of Glass (1978)",
    "8": "Devo — Jocko Homo (1978)",
    "9": "Chic — Good Times (1979)",
    "10": "Joy Division — Isolation (1980)",
    "11": "Talking Heads — Once in a Lifetime (1980)",
    "12": "Queen — Another One Bites the Dust (1980)",
    "13": "Prince — When Doves Cry (1984)",
    "14": "Red Hot Chili Peppers — Give It Away (1991)",
    "15": "Daft Punk — Get Lucky (2013)",
    "16": "Tame Impala — The Less I Know the Better (2015)",
    "17": "Khruangbin — María También (2018)",
    "18": "Mk.gee — You Dreamed of Me (2024)"
  },
  "connection_pairs": []
}
```

- [ ] **Step 4: Author each pair**

Add to `connection_pairs[]` one pair at a time, working through positions 1 → 18. For each non-muted track, ensure:
- `connection_pairs.filter(p => p.from_position == N || p.to_position == N).length` ≤ 5 (≤7 for N=6)
- At least one upstream + one downstream connection appears for every non-muted, non-arc-endpoint track (positions 2–16, excluding 8)
- Position 1 (Cold Sweat): only downstream pairs (it is the arc start)
- Position 17 (Khruangbin): primarily upstream pairs (arc end)
- Position 18 (Mk.gee): coda — 1–2 upstream pairs only
- Position 8 (Devo): zero pairs (muted)

Pair template (copy and fill — DO NOT mutate field names):

```json
{
  "id": "conn_<from>_to_<to>_<short_kind>",
  "from_position": <N>,
  "to_position": <M>,
  "direction": "from_inspires_to",
  "kind": "bassline_prototype",
  "evidence_basis": "musicological",
  "backed_by_edge_id": null,
  "system_sensory_note": "<2-3 sentence Chinese factual+sensory note grounding the pair>",
  "narration_at_from": {
    "voice_zh": "<≤80 char ZH; from-side, future-tense: 等会儿到 ARTIST 的 SONG 你会再撞见…>",
    "voice_en": "<≤30 word EN, same flavor>"
  },
  "narration_at_to": {
    "voice_zh": "<≤80 char ZH; to-side, past-tense: 你刚才在 ARTIST 的 SONG 已经听过…>",
    "voice_en": "<≤30 word EN>"
  },
  "user_overrides": []
}
```

Target volume: ~40–55 pairs total. Concrete pair seeds the agent should
include (these are bass DNA truths from the existing playlist):

| from | to | kind | what to anchor on |
|------|-----|------|------|
| 1 (JB) | 9 (Chic) | groove_dna | Stubblefield drum/bass interlock → Edwards' locked rhythm-bass-guitar |
| 1 (JB) | 4 (Parliament) | personnel_bridge_bass | JBs horn section poached, Bootsy enters Parliament — bass culture transfer |
| 4 (Parliament) | 14 (RHCP) | bassline_prototype | Bootsy slap-pop vocabulary → Flea |
| 5 (Bee Gees) | 6 (Stones) | groove_dna | four-on-the-floor disco bass logic Stones approximate |
| 9 (Chic) | 12 (Queen) | bassline_prototype | "Good Times" line → Deacon's "Another One Bites the Dust" |
| 9 (Chic) | 15 (Daft Punk) | personnel_bridge_bass | Nile Rodgers continuity, Nathan East takes the bass role |
| 6 (Stones) | 7 (Blondie) | lateral_dialogue (kind: groove_dna, direction: lateral_dialogue) | parallel rock-translates-disco bass approach, same year |
| 10 (Joy Division) | 16 (Tame Impala) | bassline_prototype | Hook's high-register melodic bass → Parker's similar voicing |
| 10 (Joy Division) | 11 (Talking Heads) | lateral_dialogue (groove_dna) | post-punk rhythm-section repositioning, both 1980 |
| 13 (Prince) | 18 (Mk.gee) | groove_dna | one-person multi-instrument bass programming lineage |
| 4 (Parliament) | 17 (Khruangbin) | gear_lineage_bass | warm tube/Ampeg bass tone heritage (verify before committing) |
| 1 (JB) | 17 (Khruangbin) | groove_dna | minimalist bass-drum locked groove philosophy |
| 6 (Stones) | 6 — N/A — anchor distributes upstream (1,2,4,5) and downstream (9,12,15) | several | Miss You is the network hub |

Add additional pairs as bass evidence supports — but never invent edges
without grounding in the playlist text or a verifiable bass fact.

- [ ] **Step 5: Validate the file with the TS validator**

Create a one-off check script `musicos-exhibition/scripts/check-connections.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseConnections } from './lib/parse-connections.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const VAULT_ROOT = path.resolve(__dirname, '../..');
const FILE = path.join(VAULT_ROOT, 'playlists/rolling-stones_some-girls_miss-you.connections.json');

const raw = JSON.parse(readFileSync(FILE, 'utf8'));
const result = parseConnections(raw);
console.log(`OK · ${result.connection_pairs.length} pairs`);

// Cap check
const counts = new Map<number, number>();
for (const p of result.connection_pairs) {
  counts.set(p.from_position, (counts.get(p.from_position) ?? 0) + 1);
  counts.set(p.to_position,   (counts.get(p.to_position) ?? 0) + 1);
}
for (const [pos, n] of counts) {
  const cap = pos === 6 ? 7 : 5;
  if (n > cap) {
    console.error(`position ${pos}: ${n} pairs exceeds cap ${cap}`);
    process.exit(1);
  }
}
console.log('cap check OK');
```

Run: `cd musicos-exhibition && npx tsx scripts/check-connections.ts`
Expected: `OK · NN pairs` followed by `cap check OK`.

- [ ] **Step 6: Commit**

```bash
git add playlists/rolling-stones_some-girls_miss-you.connections.json \
        musicos-exhibition/scripts/check-connections.ts
git commit -m "feat(playlist): bass DNA connections.json + cap check script"
```

---

## Task 7: Archive existing episode files

**Files:**
- Copy: `episodes/rolling-stones_some-girls_miss-you.episode.md` → `.episode.v0.1.md`
- Copy: `episodes/rolling-stones_some-girls_miss-you.episode.json` → `.episode.v0.1.json`

- [ ] **Step 1: Make archive copies**

Run:
```bash
cp episodes/rolling-stones_some-girls_miss-you.episode.md \
   episodes/rolling-stones_some-girls_miss-you.episode.v0.1.md
cp episodes/rolling-stones_some-girls_miss-you.episode.json \
   episodes/rolling-stones_some-girls_miss-you.episode.v0.1.json
```

- [ ] **Step 2: Commit the archive**

```bash
git add episodes/rolling-stones_some-girls_miss-you.episode.v0.1.md \
        episodes/rolling-stones_some-girls_miss-you.episode.v0.1.json
git commit -m "chore(episodes): archive v0.1 episode files before bass DNA rewrite"
```

---

## Task 8: Rewrite `playlist v0.3.md` (bass DNA framing)

**Files:**
- Create: `playlists/rolling-stones_some-girls_miss-you.playlist v0.3.md`
- Read: `playlists/rolling-stones_some-girls_miss-you.playlist.md` (current canonical)

- [ ] **Step 1: Draft the new playlist**

Create `playlists/rolling-stones_some-girls_miss-you.playlist v0.3.md`:

Required structure:
```
# Miss You · 第 1 期 · bassline DNA 谱系
*Anchored at The Rolling Stones · Miss You · 1978*

**This episode is**: <2–3 sentences framing the bass arc James Brown → Khruangbin and what it tracks>

**Total tracks**: 18 · **Estimated time**: ~84 min · **Episode focus**: bassline_dna

---

## Track 1: James Brown — Cold Sweat (1967)
*From Cold Sweat / Funky Drummer era (1967–1970)*
**Genre**: Funk
**Bass role**: <one line: e.g., "Genetic ground-zero — drum/bass interlock as primary harmonic instrument">
**Connections in this episode**:
- → Chic — Good Times (1979): Edwards inherits the locked drum/bass groove philosophy directly
- → Khruangbin — María También (2018): minimalist bass-drum lock continues across 50 years
- → Parliament — Give Up the Funk (1976): JBs personnel transfer (Maceo Parker, Fred Wesley) carries the bass culture
**Red-heart resonance**: <hit | adjacent | blind_spot — fill from red_heart_match.py output>

<2–4 short paragraphs of musician-voice prose grounding the bass facts. Same evidence as before but pruned to bass-only material.>

[Listen on NetEase](<existing link>)

---
```

Repeat the structure for tracks 2–18. For Track 8 (Devo) the format is reduced:
```
## Track 8: Devo — Jocko Homo (1978)
*From Q: Are We Not Men? A: We Are Devo!*
**Genre**: Art punk / proto-new-wave
**Bass role in this episode**: muted — Devo's story is about voicing/refusal, not bass; revisit in episode 2
**Bridge**: <40–80 char ZH bridge sentence>
```

- [ ] **Step 2: Update `build-exhibition-json.ts` PLAYLIST constant**

Edit `musicos-exhibition/scripts/build-exhibition-json.ts`:

Find:
```ts
const PLAYLIST = path.join(
  VAULT_ROOT,
  'playlists/rolling-stones_some-girls_miss-you.playlist v0.2.md',
);
```

Replace with:
```ts
const PLAYLIST = path.join(
  VAULT_ROOT,
  'playlists/rolling-stones_some-girls_miss-you.playlist v0.3.md',
);
```

- [ ] **Step 3: Confirm parse-playlist still extracts what build needs**

Read `musicos-exhibition/scripts/lib/parse-playlist.ts`. Confirm the new v0.3
markdown's `## Track N: ARTIST — SONG (YEAR)` headers and `[Listen on NetEase]`
links still match the existing parser regex. If parser breaks because of the
added `**Genre**` / `**Bass role**` lines, **do not** rewrite the parser — the
v0.3 markdown should preserve the structural lines the parser already reads
(track header, italic album line, NetEase link). Add the new metadata as
separate lines that the parser ignores.

If you must change the parser, write a failing test in
`musicos-exhibition/tests/parse-playlist.test.ts` first.

- [ ] **Step 4: Commit**

```bash
git add 'playlists/rolling-stones_some-girls_miss-you.playlist v0.3.md' \
        musicos-exhibition/scripts/build-exhibition-json.ts
git commit -m "feat(playlist): v0.3 bass DNA framing, point build at v0.3"
```

---

## Task 9: Rewrite `episode.md` with TTS template

**Files:**
- Modify: `episodes/rolling-stones_some-girls_miss-you.episode.md`
- Modify: `episodes/rolling-stones_some-girls_miss-you.episode.json`

- [ ] **Step 1: Inspect current episode structure**

Read both files. Note how track sections are delimited and how bilingual
transcripts are stored (look for the existing `transcript_zh` / `transcript_en`
keys in the JSON; find the matching headers in the markdown).

- [ ] **Step 2: Rewrite each track transcript per §4 template**

For each non-muted track, the new `transcript_zh` must follow:

```
[OPENING]    "<artist>, <year> 年的 <album>——<genre>。<song>。"
[FOCUS]      <one sentence on the track's bass DNA role>
[NETWORK]    <woven prose containing every narration_at_from / narration_at_to
              snippet for pairs touching this track, in the order:
              upstream first, downstream second, lateral last>
[RESONANCE]  <one sentence per §5 table — pull tier from red_heart_match output>
[HANDOFF]    <one sentence introducing the next track by artist + 1-2 word hook>
```

Constraints:
- Total ZH 250–400 chars per track; EN 100–180 words.
- All "other-track" mentions must use "<artist> 的 <song>" (full attribution).
- Do NOT use "Track 9" / "第 9 首" / square brackets.
- Pull each `narration_at_from.voice_zh` / `narration_at_to.voice_zh` from
  `connections.json` essentially verbatim, with at most light connective
  glue ("再往前一首是…", "等会儿到…").

For Track 8 (Devo): emit only the bridge text and store under
`bridge_narration_zh` / `bridge_narration_en` in the JSON (transcripts can
hold the same text or be null — match whatever shape `parse-episode.ts`
expects; verify by re-reading that parser).

- [ ] **Step 3: Validate the rewrite**

Run:
```bash
python3 -m tools.validate_episode_connections \
  playlists/rolling-stones_some-girls_miss-you.connections.json \
  episodes/rolling-stones_some-girls_miss-you.episode.md
```
Expected: `OK`.

If it reports `position N section does not mention "X" or "Y"`, that
position's transcript is missing a required pair reference — go back and
weave it in.

- [ ] **Step 4: Commit**

```bash
git add episodes/rolling-stones_some-girls_miss-you.episode.md \
        episodes/rolling-stones_some-girls_miss-you.episode.json
git commit -m "feat(episode): rewrite transcripts under bass DNA TTS template"
```

---

## Task 10: Wire connections + red-heart into `build-exhibition-json.ts`

**Files:**
- Modify: `musicos-exhibition/scripts/build-exhibition-json.ts`
- Test: `musicos-exhibition/tests/exhibition-json.test.ts`

- [ ] **Step 1: Write failing assertions in exhibition-json test**

Edit `musicos-exhibition/tests/exhibition-json.test.ts`. Add inside the
existing `describe('build-exhibition-json')`:

```ts
it('every track has episode_focus = "bassline_dna"', () => {
  const tracks = data.filter((e) => e.kind === 'track') as TrackExhibit[];
  for (const t of tracks) {
    expect(t.episode_focus).toBe('bassline_dna');
  }
});

it('every track has a non-null genre', () => {
  const tracks = data.filter((e) => e.kind === 'track') as TrackExhibit[];
  for (const t of tracks) {
    expect(t.genre, `track ${t.position} missing genre`).toBeTruthy();
  }
});

it('every track has red_heart_tier in {hit,adjacent,blind_spot}', () => {
  const tracks = data.filter((e) => e.kind === 'track') as TrackExhibit[];
  for (const t of tracks) {
    expect(['hit', 'adjacent', 'blind_spot']).toContain(t.red_heart_tier);
  }
});

it('non-muted tracks (excluding position 1) have ≥1 inbound connection', () => {
  const tracks = data.filter((e) => e.kind === 'track') as TrackExhibit[];
  for (const t of tracks) {
    if (t.muted_this_episode) continue;
    if (t.position === 1) continue;  // arc start has no upstream
    expect(t.connections_in.length, `track ${t.position} has no inbound`)
      .toBeGreaterThanOrEqual(1);
  }
});

it('Devo (position 8) is muted with a bridge_narration_zh', () => {
  const devo = (data.filter((e) => e.kind === 'track') as TrackExhibit[])
    .find((t) => t.position === 8)!;
  expect(devo.muted_this_episode).toBe(true);
  expect(devo.bridge_narration_zh).toBeTruthy();
});
```

Run: `cd musicos-exhibition && npx vitest run tests/exhibition-json.test.ts`
Expected: FAIL on the new assertions (build script doesn't populate yet).

- [ ] **Step 2: Implement the join in build-exhibition-json.ts**

Edit `musicos-exhibition/scripts/build-exhibition-json.ts`.

Add near the top imports:
```ts
import { execSync } from 'node:child_process';
import { parseConnections, type ConnectionsFile, type ConnectionPair } from './lib/parse-connections.js';
```

Add the connections file path constant alongside existing `PLAYLIST` / `EPISODE`:
```ts
const CONNECTIONS = path.join(
  VAULT_ROOT,
  'playlists/rolling-stones_some-girls_miss-you.connections.json',
);
```

Add a `GENRE_BY_POSITION` table near `TRACK_META`:
```ts
const GENRE_BY_POSITION: Record<number, string> = {
  1: 'Funk',
  2: 'Funk / Soul',
  3: 'Plastic soul',
  4: 'P-Funk',
  5: 'Disco',
  6: 'Rock × Disco',
  7: 'Punk × Disco',
  8: 'Art punk / proto-new-wave',
  9: 'Disco',
  10: 'Post-punk',
  11: 'Art rock / post-punk funk',
  12: 'Stadium rock × disco',
  13: 'Minneapolis funk-rock',
  14: 'Funk-rock',
  15: 'Nu-disco',
  16: 'Psychedelic pop',
  17: 'Dub-soul / instrumental groove',
  18: 'Bedroom R&B / experimental rock',
};
```

Add helper `runRedHeartMatch`:
```ts
function runRedHeartMatch(artist: string, song: string, album: string): {
  tier: 'hit' | 'adjacent' | 'blind_spot';
  matched_seeds: { type: string; value: string }[];
} {
  const escape = (s: string) => s.replace(/'/g, "\\'");
  const pyExpr =
    `from tools.red_heart_match import match; ` +
    `import json; ` +
    `print(json.dumps(match({` +
      `'artist': '${escape(artist)}', ` +
      `'song':   '${escape(song)}', ` +
      `'album':  '${escape(album)}'` +
    `})))`;
  const out = execSync(`python3 -c "${pyExpr.replace(/"/g, '\\"')}"`, {
    cwd: VAULT_ROOT,
    encoding: 'utf8',
  });
  return JSON.parse(out);
}
```

Add a function that converts a connections file into per-position lists:
```ts
function indexConnections(conn: ConnectionsFile): {
  inbound:  Map<number, ConnectionRefBuild[]>;
  outbound: Map<number, ConnectionRefBuild[]>;
  lateral:  Map<number, ConnectionRefBuild[]>;
} {
  const inbound = new Map<number, ConnectionRefBuild[]>();
  const outbound = new Map<number, ConnectionRefBuild[]>();
  const lateral = new Map<number, ConnectionRefBuild[]>();
  const labels: Record<number, string> = (conn as any).position_labels;

  for (const p of conn.connection_pairs) {
    const refForFrom: ConnectionRefBuild = {
      id: p.id,
      other_position: p.to_position,
      other_label: labels[p.to_position],
      kind: p.kind,
      evidence_basis: p.evidence_basis,
      narration_zh: p.narration_at_from.voice_zh,
      narration_en: p.narration_at_from.voice_en,
    };
    const refForTo: ConnectionRefBuild = {
      id: p.id,
      other_position: p.from_position,
      other_label: labels[p.from_position],
      kind: p.kind,
      evidence_basis: p.evidence_basis,
      narration_zh: p.narration_at_to.voice_zh,
      narration_en: p.narration_at_to.voice_en,
    };

    if (p.direction === 'lateral_dialogue' || p.direction === 'inversion_counterpoint') {
      pushTo(lateral, p.from_position, refForFrom);
      pushTo(lateral, p.to_position, refForTo);
    } else {
      pushTo(outbound, p.from_position, refForFrom);   // from inspired to → from has it OUTbound
      pushTo(inbound,  p.to_position, refForTo);       // to was inspired by from → to has it INbound
    }
  }
  return { inbound, outbound, lateral };
}

interface ConnectionRefBuild {
  id: string;
  other_position: number;
  other_label: string;
  kind: string;
  evidence_basis: string;
  narration_zh: string;
  narration_en: string;
}

function pushTo<T>(m: Map<number, T[]>, k: number, v: T): void {
  const list = m.get(k) ?? [];
  list.push(v);
  m.set(k, list);
}
```

Wherever the existing build function constructs each `TrackExhibit`, after
all existing fields are set, add:

```ts
const conn = parseConnections(JSON.parse(readFileSync(CONNECTIONS, 'utf8')));
const idx = indexConnections(conn);
// ... in the per-track loop:
const rh = runRedHeartMatch(track.artist, track.song, track.album);
track.genre = GENRE_BY_POSITION[track.position] ?? null;
track.episode_focus = conn.episode_focus;
track.red_heart_tier = rh.tier;
track.red_heart_matched_seeds = rh.matched_seeds as any;
track.muted_this_episode = conn.muted_positions.includes(track.position);
track.bridge_narration_zh = track.muted_this_episode
  ? (lookupBridgeFromEpisodeJson(track.position, 'zh') ?? null)
  : null;
track.bridge_narration_en = track.muted_this_episode
  ? (lookupBridgeFromEpisodeJson(track.position, 'en') ?? null)
  : null;
track.connections_in      = idx.inbound.get(track.position)  ?? [];
track.connections_out     = idx.outbound.get(track.position) ?? [];
track.connections_lateral = idx.lateral.get(track.position)  ?? [];
```

Where `lookupBridgeFromEpisodeJson` reads the existing parsed episode object
(already in scope from `parseEpisode`) and returns the bridge text for the
muted position. Implement inline based on the JSON shape established in Task 9.

- [ ] **Step 3: Run the test to verify it passes**

Run: `cd musicos-exhibition && npm run build-data && npx vitest run tests/exhibition-json.test.ts`
Expected: PASS, including the 5 new assertions added in Step 1.

If a track fails the `connections_in ≥ 1` check, that track was never
referenced as a `to_position` in any pair — go back to Task 6 and add the
missing pair.

- [ ] **Step 4: Commit**

```bash
git add musicos-exhibition/scripts/build-exhibition-json.ts \
        musicos-exhibition/tests/exhibition-json.test.ts
git commit -m "feat(exhibition): join connections + red_heart into exhibition.json"
```

---

## Task 11: Eyeball + browser smoke test

**Files:** none modified

- [ ] **Step 1: Start the dev server**

Run: `cd musicos-exhibition && npm run dev`
Expected: vite serves on port 5173 (or printed).

- [ ] **Step 2: Open the browser and inspect at least 3 tracks**

Open `http://localhost:5173/` (or the timeline route). Check for at least
positions 1, 9, 17:
- Genre is visible
- Red-heart tier badge is visible (hit/adjacent/blind-spot)
- The new connections fields are accessible in the data (open DevTools → Network → fetch the /data/exhibition.json response → confirm `connections_in`, `connections_out`, `connections_lateral` populated)
- Devo (position 8) shows muted state with bridge text

The current React routes may not yet **render** the new fields visually —
that is a subsequent UI plan, out of scope here. The acceptance bar is
**data plumbing correctness**, not UI surfacing.

- [ ] **Step 3: Stop dev server**

Ctrl-C the dev server.

- [ ] **Step 4: Run the full vitest suite**

Run: `cd musicos-exhibition && npm test`
Expected: all tests pass (existing suite + new assertions from Tasks 1, 2, 10).

- [ ] **Step 5: Run the validator one more time**

Run:
```bash
python3 -m tools.validate_episode_connections \
  playlists/rolling-stones_some-girls_miss-you.connections.json \
  episodes/rolling-stones_some-girls_miss-you.episode.md
```
Expected: `OK`.

- [ ] **Step 6: Commit (if anything dirty) + report**

If `git status` shows clean, no commit needed. Otherwise commit with:

```bash
git commit -am "chore: post-verification snapshot"
```

Report back to user:
- Number of connection_pairs authored
- Red-heart tier distribution across the 18 tracks
- Any remaining warnings from the validator

---

## Self-Review Checklist (run after authoring all tasks)

**Spec coverage:**
- §2 two-layer architecture → Task 6 (connections.json sits next to map.json which is untouched) ✓
- §3.1 connections.json shape → Task 6 ✓
- §3.2 connection_pair shape → Task 2 (TS validator) + Task 6 (data) ✓
- §3.3 caps → Task 6 step 5 (cap check script) ✓
- §3.4 user_overrides shape → Task 4 (digest reads them) + Task 2 (TS type) ✓
- §4 TTS template → Task 9 ✓
- §5 red-heart three tiers → Task 3 (matcher) + Task 10 (wiring) ✓
- §6 calibration loop → Task 4 ✓
- §7 file changes → Tasks 1, 6, 8, 9, 10 cover all listed files ✓
- §9 acceptance criteria → Tasks 10, 11 verify ✓

**Type consistency check:** `RedHeartTier`, `ConnectionRef`, `ConnectionsFile`,
`ConnectionPair`, `ConnectionRefBuild` all defined where first used; the
build script's `ConnectionRefBuild` matches the runtime field set on
`TrackExhibit.connections_in/out/lateral` (since `ConnectionRef` from
`types.ts` is identical in shape — keep them in sync if you ever rename).

**No placeholders:** every step has either runnable code, exact commands, or
explicit content templates with examples.

**Out-of-scope (deferred to later plans):**
- React UI components rendering the new fields visually
- TTS audio synthesis from the rewritten transcripts
- User-facing override editor + persistence
- Episode 2+ (voicing / vocal phrasing / etc.)

---
