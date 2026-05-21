import { useRef } from 'react';
import { assetUrl } from '../../lib/asset-url.js';
import type { TrackExhibit } from '../../types.js';
import { MentionArcs } from './MentionArcs.js';
import './nocturne-focal.css';

interface Props {
  focalTrack: TrackExhibit | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  listOpen: boolean;
  onListToggle: () => void;
  arcTracks: TrackExhibit[];
  onArcClick: (position: number) => void;
  arcsDimmed: boolean;
}

/**
 * Nocturne register player surface — replaces the FocalDisc + bottom PlayerBar
 * pair when [data-theme="nocturne"] is active. Restructure per the source
 * reference (Nocturne/DESIGN.md §Layout-N01): album art rules the upper half,
 * a single glowing concave dial holds the player below. The "lit object" is
 * the play button in the dial's gravity well — surrounded by an electric rim
 * halo, sitting on a recessed concave surface, with a thin circular scrub arc
 * tracing the dial's outer edge.
 *
 * MentionArcs continue to render inside the dial so their orbit center
 * coincides with the dial geometry (callback targets feel like they're being
 * pulled out of the same light source).
 */

const DIAL_SIZE_PX = 320;

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function NocturneFocal({
  focalTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  listOpen,
  onListToggle,
  arcTracks,
  onArcClick,
  arcsDimmed,
}: Props) {
  const pct = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const arcRef = useRef<SVGSVGElement>(null);

  // Click-to-seek on the scrub arc — convert pointer angle to time. The arc
  // sweeps clockwise starting at 12 o'clock (-90°). Angle of click relative to
  // dial center maps to a 0..1 ratio along the same sweep.
  const onArcPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = arcRef.current;
    if (!svg || duration <= 0) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // Standard math atan2 gives angle from +x axis CCW. We want angle from
    // top (-y axis) clockwise, in [0, 2π).
    let angle = Math.atan2(dx, -dy);
    if (angle < 0) angle += Math.PI * 2;
    const ratio = angle / (Math.PI * 2);
    onSeek(ratio * duration);
  };

  return (
    <div className="nocturne-focal">
      {/* Hero — album cover full-bleed at top, fading into the dial area */}
      <div className="nocturne-focal__hero" aria-hidden="true">
        {focalTrack?.album_cover_url ? (
          <img
            className="nocturne-focal__hero-img"
            src={assetUrl(focalTrack.album_cover_url)}
            alt=""
          />
        ) : (
          <div className="nocturne-focal__hero-placeholder" />
        )}
        <div className="nocturne-focal__hero-vignette" />
        <div className="nocturne-focal__hero-bottom-fade" />
      </div>

      {/* Track label — sits just above the dial, on the bottom-fade ramp */}
      {focalTrack && (
        <div className="nocturne-focal__label">
          <div className="nocturne-focal__song">{focalTrack.song}</div>
          <div className="nocturne-focal__artist">{focalTrack.artist}</div>
        </div>
      )}

      {/* The glowing dial — concave bowl + electric rim + embedded controls */}
      <div
        className="nocturne-focal__dial"
        style={{ ['--dial-size' as string]: `${DIAL_SIZE_PX}px` }}
      >
        {/* Scrub arc — full-circle progress traced along the outer dial edge.
         * pathLength=100 lets us drive dasharray as a percentage directly. */}
        <svg
          ref={arcRef}
          className="nocturne-focal__arc"
          viewBox="0 0 100 100"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            onArcPointer(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 0) return;
            onArcPointer(e);
          }}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, Math.floor(duration))}
          aria-valuenow={Math.floor(currentTime)}
        >
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="rgba(180, 180, 200, 0.10)"
            strokeWidth="0.8"
          />
          {/* Played portion */}
          <circle
            className="nocturne-focal__arc-fill"
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="rgba(245, 245, 255, 0.92)"
            strokeWidth="1.4"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${pct * 100} 100`}
            transform="rotate(-90 50 50)"
          />
          {/* Handle dot at the arc head */}
          {pct > 0 && (
            <circle
              className="nocturne-focal__arc-handle"
              cx={50 + 47 * Math.cos((pct * 2 * Math.PI) - Math.PI / 2)}
              cy={50 + 47 * Math.sin((pct * 2 * Math.PI) - Math.PI / 2)}
              r="1.8"
              fill="rgb(245 245 255)"
            />
          )}
        </svg>

        <div className="nocturne-focal__timecode">
          <span>{fmt(currentTime)}</span>
          <span className="nocturne-focal__timecode-sep">/</span>
          <span>{fmt(duration)}</span>
        </div>

        <button
          type="button"
          className={`nocturne-focal__play${isPlaying ? ' nocturne-focal__play--playing' : ''}`}
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
              <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M7.5 4.5v15l12.5-7.5L7.5 4.5z" fill="currentColor" />
            </svg>
          )}
        </button>

        <button
          type="button"
          className={`nocturne-focal__list${listOpen ? ' nocturne-focal__list--on' : ''}`}
          onClick={onListToggle}
          aria-pressed={listOpen}
          aria-label="Toggle playlist"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M5 7h14M5 12h14M5 17h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* MentionArcs orbit the dial — placed as a dial child so its
         * absolute-50/50 self-centering puts the orbit center at the dial
         * center automatically. */}
        <MentionArcs
          tracks={arcTracks}
          discSize={DIAL_SIZE_PX}
          onArcClick={onArcClick}
          dimmed={arcsDimmed}
        />
      </div>
    </div>
  );
}
