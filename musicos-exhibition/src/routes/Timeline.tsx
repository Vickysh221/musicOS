import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useExhibition } from '../store/exhibition.js';

export function Timeline() {
  const { exhibits, load, setMode } = useExhibition();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (exhibits.length === 0) load();
  }, [exhibits.length, load]);

  const tracks = exhibits.filter((e) => e.kind === 'track');

  const startAuto = () => {
    setMode('auto');
    navigate('/track/1');
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 800, margin: '0 auto' }}>
      <h1>Miss You · Sonic Cartography</h1>
      <p style={{ opacity: 0.7 }}>
        The Rock × Funk Translation — 1967 → 2024 — {tracks.length} tracks
      </p>
      <button
        onClick={startAuto}
        style={{ margin: '16px 0', padding: '8px 16px', background: '#222', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        ▶ Play from beginning (auto)
      </button>
      <ol style={{ listStyle: 'none', padding: 0 }}>
        {tracks.map((t) => (
          <li key={t.position} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <Link
              href={`/track/${t.position}`}
              onClick={() => setMode('manual')}
            >
              <span style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 8, cursor: 'pointer' }}>
                <span style={{ display: 'inline-block', width: 32, opacity: 0.5 }}>{t.position}</span>
                <span style={{ display: 'inline-block', width: 60, opacity: 0.7 }}>{t.year}</span>
                <span><strong>{t.artist}</strong> — {t.song}</span>
                {t.is_base_node && <span style={{ marginLeft: 8, fontSize: 12, color: '#a60' }}>★ ANCHOR</span>}
                {t.unavailable && <span style={{ marginLeft: 8, fontSize: 12, color: '#a00' }}>(no audio)</span>}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
