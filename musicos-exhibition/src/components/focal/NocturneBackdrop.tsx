import './nocturne-backdrop.css';

/**
 * Nocturne register backdrop — the "one screen on in a dark room" substrate
 * for ep2. Per Nocturne/DESIGN.md it's intentionally NOT a shader: a near-black
 * warm-tinted void (#0A0A12), a bottom-anchored radial wash of `electric` at
 * 0.18 to suggest a light source rising into the rotor, and an offscreen
 * planet bleed from the upper-right at 0.28. Everything composes from CSS
 * gradients; no WebGL, no canvas, no per-frame work.
 *
 * Sits behind .focal-scene's content with pointer-events: none.
 */
export function NocturneBackdrop() {
  return <div className="nocturne-backdrop" aria-hidden="true" />;
}
