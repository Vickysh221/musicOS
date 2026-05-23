import { AnimatePresence, motion, type MotionStyle, type Transition } from 'framer-motion';
import { assetUrl } from '../../lib/asset-url.js';
import type { Slot } from './home-layout.js';
import './floating-cover.css';

const HOVER_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26, mass: 0.6 };

export interface ExitTarget {
  xPct: number;
  yPct: number;
  rotateDeg: number;
}

interface Props {
  slot: Slot;
  cover: string;
  active: boolean; // this slot is the hovered one
  dimmed: boolean; // some other slot is hovered
  reducedMotion: boolean;
  exit: ExitTarget | null; // ep1/ep4 stacking exit target, or null
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

export function FloatingCover({
  slot,
  cover,
  active,
  dimmed,
  reducedMotion,
  exit,
  onHover,
  onLeave,
  onClick,
}: Props) {
  // CSS custom properties are not in MotionStyle's strict type under exactOptionalPropertyTypes;
  // double-assert so TypeScript accepts the custom-prop record without error.
  const style = {
    '--size': `${slot.sizePx}px`,
    '--drift-dur': `${slot.driftDurSec}s`,
    '--drift-delay': `${slot.driftDelaySec}s`,
    '--drift-rot': `${slot.rotateDeg}deg`,
    zIndex: active ? 50 : slot.depth + 10,
  } as unknown as MotionStyle;

  const className = [
    'floating-cover',
    `floating-cover--depth-${slot.depth}`,
    reducedMotion || exit ? 'floating-cover--still' : '',
    dimmed && !active ? 'floating-cover--dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      className={className}
      style={style}
      initial={false}
      // left/top tween directly (not via layout prop) — fine for a one-shot exit collapse
      animate={{
        left: exit ? `${exit.xPct}%` : `${slot.xPct}%`,
        top: exit ? `${exit.yPct}%` : `${slot.yPct}%`,
        scale: active ? 1.12 : 1,
        rotate: exit ? exit.rotateDeg : 0,
      }}
      transition={HOVER_SPRING}
    >
      {/* drift wrapper: CSS keyframes own continuous float; motion.div above owns hover/exit */}
      <div className="floating-cover__drift">
        <button
          type="button"
          className="floating-cover__inner"
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          onClick={onClick}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={cover}
              className="floating-cover__art"
              src={assetUrl(cover)}
              alt=""
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
