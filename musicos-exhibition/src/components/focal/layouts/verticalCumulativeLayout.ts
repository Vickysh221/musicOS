import type { CardTransform } from '../../timeline/timeline-keyframes.js';

export interface VerticalCumulativeParams {
  verticalSpacing: number;
  verticalDepth: number;
  verticalShrink: number;
  verticalFade: number;
  verticalRotX: number;
  verticalRotY: number;
  verticalOffsetX: number;
  focalOffsetY: number;
}

export interface VerticalCumulativeArgs {
  /** Sorted ascending (chronological) — earliest mentioned first. */
  mentioned: number[];
  currentPosition: number;
  /** Every renderable position; positions outside the visible set get a hidden transform. */
  allPositions: number[];
  params: VerticalCumulativeParams;
}

const HIDDEN: CardTransform = {
  x: 0,
  y: 0,
  z: -400,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  opacity: 0,
  scale: 0.6,
};

/**
 * Vertical cumulative layout: focal disc at origin, mentioned discs stacked
 * upward in chronological order with perspective recession. Positions outside
 * `mentioned ∪ {currentPosition}` get a hidden transform so framer-motion can
 * animate them in/out cleanly.
 */
export function verticalCumulativeLayout(
  args: VerticalCumulativeArgs,
): Map<number, CardTransform> {
  const { mentioned, currentPosition, allPositions, params } = args;
  const out = new Map<number, CardTransform>();
  for (const p of allPositions) {
    if (p === currentPosition) {
      out.set(p, { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, opacity: 1, scale: 1 });
      continue;
    }
    const idxFromBottom = mentioned.indexOf(p);
    if (idxFromBottom === -1) {
      out.set(p, HIDDEN);
      continue;
    }
    // mentioned[0] is earliest. We want earliest at top, so distance from focal
    // grows as we go backward in `mentioned`.
    const i = mentioned.length - idxFromBottom; // 1..mentioned.length
    out.set(p, {
      x: i * params.verticalOffsetX,
      y: -params.focalOffsetY - i * params.verticalSpacing,
      z: -i * params.verticalDepth,
      rotX: params.verticalRotX,
      rotY: params.verticalRotY,
      rotZ: 0,
      opacity: Math.max(0.35, 1 - i * params.verticalFade),
      scale: Math.max(0.4, 1 - i * params.verticalShrink),
    });
  }
  return out;
}
