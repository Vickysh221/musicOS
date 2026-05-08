import { useEffect, useState } from 'react';
import { useExhibition } from '../../store/exhibition.js';
import { useTuning } from '../../store/tuning.js';
import { useFusionSubtitle } from '../../hooks/useFusionSubtitle.js';
import { useCurrentAndNext } from '../../hooks/useCurrentAndNext.js';
import { detectCallbacks } from '../../lib/callbackDetection.js';
import { EP3_ALIASES } from '../../data/ep3-aliases.js';
import { verticalCumulativeLayout } from './layouts/verticalCumulativeLayout.js';
import { horizontalCarouselLayout } from './layouts/horizontalCarouselLayout.js';
import { Subtitle } from './Subtitle.js';
import { Spectrum } from './Spectrum.js';
import { PlayerBar } from './PlayerBar.js';
import { FocalDisc } from './FocalDisc.js';
import { TuningPanel } from '../timeline/TuningPanel.js';
import type { TrackExhibit } from '../../types.js';
import './focal-scene.css';

type Phase = 'vertical' | 'horizontal';

export function FocalScene() {
  const exhibits = useExhibition((s) => s.exhibits);
  const playingPosition = useExhibition((s) => s.playingPosition);
  const currentTime = useExhibition((s) => s.currentTime);
  const mentionedSet = useExhibition((s) => s.mentionedSet);
  const addMentioned = useExhibition((s) => s.addMentioned);
  const play = useExhibition((s) => s.play);
  const tuning = useTuning();

  const [phase, setPhase] = useState<Phase>('vertical');

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');
  const trackPositions = tracks.map((t) => t.position).sort((a, b) => a - b);
  const currentExhibit = exhibits.find((e) => e.position === playingPosition) ?? null;
  const currentPosition = playingPosition ?? trackPositions[0] ?? 0;

  const subtitle = useFusionSubtitle(currentExhibit?.fusion_audio_url ?? null);
  const { current, next } = useCurrentAndNext(subtitle, currentTime);

  // Run callback detection on the *current* sentence and accumulate.
  useEffect(() => {
    if (!current) return;
    const hits = detectCallbacks(current.text, currentPosition, EP3_ALIASES, {
      allowPlain: false,
    });
    if (hits.size > 0) addMentioned([...hits]);
  }, [current, currentPosition, addMentioned]);

  const mentionedSorted = trackPositions.filter(
    (p) => mentionedSet.has(p) && p !== currentPosition,
  );

  const layout =
    phase === 'vertical'
      ? verticalCumulativeLayout({
          mentioned: mentionedSorted,
          currentPosition,
          allPositions: trackPositions,
          params: {
            verticalSpacing: tuning.verticalSpacing,
            verticalDepth: tuning.verticalDepth,
            verticalShrink: tuning.verticalShrink,
            verticalFade: tuning.verticalFade,
            focalOffsetY: tuning.focalOffsetY,
          },
        })
      : horizontalCarouselLayout({
          allPositions: trackPositions,
          currentPosition,
          params: {
            arcSpacing: tuning.arcSpacing,
            arcDepth: tuning.arcDepth,
            arcRotStep: tuning.arcRotStep,
            carouselScale: tuning.carouselScale,
          },
        });

  const onPillClick = (position: number) => {
    play(position);
  };
  const onCardClick = (position: number) => {
    play(position);
    setPhase('vertical');
  };

  return (
    <div className="focal-scene">
      <header className="focal-scene__header">
        <div className="focal-scene__ep">EP3 · Riff Genealogy</div>
        <Spectrum />
        <Subtitle
          current={current?.text ?? null}
          next={next?.text ?? null}
          aliases={EP3_ALIASES}
          mentionedSet={mentionedSet}
          onPillClick={onPillClick}
        />
      </header>

      <div className="focal-scene__stage" style={{ perspective: `${tuning.perspective}px` }}>
        <div className="focal-scene__stage-inner">
          {tracks.map((t) => {
            const tf = layout.get(t.position);
            if (!tf) return null;
            const isFocal = t.position === currentPosition;
            const z = isFocal ? 1000 : 100 - Math.abs(t.position - currentPosition);
            return (
              <FocalDisc
                key={t.position}
                track={t}
                transform={tf}
                isFocal={isFocal}
                zIndex={z}
                onClick={() => onCardClick(t.position)}
              />
            );
          })}
        </div>
      </div>

      <PlayerBar
        listOpen={phase === 'horizontal'}
        onListToggle={() => setPhase((p) => (p === 'vertical' ? 'horizontal' : 'vertical'))}
      />
      <TuningPanel />
    </div>
  );
}
