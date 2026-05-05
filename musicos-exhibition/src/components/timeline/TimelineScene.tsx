import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { TrackExhibit } from '../../types.js';
import { useExhibition } from '../../store/exhibition.js';
import { useTuning } from '../../store/tuning.js';
import { TrackCard } from './TrackCard.js';
import { Stepper } from './Stepper.js';
import { TuningPanel } from './TuningPanel.js';
import { processionLayout } from './timeline-keyframes.js';
import { PRESETS, INTRO_STEP_MS, type Phase } from './presets.js';
import './timeline.css';

interface Props {
  tracks: TrackExhibit[];
}

export function TimelineScene({ tracks }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  // Layout phase: intro1 → intro2 → intro3 on mount; flips to "playing" once playback starts.
  const [phase, setPhase] = useState<Phase>('intro1');

  // Sync the tuning store to the active phase preset so the panel mirrors what's on screen
  // and live edits feed straight back into the layout.
  useEffect(() => {
    applyPreset(PRESETS[phase]);
  }, [phase, applyPreset]);

  useEffect(() => {
    if (playingPosition !== null) return; // playing phase takes over below
    const t1 = setTimeout(() => setPhase('intro2'), INTRO_STEP_MS);
    const t2 = setTimeout(() => setPhase('intro3'), INTRO_STEP_MS * 2);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
            transform: `rotateX(${tuning.stageRotX}deg) rotateY(${tuning.stageRotY}deg) rotateZ(${tuning.stageRotZ}deg)`,
            transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {tracks.map((track, i) => {
            const transform = processionLayout({
              index: i,
              total,
              focalIndex,
              hoveredIndex,
              tuning,
              centerIndex,
            });
            const isFocal = i === focalIndex;
            const isThisPlaying = playingPosition === track.position && isPlaying;
            const zIndex = isFocal ? 1000 : i + 1;
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
