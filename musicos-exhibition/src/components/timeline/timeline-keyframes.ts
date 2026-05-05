export interface CardTransform {
  x: number;       // px from container center (positive = right)
  y: number;       // px from container center (positive = down). Procession lifts cards => y < 0 toward upper-right.
  z: number;       // px in 3D space (positive = toward camera)
  rotZ: number;    // degrees of in-plane rotation (hand-placed jitter)
  opacity: number; // 0..1
  scale: number;   // size multiplier (focal card is enlarged)
}

// Deterministic pseudo-random in [-1, 1] from an integer seed.
// Used so card rotations look "hand-placed" but stable across renders.
export function seededJitter(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return (x - Math.floor(x)) * 2 - 1;
}

const X_STEP = 56;          // px between adjacent card centers (procession is tight; ~60% overlap of 150px cards)
const Y_RISE_PER_STEP = 18; // px each subsequent card rises (negative y)
const Z_STEP = 10;          // px each subsequent card pulls toward camera
const JITTER_DEG = 6;       // hand-placed rotation range for non-focal cards
const FOCAL_OPACITY = 1;
const DIM_OPACITY = 0.5;
const FOCAL_SCALE = 1.05;
const FOCAL_LIFT = 12;      // px translateY lift on focal card

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
}): CardTransform {
  const { index, total, anchorIndex, hoveredIndex } = params;
  const focalIndex = hoveredIndex ?? anchorIndex;
  const isFocal = index === focalIndex;

  const center = (total - 1) / 2;
  const offset = index - center;

  const x = offset * X_STEP;
  // Cards rise (negative y) as index increases, producing a diagonal up-right march.
  const baseY = -offset * Y_RISE_PER_STEP;
  const y = isFocal ? baseY - FOCAL_LIFT : baseY;
  const z = offset * Z_STEP + (isFocal ? 40 : 0);
  const rotZ = isFocal ? 0 : JITTER_DEG * seededJitter(index + 1);
  const opacity = hoveredIndex === null
    ? (isFocal ? FOCAL_OPACITY : 0.8)
    : (isFocal ? FOCAL_OPACITY : DIM_OPACITY);
  const scale = isFocal ? FOCAL_SCALE : 1;

  return { x, y, z, rotZ, opacity, scale };
}
