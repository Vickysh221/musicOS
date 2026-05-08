import { useEffect, useState } from 'react';

export interface FusionSubtitleSegment {
  text: string;
  start: number;
  end: number;
}

/**
 * Sentence-level segments emitted by the fusion pipeline (MiniMax-derived,
 * already offset to the fusion-output timeline). Returns null while the
 * fetch is in flight or if no sidecar exists.
 */
export function useFusionSubtitle(
  fusionUrl: string | null | undefined,
): FusionSubtitleSegment[] | null {
  const [segments, setSegments] = useState<FusionSubtitleSegment[] | null>(null);
  useEffect(() => {
    setSegments(null);
    if (!fusionUrl || !fusionUrl.endsWith('.mp3')) return;
    const subUrl = fusionUrl.slice(0, -4) + '.subtitle.json';
    let cancelled = false;
    fetch(subUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: FusionSubtitleSegment[] | null) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setSegments(data);
      })
      .catch(() => {
        /* fall back silently */
      });
    return () => {
      cancelled = true;
    };
  }, [fusionUrl]);
  return segments;
}
