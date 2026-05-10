import { AnimatePresence, motion } from 'framer-motion';
import { mentionColor } from '../../lib/mention-colors.js';
import type { TrackExhibit } from '../../types.js';
import './mention-arcs.css';

interface Props {
  /** Currently-pinned callback targets, in mention order. Color slot = index. */
  tracks: TrackExhibit[];
  /** Current focal disc diameter in px (arcs orbit just outside this). */
  discSize: number;
  onArcClick: (position: number) => void;
  /** Fade the orbit out when the transcript is expanded for reading. */
  dimmed?: boolean;
}

const STROKE = 26;
const TEXT_FONT_SIZE = 13;
const RADIUS_GAP = 22;
const HALO_FILTER_ID = 'mention-arc-halo';

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
      <defs>
        {/* Shared halo: a Gaussian blur applied to the colored ghost text
         * underneath each label, producing the "diffused light" behind the
         * letters without darkening the glass band itself. */}
        <filter id={HALO_FILTER_ID} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>
      <AnimatePresence>
        {tracks.map((track, i) => {
          const centerDeg = centers[i] ?? -90;
          const { d } = arcPath(centerDeg, spanDeg, r, cx, cy);
          const pathId = `mention-arc-${track.position}`;
          const textColor = mentionColor(i, 1);
          const haloColor = mentionColor(i, 0.85);
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
              </defs>
              {/* Frosted-glass band — pure white translucent stroke. The
               * BackgroundShader behind the focal stage shows through, giving
               * the band its glass read; color lives only in the text. */}
              <path
                d={d}
                stroke="rgba(255, 255, 255, 0.22)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
              />
              {/* Diffused color halo behind the letters — colored ghost layer
               * blurred via the shared filter. Drawn first so the sharp text
               * sits cleanly on top. */}
              <text
                fontSize={TEXT_FONT_SIZE}
                fill={haloColor}
                fontWeight={600}
                letterSpacing="0.3"
                filter={`url(#${HALO_FILTER_ID})`}
              >
                <textPath
                  href={`#${pathId}`}
                  startOffset="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  alignmentBaseline="central"
                >
                  {track.song}
                </textPath>
              </text>
              {/* Sharp, fully-saturated label on top. */}
              <text
                fontSize={TEXT_FONT_SIZE}
                fill={textColor}
                fontWeight={600}
                letterSpacing="0.3"
              >
                <textPath
                  href={`#${pathId}`}
                  startOffset="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  alignmentBaseline="central"
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
