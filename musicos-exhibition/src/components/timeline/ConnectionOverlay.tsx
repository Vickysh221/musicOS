import { useEffect, useState, type RefObject } from 'react';
import type { ConnectionKind } from '../../types.js';
import './connection-overlay.css';

const KIND_LABEL: Record<ConnectionKind, { zh: string; en: string }> = {
  bassline_prototype: { zh: '贝斯线原型', en: 'bassline prototype' },
  groove_dna: { zh: '律动基因', en: 'groove DNA' },
  personnel_bridge_bass: { zh: '乐手桥接', en: 'personnel bridge' },
  gear_lineage_bass: { zh: '器材谱系', en: 'gear lineage' },
};

interface Props {
  /** The perspective stage; edge coordinates are computed relative to it. */
  stageRef: RefObject<HTMLElement | null>;
  /** Now-playing track position — every edge points at this card. */
  focalPosition: number | null;
  /** Lit source positions, in mention order. */
  pins: number[];
  /** Resolve a track position to its rendered card element. */
  getEl: (position: number) => HTMLElement | null;
  kindByPosition: Map<number, ConnectionKind>;
  /** 'in' = ancestor→focal, 'out' = focal→descendant, 'lateral' = same era. */
  directionByPosition: Map<number, 'in' | 'out' | 'lateral'>;
  slotByPosition: Map<number, number>;
  slotColor: (slot: number) => string;
  language: 'zh' | 'en';
}

interface Edge {
  position: number;
  d: string;
  // Label anchor (near the arc apex).
  lx: number;
  ly: number;
  color: string;
  label: string;
}

export function ConnectionOverlay({
  stageRef,
  focalPosition,
  pins,
  getEl,
  kindByPosition,
  directionByPosition,
  slotByPosition,
  slotColor,
  language,
}: Props) {
  const [edges, setEdges] = useState<Edge[]>([]);
  // Re-derive only when the active set changes; the rAF loop keeps the
  // geometry glued to the cards as their springs settle.
  const pinKey = pins.join(',');

  useEffect(() => {
    if (focalPosition === null || pins.length === 0) {
      setEdges([]);
      return;
    }
    let raf = 0;
    const tick = () => {
      const stage = stageRef.current;
      const focalEl = getEl(focalPosition);
      if (stage && focalEl) {
        const sb = stage.getBoundingClientRect();
        const fb = focalEl.getBoundingClientRect();
        const fx = fb.left + fb.width / 2 - sb.left;
        const fy = fb.top + fb.height / 2 - sb.top;
        const next: Edge[] = [];
        for (const p of pins) {
          const el = getEl(p);
          if (!el) continue;
          const b = el.getBoundingClientRect();
          const cardX = b.left + b.width / 2 - sb.left;
          const cardY = b.top + b.height / 2 - sb.top;
          // Ancestor (in) / lateral edges flow source→focal; a descendant (out)
          // edge flows focal→source-card, so the arrowhead lands on what the
          // playing track influenced.
          const out = (directionByPosition.get(p) ?? 'in') === 'out';
          const ax = out ? fx : cardX;
          const ay = out ? fy : cardY;
          const aw = out ? fb.width : b.width;
          const bx = out ? cardX : fx;
          const by = out ? cardY : fy;
          const bw = out ? b.width : fb.width;
          const dx = bx - ax;
          const dy = by - ay;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          // Leave the start card edge; stop short of the target so the
          // arrowhead reads as landing on it rather than buried under it.
          const x1 = ax + ux * aw * 0.42;
          const y1 = ay + uy * aw * 0.42;
          const x2 = bx - ux * bw * 0.5;
          const y2 = by - uy * bw * 0.5;
          // Gentle bow via a perpendicular lift on the midpoint.
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const bow = Math.min(60, len * 0.16);
          const cx = mx - uy * bow;
          const cy = my + ux * bow;
          const slot = slotByPosition.get(p) ?? 0;
          const kind = kindByPosition.get(p);
          next.push({
            position: p,
            d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
            lx: cx,
            ly: cy,
            color: slotColor(slot),
            label: kind ? KIND_LABEL[kind]?.[language] ?? kind : '',
          });
        }
        setEdges(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRef, focalPosition, pinKey, getEl, language]);

  if (edges.length === 0) return null;

  return (
    <svg className="timeline-connections" aria-hidden="true">
      <defs>
        <marker
          id="timeline-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.7)" />
        </marker>
      </defs>
      {edges.map((e) => (
        <g key={e.position}>
          <path
            className="timeline-connections__edge"
            d={e.d}
            markerEnd="url(#timeline-arrowhead)"
            style={{ ['--edge-color' as string]: e.color }}
          />
          {e.label && (
            <text className="timeline-connections__label" x={e.lx} y={e.ly - 6} textAnchor="middle">
              {e.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
