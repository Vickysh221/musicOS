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
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: '-apple-system, Inter, system-ui, sans-serif',
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          zIndex: 10,
          mixBlendMode: 'difference',
          color: '#fff',
        }}
      >
        <div>Miss You · Sonic Cartography</div>
        <button
          onClick={startAuto}
          style={{
            background: 'transparent',
            color: 'inherit',
            border: '1px solid currentColor',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          ▶ Play from beginning
        </button>
      </header>
      <TimelineScene tracks={tracks} />
    </>
  );
}
