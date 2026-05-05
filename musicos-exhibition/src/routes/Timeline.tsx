import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useExhibition } from '../store/exhibition.js';
import { TimelineScene } from '../components/timeline/TimelineScene.js';
import type { TrackExhibit } from '../types.js';

export function Timeline() {
  const { exhibits, load, setMode } = useExhibition();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (exhibits.length === 0) load();
  }, [exhibits.length, load]);

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');

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
      <TimelineScene tracks={tracks} />
    </>
  );
}
