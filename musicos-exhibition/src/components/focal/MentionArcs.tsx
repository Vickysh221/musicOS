import { AnimatePresence, motion } from 'framer-motion';
import { mentionColor } from '../../lib/mention-colors.js';
import type { TrackExhibit } from '../../types.js';
import './mention-arcs.css';

interface Props {
  /** Currently-pinned callback targets, in deterministic order. */
  tracks: TrackExhibit[];
  /** Current focal disc diameter in px (arcs orbit just outside this). */
  discSize: number;
  onArcClick: (position: number) => void;
  /** Fade the orbit out when the transcript is expanded for reading. */
  dimmed?: boolean;
}

const STROKE = 26;
const TEXT_FONT_SIZE = 11;
const RADIUS_GAP = 22;

function arcPath(
  centerDeg: number,
  spanDeg: number,
  r: number,
  cx: number,
  cy: number,
): { d: string } {
  const centerNorm = ((centerDeg % 360) + 360) % 360;
  // SVG y-axis is down: angles in (0°, 180°) put the arc midpoint in the lower
  // hemisphere, where text along a clockwise path would render upside-down.
  // Flip the sweep so the text baseline stays upright.
  const flipped = centerNorm > 0 && centerNorm < 180;
  const a1Deg = flipped ? centerDeg + spanDeg / 2 : centerDeg - spanDeg / 2;
  const a2Deg = flipped ? centerDeg - spanDeg / 2 : centerDeg + spanDeg / 2;
  const sweep = flipped ? 0 : 1;
  const sa = (a1Deg * Math.PI) / 180;
  const ea = (a2Deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(sa);
  const y1 = cy + r * Math.sin(sa);
  const x2 = cx + r * Math.cos(ea);
  const y2 = cy + r * Math.sin(ea);
  return { d: `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}` };
}

/**
 * For 1 arc: sit on top. For 2: top + bottom. For 3+: distribute evenly,
 * starting from -90° (12 o'clock) and rotating clockwise.
 */
function arcCenters(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [-90];
  const step = 360 / n;
  return Array.from({ length: n }, (_, i) => -90 + i * step);
}

export function MentionArcs({ tracks, discSize, onArcClick, dimmed = false }: Props) {
  const r = discSize / 2 + RADIUS_GAP;
  const padding = STROKE / 2 + 18;
  const half = r + padding;
  const cx = half;
  const cy = half;
  const size = half * 2;

  const N = tracks.length;
  const centers = arcCenters(N);
  const sliceDeg = N > 0 ? 360 / N : 360;
  const gapDeg = N <= 1 ? 0 : Math.min(28, sliceDeg * 0.28);
  const spanDeg = N === 1 ? 110 : Math.min(150, Math.max(38, sliceDeg - gapDeg));

  return (
    <svg
      className={`mention-arcs${dimmed ? ' mention-arcs--dimmed' : ''}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ marginLeft: -size / 2, marginTop: -size / 2 }}
      aria-hidden={N === 0}
    >
      <AnimatePresence>
        {tracks.map((track, i) => {
          const centerDeg = centers[i] ?? -90;
          const { d } = arcPath(centerDeg, spanDeg, r, cx, cy);
          const pathId = `mention-arc-${track.position}`;
          const gradId = `mention-arc-grad-${track.position}`;
          return (
            <motion.g
              key={track.position}
              className="mention-arcs__arc"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              onClick={() => onArcClick(track.position)}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              <defs>
                <path id={pathId} d={d} fill="none" />
                {/* Vertical gradient (top→bottom) of the mention color so each
                 * arc reads as a tinted glass band, not a flat stroke. */}
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={mentionColor(track.position, 0.5)} />
                  <stop offset="100%" stopColor={mentionColor(track.position, 0.18)} />
                </linearGradient>
              </defs>
              {/* Glass base — white-translucent, gives the liquid-glass tint. */}
              <path
                d={d}
                stroke="rgba(255, 255, 255, 0.18)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
              />
              {/* Color gradient overlay. */}
              <path
                d={d}
                stroke={`url(#${gradId})`}
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
              />
              <text
                fontSize={TEXT_FONT_SIZE}
                fill="#fff"
                fontWeight={500}
                letterSpacing="0.3"
              >
                <textPath
                  href={`#${pathId}`}
                  startOffset="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {track.song}
                </textPath>
              </text>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
}
