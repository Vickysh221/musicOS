import { useEffect, useRef } from 'react';
import { useExhibition } from '../store/exhibition.js';

export function GlobalPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSeekId = useRef<number>(0);

  const exhibits = useExhibition((s) => s.exhibits);
  const playingPosition = useExhibition((s) => s.playingPosition);
  const isPlaying = useExhibition((s) => s.isPlaying);
  const seekRequest = useExhibition((s) => s.seekRequest);
  const setIsPlaying = useExhibition((s) => s.setIsPlaying);
  const setProgress = useExhibition((s) => s.setProgress);
  const next = useExhibition((s) => s.next);

  const exhibit = exhibits.find((e) => e.position === playingPosition) ?? null;
  const src =
    exhibit?.fusion_audio_url ??
    (exhibit && exhibit.kind === 'track' ? exhibit.audio_url : null) ??
    null;

  // React to play/pause toggles.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;
    if (isPlaying) {
      void el.play().catch(() => setIsPlaying(false));
    } else {
      el.pause();
    }
  }, [isPlaying, src, setIsPlaying]);

  // Honor seek requests.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !seekRequest) return;
    if (seekRequest.id === lastSeekId.current) return;
    lastSeekId.current = seekRequest.id;
    try {
      el.currentTime = seekRequest.time;
    } catch {
      /* ignore */
    }
  }, [seekRequest]);

  if (!src) return null;

  return (
    <audio
      ref={audioRef}
      src={src}
      key={src}
      autoPlay={isPlaying}
      onLoadedMetadata={(e) => setProgress(0, (e.target as HTMLAudioElement).duration || 0)}
      onTimeUpdate={(e) => {
        const el = e.target as HTMLAudioElement;
        setProgress(el.currentTime, el.duration || 0);
      }}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onEnded={() => next()}
      style={{ display: 'none' }}
    />
  );
}
