import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import type { TrackExhibit } from '../../types.js';
import type { CardTransform } from './timeline-keyframes.js';

interface Props {
  track: TrackExhibit;
  transform: CardTransform;
  isFocal: boolean;
  isPlaying: boolean;
  zIndex: number;
}

export const TrackCard = forwardRef<HTMLButtonElement, Props>(function TrackCard(
  { track, transform, isFocal, isPlaying, zIndex },
  ref,
) {
  const { x, y, z, rotX, rotY, rotZ, opacity, scale } = transform;
  const transformString = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`;

  const className =
    'track-card' +
    (isFocal ? ' track-card--focal' : '') +
    (isFocal && isPlaying ? ' track-card--playing' : '');

  return (
    <motion.button
      ref={ref}
      type="button"
      tabIndex={-1}
      className={className}
      style={{
        transform: transformString,
        opacity,
        zIndex,
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
});
