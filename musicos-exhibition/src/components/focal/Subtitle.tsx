import { motion, AnimatePresence } from 'framer-motion';
import './subtitle.css';

interface SubtitleProps {
  current: string | null;
  next: string | null;
  /** Position → aliases. Pills only render for positions in `mentionedSet`. */
  aliases: Record<number, string[]>;
  mentionedSet: ReadonlySet<number>;
  onPillClick?: (position: number) => void;
}

interface PillSegment {
  kind: 'pill';
  position: number;
  text: string;
}
interface PlainSegment {
  kind: 'plain';
  text: string;
}
type Segment = PillSegment | PlainSegment;

/**
 * Walks `text` left-to-right, greedily wrapping the longest matching alias
 * for any pill-eligible position into a <span class="pill">.
 */
function segmentText(
  text: string,
  aliases: Record<number, string[]>,
  eligible: ReadonlySet<number>,
): Segment[] {
  if (!text) return [];
  const candidates: { pos: number; alias: string }[] = [];
  for (const pos of eligible) {
    const list = aliases[pos];
    if (!list) continue;
    for (const a of list) candidates.push({ pos, alias: a });
  }
  // Prefer longer aliases first so "Black Sabbath" wins over "Sabbath".
  candidates.sort((a, b) => b.alias.length - a.alias.length);

  const segments: Segment[] = [];
  let i = 0;
  while (i < text.length) {
    let matched: { pos: number; alias: string } | null = null;
    for (const c of candidates) {
      if (text.startsWith(c.alias, i)) {
        matched = c;
        break;
      }
    }
    if (matched) {
      segments.push({ kind: 'pill', position: matched.pos, text: matched.alias });
      i += matched.alias.length;
    } else {
      const last = segments[segments.length - 1];
      const ch = text[i] ?? '';
      if (last && last.kind === 'plain') last.text += ch;
      else segments.push({ kind: 'plain', text: ch });
      i++;
    }
  }
  return segments;
}

export function Subtitle({ current, next, aliases, mentionedSet, onPillClick }: SubtitleProps) {
  const currentSegs = segmentText(current ?? '', aliases, mentionedSet);

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
            {currentSegs.map((s, i) =>
              s.kind === 'pill' ? (
                <button
                  key={i}
                  type="button"
                  className="subtitle__pill"
                  onClick={() => onPillClick?.(s.position)}
                  data-position={s.position}
                >
                  {s.text}
                </button>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="subtitle__next" aria-hidden="true">
        {next}
      </div>
    </div>
  );
}
