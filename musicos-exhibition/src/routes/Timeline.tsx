import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useExhibition } from '../store/exhibition.js';
import { TimelineScene } from '../components/timeline/TimelineScene.js';
import { NarrationCard } from '../components/NarrationCard.js';
import type { TrackExhibit, NonTrackExhibit } from '../types.js';

export function Timeline() {
  const { exhibits, load, setMode } = useExhibition();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (exhibits.length === 0) load();
  }, [exhibits.length, load]);

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');
  const narrations = exhibits.filter((e): e is NonTrackExhibit => e.kind === 'narration');
  const opening = narrations.find((n) => n.exhibit_type === 'opening') ?? null;
  const interlude = narrations.find((n) => n.exhibit_type === 'interlude') ?? null;
  const closing = narrations.find((n) => n.exhibit_type === 'thematic_closure') ?? null;

  const startAuto = () => {
    setMode('auto');
    navigate('/track/1');
  };

  return (
    <>
      <header className="timeline-header">
        <div className="timeline-header__brand">Miss You · Sonic Cartography</div>
        <button type="button" className="timeline-header__cta" onClick={startAuto}>
          ▶ Play from beginning
        </button>
      </header>
      {opening && <NarrationCard exhibit={opening} label="开场 · Opening" />}
      <TimelineScene tracks={tracks} />
      {interlude && <NarrationCard exhibit={interlude} label="过渡 · Interlude" />}
      {closing && <NarrationCard exhibit={closing} label="结尾 · Closing" />}
    </>
  );
}
