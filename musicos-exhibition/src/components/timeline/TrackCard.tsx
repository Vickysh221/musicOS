import { motion } from 'framer-motion';
import type { TrackExhibit } from '../../types.js';
import type { CardTransform } from './timeline-keyframes.js';

interface Props {
  track: TrackExhibit;
  transform: CardTransform;
  isFocal: boolean;
  zIndex: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function TrackCard({ track, transform, isFocal, zIndex, onMouseEnter, onMouseLeave, onClick }: Props) {
  const { x, y, z, rotX, rotY, rotZ, opacity, scale } = transform;
  const transformString = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`track-card${isFocal ? ' track-card--focal' : ''}`}
      style={{
        transform: transformString,
        opacity,
        zIndex,
        transformStyle: 'preserve-3d',
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 0.6 }}
      aria-label={`${track.position}. ${track.artist} — ${track.song}`}
    >
      {track.album_cover_url ? (
        <img src={track.album_cover_url} alt="" className="track-card__art" />
      ) : (
        <div className="track-card__art track-card__art--placeholder" />
      )}
    </motion.button>
  );
}
