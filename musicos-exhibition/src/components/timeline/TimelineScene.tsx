import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type { ConnectionKind, TrackExhibit } from '../../types.js';
import { useExhibition } from '../../store/exhibition.js';
import { useTuning } from '../../store/tuning.js';
import { TrackCard } from './TrackCard.js';
import { Stepper } from './Stepper.js';
import { TuningPanel } from './TuningPanel.js';
import { ConnectionOverlay } from './ConnectionOverlay.js';
import { processionLayout, arcLayout, type CardTransform } from './timeline-keyframes.js';
import { PRESETS, INTRO_STEP_MS, INTRO_TRANSITION_MS, type Phase } from './presets.js';
import {
  splitParagraphs,
  paragraphStartTimes,
  buildSegmentToParagraphMap,
  activeParagraphIdx,
} from '../../lib/transcript-paragraphs.js';
import { findCallbackPhrases, aliasesForPosition } from '../../lib/callback-phrase.js';
import { buildSubtitleSegments, type SubtitleCallback } from '../../lib/subtitle-segments.js';
import { ALIASES_BY_EPISODE } from '../../data/episode-aliases.js';
import { MAX_MENTION_SLOTS, mentionColor } from '../../lib/mention-colors.js';
import { useFusionSubtitle } from '../../hooks/useFusionSubtitle.js';
import { useCurrentAndNext } from '../../hooks/useCurrentAndNext.js';
import './timeline.css';

interface Props {
  tracks: TrackExhibit[];
}

const MOBILE_BREAKPOINT_PX = 768;

// ep1 connection layer — the related songs sit on a concentric OUTER ring whose
// params are live-tunable (see the tuning panel). The camera (stage rotateX +
// perspective) is unchanged. Related songs are split to the two sides around a
// cleared front-center gap so the now-playing card stays unobstructed.
interface OuterRingParams {
  ringCenterZ: number;
  outerRadius: number;
  outerGapDeg: number;
  outerFrontGapDeg: number;
  outerRotOffsetDeg: number;
  outerHeight: number;
  outerScale: number;
  outerStaggerZ: number;
}

function outerRingLayout(slot: number, t: OuterRingParams): CardTransform {
  // Even slots fan to the right of the front gap, odd to the left; each side
  // steps outward by outerGapDeg. Front-center is left clear by outerFrontGapDeg.
  const side = slot % 2 === 0 ? 1 : -1;
  const idxOnSide = Math.floor(slot / 2);
  const angleDeg = side * (t.outerFrontGapDeg / 2 + idxOnSide * t.outerGapDeg) + t.outerRotOffsetDeg;
  const a = (angleDeg * Math.PI) / 180;
  const stagger = idxOnSide % 2 === 1 ? t.outerStaggerZ : 0;
  return {
    x: t.outerRadius * Math.sin(a),
    y: t.outerHeight,
    z: t.ringCenterZ + t.outerRadius * Math.cos(a) + stagger,
    rotX: 0,
    rotY: -angleDeg, // tangent to the ring
    rotZ: 0,
    opacity: 1,
    scale: t.outerScale,
  };
}

