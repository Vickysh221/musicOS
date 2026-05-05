import { useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { useLocation } from 'wouter';
import type { TrackExhibit } from '../../types.js';
import { useExhibition } from '../../store/exhibition.js';
import { TrackCard } from './TrackCard.js';
import { Stepper } from './Stepper.js';
import './timeline.css';

interface Props {
  tracks: TrackExhibit[];
}

export function TimelineScene({ tracks }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const { setMode } = useExhibition();

  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ['start start', 'end end'],
  });

  const total = tracks.length;
  const anchorIndex = Math.max(0, tracks.findIndex((t) => t.is_base_node));
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', setProgress);

  // Focal track in PROCESSION state (progress > 0.5): map progress 0.5..1 across all tracks.
  const focalIndex =
    progress > 0.5
      ? Math.min(total - 1, Math.floor(((progress - 0.5) / 0.5) * total))
      : anchorIndex;

  const captionState: 'constellation' | 'sequence' | 'procession' =
    progress < 0.33 ? 'constellation' : progress < 0.66 ? 'sequence' : 'procession';

  const onCardClick = (position: number) => {
    setMode('manual');
    navigate(`/track/${position}`);
  };

  return (
    <div ref={sceneRef} className="timeline-scene">
      <div className="timeline-scene__sticky">
        <div className="timeline-scene__stage">
          {tracks.map((track, i) => (
            <TrackCard
              key={track.position}
              track={track}
              index={i}
              total={total}
              anchorIndex={anchorIndex}
              progress={scrollYProgress}
              isFocal={i === focalIndex}
              onClick={() => onCardClick(track.position)}
            />
          ))}
        </div>
        <div className="timeline-scene__caption">
          {captionState === 'constellation' && (
            <>
              <div className="caption__sub">The Rock × Funk Translation</div>
              <div className="caption__title">Miss You · 1967 → 2024</div>
            </>
          )}
          {captionState === 'sequence' && (
            <>
              <div className="caption__sub">{total} tracks across 57 years</div>
              <div className="caption__title">Bassline DNA</div>
            </>
          )}
          {captionState === 'procession' && (
            <Stepper track={tracks[focalIndex] ?? null} index={focalIndex} total={total} visible />
          )}
        </div>
      </div>
    </div>
  );
}
