import type { Exhibit, TrackExhibit } from '../types.js';

const TERMINATORS = ['——', '。', '！', '？', '!', '?', '；', ';', '\n'];

interface ConnectionParse {
  from: number;
  to: number;
}

function parseConnectionId(id: string | null | undefined): ConnectionParse | null {
  if (!id) return null;
  const m = /^conn_(\d+)_to_(\d+)/.exec(id);
  if (!m) return null;
  return { from: Number(m[1]), to: Number(m[2]) };
}

/**
 * Collect every position that connects INTO `focalPos`. Pulls from each
 * track's `strong_connection_id` (the primary outgoing edge) AND from the
 * focal track's `archived_weak_connections` (edges that were demoted to
 * "redundant_with_strong" but are still woven into the narration). Returns
 * positions sorted ascending so callers can iterate deterministically.
 */
export function findCallbackTargets(exhibits: Exhibit[], focalPos: number): number[] {
  const ids = new Set<string>();
  for (const e of exhibits) {
    if (e.kind !== 'track') continue;
    if (e.strong_connection_id) ids.add(e.strong_connection_id);
    if (e.position === focalPos) {
      for (const a of e.archived_weak_connections ?? []) {
        if (a.connection_id) ids.add(a.connection_id);
      }
    }
  }
  const out = new Set<number>();
  for (const id of ids) {
    const p = parseConnectionId(id);
    if (!p) continue;
    if (p.to !== focalPos) continue;
    if (p.from === focalPos) continue;
    if (p.from <= 0) continue;
    out.add(p.from);
  }
  return [...out].sort((a, b) => a - b);
}

export interface CandidateAlias {
  position: number;
  aliases: string[];
}

export interface PhraseHit {
  start: number;
  end: number;
  phrase: string;
  targetPosition: number;
}

/**
 * Build alias lookup for a candidate position by combining a curated alias
 * table (when the position has an entry) with the track's artist + song.
 */
export function aliasesForPosition(
  position: number,
  tracks: TrackExhibit[],
  curated: Record<number, string[]> = {},
): string[] {
  const result = new Set<string>();
  for (const a of curated[position] ?? []) result.add(a);
  const t = tracks.find((x) => x.position === position);
  if (t) {
    if (t.song) result.add(t.song);
    if (t.artist) result.add(t.artist);
  }
  // Longer aliases first so e.g. "Black Sabbath" wins over "Sabbath".
  return [...result].sort((a, b) => b.length - a.length);
}

function splitClauses(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let start = 0;
  let i = 0;
  while (i < text.length) {
    let matched = '';
    for (const t of TERMINATORS) {
      if (text.startsWith(t, i)) {
        matched = t;
        break;
      }
    }
    if (matched) {
      out.push([start, i]);
      i += matched.length;
      start = i;
    } else {
      i++;
    }
  }
  if (start < text.length) out.push([start, text.length]);
  return out;
}

/**
 * For each clause in `text`, emit at most one PhraseHit pointing to the
 * candidate whose alias appears earliest in the clause. Clauses with no
 * candidate alias are silent.
 */
export function findCallbackPhrases(
  text: string,
  candidates: CandidateAlias[],
): PhraseHit[] {
  if (!text || candidates.length === 0) return [];
  const hits: PhraseHit[] = [];
  for (const [s, e] of splitClauses(text)) {
    const slice = text.slice(s, e);
    if (!slice.trim()) continue;
    let bestPos = -1;
    let bestIdx = Infinity;
    for (const c of candidates) {
      for (const a of c.aliases) {
        if (!a) continue;
        const idx = slice.indexOf(a);
        if (idx === -1) continue;
        if (idx < bestIdx) {
          bestIdx = idx;
          bestPos = c.position;
        }
      }
    }
    if (bestPos === -1) continue;
    let ps = s;
    while (ps < e && /\s/.test(text[ps] ?? '')) ps++;
    hits.push({ start: ps, end: e, phrase: text.slice(ps, e), targetPosition: bestPos });
  }
  return hits;
}
