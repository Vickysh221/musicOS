import { AnimatePresence, motion } from 'framer-motion';
import { assetUrl } from '../../lib/asset-url.js';
import type { TrackExhibit } from '../../types.js';
import './playlist-popup.css';

interface Props {
  open: boolean;
  tracks: TrackExhibit[];
  currentPosition: number;
  onSelect: (position: number) => void;
  onClose: () => void;
}

/**
 * Bottom-sheet playlist popup — opened by the player bar's list button.
 * Each row is a frosted-glass card with album thumb, song title, artist,
 * and heart icon (filled when red_heart_tier === 'hit'). Tap a row to play
 * that track; tap the backdrop or the active row again to close.
 */
export function PlaylistPopup({ open, tracks, currentPosition, onSelect, onClose }: Props) {
  const ordered = tracks.slice().sort((a, b) => a.position - b.position);
  // Index distance from the selected row (not position-diff — there can be
  // gaps if a track is muted). Used by the Nocturne theme to fade siblings
  // by distance (DESIGN.md §Interaction → Selection Inversion).
  const activeIdx = ordered.findIndex((t) => t.position === currentPosition);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="playlist-popup__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="playlist-popup"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            role="dialog"
            aria-label="Playlist"
          >
            <div className="playlist-popup__scroll">
              {ordered.map((t, i) => {
                const active = t.position === currentPosition;
                const hearted = t.red_heart_tier === 'hit';
                const distance = activeIdx >= 0 ? Math.abs(i - activeIdx) : 0;
                return (
                  <button
                    key={t.position}
                    type="button"
                    className={`playlist-row${active ? ' playlist-row--active' : ''}`}
                    data-distance={distance}
                    onClick={() => onSelect(t.position)}
                  >
                    <div className="playlist-row__cover">
                      {t.album_cover_url ? (
                        <img src={assetUrl(t.album_cover_url)} alt="" />
                      ) : (
                        <div className="playlist-row__cover-placeholder" />
                      )}
                    </div>
                    <div className="playlist-row__text">
                      <div className="playlist-row__song">{t.song}</div>
                      <div className="playlist-row__artist">{t.artist}</div>
                    </div>
                    <div
                      className={`playlist-row__heart${hearted ? ' playlist-row__heart--filled' : ''}`}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22">
                        <path
                          d="M12 21s-7.5-4.6-9.6-9.4C1.1 8.3 3.2 5 6.5 5c1.9 0 3.6 1 4.5 2.6h0.0c0.9-1.6 2.6-2.6 4.5-2.6 3.3 0 5.4 3.3 4.1 6.6C19.5 16.4 12 21 12 21z"
                          fill={hearted ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
