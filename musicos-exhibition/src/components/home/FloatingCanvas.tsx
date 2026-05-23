import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './floating-canvas.css';

export interface EpisodeBadge {
  titleZh: string;
  anchor: string;
  year: string;
}

interface Props {
  episodeCount: number;
  activeMeta?: EpisodeBadge | null;
  children: ReactNode;
}

export function FloatingCanvas({ episodeCount, activeMeta = null, children }: Props) {
  return (
    <div className="floating-canvas">
      <div className="floating-canvas__wordmark">MusicOS</div>
      <div className="floating-canvas__counter">EP 1–{episodeCount}</div>
      <div className="floating-canvas__center">
        <AnimatePresence mode="wait">
          {activeMeta ? (
            <motion.div
              key="title"
              className="floating-canvas__title"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              <span className="floating-canvas__title-zh">{activeMeta.titleZh}</span>
              <span className="floating-canvas__title-meta">
                {activeMeta.anchor} · {activeMeta.year}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="cross"
              className="floating-canvas__crosshair"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              +
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {children}
    </div>
  );
}
