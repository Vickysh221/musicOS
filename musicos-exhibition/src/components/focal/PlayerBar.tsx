import { useExhibition } from '../../store/exhibition.js';
import './liquid-glass.css';
import './player-bar.css';

interface Props {
  onListToggle: () => void;
  listOpen: boolean;
}

function fmt(seconds: number, sign: '' | '-' = ''): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerBar({ onListToggle, listOpen }: Props) {
  const isPlaying = useExhibition((s) => s.isPlaying);
  const togglePlay = useExhibition((s) => s.togglePlay);
  const currentTime = useExhibition((s) => s.currentTime);
  const duration = useExhibition((s) => s.duration);
  const seekTo = useExhibition((s) => s.seekTo);

  const pct = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const remaining = Math.max(0, duration - currentTime);

  return (
    <div className="player-bar">
      <div className="player-bar__progress lg-surface">
        <span className="player-bar__time player-bar__time--current">{fmt(currentTime)}</span>
        <div
          className="player-bar__track"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const t = ((e.clientX - rect.left) / rect.width) * duration;
            seekTo(Math.max(0, t));
          }}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, Math.floor(duration))}
          aria-valuenow={Math.floor(currentTime)}
        >
          <div className="player-bar__fill" style={{ width: `${pct * 100}%` }} />
        </div>
        <span className="player-bar__time player-bar__time--remaining">{fmt(remaining, '-')}</span>
      </div>
      <button
        type="button"
        className="player-bar__btn lg-surface"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
            <rect x="3" y="2.25" width="2" height="7.5" rx="0.6" fill="currentColor" />
            <rect x="7" y="2.25" width="2" height="7.5" rx="0.6" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
            <path d="M3.4 2.2v7.6L9.4 6 3.4 2.2z" fill="currentColor" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className={`player-bar__btn lg-surface${listOpen ? ' player-bar__btn--on' : ''}`}
        onClick={onListToggle}
        aria-pressed={listOpen}
        aria-label="Toggle list"
      >
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path
            d="M2 3h8M2 6h8M2 9h8"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
