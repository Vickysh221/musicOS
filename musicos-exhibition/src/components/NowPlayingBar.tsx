import { useEffect, useMemo, useRef, useState } from 'react';
import { useExhibition } from '../store/exhibition.js';
import { useFusionSubtitle } from '../hooks/useFusionSubtitle.js';
import './now-playing-bar.css';

const NARRATION_LABEL: Record<string, string> = {
  opening: '开场 · Opening',
  interlude: '过渡 · Interlude',
  thematic_closure: '结尾 · Closing',
};

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15a1 1 0 0 0 1.55.83l11.5-7.5a1 1 0 0 0 0-1.66L8.55 3.67A1 1 0 0 0 7 4.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4.5" height="16" rx="1" />
      <rect x="13.5" y="4" width="4.5" height="16" rx="1" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.5 5.5L4.5 11.13a1.1 1.1 0 0 0 0 1.74L11.5 18.5a1 1 0 0 0 1.6-.79V6.29a1 1 0 0 0-1.6-.79z" />
      <path d="M20.5 5.5L13.5 11.13a1.1 1.1 0 0 0 0 1.74L20.5 18.5a1 1 0 0 0 1.6-.79V6.29a1 1 0 0 0-1.6-.79z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.5 5.5L10.5 11.13a1.1 1.1 0 0 1 0 1.74L3.5 18.5a1 1 0 0 1-1.6-.79V6.29A1 1 0 0 1 3.5 5.5z" />
      <path d="M12.5 5.5L19.5 11.13a1.1 1.1 0 0 1 0 1.74L12.5 18.5a1 1 0 0 1-1.6-.79V6.29a1 1 0 0 1 1.6-.79z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M12 20.3l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.49L12 20.3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function splitSections(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Returns the start time (seconds) of each section, weighted by character
 * count. Sections with more text take proportionally longer to narrate.
 */
function sectionStartTimes(sections: string[], duration: number): number[] {
  if (sections.length === 0 || duration <= 0) return [];
  const totalChars = sections.reduce((sum, s) => sum + s.length, 0);
  let elapsed = 0;
  return sections.map((s) => {
    const t = elapsed;
    elapsed += (s.length / totalChars) * duration;
    return t;
  });
}

function activeSectionIdx(startTimes: number[], currentTime: number): number {
  let idx = 0;
  for (let i = 0; i < startTimes.length; i++) {
    if (currentTime >= startTimes[i]) idx = i;
  }
  return idx;
}

export function NowPlayingBar() {
  const exhibits = useExhibition((s) => s.exhibits);
  const language = useExhibition((s) => s.language);
  const playingPosition = useExhibition((s) => s.playingPosition);
  const isPlaying = useExhibition((s) => s.isPlaying);
  const currentTime = useExhibition((s) => s.currentTime);
  const duration = useExhibition((s) => s.duration);
  const togglePlay = useExhibition((s) => s.togglePlay);
  const seekTo = useExhibition((s) => s.seekTo);
  const next = useExhibition((s) => s.next);
  const prev = useExhibition((s) => s.prev);

  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);
  const activeItemRef = useRef<HTMLLIElement | null>(null);

  const exhibit = exhibits.find((e) => e.position === playingPosition) ?? null;

  const transcript = exhibit
    ? language === 'zh'
      ? exhibit.transcript_zh
      : exhibit.transcript_en
    : null;

  const fusionSubtitle = useFusionSubtitle(exhibit?.fusion_audio_url ?? null);

  const paragraphSections = useMemo(() => splitSections(transcript), [transcript]);
  const paragraphStartTimes = useMemo(
    () => sectionStartTimes(paragraphSections, duration),
    [paragraphSections, duration],
  );

  // When MiniMax-derived sentence timestamps are available, use them; otherwise
  // fall back to the paragraph-proportional estimate. The two modes drive the
  // same UI (sections list + active highlight).
  const sections = fusionSubtitle
    ? fusionSubtitle.map((s) => s.text)
    : paragraphSections;
  const startTimes = fusionSubtitle
    ? fusionSubtitle.map((s) => s.start)
    : paragraphStartTimes;

  const sectionIdx = startTimes.length > 0 ? activeSectionIdx(startTimes, currentTime) : 0;

  // Scroll the active item into view with ~40px of peek context above it.
  useEffect(() => {
    const list = listRef.current;
    const item = activeItemRef.current;
    if (!list || !item) return;
    const PEEK = 40; // px of context to show above the active item
    const targetScrollTop = item.offsetTop - PEEK;
    list.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  }, [sectionIdx]);

  if (!exhibit) return null;

  const onSeekToSection = (idx: number) => {
    if (duration <= 0 || startTimes.length === 0) return;
    seekTo((startTimes[idx] ?? 0) + 0.05);
  };

  const isTrack = exhibit.kind === 'track';
  const title = isTrack ? exhibit.song : NARRATION_LABEL[exhibit.exhibit_type] ?? 'Narration';
  const subtitle = isTrack ? `${exhibit.artist} · ${exhibit.year}` : null;

  return (
    <div className={`npb${expanded ? ' npb--expanded' : ''}`}>
      {expanded && sections.length > 0 && (
        <ul ref={listRef} className="npb__list" aria-label="Transcript sections">
          {sections.map((sec, i) => (
            <li key={i} ref={i === sectionIdx ? activeItemRef : null}>
              <button
                type="button"
                className={`npb__list-item${i === sectionIdx ? ' npb__list-item--active' : ''}`}
                onClick={() => onSeekToSection(i)}
              >
                <span className="npb__list-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="npb__list-text">{sec}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="npb__card">
        <div className="npb__head-text">
          <div className="npb__title">{title}</div>
          {subtitle && <div className="npb__subtitle">{subtitle}</div>}
        </div>

        <div className="npb__transport">
          <button type="button" className="npb__ctrl" onClick={prev} aria-label="Previous">
            <PrevIcon />
          </button>
          <button
            type="button"
            className="npb__ctrl npb__ctrl--play"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button type="button" className="npb__ctrl" onClick={next} aria-label="Next">
            <NextIcon />
          </button>
        </div>

        <div className="npb__actions">
          <button
            type="button"
            className={`npb__ctrl npb__list-toggle${expanded ? ' npb__list-toggle--open' : ''}`}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse sections' : 'Show sections'}
            disabled={sections.length === 0}
          >
            <ListIcon />
          </button>
          <button
            type="button"
            className={`npb__ctrl npb__like${liked ? ' npb__like--on' : ''}`}
            onClick={() => setLiked((v) => !v)}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <HeartIcon filled={liked} />
          </button>
        </div>
      </div>
    </div>
  );
}
