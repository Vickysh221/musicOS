import { motion, useTransform, type MotionValue } from 'framer-motion';
import type { TrackExhibit } from '../../types.js';
import { cardTransform } from './timeline-keyframes.js';

interface Props {
  track: TrackExhibit;
  index: number;
  total: number;
  anchorIndex: number;
  progress: MotionValue<number>;
  isFocal: boolean;
  onClick: () => void;
}

export function TrackCard({ track, index, total, anchorIndex, progress, isFocal, onClick }: Props) {
  const x = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).x);
  const y = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).y);
  const z = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).z);
  const rotX = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).rotX);
  const rotZ = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).rotZ);
  const opacity = useTransform(progress, (p) => cardTransform({ index, total, anchorIndex, progress: p }).opacity);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="track-card"
      style={{
        x,
        y,
        z,
        rotateX: rotX,
        rotateZ: rotZ,
        opacity,
        transformStyle: 'preserve-3d',
      }}
      aria-label={`${track.position}. ${track.artist} — ${track.song}`}
    >
      {track.album_cover_url ? (
        <img src={track.album_cover_url} alt="" className="track-card__art" />
      ) : (
        <div className="track-card__art track-card__art--placeholder" />
      )}
      {(isFocal || track.is_base_node) && (
        <div className="track-card__overlay">
          <div className="track-card__year">{track.year}</div>
          <div className="track-card__artist">{track.artist}</div>
          <div className="track-card__song">{track.song}</div>
        </div>
      )}
    </motion.button>
  );
}
