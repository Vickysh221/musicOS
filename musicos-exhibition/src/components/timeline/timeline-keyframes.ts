import type { TuningParams } from '../../store/tuning.js';

export interface CardTransform {
  x: number;       // px from container center (positive = right)
  y: number;       // px from container center (positive = down). Procession lifts cards => y < 0 toward upper-right.
  z: number;       // px in 3D space (positive = toward camera)
  rotX: number;    // degrees around horizontal axis
  rotY: number;    // degrees around vertical axis
  rotZ: number;    // degrees of in-plane rotation (hand-placed jitter)
  opacity: number; // 0..1
  scale: number;   // size multiplier (focal card is enlarged)
}

// Deterministic pseudo-random in [-1, 1] from an integer seed.
export function seededJitter(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return (x - Math.floor(x)) * 2 - 1;
}

const FOCAL_OPACITY = 1;
const DIM_OPACITY = 0.5;

/**
 * Single static layout for the procession state. Cards march left-to-right,
 * rising and approaching the camera as index increases. The focal card
 * (hovered, or anchor when nothing hovered) is brightened, lifted, scaled,
 * and stripped of jitter rotation.
 */
export function processionLayout(params: {
  index: number;
  total: number;
  anchorIndex: number;
  hoveredIndex: number | null;
  tuning: TuningParams;
}): CardTransform {
  const { index, total, anchorIndex, hoveredIndex, tuning } = params;
  const focalIndex = hoveredIndex ?? anchorIndex;
  const isFocal = index === focalIndex;

  const center = (total - 1) / 2;
  const offset = index - center;

  const x = offset * tuning.gapX;
  const baseY = -offset * tuning.riseY;
  const y = isFocal ? baseY - tuning.focalLift : baseY;
  const z = offset * tuning.stepZ + (isFocal ? tuning.focalZBoost : 0);
  const rotX = tuning.cardRotX;
  const rotY = tuning.cardRotY;
  const rotZ = isFocal ? 0 : tuning.jitterDeg * seededJitter(index + 1);
  const opacity = hoveredIndex === null
    ? (isFocal ? FOCAL_OPACITY : 0.8)
    : (isFocal ? FOCAL_OPACITY : DIM_OPACITY);
  const scale = isFocal ? tuning.focalScale : 1;

  return { x, y, z, rotX, rotY, rotZ, opacity, scale };
}
