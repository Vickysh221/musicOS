const CALLBACK_MARKERS = ['你刚才', '刚才', '之前', '早些时候', '前面', '上一首', '上一个'];
const PROXIMITY_CHARS = 8;

export interface DetectOptions {
  /** Allow plain substring match when no marker is anywhere in the sentence. */
  allowPlain?: boolean;
  /** Include forward references (positions >= currentPosition). Default: backward only. */
  anyDirection?: boolean;
}

/**
 * Returns the set of exhibit positions referenced as callbacks in `text`.
 *
 * Rules:
 *  - Position 0 (opening) excluded.
 *  - By default only positions strictly less than `currentPosition`; pass
 *    `anyDirection: true` to also catch forward intros.
 *  - Alias must appear within PROXIMITY_CHARS chars of a callback marker.
 *  - If no marker is in the sentence and options.allowPlain is true, fall back
 *    to plain substring (graceful degradation).
 */
export function detectCallbacks(
  text: string,
  currentPosition: number,
  aliases: Record<number, string[]>,
  options: DetectOptions = {},
): Set<number> {
  const out = new Set<number>();
  const markerHits: number[] = [];
  for (const m of CALLBACK_MARKERS) {
    let i = text.indexOf(m);
    while (i !== -1) {
      markerHits.push(i);
      i = text.indexOf(m, i + 1);
    }
  }
  const hasMarker = markerHits.length > 0;
  const allowPlain = options.allowPlain === true && !hasMarker;

  for (const [posStr, aliasList] of Object.entries(aliases)) {
    const pos = Number(posStr);
    if (pos === 0) continue;
    if (pos === currentPosition) continue;
    if (!options.anyDirection && pos >= currentPosition) continue;
    for (const a of aliasList) {
      const idx = text.indexOf(a);
      if (idx === -1) continue;
      if (hasMarker) {
        const near = markerHits.some((m) => Math.abs(m - idx) <= PROXIMITY_CHARS + a.length);
        if (near) {
          out.add(pos);
          break;
        }
      } else if (allowPlain) {
        out.add(pos);
        break;
      }
    }
  }
  return out;
}
