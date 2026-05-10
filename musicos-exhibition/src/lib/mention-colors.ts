// Color is keyed by SLOT (the order an outgoing mention appears in the focal
// song's narration), not by absolute track position. A focal song may pin at
// most MAX_MENTION_SLOTS outgoing connections, so each arc/pill in the same
// focal context is guaranteed a distinct color.
const PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [114, 172, 255], // cool blue
  [255, 152, 120], // warm peach
  [180, 220, 130], // sage green
  [220, 140, 220], // soft violet
];

export const MAX_MENTION_SLOTS = PALETTE.length;

export function mentionColor(slot: number, alpha = 1): string {
  const i = ((slot % PALETTE.length) + PALETTE.length) % PALETTE.length;
  const entry = PALETTE[i] ?? PALETTE[0]!;
  const [r, g, b] = entry;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
