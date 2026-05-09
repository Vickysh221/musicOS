const PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [114, 172, 255],
  [255, 152, 120],
  [180, 220, 130],
  [220, 140, 220],
  [255, 200, 100],
  [140, 220, 220],
];

export function mentionColor(position: number, alpha = 1): string {
  const i = ((position % PALETTE.length) + PALETTE.length) % PALETTE.length;
  const entry = PALETTE[i] ?? PALETTE[0]!;
  const [r, g, b] = entry;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
