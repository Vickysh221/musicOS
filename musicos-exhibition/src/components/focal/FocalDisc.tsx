import { motion, type Transition } from 'framer-motion';
import { assetUrl } from '../../lib/asset-url.js';
import type { TrackExhibit } from '../../types.js';
import type { CardTransform } from '../timeline/timeline-keyframes.js';
import './focal-disc.css';

interface Props {
  track: TrackExhibit;
  transform: CardTransform;
  zIndex: number;
  isFocal: boolean;
  size?: number;
  /** When true, the focal vinyl spins. No-op on non-focal discs. */
  playing?: boolean;
  onClick?: () => void;
  transition?: Transition;
}

const DEFAULT_TRANSITION: Transition = { type: 'spring', stiffness: 220, damping: 26, mass: 0.6 };

export function FocalDisc({ track, transform, zIndex, isFocal, size, playing = false, onClick, transition }: Props) {
  const { x, y, z, rotX, rotY, rotZ, opacity, scale } = transform;
  const styleVars = size != null ? { ['--disc-size' as string]: `${size}px` } : undefined;
  const className = [
    'focal-disc',
    isFocal && 'focal-disc--focal',
    isFocal && playing && 'focal-disc--playing',
  ]
    .filter(Boolean)
    .join(' ');
  const art = (
    <div className="focal-disc__art">
      {track.album_cover_url ? (
        <img src={assetUrl(track.album_cover_url)} alt="" />
      ) : (
        <div className="focal-disc__art-placeholder" />
      )}
    </div>
  );
  return (
    <motion.button
      type="button"
      layoutId={`disc-${track.position}`}
      className={className}
      style={{ zIndex, ...styleVars }}
      animate={{ x, y, z, rotateX: rotX, rotateY: rotY, rotateZ: rotZ, scale, opacity }}
      transition={transition ?? DEFAULT_TRANSITION}
      onClick={onClick}
      aria-label={`${track.position}. ${track.artist} — ${track.song}`}
    >
      {isFocal ? <div className="focal-disc__spinner">{art}</div> : art}
      {isFocal && <div className="focal-disc__shimmer" aria-hidden="true" />}
      {isFocal && (
        <div className="focal-disc__label">
          <span className="focal-disc__song">{track.song}</span>
          <span className="focal-disc__artist">{track.artist}</span>
        </div>
      )}
    </motion.button>
  );
}
