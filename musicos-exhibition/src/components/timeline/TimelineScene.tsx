import { useState } from 'react';
import { useLocation } from 'wouter';
import type { TrackExhibit } from '../../types.js';
import { useExhibition } from '../../store/exhibition.js';
import { useTuning } from '../../store/tuning.js';
import { TrackCard } from './TrackCard.js';
import { Stepper } from './Stepper.js';
import { TuningPanel } from './TuningPanel.js';
import { processionLayout } from './timeline-keyframes.js';
import './timeline.css';

interface Props {
  tracks: TrackExhibit[];
}

export function TimelineScene({ tracks }: Props) {
  const [, navigate] = useLocation();
  const { setMode } = useExhibition();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const tuning = useTuning();

  const total = tracks.length;
  const anchorIndex = Math.max(0, tracks.findIndex((t) => t.is_base_node));
  const focalIndex = hoveredIndex ?? anchorIndex;

  const onCardClick = (position: number) => {
    setMode('manual');
    navigate(`/track/${position}`);
  };

  const focalTrack: TrackExhibit | null = tracks[focalIndex] ?? null;
  const prevTrack: TrackExhibit | null = focalIndex > 0 ? tracks[focalIndex - 1] ?? null : null;
  const nextTrack: TrackExhibit | null = focalIndex < total - 1 ? tracks[focalIndex + 1] ?? null : null;

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
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ perspective: `${tuning.perspective}px` }}
      >
        <div
          className="timeline-scene__stage-inner"
          style={{
            transform: `rotateX(${tuning.stageRotX}deg) rotateY(${tuning.stageRotY}deg) rotateZ(${tuning.stageRotZ}deg)`,
          }}
        >
          {tracks.map((track, i) => {
            const transform = processionLayout({
              index: i,
              total,
              anchorIndex,
              hoveredIndex,
              tuning,
            });
            const isFocal = i === focalIndex;
            // Focal card always on top; otherwise stack so later cards are above earlier (procession recedes left).
            const zIndex = isFocal ? 1000 : i + 1;
            return (
              <TrackCard
                key={track.position}
                track={track}
                transform={transform}
                isFocal={isFocal}
                zIndex={zIndex}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => { /* leave handled at stage level */ }}
                onClick={() => onCardClick(track.position)}
              />
            );
          })}
        </div>
      </div>
      <TuningPanel />
      <div className="timeline-scene__stepper-wrap">
        <Stepper
          track={focalTrack}
          prevTrack={prevTrack}
          nextTrack={nextTrack}
          index={focalIndex}
          total={total}
        />
      </div>
    </div>
  );
}
