import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { TrackExhibit } from '../../types.js';
import { useExhibition } from '../../store/exhibition.js';
import { useTuning } from '../../store/tuning.js';
import { TrackCard } from './TrackCard.js';
import { Stepper } from './Stepper.js';
import { TuningPanel } from './TuningPanel.js';
import { processionLayout } from './timeline-keyframes.js';
import { PRESETS, INTRO_STEP_MS, INTRO_TRANSITION_MS, type Phase } from './presets.js';
import './timeline.css';

interface Props {
  tracks: TrackExhibit[];
}

const MOBILE_BREAKPOINT_PX = 768;

export function TimelineScene({ tracks }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT_PX,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT_PX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const playingPosition = useExhibition((s) => s.playingPosition);
  const isPlaying = useExhibition((s) => s.isPlaying);
  const play = useExhibition((s) => s.play);
  const exhibits = useExhibition((s) => s.exhibits);

  const playingExhibit = playingPosition !== null
    ? exhibits.find((e) => e.position === playingPosition) ?? null
    : null;
  const isBookendNarration =
    playingExhibit?.kind === 'narration' &&
    (playingExhibit.exhibit_type === 'opening' ||
      playingExhibit.exhibit_type === 'thematic_closure');

  const tuning = useTuning();
  const applyPreset = useTuning((s) => s.applyPreset);

  // Layout phase: intro1 → intro3 on mount; flips to "playing" once playback starts.
  const [phase, setPhase] = useState<Phase>('intro1');

  // Sync the tuning store to the active phase preset so the panel mirrors what's on screen
  // and live edits feed straight back into the layout.
  useEffect(() => {
    applyPreset(PRESETS[phase]);
  }, [phase, applyPreset]);

  useEffect(() => {
    if (playingPosition !== null) return; // playing phase takes over below
    const t = setTimeout(() => setPhase('intro3'), INTRO_STEP_MS);
    return () => clearTimeout(t);
  }, [playingPosition]);

  useEffect(() => {
    if (playingPosition !== null) {
      // Opening / closing narration use the resting intro3 layout; tracks (and interlude) use PLAYING.
      setPhase(isBookendNarration ? 'intro3' : 'playing');
    } else if (phase === 'playing') {
      // Returning to a stopped state — settle on the resting intro3 layout.
      setPhase('intro3');
    }
  }, [playingPosition, isBookendNarration, phase]);

  const total = tracks.length;
  const anchorIndex = Math.max(0, tracks.findIndex((t) => t.is_base_node));
  const playingIndex =
    playingPosition !== null ? tracks.findIndex((t) => t.position === playingPosition) : -1;
  const focalIndex =
    hoveredIndex !== null ? hoveredIndex : playingIndex >= 0 ? playingIndex : anchorIndex;

  // While playing, anchor the procession around the playing card so it sits near screen center.
  const centerIndex = phase === 'playing' && playingIndex >= 0 ? playingIndex : undefined;

  const focalTrack: TrackExhibit | null = tracks[focalIndex] ?? null;
  const prevTrack: TrackExhibit | null = focalIndex > 0 ? tracks[focalIndex - 1] ?? null : null;
  const nextTrack: TrackExhibit | null = focalIndex < total - 1 ? tracks[focalIndex + 1] ?? null : null;

  const cardAtPoint = (clientX: number, clientY: number): number | null => {
    for (let i = cardRefs.current.length - 1; i >= 0; i--) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return i;
      }
    }
    return null;
  };

  const onStageMouseMove = (e: ReactMouseEvent) => {
    const idx = cardAtPoint(e.clientX, e.clientY);
    if (idx !== hoveredIndex) setHoveredIndex(idx);
  };

  const onStageClick = (e: ReactMouseEvent) => {
    const idx = cardAtPoint(e.clientX, e.clientY);
    if (idx !== null) {
      const t = tracks[idx];
      if (t) play(t.position);
    }
  };

  return (
    <div
      className="timeline-scene"
      style={{
        ['--card-w' as string]: `${tuning.cardWidth}px`,
        ['--card-h' as string]: `${tuning.cardHeight}px`,
      }}
    >
      <div
        className="timeline-scene__stage"
        onMouseMove={onStageMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={onStageClick}
        style={{ perspective: `${tuning.perspective}px` }}
      >
        <div
          className="timeline-scene__stage-inner"
          style={{
            transform:
              isMobile && phase === 'playing'
                ? 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)'
                : `rotateX(${tuning.stageRotX}deg) rotateY(${tuning.stageRotY}deg) rotateZ(${tuning.stageRotZ}deg)`,
            transition: `transform ${INTRO_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {tracks.map((track, i) => {
            const baseTransform = processionLayout({
              index: i,
              total,
              focalIndex,
              hoveredIndex,
              tuning,
              centerIndex,
            });
            const isFocal = i === focalIndex;
            const isThisPlaying = playingPosition === track.position && isPlaying;
            // On mobile, the playing card sits flat and centered so the user can read it head-on.
            const transform =
              isMobile && phase === 'playing' && i === playingIndex
                ? {
                    x: 0,
                    y: 0,
                    z: tuning.focalZBoost,
                    rotX: 0,
                    rotY: 0,
                    rotZ: 0,
                    opacity: 1,
                    scale: tuning.focalScale,
                  }
                : baseTransform;
            const zIndex = isFocal ? 1000 : i + 1;
            const cardTransition =
              phase === 'intro1' || phase === 'intro3'
                ? {
                    type: 'tween' as const,
                    duration: INTRO_TRANSITION_MS / 1000,
                    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                  }
                : undefined;
            return (
              <TrackCard
                key={track.position}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                track={track}
                transform={transform}
                isFocal={isFocal}
                isPlaying={isThisPlaying}
                zIndex={zIndex}
                {...(cardTransition ? { transition: cardTransition } : {})}
              />
            );
          })}

        </div>
      </div>
      {playingPosition === null && phase === 'intro3' && (
        <div className="timeline-scene__stepper-wrap">
          <Stepper
            track={focalTrack}
            prevTrack={prevTrack}
            nextTrack={nextTrack}
            index={focalIndex}
            total={total}
          />
        </div>
      )}
      <TuningPanel />
    </div>
  );
}
