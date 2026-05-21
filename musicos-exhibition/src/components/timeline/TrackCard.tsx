import { motion, type Transition } from 'framer-motion';
import { forwardRef } from 'react';
import { assetUrl } from '../../lib/asset-url.js';
import type { TrackExhibit } from '../../types.js';
import type { CardTransform } from './timeline-keyframes.js';

interface Props {
  track: TrackExhibit;
  transform: CardTransform;
  isFocal: boolean;
  isPlaying: boolean;
  zIndex: number;
  transition?: Transition;
  /** ep1 connection layer: this card is a named source of the playing track. */
  lit?: boolean;
  /** ep1 connection layer: a connection is active and this card isn't part of it. */
  recessed?: boolean;
  /** Color slot shared with the connection edge/label when lit. */
  slotColor?: string;
}

const DEFAULT_TRANSITION: Transition = { type: 'spring', stiffness: 220, damping: 26, mass: 0.6 };

export const TrackCard = forwardRef<HTMLButtonElement, Props>(function TrackCard(
  { track, transform, isFocal, isPlaying, zIndex, transition, lit, recessed, slotColor },
  ref,
) {
  const { x, y, z, rotX, rotY, rotZ, opacity, scale } = transform;

  const className =
    'track-card' +
    (isFocal ? ' track-card--focal' : '') +
    (isFocal && isPlaying ? ' track-card--playing' : '') +
    (lit ? ' track-card--lit' : '') +
    (recessed ? ' track-card--recessed' : '');

  return (
    <motion.button
      ref={ref}
      type="button"
      tabIndex={-1}
      className={className}
      style={{ zIndex, ...(slotColor ? { ['--card-slot-color' as string]: slotColor } : {}) }}
      animate={{ x, y, z, rotateX: rotX, rotateY: rotY, rotateZ: rotZ, scale, opacity }}
      transition={transition ?? DEFAULT_TRANSITION}
      aria-label={`${track.position}. ${track.artist} — ${track.song}`}
    >
      {track.album_cover_url ? (
        <img src={assetUrl(track.album_cover_url)} alt="" className="track-card__art" />
      ) : (
        <div className="track-card__art track-card__art--placeholder" />
      )}
    </motion.button>
  );
});
