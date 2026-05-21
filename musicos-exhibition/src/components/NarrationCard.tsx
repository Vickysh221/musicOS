import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../lib/asset-url.js';
import type { NonTrackExhibit } from '../types.js';
import './narration-card.css';

interface Props {
  exhibit: NonTrackExhibit;
  label: string;
}

export function NarrationCard({ exhibit, label }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => setIsPlaying(false);
    el.addEventListener('ended', onEnd);
    return () => el.removeEventListener('ended', onEnd);
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const url = exhibit.fusion_audio_url ? assetUrl(exhibit.fusion_audio_url) : null;
  const transcript = exhibit.transcript_zh ?? '';

  return (
    <div className={`narration-card${isPlaying ? ' narration-card--playing' : ''}`}>
      <div className="narration-card__header">
        <button
          type="button"
          className="narration-card__play"
          onClick={toggle}
          disabled={!url}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <span className="narration-card__label">{label}</span>
      </div>
      {transcript && (
        <p className="narration-card__transcript">{transcript}</p>
      )}
      {url && <audio ref={audioRef} src={url} crossOrigin="anonymous" preload="none" />}
    </div>
  );
}
