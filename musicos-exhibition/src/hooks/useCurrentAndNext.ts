import { useMemo } from 'react';
import type { FusionSubtitleSegment } from './useFusionSubtitle.js';

export interface CurrentAndNext {
  current: FusionSubtitleSegment | null;
  next: FusionSubtitleSegment | null;
  currentIdx: number;
}

export function useCurrentAndNext(
  segments: FusionSubtitleSegment[] | null,
  currentTime: number,
): CurrentAndNext {
  return useMemo(() => {
    if (!segments || segments.length === 0) {
      return { current: null, next: null, currentIdx: -1 };
    }
    let idx = -1;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg && currentTime >= seg.start && currentTime < seg.end) {
        idx = i;
        break;
      }
    }
    // If we're between segments (gap), keep the most recently passed segment
    // as "current" so the line doesn't blank out.
    if (idx === -1) {
      for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        if (seg && currentTime >= seg.start) {
          idx = i;
          break;
        }
      }
    }
    if (idx === -1) {
      return { current: null, next: segments[0] ?? null, currentIdx: -1 };
    }
    return {
      current: segments[idx] ?? null,
      next: segments[idx + 1] ?? null,
      currentIdx: idx,
    };
  }, [segments, currentTime]);
}
