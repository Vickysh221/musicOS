import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useExhibition } from '../../store/exhibition.js';
import { useTuning } from '../../store/tuning.js';
import {
  findCallbackTargets,
  findCallbackPhrases,
  aliasesForPosition,
  type CandidateAlias,
} from '../../lib/callback-phrase.js';
import {
  splitParagraphs,
  paragraphStartTimes,
  buildSegmentToParagraphMap,
  activeParagraphIdx,
} from '../../lib/transcript-paragraphs.js';
import { useFusionSubtitle } from '../../hooks/useFusionSubtitle.js';
import { useCurrentAndNext } from '../../hooks/useCurrentAndNext.js';
import { ALIASES_BY_EPISODE } from '../../data/episode-aliases.js';
import { EPISODES } from '../../lib/episodes.js';
import { Subtitle, type SubtitleCallback } from './Subtitle.js';
import { PlayerBar } from './PlayerBar.js';
import { FocalDisc } from './FocalDisc.js';
import { MentionArcs } from './MentionArcs.js';
import { BackgroundShader } from './BackgroundShader.js';
import { PreviousDisc } from './PreviousDisc.js';
import { PlaylistPopup } from './PlaylistPopup.js';
import type { CardTransform } from '../timeline/timeline-keyframes.js';
import type { TrackExhibit } from '../../types.js';
import './focal-scene.css';

const RESUME_REWIND_SEC = 10; // tap-back resumes 10 seconds before saved breakpoint
const POPUP_IDLE_REVERT_MS = 5000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

const FOCAL_TRANSFORM: CardTransform = {
  x: 0,
  y: 0,
  z: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  opacity: 1,
  scale: 1,
};

