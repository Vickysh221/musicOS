import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useLocation } from 'wouter';
import { FloatingCanvas, type EpisodeBadge } from '../components/home/FloatingCanvas.js';
import { FloatingCover, type ExitTarget } from '../components/home/FloatingCover.js';
import { SLOTS, coverForSlot, stackTarget, type HoverState, type Slot } from '../components/home/home-layout.js';
import { loadHomeManifest, type EpisodeManifest } from '../lib/home-manifest.js';
import { EPISODES } from '../lib/episodes.js';
import './home.css';

const STACK_EPISODES = new Set(['ep1', 'ep4']);
const STACK_DURATION_MS = 650;
const PAN_RANGE = 0.22; // max field travel as a fraction of the viewport
const PAN_SPEED = 7; // px per frame at full cursor deflection
const DEADZONE = 0.08; // cursor fraction from center with no pan

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function Home() {
  const [, setLocation] = useLocation();
  const [manifests, setManifests] = useState<Record<string, EpisodeManifest> | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [exitingEpisode, setExitingEpisode] = useState<string | null>(null);
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const navTimer = useRef<number | null>(null);

  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // Continuous diagonal auto-pan: the whole cover field slides toward the
  // cursor (revealing off-screen covers), clamped to the field bounds and
  // frozen while a cover is hovered. Driven through motion values + rAF so the
  // 60fps motion never triggers React re-renders.
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoverRef = useRef<HoverState | null>(null);
  const vpRef = useRef(vp);
  hoverRef.current = hover;
  vpRef.current = vp;

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let raf = requestAnimationFrame(function tick() {
      raf = requestAnimationFrame(tick);
      const m = mouseRef.current;
      if (hoverRef.current || !m) return; // frozen on hover / no cursor yet
      const { w, h } = vpRef.current;
      let dx = -(m.x / w - 0.5) * 2; // toward cursor: field moves opposite
      let dy = -(m.y / h - 0.5) * 2;
      if (Math.abs(dx) < DEADZONE) dx = 0;
      if (Math.abs(dy) < DEADZONE) dy = 0;
      if (dx === 0 && dy === 0) return;
      panX.set(clamp(panX.get() + dx * PAN_SPEED, -w * PAN_RANGE, w * PAN_RANGE));
      panY.set(clamp(panY.get() + dy * PAN_SPEED, -h * PAN_RANGE, h * PAN_RANGE));
    });
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, panX, panY]);

  function handleMouseMove(e: { clientX: number; clientY: number }) {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }
  function handleMouseLeave() {
    mouseRef.current = null;
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

  // Per-cover translate: gather toward the hovered cover. The base drift (pan)
  // lives on the field wrapper, so idle covers carry no per-cover offset.
  function offsetFor(slot: Slot): { x: number; y: number } {
    if (reducedMotion || !hoveredSlot || slot.id === hoveredSlot.id) return { x: 0, y: 0 };
    return {
      x: ((hoveredSlot.xPct - slot.xPct) / 100) * vp.w * 0.1,
      y: ((hoveredSlot.yPct - slot.yPct) / 100) * vp.h * 0.1,
    };
  }

  return (
    <div className="home" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <FloatingCanvas episodeCount={EPISODES.length} activeMeta={activeMeta}>
        <motion.div className="home__field" style={{ x: panX, y: panY }}>
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
        </motion.div>
      </FloatingCanvas>
    </div>
  );
}
