import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { FloatingCanvas } from '../components/home/FloatingCanvas.js';
import { FloatingCover, type ExitTarget } from '../components/home/FloatingCover.js';
import { SLOTS, coverForSlot, stackTarget, type HoverState, type Slot } from '../components/home/home-layout.js';
import { loadHomeManifest, type EpisodeManifest } from '../lib/home-manifest.js';
import { EPISODES } from '../lib/episodes.js';
import './home.css';

const STACK_EPISODES = new Set(['ep1', 'ep4']);
const STACK_DURATION_MS = 650;

export function Home() {
  const [, setLocation] = useLocation();
  const [manifests, setManifests] = useState<Record<string, EpisodeManifest> | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [exitingEpisode, setExitingEpisode] = useState<string | null>(null);
  const navTimer = useRef<number | null>(null);

  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    let alive = true;
    loadHomeManifest()
      .then((list) => {
        if (!alive) return;
        setManifests(Object.fromEntries(list.map((m) => [m.episodeId, m])));
      })
      .catch((err) => {
        if (!alive) return;
        // Static episode JSONs should always resolve; if a fetch fails, fall
        // back to the first episode rather than stranding the user on LOADING.
        console.error('Failed to load home manifest', err);
        setLocation('/ep1');
      });
    return () => {
      alive = false;
      if (navTimer.current) window.clearTimeout(navTimer.current);
    };
  }, []);

  function handleClick(slot: Slot) {
    if (exitingEpisode) return;
    const episodeId = slot.episodeId;
    if (STACK_EPISODES.has(episodeId) && !reducedMotion) {
      // Pin hover to the clicked episode so its tracklist covers are what
      // collapse into the stack — even when clicked without a prior mouseenter.
      // hover is intentionally not reset: Home unmounts once setLocation routes away.
      setHover({ hoveredSlotId: slot.id, activeEpisodeId: episodeId });
      setExitingEpisode(episodeId);
      navTimer.current = window.setTimeout(() => setLocation(`/${episodeId}`), STACK_DURATION_MS);
    } else {
      setLocation(`/${episodeId}`);
    }
  }

  if (!manifests) {
    return (
      <div className="home">
        <FloatingCanvas episodeCount={EPISODES.length}>
          <div className="home__loading">LOADING</div>
        </FloatingCanvas>
      </div>
    );
  }

  return (
    <div className="home">
      <FloatingCanvas episodeCount={6}>
        {SLOTS.map((slot, i) => {
          const exit: ExitTarget | null = exitingEpisode ? stackTarget(i, SLOTS.length) : null;
          return (
            <FloatingCover
              key={slot.id}
              slot={slot}
              cover={coverForSlot(slot, manifests, hover)}
              active={hover?.hoveredSlotId === slot.id}
              dimmed={hover !== null}
              reducedMotion={reducedMotion}
              exit={exit}
              onHover={() => !exitingEpisode && setHover({ hoveredSlotId: slot.id, activeEpisodeId: slot.episodeId })}
              onLeave={() => !exitingEpisode && setHover(null)}
              onClick={() => handleClick(slot)}
            />
          );
        })}
      </FloatingCanvas>
    </div>
  );
}