export function FocalScene() {
  const exhibits = useExhibition((s) => s.exhibits);
  const episodeId = useExhibition((s) => s.episodeId);
  const playingPosition = useExhibition((s) => s.playingPosition);
  const isPlaying = useExhibition((s) => s.isPlaying);
  const currentTime = useExhibition((s) => s.currentTime);
  const duration = useExhibition((s) => s.duration);
  const language = useExhibition((s) => s.language);
  const play = useExhibition((s) => s.play);
  const seekTo = useExhibition((s) => s.seekTo);
  const tuning = useTuning();

  const [lastPlayedTrackPosition, setLastPlayedTrackPosition] = useState<number | null>(null);
  // Set of mentioned positions pinned for the duration of the focal song. An
  // arc lights up the first time the narrator says the linked track's name
  // (gated by `arcsReady` so we don't fire during the disc's settle animation)
  // and stays on screen until the focal track changes. Live phrase hits drive
  // additions; the cleanup on focal-track change is the ONLY removal path.
  const [arcPins, setArcPins] = useState<Set<number>>(new Set());
  // 1-level back: { position, time } captured when the user jumps to a related
  // song via arc/pill. Cleared when goBack consumes it. Not auto-cleared on
  // natural advance — staying gives users a way to recover the song they
  // detoured from even after the detour song finishes.
  const [previousNav, setPreviousNav] = useState<{ position: number; time: number } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [subtitleExpanded, setSubtitleExpanded] = useState(false);

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');
  const currentExhibit = exhibits.find((e) => e.position === playingPosition) ?? null;
  const playingTrackPosition =
    currentExhibit?.kind === 'track' ? currentExhibit.position : null;
  const trackPositions = tracks.map((t) => t.position).sort((a, b) => a - b);
  const anchorPosition = trackPositions[0] ?? 0;
  // Derive synchronously from `playingTrackPosition` whenever a track is
  // playing — falling back to the persisted `lastPlayedTrackPosition` only
  // when narration (a non-track exhibit) is active. The persisted value lags
  // behind by one render (it's set via useEffect), so reading it directly
  // would briefly render the previous focal track for a frame after every
  // play() call. That one-frame stale read is the flicker users see when the
  // disc swaps position.
  const currentPosition =
    playingTrackPosition ?? lastPlayedTrackPosition ?? anchorPosition;

  // Subtitle displays the current TRANSCRIPT PARAGRAPH. To stay in sync with
  // actual audio (variable music intro, TTS pacing, pauses), we drive the
  // active paragraph off MiniMax sentence-level timestamps when available,
  // mapping each sentence segment back to its containing paragraph. If no
  // fusion subtitle exists for the track, we fall back to character-count
  // proportional timing as a best-effort estimate.
  const transcript = currentExhibit
    ? language === 'zh'
      ? currentExhibit.transcript_zh
      : currentExhibit.transcript_en
    : null;
  const paragraphs = useMemo(() => splitParagraphs(transcript), [transcript]);
  const fusionSegments = useFusionSubtitle(currentExhibit?.fusion_audio_url ?? null);
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

  useEffect(() => {
    if (playingTrackPosition !== null && playingTrackPosition !== lastPlayedTrackPosition) {
      setLastPlayedTrackPosition(playingTrackPosition);
    }
  }, [playingTrackPosition, lastPlayedTrackPosition]);

  // Gate MentionArcs visibility on a "stage settled" flag: when the focal
  // track changes, the disc spends ~500ms animating between layoutId-shared
  // positions (e.g. PreviousDisc → center on goBack, or in-place mount on
  // natural advance). Showing arcs during that flight looks chaotic, so we
  // delay arc render until after the spring settles.
  const ARCS_SETTLE_MS = 520;
  const [arcsReadyForPos, setArcsReadyForPos] = useState<number | null>(null);
  useEffect(() => {
    setArcsReadyForPos(null);
    const timer = window.setTimeout(() => {
      setArcsReadyForPos(currentPosition);
    }, ARCS_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [currentPosition]);
  const arcsReady = arcsReadyForPos === currentPosition;

  // Clear pins whenever the focal track changes — pins belong to the song.
  useEffect(() => {
    setArcPins(new Set());
  }, [currentPosition]);

  // Auto-close the playlist popup after 5s of inactivity.
  useEffect(() => {
    if (!listOpen) return;
    let timer = window.setTimeout(() => setListOpen(false), POPUP_IDLE_REVERT_MS);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setListOpen(false), POPUP_IDLE_REVERT_MS);
    };
    for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, reset, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, reset);
    };
  }, [listOpen]);

  // Candidate set: every track that connects INTO the focal (strong + archived).
  const candidates: CandidateAlias[] = useMemo(() => {
    const positions = findCallbackTargets(exhibits, currentPosition);
    const curated = ALIASES_BY_EPISODE[episodeId ?? ''] ?? {};
    return positions.map((p) => ({ position: p, aliases: aliasesForPosition(p, tracks, curated) }));
  }, [exhibits, currentPosition, tracks]);

  const phraseHits = useMemo(
    () => (currentParagraph ? findCallbackPhrases(currentParagraph, candidates) : []),
    [currentParagraph, candidates],
  );

  const subtitleCallbacks: SubtitleCallback[] = useMemo(
    () =>
      phraseHits.map((h) => ({
        start: h.start,
        end: h.end,
        targetPosition: h.targetPosition,
      })),
    [phraseHits],
  );

  // Pin a target the FIRST time the narrator mentions it (gated by
  // `arcsReady` so we don't fire during disc settle). Once pinned, the arc
  // stays for the rest of the focal song — only the focal-track-change
  // effect above clears the set.
  const cbKey = phraseHits.map((h) => h.targetPosition).join(',');
  useEffect(() => {
    if (!arcsReady || phraseHits.length === 0) return;
    setArcPins((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const h of phraseHits) {
        if (h.targetPosition === currentPosition) continue;
        if (!next.has(h.targetPosition)) {
          next.add(h.targetPosition);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cbKey, arcsReady, currentPosition, phraseHits]);

  const arcTracks: TrackExhibit[] = useMemo(() => {
    const positions = [...arcPins]
      .filter((p) => p !== currentPosition)
      .sort((a, b) => a - b);
    return positions
      .map((p) => tracks.find((t) => t.position === p))
      .filter((t): t is TrackExhibit => Boolean(t));
  }, [arcPins, currentPosition, tracks]);

  const episodeMeta = EPISODES.find((e) => e.id === episodeId);
  const epTitle = (language === 'en' ? episodeMeta?.titleEn : episodeMeta?.titleZh) ?? '';

  const focalTrack = useMemo(
    () => tracks.find((t) => t.position === currentPosition) ?? null,
    [tracks, currentPosition],
  );
  const previousTrack = useMemo(
    () =>
      previousNav ? tracks.find((t) => t.position === previousNav.position) ?? null : null,
    [previousNav, tracks],
  );

  // Jump to a related song via arc or subtitle pill. Captures the song we're
  // leaving (and its current playback time) as the 1-level back anchor.
  // Connection-driven nav also collapses the transcript — paragraph rollover
  // and natural advance both preserve the user's expanded state, but
  // explicit jumps via a connection reset to the clamped 2-line view.
  const goToTrack = (target: number) => {
    if (target === currentPosition) return;
    setPreviousNav({ position: currentPosition, time: currentTime });
    setSubtitleExpanded(false);
    play(target);
  };

  // Tap the bottom-right disc → return home. The detour anchor is consumed:
  // previousNav clears, so once back at A the right-side mini disc is gone
  // (no toggle/swap). Resume seeks the incoming track back by RESUME_REWIND_SEC
  // for context. The shared layoutId on the disc still animates A from
  // bottom-right back to center; B (the leaving focal) fades via AnimatePresence.
  const goBack = () => {
    if (!previousNav) return;
    const { position, time } = previousNav;
    setPreviousNav(null);
    setSubtitleExpanded(false);
    play(position);
    seekTo(Math.max(0, time - RESUME_REWIND_SEC));
  };

  return (
    <div className="focal-scene">
      <BackgroundShader persona={1} />
      <AnimatePresence>
        {subtitleExpanded && (
          <motion.div
            className="subtitle-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSubtitleExpanded(false)}
          />
        )}
      </AnimatePresence>
      <header
        className={`focal-scene__header${subtitleExpanded ? ' focal-scene__header--lifted' : ''}`}
      >
        <h1 className="focal-scene__title">{epTitle}</h1>
        <Subtitle
          current={currentParagraph}
          callbacks={subtitleCallbacks}
          onPillClick={goToTrack}
          expanded={subtitleExpanded}
          onExpandedChange={setSubtitleExpanded}
        />
      </header>

      <div className="focal-scene__stage" style={{ perspective: `${tuning.perspective}px` }}>
        <div
          className="focal-scene__stage-inner"
          style={{ ['--focal-stage-y' as string]: `${tuning.focalStageY}%` }}
        >
          <AnimatePresence>
            {focalTrack && (
              <FocalDisc
                key={focalTrack.position}
                track={focalTrack}
                transform={FOCAL_TRANSFORM}
                isFocal
                playing={isPlaying}
                size={tuning.focalDiscSize}
                zIndex={1000}
              />
            )}
          </AnimatePresence>
          <MentionArcs
            tracks={arcTracks}
            discSize={tuning.focalDiscSize}
            onArcClick={goToTrack}
            dimmed={subtitleExpanded}
          />
        </div>
      </div>

      <AnimatePresence>
        {previousTrack && (
          <PreviousDisc key={previousTrack.position} track={previousTrack} onClick={goBack} />
        )}
      </AnimatePresence>

      <PlayerBar listOpen={listOpen} onListToggle={() => setListOpen((v) => !v)} />

      <PlaylistPopup
        open={listOpen}
        tracks={tracks}
        currentPosition={currentPosition}
        onSelect={(pos) => {
          setListOpen(false);
          if (pos !== currentPosition) {
            setPreviousNav(null);
            play(pos);
          }
        }}
        onClose={() => setListOpen(false)}
      />
    </div>
  );
}
