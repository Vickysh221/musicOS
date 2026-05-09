/**
 * Split a transcript body into paragraphs (blank-line separated). Empty
 * paragraphs are dropped.
 */
export function splitParagraphs(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Compute each paragraph's start time (seconds) by allocating `duration`
 * proportionally to character count. The first paragraph always starts at 0.
 */
export function paragraphStartTimes(paragraphs: string[], duration: number): number[] {
  if (paragraphs.length === 0 || duration <= 0) return paragraphs.map(() => 0);
  const totalChars = paragraphs.reduce((sum, s) => sum + s.length, 0);
  if (totalChars === 0) return paragraphs.map(() => 0);
  let elapsed = 0;
  return paragraphs.map((s) => {
    const t = elapsed;
    elapsed += (s.length / totalChars) * duration;
    return t;
  });
}

/**
 * Returns the index of the most-recently-passed paragraph for `currentTime`.
 * Defaults to 0 before the first paragraph's start time.
 */
export function activeParagraphIdx(startTimes: number[], currentTime: number): number {
  let idx = 0;
  for (let i = 0; i < startTimes.length; i++) {
    if (currentTime >= startTimes[i]!) idx = i;
  }
  return idx;
}

interface TimedSegment {
  text: string;
  start: number;
  end: number;
}

/**
 * For each fusion-pipeline subtitle segment (sentence-level, with real audio
 * timestamps), return the index of the paragraph that contains it. The
 * mapping is monotonic: once a segment lands in paragraph P, later segments
 * map to P or later paragraphs, never earlier.
 *
 * Why this exists: paragraphs are the display unit; MiniMax-derived segments
 * are sentence-level (1:N per paragraph). To drive the paragraph UI off real
 * audio time, the caller looks up the active segment via existing
 * useCurrentAndNext logic, then translates segment index → paragraph index
 * through this map.
 *
 * Matching uses the segment's first ~8 chars as a signature. If a segment
 * cannot be located in any forward paragraph, it inherits the previous
 * segment's paragraph (best-effort, never throws).
 */
export function buildSegmentToParagraphMap(
  paragraphs: string[],
  segments: TimedSegment[],
): number[] {
  if (segments.length === 0) return [];
  if (paragraphs.length === 0) return segments.map(() => -1);
  const SIG = 8;
  const map: number[] = new Array(segments.length).fill(0);
  let cursor = 0;
  for (let s = 0; s < segments.length; s++) {
    const sig = segments[s]!.text.slice(0, SIG);
    if (paragraphs[cursor]?.includes(sig)) {
      map[s] = cursor;
      continue;
    }
    let found = -1;
    for (let p = cursor + 1; p < paragraphs.length; p++) {
      if (paragraphs[p]!.includes(sig)) {
        found = p;
        break;
      }
    }
    if (found >= 0) {
      cursor = found;
      map[s] = found;
    } else {
      map[s] = cursor;
    }
  }
  return map;
}
