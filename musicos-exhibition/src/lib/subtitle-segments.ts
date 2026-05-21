export interface SubtitleCallback {
  /** Span within the text that gets pilled. */
  start: number;
  end: number;
  /** Track this callback points to (drives pill color and click action). */
  targetPosition: number;
}

export interface PlainSeg {
  kind: 'plain';
  text: string;
}
export interface PillSeg {
  kind: 'pill';
  text: string;
  position: number;
}
export type Seg = PlainSeg | PillSeg;

/**
 * Split `text` into plain + pill segments at the callback spans. Overlapping
 * callbacks are dropped (earliest wins) so pills never collide. Shared by the
 * focal Subtitle and the ep1 timeline current-sentence so both highlight
 * connection terms identically.
 */
export function buildSubtitleSegments(text: string, callbacks: SubtitleCallback[]): Seg[] {
  if (!text) return [];
  const valid = callbacks
    .filter((c) => c.start >= 0 && c.end > c.start && c.end <= text.length)
    .slice()
    .sort((a, b) => a.start - b.start);
  const ordered: SubtitleCallback[] = [];
  let cursor = 0;
  for (const c of valid) {
    if (c.start < cursor) continue;
    ordered.push(c);
    cursor = c.end;
  }
  const segs: Seg[] = [];
  let i = 0;
  for (const c of ordered) {
    if (c.start > i) segs.push({ kind: 'plain', text: text.slice(i, c.start) });
    segs.push({ kind: 'pill', text: text.slice(c.start, c.end), position: c.targetPosition });
    i = c.end;
  }
  if (i < text.length) segs.push({ kind: 'plain', text: text.slice(i) });
  return segs;
}
