import type { TrackExhibit } from '../../types.js';

interface Props {
  track: TrackExhibit | null;
  prevTrack: TrackExhibit | null;
  nextTrack: TrackExhibit | null;
  index: number;
  total: number;
}

export function Stepper({ track, prevTrack, nextTrack, index, total }: Props) {
  if (!track) return null;
  const padded = String(index + 1).padStart(2, '0');
  const totalPadded = String(total).padStart(2, '0');

  return (
    <div className="stepper" role="status" aria-live="polite">
      <div className="stepper__label">Track</div>
      <div className="stepper__count">{padded}/{totalPadded}</div>
      <div className="stepper__pills">
        <div className="stepper__pill stepper__pill--ghost">
          {prevTrack ? prevTrack.song : ''}
        </div>
        <div className="stepper__pill stepper__pill--active">
          {track.song}
        </div>
        <div className="stepper__pill stepper__pill--ghost">
          {nextTrack ? nextTrack.song : ''}
        </div>
      </div>
    </div>
  );
}
