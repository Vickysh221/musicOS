import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useExhibition } from '../store/exhibition.js';
import { assetUrl } from '../lib/asset-url.js';
import type { TrackExhibit } from '../types.js';
import './track-detail.css';

interface TrackDetailProps {
  episodeId: string;
  position: number;
}

export function TrackDetail({ episodeId, position }: TrackDetailProps) {
  const { exhibits, episodeId: loadedId, load, language, mode } = useExhibition();
  const [, navigate] = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (loadedId !== episodeId) load(episodeId);
  }, [episodeId, loadedId, load]);

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');
  const track  = tracks.find((t) => t.position === position) ?? null;
  const idx    = tracks.findIndex((t) => t.position === position);
  const prev   = idx > 0 ? tracks[idx - 1] ?? null : null;
  const next   = idx >= 0 && idx < tracks.length - 1 ? tracks[idx + 1] ?? null : null;

  useEffect(() => { setIsPlaying(false); }, [position]);

  const handleEnded = () => {
    setIsPlaying(false);
    if (mode === 'auto' && next) navigate(`/${episodeId}/track/${next.position}`);
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { void el.play(); setIsPlaying(true); }
    else           { el.pause();     setIsPlaying(false); }
  };

  if (!track) {
    return (
      <div className="detail">
        <Link href={`/${episodeId}`} className="detail__back">← Back</Link>
        <div style={{ padding: 80 }}>Track {position} not found.</div>
      </div>
    );
  }

  const transcript    = language === 'zh' ? track.transcript_zh : track.transcript_en;
  const transcriptStatus = language === 'zh' ? track.transcript_zh_status : track.transcript_en_status;
  const cover         = track.album_cover_url ? assetUrl(track.album_cover_url) : null;
  const rawPlaybackUrl = track.fusion_audio_url ?? track.audio_url;
  const playbackUrl   = rawPlaybackUrl ? assetUrl(rawPlaybackUrl) : null;
  const audioAvailable = Boolean(playbackUrl);

  return (
    <div className="detail">
      <Link href={`/${episodeId}`} className="detail__back">← Back</Link>

      <div className="detail__layout">
        <div className="detail__cards">
          {cover && (
            <>
              <div className="detail__card detail__card--ghost-tl"><img src={cover} alt="" /></div>
              <div className="detail__card detail__card--ghost-bl"><img src={cover} alt="" /></div>
            </>
          )}
          <div className="detail__card detail__card--main">
            {cover
              ? <img src={cover} alt={`${track.album || track.song} cover`} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#ddd,#bbb)' }} />
            }
          </div>

          <button
            type="button"
            className="detail__play"
            onClick={togglePlay}
            disabled={!audioAvailable}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          {!audioAvailable && (
            <div className="detail__play-caption">源不可用 / source unavailable</div>
          )}
          {playbackUrl && (
            <audio
              ref={audioRef}
              src={playbackUrl}
              crossOrigin="anonymous"
              autoPlay={mode === 'auto'}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleEnded}
              key={playbackUrl}
              style={{ display: 'none' }}
            />
          )}
        </div>

        <div className="detail__info">
          <div className="detail__meta">
            Track {String(track.position).padStart(2, '0')} / {String(tracks.length).padStart(2, '0')} · {track.year}
            {transcriptStatus === 'placeholder' && ' · curatorial draft'}
          </div>
          <h1 className="detail__title">{track.song}</h1>
          <p className="detail__artist">{track.artist}</p>
          <div className={`detail__transcript${transcript ? '' : ' detail__transcript--placeholder'}`}>
            {transcript ?? (language === 'zh' ? '讲解词建设中' : 'Curatorial note in progress')}
          </div>
        </div>
      </div>

      <div className="detail__nav" aria-label="Track navigation">
        <button
          type="button"
          className="detail__nav-btn"
          onClick={() => prev && navigate(`/${episodeId}/track/${prev.position}`)}
          disabled={!prev}
          aria-label="Previous track"
        >←</button>
        <button
          type="button"
          className="detail__nav-btn detail__nav-btn--primary"
          onClick={() => next && navigate(`/${episodeId}/track/${next.position}`)}
          disabled={!next}
          aria-label="Next track"
        >→</button>
      </div>
    </div>
  );
}
