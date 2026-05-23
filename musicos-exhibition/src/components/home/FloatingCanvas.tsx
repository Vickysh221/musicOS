import type { ReactNode } from 'react';
import './floating-canvas.css';

interface Props {
  episodeCount: number;
  children: ReactNode;
}

export function FloatingCanvas({ episodeCount, children }: Props) {
  return (
    <div className="floating-canvas">
      <div className="floating-canvas__wordmark">MusicOS</div>
      <div className="floating-canvas__counter">EP 1–{episodeCount}</div>
      <div className="floating-canvas__crosshair">+</div>
      {children}
    </div>
  );
}
