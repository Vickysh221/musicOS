export interface CardTransform {
  x: number;       // px from container center
  y: number;       // px from container center (positive = down)
  z: number;       // px in 3D space (negative = away from camera)
  rotX: number;    // degrees
  rotY: number;    // degrees
  rotZ: number;    // degrees
  opacity: number; // 0..1
}

// Deterministic pseudo-random in [-1, 1] from an integer seed.
// Used so card rotations look "hand-placed" but stable across renders.
function seededJitter(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return (x - Math.floor(x)) * 2 - 1;
}

const ARC_RADIUS_X = 520;   // px — half-width of the constellation fan
const ARC_DROP_Y = 180;     // px — how far edge cards drop below center
const SEQ_SPACING = 56;     // px between card centers in sequence row
const PROC_TILT_DEG = 28;   // tilt angle of procession state
const PROC_DEPTH_SCALE = 8; // px translateZ per card index in procession

export function constellationTransform(params: {
  index: number;
  total: number;
  anchorIndex: number;
}): CardTransform {
  const { index, total, anchorIndex } = params;
  if (index === anchorIndex) {
    return { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, opacity: 1 };
  }
  // Position relative to anchor on a normalized arc parameter u in [-1, 1].
  const half = Math.max(anchorIndex, total - 1 - anchorIndex, 1);
  const u = (index - anchorIndex) / half;
  const x = u * ARC_RADIUS_X;
  // Parabolic dip: y = ARC_DROP_Y * u^2
  const y = ARC_DROP_Y * u * u;
  const rotZ = 15 * seededJitter(index); // hand-placed feel, in [-15, 15]
  return { x, y, z: 0, rotX: 0, rotY: 0, rotZ, opacity: 0.7 };
}

export function sequenceTransform(params: {
  index: number;
  total: number;
}): CardTransform {
  const { index, total } = params;
  const center = (total - 1) / 2;
  const x = (index - center) * SEQ_SPACING;
  const rotZ = 8 * seededJitter(index + 1000); // small uniform-ish jitter
  return { x, y: 0, z: 0, rotX: 0, rotY: 0, rotZ, opacity: 0.85 };
}

export function processionTransform(params: {
  index: number;
  total: number;
}): CardTransform {
  const { index, total } = params;
  const seq = sequenceTransform({ index, total });
  const center = (total - 1) / 2;
  const depthFromCenter = Math.abs(index - center);
  return {
    x: seq.x,
    y: 0,
    z: -depthFromCenter * PROC_DEPTH_SCALE,
    rotX: PROC_TILT_DEG,
    rotY: 0,
    rotZ: seq.rotZ * 0.5,
    opacity: 0.9,
  };
}

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

function lerpTransform(a: CardTransform, b: CardTransform, u: number): CardTransform {
  return {
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u),
    z: lerp(a.z, b.z, u),
    rotX: lerp(a.rotX, b.rotX, u),
    rotY: lerp(a.rotY, b.rotY, u),
    rotZ: lerp(a.rotZ, b.rotZ, u),
    opacity: lerp(a.opacity, b.opacity, u),
  };
}

// progress in [0, 1] across the whole scroll range.
// 0..0.33 = CONSTELLATION → SEQUENCE
// 0.33..0.66 = SEQUENCE (hold then transition)
// 0.66..1.0 = SEQUENCE → PROCESSION
export function cardTransform(params: {
  index: number;
  total: number;
  anchorIndex: number;
  progress: number;
}): CardTransform {
  const { index, total, anchorIndex, progress } = params;
  const p = Math.max(0, Math.min(1, progress));
  const a = constellationTransform({ index, total, anchorIndex });
  const b = sequenceTransform({ index, total });
  const c = processionTransform({ index, total });

  if (p <= 0.5) {
    const u = p / 0.5; // 0..1 across constellation→sequence
    return lerpTransform(a, b, u);
  }
  const u = (p - 0.5) / 0.5; // 0..1 across sequence→procession
  return lerpTransform(b, c, u);
}
