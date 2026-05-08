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
  onClick?: () => void;
  transition?: Transition;
}

const DEFAULT_TRANSITION: Transition = { type: 'spring', stiffness: 220, damping: 26, mass: 0.6 };

export function FocalDisc({ track, transform, zIndex, isFocal, onClick, transition }: Props) {
  const { x, y, z, rotX, rotY, rotZ, opacity, scale } = transform;
  const isHearted = track.red_heart_tier === 'hit';
  return (
    <motion.button
      type="button"
      className={`focal-disc${isFocal ? ' focal-disc--focal' : ''}`}
      style={{ zIndex }}
      animate={{ x, y, z, rotateX: rotX, rotateY: rotY, rotateZ: rotZ, scale, opacity }}
      transition={transition ?? DEFAULT_TRANSITION}
      onClick={onClick}
      aria-label={`${track.position}. ${track.artist} — ${track.song}`}
    >
      <div className="focal-disc__art">
        {track.album_cover_url ? (
          <img src={assetUrl(track.album_cover_url)} alt="" />
        ) : (
          <div className="focal-disc__art-placeholder" />
        )}
      </div>
      {isFocal && (
        <div className="focal-disc__label lg-surface">
          <span className="focal-disc__song">{track.song}</span>
          <span className="focal-disc__artist">{track.artist}</span>
          {isHearted && (
            <span className="focal-disc__heart" aria-label="Red heart">
              ♥
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}