export function TimelineScene({ tracks }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT_PX,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT_PX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const playingPosition = useExhibition((s) => s.playingPosition);
  const isPlaying = useExhibition((s) => s.isPlaying);
  const play = useExhibition((s) => s.play);
  const exhibits = useExhibition((s) => s.exhibits);

  const playingExhibit = playingPosition !== null
    ? exhibits.find((e) => e.position === playingPosition) ?? null
    : null;
  const isBookendNarration =
    playingExhibit?.kind === 'narration' &&
    (playingExhibit.exhibit_type === 'opening' ||
      playingExhibit.exhibit_type === 'thematic_closure');

  const tuning = useTuning();
  const applyPreset = useTuning((s) => s.applyPreset);

  // Layout phase: intro1 → intro3 on mount; flips to "playing" once playback starts.
  const [phase, setPhase] = useState<Phase>('intro1');

  // Sync the tuning store to the active phase preset so the panel mirrors what's on screen
  // and live edits feed straight back into the layout.
  useEffect(() => {
    applyPreset(PRESETS[phase]);
  }, [phase, applyPreset]);

  useEffect(() => {
    if (playingPosition !== null) return; // playing phase takes over below
    const t = setTimeout(() => setPhase('intro3'), INTRO_STEP_MS);
    return () => clearTimeout(t);
  }, [playingPosition]);

  useEffect(() => {
    if (playingPosition !== null) {
      // Opening / closing narration use the resting intro3 layout; tracks (and interlude) use PLAYING.
      setPhase(isBookendNarration ? 'intro3' : 'playing');
    } else if (phase === 'playing') {
      // Returning to a stopped state — settle on the resting intro3 layout.
      setPhase('intro3');
    }
  }, [playingPosition, isBookendNarration, phase]);

  const total = tracks.length;
  const anchorIndex = Math.max(0, tracks.findIndex((t) => t.is_base_node));
  const playingIndex =
    playingPosition !== null ? tracks.findIndex((t) => t.position === playingPosition) : -1;
  const focalIndex =
    hoveredIndex !== null ? hoveredIndex : playingIndex >= 0 ? playingIndex : anchorIndex;

  // While playing, anchor the procession around the playing card so it sits near screen center.
  const centerIndex = phase === 'playing' && playingIndex >= 0 ? playingIndex : undefined;

  const focalTrack: TrackExhibit | null = tracks[focalIndex] ?? null;
  const prevTrack: TrackExhibit | null = focalIndex > 0 ? tracks[focalIndex - 1] ?? null : null;
  const nextTrack: TrackExhibit | null = focalIndex < total - 1 ? tracks[focalIndex + 1] ?? null : null;

  // ── ep1 connection layer ─────────────────────────────────────────────────
  // When a track is playing, its narration establishes links to the tracks it
  // borrowed from. As the narrator names each source, that card lights up and
  // draws a directed edge to the now-playing card; the link persists for the
  // rest of the song (accumulating), while unrelated cards recede. ep1-only.
  const episodeId = useExhibition((s) => s.episodeId);
  const currentTime = useExhibition((s) => s.currentTime);
  const duration = useExhibition((s) => s.duration);
  const language = useExhibition((s) => s.language);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const playingTrack: TrackExhibit | null =
    playingExhibit?.kind === 'track' ? playingExhibit : null;
  const connectionsEnabled = episodeId === 'ep1' && phase === 'playing' && playingTrack !== null;

  const transcript = playingTrack
    ? language === 'zh'
      ? playingTrack.transcript_zh
      : playingTrack.transcript_en
    : null;
  const paragraphs = useMemo(() => splitParagraphs(transcript), [transcript]);
  const fusionSegments = useFusionSubtitle(
    connectionsEnabled ? playingTrack?.fusion_audio_url ?? null : null,
  );
  const { currentIdx: currentSegIdx } = useCurrentAndNext(fusionSegments, currentTime);
  const segToPara = useMemo(
    () => (fusionSegments ? buildSegmentToParagraphMap(paragraphs, fusionSegments) : null),
    [fusionSegments, paragraphs],
  );
  const fallbackStartTimes = useMemo(
    () => paragraphStartTimes(paragraphs, duration),
    [paragraphs, duration],
  );
  let paragraphIdx = -1;
  if (paragraphs.length > 0) {
    if (segToPara && currentSegIdx >= 0 && currentSegIdx < segToPara.length) {
      paragraphIdx = segToPara[currentSegIdx]!;
    } else {
      paragraphIdx = activeParagraphIdx(fallbackStartTimes, currentTime);
    }
  }
  const currentParagraph = paragraphIdx >= 0 ? paragraphs[paragraphIdx] ?? null : null;

  // Full connection neighbourhood of the playing track: ancestors it drew from
  // (connections_in), descendants it seeded (connections_out), and same-era
  // dialogue (connections_lateral). The narration may name any of them, so all
  // are mention candidates. `direction` drives the arrow orientation.
  const neighbors = useMemo(() => {
    if (!connectionsEnabled || !playingTrack) return [];
    const seen = new Map<number, { position: number; kind: ConnectionKind; direction: 'in' | 'out' | 'lateral' }>();
    const add = (refs: typeof playingTrack.connections_in, direction: 'in' | 'out' | 'lateral') => {
      for (const c of refs ?? []) {
        if (c.other_position === playingTrack.position) continue;
        if (!seen.has(c.other_position)) {
          seen.set(c.other_position, { position: c.other_position, kind: c.kind, direction });
        }
      }
    };
    add(playingTrack.connections_in, 'in');
    add(playingTrack.connections_out, 'out');
    add(playingTrack.connections_lateral, 'lateral');
    return [...seen.values()];
  }, [connectionsEnabled, playingTrack]);

  const candidates = useMemo(() => {
    const curated = ALIASES_BY_EPISODE['ep1'] ?? {};
    return neighbors.map((n) => ({
      position: n.position,
      aliases: aliasesForPosition(n.position, tracks, curated),
    }));
  }, [neighbors, tracks]);

  const phraseHits = useMemo(
    () => (currentParagraph ? findCallbackPhrases(currentParagraph, candidates) : []),
    [currentParagraph, candidates],
  );

  const [pins, setPins] = useState<Set<number>>(new Set());
  const playingTrackPos = playingTrack?.position ?? null;
  useEffect(() => {
    setPins(new Set());
  }, [playingTrackPos]);
  const cbKey = phraseHits.map((h) => h.targetPosition).join(',');
  useEffect(() => {
    if (phraseHits.length === 0) return;
    setPins((prev) => {
      let changed = false;
      const nextSet = new Set(prev);
      for (const h of phraseHits) {
        if (h.targetPosition === playingTrackPos) continue;
        if (!nextSet.has(h.targetPosition)) {
          nextSet.add(h.targetPosition);
          changed = true;
        }
      }
      return changed ? nextSet : prev;
    });
  }, [cbKey, phraseHits, playingTrackPos]);

  const pinList = useMemo(
    () => [...pins].filter((p) => p !== playingTrackPos).slice(0, MAX_MENTION_SLOTS),
    [pins, playingTrackPos],
  );
  const pinSet = useMemo(() => new Set(pinList), [pinList]);
  // Color slot per position: pinned cards first (in mention order), then any
  // freshly-named terms in the current paragraph that haven't pinned yet — so a
  // pill gets its color the same frame it appears, matching its card ring.
  const slotByPosition = useMemo(() => {
    const m = new Map<number, number>();
    let i = 0;
    for (const p of pinList) {
      if (i >= MAX_MENTION_SLOTS) break;
      m.set(p, i++);
    }
    for (const h of phraseHits) {
      if (h.targetPosition === playingTrackPos) continue;
      if (m.has(h.targetPosition)) continue;
      if (i >= MAX_MENTION_SLOTS) break;
      m.set(h.targetPosition, i++);
    }
    return m;
  }, [pinList, phraseHits, playingTrackPos]);
  const subtitleCallbacks: SubtitleCallback[] = useMemo(
    () => phraseHits.map((h) => ({ start: h.start, end: h.end, targetPosition: h.targetPosition })),
    [phraseHits],
  );
  const sentenceSegs = useMemo(
    () => (currentParagraph ? buildSubtitleSegments(currentParagraph, subtitleCallbacks) : []),
    [currentParagraph, subtitleCallbacks],
  );
  const showSentence = connectionsEnabled && !!currentParagraph && phraseHits.length > 0;
  const kindByPosition = useMemo(() => {
    const m = new Map<number, ConnectionKind>();
    for (const n of neighbors) m.set(n.position, n.kind);
    return m;
  }, [neighbors]);
  const directionByPosition = useMemo(() => {
    const m = new Map<number, 'in' | 'out' | 'lateral'>();
    for (const n of neighbors) m.set(n.position, n.direction);
    return m;
  }, [neighbors]);
  const connectionsActive = connectionsEnabled && pinList.length > 0;

  const getCardEl = useCallback(
    (position: number): HTMLElement | null => {
      const idx = tracks.findIndex((t) => t.position === position);
      return idx >= 0 ? cardRefs.current[idx] ?? null : null;
    },
    [tracks],
  );

  const cardAtPoint = (clientX: number, clientY: number): number | null => {
    for (let i = cardRefs.current.length - 1; i >= 0; i--) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return i;
      }
    }
    return null;
  };

  const onStageMouseMove = (e: ReactMouseEvent) => {
    const idx = cardAtPoint(e.clientX, e.clientY);
    if (idx !== hoveredIndex) setHoveredIndex(idx);
  };

  const onStageClick = (e: ReactMouseEvent) => {
    const idx = cardAtPoint(e.clientX, e.clientY);
    if (idx !== null) {
      const t = tracks[idx];
      if (t) play(t.position);
    }
  };

  return (
    <div
      className="timeline-scene"
      style={{
        ['--card-w' as string]: `${tuning.cardWidth}px`,
        ['--card-h' as string]: `${tuning.cardHeight}px`,
      }}
    >
      <div
        ref={stageRef}
        className="timeline-scene__stage"
        onMouseMove={onStageMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={onStageClick}
        style={{ perspective: `${tuning.perspective}px` }}
      >
        <div
          className="timeline-scene__stage-inner"
          style={{
            transform:
              phase === 'playing'
                ? `translate(${tuning.playingOffsetX}px, ${tuning.playingOffsetY}px) rotateX(${tuning.playingRotX}deg) rotateY(0deg) rotateZ(0deg)`
                : `rotateX(${tuning.stageRotX}deg) rotateY(${tuning.stageRotY}deg) rotateZ(${tuning.stageRotZ}deg)`,
            transition: `transform ${INTRO_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {tracks.map((track, i) => {
            const baseTransform = processionLayout({
              index: i,
              total,
              focalIndex,
              hoveredIndex,
              tuning,
              centerIndex,
            });
            const isFocal = i === focalIndex;
            const isThisPlaying = playingPosition === track.position && isPlaying;
            // During playback: playing card is flat + centered; others orbit the circular ring.
            let transform =
              phase === 'playing' && i === playingIndex
                ? {
                    x: 0,
                    y: 0,
                    z: tuning.focalZBoost,
                    rotX: 0,
                    rotY: 0,
                    rotZ: 0,
                    opacity: 1,
                    scale: tuning.focalScale,
                  }
                : phase === 'playing' && playingIndex >= 0
                ? arcLayout({
                    index: i,
                    total,
                    playingIndex,
                    arcSpacing: tuning.arcSpacing,
                    arcDepth: tuning.arcDepth,
                    arcRotStep: tuning.arcRotStep,
                  })
                : baseTransform;

            // ep1 connection layer: named songs leave the playlist procession
            // and rise onto the outer ring's front arc (toward the camera);
            // the now-playing card eases back a touch, and the rest of the
            // playlist ring recedes + dims so the active links read.
            const lit = connectionsActive && pinSet.has(track.position);
            const recessed =
              connectionsActive && i !== playingIndex && !pinSet.has(track.position);
            if (lit) {
              transform = outerRingLayout(slotByPosition.get(track.position) ?? 0, tuning);
            } else if (recessed) {
              transform = {
                ...transform,
                z: transform.z - tuning.ringRecede,
                opacity: Math.min(transform.opacity, 0.16),
              };
            } else if (connectionsActive && i === playingIndex) {
              transform = { ...transform, z: transform.z - tuning.focalRecede };
            }
            const slotColor = lit
              ? mentionColor(slotByPosition.get(track.position) ?? 0, 0.95)
              : undefined;
            const zIndex = isFocal
              ? 1000
              : lit
              ? 500 + (slotByPosition.get(track.position) ?? 0)
              : i + 1;
            const cardTransition =
              phase === 'intro1' || phase === 'intro3'
                ? {
                    type: 'tween' as const,
                    duration: INTRO_TRANSITION_MS / 1000,
                    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                  }
                : undefined;
            return (
              <TrackCard
                key={track.position}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                track={track}
                transform={transform}
                isFocal={isFocal}
                isPlaying={isThisPlaying}
                zIndex={zIndex}
                lit={lit}
                recessed={recessed}
                {...(slotColor ? { slotColor } : {})}
                {...(cardTransition ? { transition: cardTransition } : {})}
              />
            );
          })}

        </div>
        {connectionsActive && (
          <ConnectionOverlay
            stageRef={stageRef}
            focalPosition={playingPosition}
            pins={pinList}
            getEl={getCardEl}
            kindByPosition={kindByPosition}
            directionByPosition={directionByPosition}
            slotByPosition={slotByPosition}
            slotColor={(slot) => mentionColor(slot, 0.95)}
            language={language}
          />
        )}
      </div>
      {showSentence && (
        <div className="timeline-sentence">
          <p className="timeline-sentence__text">
            {sentenceSegs.map((s, idx) =>
              s.kind === 'plain' ? (
                <span key={idx}>{s.text}</span>
              ) : (
                <button
                  key={idx}
                  type="button"
                  className="timeline-sentence__pill"
                  style={{
                    ['--pill-color' as string]: mentionColor(
                      slotByPosition.get(s.position) ?? 0,
                      1,
                    ),
                  }}
                  onClick={() => play(s.position)}
                >
                  {s.text}
                </button>
              ),
            )}
          </p>
        </div>
      )}
      {playingPosition === null && phase === 'intro3' && (
        <div className="timeline-scene__stepper-wrap">
          <Stepper
            track={focalTrack}
            prevTrack={prevTrack}
            nextTrack={nextTrack}
            index={focalIndex}
            total={total}
          />
        </div>
      )}
      <TuningPanel />
    </div>
  );
}
