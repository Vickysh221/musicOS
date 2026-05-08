import type { CardTransform } from '../../timeline/timeline-keyframes.js';

export interface HorizontalCarouselParams {
  arcSpacing: number;
  arcDepth: number;
  arcRotStep: number;
  carouselScale: number;
  carouselRotX: number;
}

export interface HorizontalCarouselArgs {
  allPositions: number[];
  currentPosition: number;
  params: HorizontalCarouselParams;
}

/**
 * Horizontal carousel layout — all positions visible, parabolic z-recession
 * around the playing card. Same vocabulary as arcLayout but applied to the
 * full episode and tunable to a smaller scale.
 */
export function horizontalCarouselLayout(
  args: HorizontalCarouselArgs,
): Map<number, CardTransform> {
  const { allPositions, currentPosition, params } = args;
  const out = new Map<number, CardTransform>();
  const sorted = [...allPositions].sort((a, b) => a - b);
  const playingIdx = sorted.indexOf(currentPosition);
  const halfSpan = Math.max(1, Math.floor(sorted.length / 2));
  sorted.forEach((p, i) => {
    const rel = i - (playingIdx === -1 ? 0 : playingIdx);
    const x = rel * params.arcSpacing;
    const z = -params.arcDepth * rel * rel;
    const rotY = -rel * params.arcRotStep;
    const opacity = Math.max(0.15, 1 - (Math.abs(rel) / halfSpan) * 0.7);
    out.set(p, {
      x,
      y: 0,
      z,
      rotX: params.carouselRotX,
      rotY,
      rotZ: 0,
      opacity,
      scale: params.carouselScale,
    });
  });
  return out;
}
