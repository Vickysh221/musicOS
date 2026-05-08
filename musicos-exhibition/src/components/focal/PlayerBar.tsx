import { useExhibition } from '../../store/exhibition.js';
import './player-bar.css';

interface Props {
  onListToggle: () => void;
  listOpen: boolean;
}

export function PlayerBar({ onListToggle, listOpen }: Props) {
  const isPlaying = useExhibition((s) => s.isPlaying);
  const togglePlay = useExhibition((s) => s.togglePlay);
  const next = useExhibition((s) => s.next);
  const prev = useExhibition((s) => s.prev);
  const currentTime = useExhibition((s) => s.currentTime);
  const duration = useExhibition((s) => s.duration);
  const seekTo = useExhibition((s) => s.seekTo);

  const pct = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="player-bar lg-surface">
      <button type="button" className="player-bar__btn" onClick={prev} aria-label="Previous">
        ‹‹
      </button>
      <button
        type="button"
        className="player-bar__btn player-bar__btn--play"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <button type="button" className="player-bar__btn" onClick={next} aria-label="Next">
        ››
      </button>
      <div
        className="player-bar__progress"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const t = ((e.clientX - rect.left) / rect.width) * duration;
          seekTo(Math.max(0, t));
        }}
      >
        <div className="player-bar__progress-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <button
        type="button"
        className={`player-bar__btn player-bar__btn--list${listOpen ? ' player-bar__btn--list-open' : ''}`}
        onClick={onListToggle}
        aria-pressed={listOpen}
        aria-label="Toggle list"
      >
        ≡
      </button>
    </div>
  );
}
