import { useEffect, useRef } from 'react';
import { useExhibition } from '../store/exhibition.js';
import { TimelineScene } from '../components/timeline/TimelineScene.js';
import { GlobalPlayer } from '../components/GlobalPlayer.js';
import { NowPlayingBar } from '../components/NowPlayingBar.js';
import { INTRO_STEP_MS } from '../components/timeline/presets.js';
import type { TrackExhibit, NonTrackExhibit } from '../types.js';

export function Timeline() {
  const exhibits = useExhibition((s) => s.exhibits);
  const load = useExhibition((s) => s.load);
  const setMode = useExhibition((s) => s.setMode);
  const play = useExhibition((s) => s.play);
  const playingPosition = useExhibition((s) => s.playingPosition);
  const autoStartedRef = useRef(false);

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

  // Auto-trigger play from beginning once the intro animation has settled at intro3.
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (exhibits.length === 0) return;
    if (playingPosition !== null) return;
    const first = opening ?? tracks[0] ?? null;
    if (!first) return;
    autoStartedRef.current = true;
    const t = setTimeout(() => {
      setMode('auto');
      play(first.position);
    }, INTRO_STEP_MS + 100);
    return () => clearTimeout(t);
  }, [exhibits.length, opening, tracks, playingPosition, setMode, play]);

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
