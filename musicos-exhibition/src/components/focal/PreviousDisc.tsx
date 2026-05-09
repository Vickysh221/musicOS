import { motion } from 'framer-motion';
import { assetUrl } from '../../lib/asset-url.js';
import type { TrackExhibit } from '../../types.js';
import './previous-disc.css';

interface Props {
  track: TrackExhibit;
  onClick: () => void;
}

/**
 * Bottom-right "back" mini-disc shown after a related-song jump. Tap to resume
 * the song you came from (rewound for context). Visual: frosted-glass ring
 * (vinyl-disc style from Figma 1746:7766, scaled down) wrapping a small album
 * cover at ~50% of the outer diameter.
 */
export function PreviousDisc({ track, onClick }: Props) {
  return (
    <motion.button
      type="button"
      layoutId={`disc-${track.position}`}
      className="previous-disc"
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      aria-label={`Resume ${track.artist} — ${track.song}`}
    >
      <span className="previous-disc__ring" aria-hidden="true" />
      <span className="previous-disc__shimmer" aria-hidden="true" />
      <span className="previous-disc__cover">
        {track.album_cover_url ? (
          <img src={assetUrl(track.album_cover_url)} alt="" />
        ) : (
          <span className="previous-disc__placeholder" />
        )}
        <span className="previous-disc__back-icon" aria-hidden="true">
          <svg viewBox="0 0 13 12" width="13" height="12" fill="none">
            <path
              d="M6 1.5 1.5 6l4.5 4.5M2 6h9.5"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </motion.button>
  );
}
