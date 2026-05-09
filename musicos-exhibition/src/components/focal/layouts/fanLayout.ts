import type { CardTransform } from '../../timeline/timeline-keyframes.js';

export interface FanLayoutParams {
  /** Focal disc diameter in px — slot offsets are derived from this. */
  focalDiscSize: number;
  /** Scale of expanded discs relative to focal. */
  fanScale?: number;

  // Centered mode (no expansion).
  /** Angle (deg) for the middle slot (filled first). -90° = directly above focal. */
  fanMidAngle?: number;
  /** Angular offset (deg) of side slots from the middle slot. */
  fanSideSpread?: number;
  /** Distance from focal center to expanded-disc center, in multiples of focalDiscSize. */
  fanRadius?: number;

  // Shifted mode (≥1 expanded). Focal moves out of center; expanded discs orbit
  // around it on a larger ring biased to the upper-right where there's space.
  /** Px the focal shifts horizontally when expanded (negative = left). */
  shiftX?: number;
  /** Px the focal shifts vertically when expanded (positive = down toward player). */
  shiftY?: number;
  /** Orbit radius in shifted mode, in multiples of focalDiscSize. */
  shiftedRadius?: number;
  /** Slot angles (deg) for [M, L, R] in shifted mode. Defaults bias upper-right. */
  shiftedSlotAngles?: readonly [number, number, number];
}

export interface FanLayoutArgs {
  /**
   * Expanded positions in EXPANSION ORDER (oldest first). Slot priority:
   * idx 0 → middle (M), idx 1 → left side (L), idx 2 → right side (R).
   * Anything beyond idx 2 is hidden.
   */
  expandedOrdered: number[];
  currentPosition: number;
  /** Every renderable position; positions outside the visible set get a hidden transform. */
  allPositions: number[];
  params: FanLayoutParams;
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
 * Two modes:
 *  - Centered (no expansion): focal at origin, no other discs visible.
 *  - Shifted (≥1 expanded): focal moves to bottom-left, expanded discs orbit
 *    around the focal center at a larger radius, biased to the upper-right
 *    quadrant where there's screen space above the player bar.
 *
 * Slot priority within the active mode is fixed: idx 0 = M (primary), idx 1 = L,
 * idx 2 = R — matching "先 album 2, 再 1, 再 3".
 */
export function fanLayout(args: FanLayoutArgs): Map<number, CardTransform> {
  const { expandedOrdered, currentPosition, allPositions, params } = args;
  const isShifted = expandedOrdered.length > 0;
  const scale = params.fanScale ?? 0.7;

  const focalX = isShifted ? (params.shiftX ?? -110) : 0;
  const focalY = isShifted ? (params.shiftY ?? 110) : 0;

  const radius = isShifted
    ? (params.shiftedRadius ?? 1.5) * params.focalDiscSize
    : (params.fanRadius ?? 1.0) * params.focalDiscSize;

  let slotAnglesDeg: readonly number[];
  if (isShifted) {
    // Orbit around bottom-left focal; default bias upper-right where space is.
    slotAnglesDeg = params.shiftedSlotAngles ?? [-45, -90, 0];
  } else {
    const midDeg = params.fanMidAngle ?? -90;
    const spread = params.fanSideSpread ?? 60;
    slotAnglesDeg = [midDeg, midDeg - spread, midDeg + spread];
  }

  const out = new Map<number, CardTransform>();
  for (const p of allPositions) {
    if (p === currentPosition) {
      out.set(p, {
        x: focalX,
        y: focalY,
        z: 0,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        opacity: 1,
        scale: 1,
      });
      continue;
    }
    const slotIdx = expandedOrdered.indexOf(p);
    if (slotIdx === -1 || slotIdx >= slotAnglesDeg.length) {
      out.set(p, HIDDEN);
      continue;
    }
    const a = (slotAnglesDeg[slotIdx]! * Math.PI) / 180;
    out.set(p, {
      x: focalX + Math.cos(a) * radius,
      y: focalY + Math.sin(a) * radius,
      z: -40,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      opacity: 1,
      scale,
    });
  }
  return out;
}
