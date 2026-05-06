import { useEffect, useRef } from 'react';
import { useExhibition } from '../store/exhibition.js';
import { TimelineScene } from '../components/timeline/TimelineScene.js';
import { GlobalPlayer } from '../components/GlobalPlayer.js';
import { NowPlayingBar } from '../components/NowPlayingBar.js';
import { EPISODES } from '../lib/episodes.js';
import type { TrackExhibit, NonTrackExhibit } from '../types.js';

const AUTOPLAY_DELAY_MS = 3000;

interface TimelineProps {
  episodeId: string;
}

export function Timeline({ episodeId }: TimelineProps) {
  const exhibits   = useExhibition((s) => s.exhibits);
  const loadedId   = useExhibition((s) => s.episodeId);
  const load       = useExhibition((s) => s.load);
  const setMode    = useExhibition((s) => s.setMode);
  const play       = useExhibition((s) => s.play);
  const playingPosition = useExhibition((s) => s.playingPosition);
  const autoStartedRef  = useRef(false);

  useEffect(() => {
    autoStartedRef.current = false;
  }, [episodeId]);

  useEffect(() => {
    if (loadedId !== episodeId) load(episodeId);
  }, [episodeId, loadedId, load]);

  const tracks    = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');
  const narrations = exhibits.filter((e): e is NonTrackExhibit => e.kind === 'narration');
  const opening   = narrations.find((n) => n.exhibit_type === 'opening') ?? null;

  const ep = EPISODES.find((e) => e.id === episodeId);
  const headerLabel = ep ? `${ep.titleZh} · ${ep.titleEn}` : episodeId;

  const startAuto = () => {
    setMode('auto');
    const first = opening ?? tracks[0] ?? null;
    if (first) play(first.position);
  };

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (loadedId !== episodeId || exhibits.length === 0) return;
    if (playingPosition !== null) return;
    const first = opening ?? tracks[0] ?? null;
    if (!first) return;
    autoStartedRef.current = true;
    const t = setTimeout(() => {
      setMode('auto');
      play(first.position);
    }, AUTOPLAY_DELAY_MS);
    return () => clearTimeout(t);
  }, [episodeId, loadedId, exhibits.length, opening, tracks, playingPosition, setMode, play]);

  return (
    <>
      <header className="timeline-header">
        <div className="timeline-header__brand">{headerLabel}</div>
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
