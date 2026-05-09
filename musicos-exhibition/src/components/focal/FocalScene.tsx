import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useExhibition } from '../../store/exhibition.js';
import { useTuning } from '../../store/tuning.js';
import { useFusionSubtitle } from '../../hooks/useFusionSubtitle.js';
import { useCurrentAndNext } from '../../hooks/useCurrentAndNext.js';
import {
  findCallbackTargets,
  findCallbackPhrases,
  aliasesForPosition,
  type CandidateAlias,
} from '../../lib/callback-phrase.js';
import { EP3_ALIASES } from '../../data/ep3-aliases.js';
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

const RESUME_REWIND_SEC = 300; // tap-back resumes 5 minutes before saved breakpoint
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
  const play = useExhibition((s) => s.play);
  const seekTo = useExhibition((s) => s.seekTo);
  const tuning = useTuning();

  const [lastPlayedTrackPosition, setLastPlayedTrackPosition] = useState<number | null>(null);
  // Set of mentioned positions pinned for the duration of the focal song. Once
  // a callback fires, the arc stays until the focal track changes.
  const [arcPins, setArcPins] = useState<Set<number>>(new Set());
  // 1-level back: { position, time } captured when the user jumps to a related
  // song via arc/pill. Cleared when goBack consumes it. Not auto-cleared on
  // natural advance — staying gives users a way to recover the song they
  // detoured from even after the detour song finishes.
  const [previousNav, setPreviousNav] = useState<{ position: number; time: number } | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const tracks = exhibits.filter((e): e is TrackExhibit => e.kind === 'track');
  const currentExhibit = exhibits.find((e) => e.position === playingPosition) ?? null;
  const playingTrackPosition =
    currentExhibit?.kind === 'track' ? currentExhibit.position : null;
  const trackPositions = tracks.map((t) => t.position).sort((a, b) => a - b);
  const anchorPosition = trackPositions[0] ?? 0;
  const currentPosition = lastPlayedTrackPosition ?? anchorPosition;

  const subtitle = useFusionSubtitle(currentExhibit?.fusion_audio_url ?? null);
  const { current, next } = useCurrentAndNext(subtitle, currentTime);

  useEffect(() => {
    if (playingTrackPosition !== null && playingTrackPosition !== lastPlayedTrackPosition) {
      setLastPlayedTrackPosition(playingTrackPosition);
    }
  }, [playingTrackPosition, lastPlayedTrackPosition]);

  // Focal track changed → wipe arc pins for the new song's callback context.
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
    return positions.map((p) => ({ position: p, aliases: aliasesForPosition(p, tracks, EP3_ALIASES) }));
  }, [exhibits, currentPosition, tracks]);

  const phraseHits = useMemo(
    () => (current ? findCallbackPhrases(current.text, candidates) : []),
    [current, candidates],
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

  const cbKey = phraseHits.map((h) => h.targetPosition).join(',');
  useEffect(() => {
    if (phraseHits.length === 0) return;
    setArcPins((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const h of phraseHits) {
        if (!next.has(h.targetPosition)) {
          next.add(h.targetPosition);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cbKey, current?.text]);

  const arcTracks: TrackExhibit[] = useMemo(() => {
    const live = [...arcPins].filter((p) => p !== currentPosition).sort((a, b) => a - b);
    return live
      .map((p) => tracks.find((t) => t.position === p))
      .filter((t): t is TrackExhibit => Boolean(t));
  }, [arcPins, currentPosition, tracks]);

  const episodeMeta = EPISODES.find((e) => e.id === episodeId);
  const epTitle = episodeMeta?.titleZh ?? '';

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
  const goToTrack = (target: number) => {
    if (target === currentPosition) return;
    setPreviousNav({ position: currentPosition, time: currentTime });
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
    play(position);
    seekTo(Math.max(0, time - RESUME_REWIND_SEC));
  };

  return (
    <div className="focal-scene">
      <BackgroundShader persona={1} />
      <header className="focal-scene__header">
        <h1 className="focal-scene__title">{epTitle}</h1>
        <Subtitle
          current={current?.text ?? null}
          next={next?.text ?? null}
          callbacks={subtitleCallbacks}
          onPillClick={goToTrack}
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
