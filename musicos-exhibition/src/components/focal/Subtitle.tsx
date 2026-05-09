import { motion, AnimatePresence } from 'framer-motion';
import { mentionColor } from '../../lib/mention-colors.js';
import './subtitle.css';

export interface SubtitleCallback {
  /** Span within `current` that gets pilled. */
  start: number;
  end: number;
  /** Track this callback points to (drives pill color and click action). */
  targetPosition: number;
}

interface SubtitleProps {
  current: string | null;
  next: string | null;
  callbacks: SubtitleCallback[];
  onPillClick?: (position: number) => void;
}

interface PlainSeg {
  kind: 'plain';
  text: string;
}
interface PillSeg {
  kind: 'pill';
  text: string;
  position: number;
}
type Seg = PlainSeg | PillSeg;

function buildSegments(text: string, callbacks: SubtitleCallback[]): Seg[] {
  if (!text) return [];
  // Sort + drop overlaps so pills never collide. Earlier wins.
  const valid = callbacks
    .filter((c) => c.start >= 0 && c.end > c.start && c.end <= text.length)
    .slice()
    .sort((a, b) => a.start - b.start);
  const ordered: SubtitleCallback[] = [];
  let cursor = 0;
  for (const c of valid) {
    if (c.start < cursor) continue;
    ordered.push(c);
    cursor = c.end;
  }
  const segs: Seg[] = [];
  let i = 0;
  for (const c of ordered) {
    if (c.start > i) segs.push({ kind: 'plain', text: text.slice(i, c.start) });
    segs.push({ kind: 'pill', text: text.slice(c.start, c.end), position: c.targetPosition });
    i = c.end;
  }
  if (i < text.length) segs.push({ kind: 'plain', text: text.slice(i) });
  return segs;
}

export function Subtitle({ current, next: _next, callbacks, onPillClick }: SubtitleProps) {
  const text = current ?? '';
  const segs = buildSegments(text, callbacks);

  return (
    <div className="subtitle">
      <div className="subtitle__current">
        <AnimatePresence mode="wait">
          <motion.div
            key={current ?? '__empty__'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {segs.map((s, idx) =>
              s.kind === 'plain' ? (
                <span key={idx}>{s.text}</span>
              ) : (
                <button
                  key={idx}
                  type="button"
                  className="subtitle__pill"
                  onClick={() => onPillClick?.(s.position)}
                  data-position={s.position}
                  style={{
                    ['--mention-bg' as string]: mentionColor(s.position, 0.42),
                    ['--mention-bg-soft' as string]: mentionColor(s.position, 0.18),
                    ['--mention-bg-hover' as string]: mentionColor(s.position, 0.6),
                    ['--mention-bg-soft-hover' as string]: mentionColor(s.position, 0.32),
                    ['--mention-ring' as string]: mentionColor(s.position, 0.5),
                  }}
                >
                  {s.text}
                </button>
              ),
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
