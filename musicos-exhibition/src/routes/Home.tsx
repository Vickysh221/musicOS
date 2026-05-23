import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { FloatingCanvas, type EpisodeBadge } from '../components/home/FloatingCanvas.js';
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

  // Mouse-parallax: covers drift opposite the cursor over empty space. Frozen
  // while a cover is hovered (the gather offset takes over instead).
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const rafRef = useRef<number | null>(null);
  const pendingMouse = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handleMouseMove(e: { clientX: number; clientY: number }) {
    if (hover) return; // frozen while a cover is hovered
    pendingMouse.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (pendingMouse.current) setMouse(pendingMouse.current);
      });
    }
  }

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

  const activeEpisodeId = exitingEpisode ?? hover?.activeEpisodeId ?? null;
  const activeEp = activeEpisodeId ? EPISODES.find((e) => e.id === activeEpisodeId) : undefined;
  const activeMeta: EpisodeBadge | null = activeEp
    ? { titleZh: activeEp.titleZh, anchor: activeEp.anchor, year: activeEp.year }
    : null;

  const hoveredSlot = hover ? SLOTS.find((s) => s.id === hover.hoveredSlotId) ?? null : null;

  // Per-cover translate: gather toward the hovered cover when one is active,
  // otherwise depth-scaled parallax following the cursor. Zero under reduced motion.
  function offsetFor(slot: Slot): { x: number; y: number } {
    if (reducedMotion) return { x: 0, y: 0 };
    if (hoveredSlot) {
      if (slot.id === hoveredSlot.id) return { x: 0, y: 0 };
      return {
        x: ((hoveredSlot.xPct - slot.xPct) / 100) * vp.w * 0.1,
        y: ((hoveredSlot.yPct - slot.yPct) / 100) * vp.h * 0.1,
      };
    }
    if (!mouse) return { x: 0, y: 0 };
    const px = mouse.x / vp.w - 0.5;
    const py = mouse.y / vp.h - 0.5;
    const f = (slot.depth + 1) * 16;
    return { x: -px * f, y: -py * f };
  }

  return (
    <div className="home" onMouseMove={handleMouseMove}>
      <FloatingCanvas episodeCount={EPISODES.length} activeMeta={activeMeta}>
        {SLOTS.map((slot, i) => {
          const exit: ExitTarget | null = exitingEpisode ? stackTarget(i, SLOTS.length) : null;
          const offset = offsetFor(slot);
          return (
            <FloatingCover
              key={slot.id}
              slot={slot}
              cover={coverForSlot(slot, manifests, hover)}
              active={hover?.hoveredSlotId === slot.id}
              dimmed={hover !== null}
              frozen={hover !== null}
              offsetX={offset.x}
              offsetY={offset.y}
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
