import { useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { useExhibition } from '../store/exhibition.js';
import type { TrackExhibit } from '../types.js';

export function TrackDetail() {
  const [, params] = useRoute<{ position: string }>('/track/:position');
  const position = Number(params?.position);
  const { exhibits, load, language, mode } = useExhibition();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (exhibits.length === 0) load();
  }, [exhibits.length, load]);

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');
  const track = tracks.find((t) => t.position === position);
  const idx = tracks.findIndex((t) => t.position === position);
  const prev = idx > 0 ? tracks[idx - 1] : null;
  const next = idx < tracks.length - 1 ? tracks[idx + 1] : null;

  const handleEnded = () => {
    if (mode === 'auto' && next) {
      navigate(`/track/${next.position}`);
    }
  };

  if (!track) {
    return (
      <div style={{ padding: 24 }}>
        <Link href="/">← Back</Link>
        <p>Track {position} not found.</p>
      </div>
    );
  }

  const transcript = language === 'zh' ? track.transcript_zh : track.transcript_en;
  const transcriptStatus =
    language === 'zh' ? track.transcript_zh_status : track.transcript_en_status;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/">← Back to timeline</Link>
        <span style={{ opacity: 0.5, fontSize: 13 }}>Mode: {mode}</span>
      </div>

      <div>
        {track.album_cover_url && (
          <img
            src={track.album_cover_url}
            alt={`${track.album} cover`}
            style={{ width: '100%', maxWidth: 400, aspectRatio: '1', objectFit: 'cover' }}
          />
        )}
        <p style={{ opacity: 0.6, marginTop: 12 }}>
          Track {track.position} / 18 · {track.year}
        </p>
        <h2 style={{ margin: '4px 0' }}>{track.artist}</h2>
        <h3 style={{ margin: '4px 0', fontWeight: 'normal' }}>{track.song}</h3>
        {track.album && <p style={{ opacity: 0.7 }}>from {track.album}</p>}

        {track.audio_url ? (
          <audio
            src={track.audio_url}
            controls
            autoPlay={mode === 'auto'}
            onEnded={handleEnded}
            style={{ width: '100%', marginTop: 16 }}
            key={track.audio_url}
          />
        ) : (
          <p style={{ color: '#a00', marginTop: 16 }}>音源待定 / source unavailable</p>
        )}

        <nav style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          {prev ? <Link href={`/track/${prev.position}`}>← {prev.artist}</Link> : <span />}
          {next ? <Link href={`/track/${next.position}`}>{next.artist} →</Link> : <span />}
        </nav>
      </div>

      <div>
        <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 4 }}>
          {track.exhibit_type.toUpperCase()} · {track.mechanism_tags.join(' · ')}
          {transcriptStatus === 'placeholder' && (
            <span style={{ marginLeft: 8, color: '#a60' }}>(curatorial note — full narration pending)</span>
          )}
        </p>
        <hr style={{ marginBottom: 12 }} />
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {transcript ?? (language === 'zh' ? '讲解词建设中' : 'Curatorial note in progress')}
        </div>
      </div>
    </div>
  );
}
