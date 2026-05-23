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
  frozen: boolean; // a cover is hovered — stop drift across the whole canvas
  offsetX: number; // px translate: mouse parallax (idle) or gather pull (hover)
  offsetY: number;
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
  frozen,
  offsetX,
  offsetY,
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
    reducedMotion || exit || frozen ? 'floating-cover--still' : '',
    dimmed && !active ? 'floating-cover--dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Cover swap = a vertical-axis (rotateY) card flip: the old face turns edge-on
  // while the new face turns in. Staggered by slot so the swap ripples across the
  // canvas. Reduced motion collapses it to an instant opacity swap.
  const flipTransition: Transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.4, 0, 0.2, 1], delay: (slot.previewIndex % 14) * 0.018 };
  const flipInitial = reducedMotion ? { opacity: 0 } : { rotateY: -90, opacity: 0 };
  const flipAnimate = reducedMotion ? { opacity: 1 } : { rotateY: 0, opacity: 1 };
  const flipExit = reducedMotion ? { opacity: 0 } : { rotateY: 90, opacity: 0 };

  return (
    <motion.div
      className={className}
      style={style}
      initial={false}
      // left/top = base slot position (tweened for the exit collapse); x/y = the
      // parallax/gather translate offset layered on top via transform.
      animate={{
        left: exit ? `${exit.xPct}%` : `${slot.xPct}%`,
        top: exit ? `${exit.yPct}%` : `${slot.yPct}%`,
        x: exit ? 0 : offsetX,
        y: exit ? 0 : offsetY,
        scale: active ? 1.14 : 1,
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
          <AnimatePresence initial={false}>
            <motion.img
              key={cover}
              className="floating-cover__art"
              src={assetUrl(cover)}
              alt=""
              draggable={false}
              initial={flipInitial}
              animate={flipAnimate}
              exit={flipExit}
              transition={flipTransition}
            />
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
