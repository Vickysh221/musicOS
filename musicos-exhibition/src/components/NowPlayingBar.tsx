import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useExhibition } from '../store/exhibition.js';
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

function CaretUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 7.5L21 18a1 1 0 0 1-.83 1.55H3.83A1 1 0 0 1 3 18l9-10.5z" />
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

function Marquee({ text, className }: { text: string; className?: string }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState(false);
  const [duration, setDuration] = useState(0);

  useLayoutEffect(() => {
    const v = viewportRef.current;
    const t = trackRef.current;
    if (!v || !t) return;
    const vw = v.clientWidth;
    const tw = t.scrollWidth;
    if (tw > vw + 1) {
      setOverflow(true);
      // Roughly 60px/s scroll speed.
      setDuration(Math.max(8, tw / 60));
    } else {
      setOverflow(false);
    }
  }, [text]);

  useEffect(() => {
    const v = viewportRef.current;
    if (!v) return;
    const ro = new ResizeObserver(() => {
      const t = trackRef.current;
      if (!t || !v) return;
      const vw = v.clientWidth;
      const tw = t.scrollWidth;
      setOverflow(tw > vw + 1);
      if (tw > vw + 1) setDuration(Math.max(8, tw / 60));
    });
    ro.observe(v);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={viewportRef} className={`npb__marquee${overflow ? ' npb__marquee--scroll' : ''} ${className ?? ''}`} aria-live="polite">
      <div
        ref={trackRef}
        className="npb__marquee-track"
        style={overflow ? { animationDuration: `${duration}s` } : undefined}
      >
        <span className="npb__marquee-text">{text}</span>
        {overflow && <span className="npb__marquee-text" aria-hidden="true">{text}</span>}
      </div>
    </div>
  );
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

  const exhibit = exhibits.find((e) => e.position === playingPosition) ?? null;

  const transcript = exhibit
    ? language === 'zh'
      ? exhibit.transcript_zh
      : exhibit.transcript_en
    : null;

  const sections = useMemo(() => splitSections(transcript), [transcript]);

  if (!exhibit) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  const sectionIdx =
    sections.length > 0 ? Math.min(sections.length - 1, Math.floor(progress * sections.length)) : 0;
  const currentSection = sections[sectionIdx] ?? '';

  const onSeekToSection = (idx: number) => {
    if (duration <= 0 || sections.length === 0) return;
    const t = (idx / sections.length) * duration + 0.05;
    seekTo(t);
  };

  const isTrack = exhibit.kind === 'track';
  const title = isTrack ? exhibit.song : NARRATION_LABEL[exhibit.exhibit_type] ?? 'Narration';
  const subtitle = isTrack ? `${exhibit.artist} · ${exhibit.year}` : null;

  const placeholder = language === 'zh' ? '讲解词建设中' : 'Curatorial note in progress';

  return (
    <div className={`npb${expanded ? ' npb--expanded' : ''}`}>
      {expanded && sections.length > 0 && (
        <ul className="npb__list" aria-label="Transcript sections">
          {sections.map((sec, i) => (
            <li key={i}>
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
        <div className="npb__head">
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
        </div>

        <div className="npb__body">
          <Marquee
            className="npb__transcript"
            text={sections.length > 0 ? currentSection : placeholder}
          />
          <button
            type="button"
            className={`npb__ctrl npb__expand${expanded ? ' npb__expand--open' : ''}`}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse sections' : 'Expand sections'}
            disabled={sections.length === 0}
          >
            <CaretUpIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
