import { useEffect } from 'react';
import { useExhibition } from '../store/exhibition.js';
import { TimelineScene } from '../components/timeline/TimelineScene.js';
import { GlobalPlayer } from '../components/GlobalPlayer.js';
import { NowPlayingBar } from '../components/NowPlayingBar.js';
import type { TrackExhibit, NonTrackExhibit } from '../types.js';

export function Timeline() {
  const exhibits = useExhibition((s) => s.exhibits);
  const load = useExhibition((s) => s.load);
  const setMode = useExhibition((s) => s.setMode);
  const play = useExhibition((s) => s.play);

  useEffect(() => {
    if (exhibits.length === 0) load();
  }, [exhibits.length, load]);

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');
  const narrations = exhibits.filter((e): e is NonTrackExhibit => e.kind === 'narration');
  const opening = narrations.find((n) => n.exhibit_type === 'opening') ?? null;

  const startAuto = () => {
    setMode('auto');
    const first = opening ?? tracks[0] ?? null;
    if (first) play(first.position);
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
      <GlobalPlayer />
      <NowPlayingBar />
    </>
  );
}
