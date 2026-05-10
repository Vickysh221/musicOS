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
  callbacks: SubtitleCallback[];
  /** position → color slot (0..MAX_MENTION_SLOTS-1) for the current focal song.
   * Pills look up their slot here so they share a color with the matching arc. */
  slotByPosition: Map<number, number>;
  onPillClick?: (position: number) => void;
  /** Controlled by parent so the full-screen backdrop can also dismiss it. */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function Subtitle({
  current,
  callbacks,
  slotByPosition,
  onPillClick,
  expanded,
  onExpandedChange,
}: SubtitleProps) {
  const text = current ?? '';
  const segs = buildSegments(text, callbacks);

  // Expanded state is fully owned by the parent. Paragraph rollover within
  // the same track AND natural track advance both preserve the user's
  // expand/collapse choice. The parent collapses explicitly only when the
  // user navigates via a connection (pill/arc click or back-disc).

  return (
    <div className="subtitle">
      <div className="subtitle__current">
        <AnimatePresence mode="wait">
          <motion.div
            key={current ?? '__empty__'}
            className={`subtitle__body${expanded ? ' subtitle__body--expanded' : ' subtitle__body--clamped'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <span className="subtitle__text">
              {segs.map((s, idx) =>
                s.kind === 'plain' ? (
                  <span key={idx}>{s.text}</span>
                ) : (
                  (() => {
                    const slot = slotByPosition.get(s.position) ?? 0;
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="subtitle__pill"
                        onClick={() => onPillClick?.(s.position)}
                        data-position={s.position}
                        data-text={s.text}
                        style={{
                          ['--mention-text' as string]: mentionColor(slot, 1),
                          ['--mention-glow' as string]: mentionColor(slot, 0.95),
                          ['--mention-ring' as string]: mentionColor(slot, 0.5),
                        }}
                      >
                        <span className="subtitle__pill-text">{s.text}</span>
                      </button>
                    );
                  })()
                ),
              )}
            </span>
            {text && (
              <button
                type="button"
                className="subtitle__chevron"
                onClick={() => onExpandedChange(!expanded)}
                aria-expanded={expanded}
                aria-label={expanded ? '收起' : '展开'}
              >
                <ChevronIcon open={expanded} />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
