import { useEffect, useRef } from 'react';
import { getOrCreateAnalyser, useSharedAudioElement } from '../../hooks/useAudioAnalyser.js';
import './spectrum.css';

// Fine-grained dot matrix that fills the parent's width.
// Pitch is fixed in CSS pixels; column count derives from container width.
const ROWS = 10;
const DOT_RADIUS = 1.1;
const DOT_PITCH_X = 7;
const DOT_PITCH_Y = 7;

export function Spectrum() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audio = useSharedAudioElement();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cols = 1;
    let cssWidth = 0;
    const cssHeight = ROWS * DOT_PITCH_Y;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : canvas.clientWidth;
      cssWidth = Math.max(1, w);
      cols = Math.max(8, Math.floor(cssWidth / DOT_PITCH_X));
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const analyser = audio ? getOrCreateAnalyser(audio) : null;
    const buf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    // Idle blend: when no real audio energy, fade toward a synthetic breathing
    // wave so the bar always looks alive. Real audio overrides instantly.
    let idleBlend = 1; // 0 = full real audio, 1 = full synthetic
    const ENERGY_GATE = 0.025;
    const BLEND_RATE_IN = 0.18; // fade to synthetic when audio drops
    const BLEND_RATE_OUT = 0.35; // snap to real when audio resumes

    let rafId = 0;
    const draw = (tMs: number) => {
      let energy = 0;
      if (analyser && buf) {
        analyser.getByteFrequencyData(buf);
        // Sum first 60% of bins (where music energy actually sits).
        const lim = Math.min(buf.length, Math.floor(buf.length * 0.6));
        for (let i = 0; i < lim; i++) energy += buf[i];
        energy = energy / (lim * 255);
      }
      const liveAvailable = energy > ENERGY_GATE;
      idleBlend += ((liveAvailable ? 0 : 1) - idleBlend) *
        (liveAvailable ? BLEND_RATE_OUT : BLEND_RATE_IN);

      const t = tMs / 1000;
      const center = (cols - 1) / 2;
      const binCount = buf ? buf.length : 0;

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      for (let c = 0; c < cols; c++) {
        // Map column → log-ish frequency bin so highs aren't squashed.
        const norm = c / Math.max(1, cols - 1);
        const binIdx = buf
          ? Math.min(binCount - 1, Math.floor(Math.pow(norm, 1.4) * binCount * 0.7))
          : 0;
        const live = buf ? (buf[binIdx] ?? 0) / 255 : 0;

        // Synthetic breathing: bell envelope across columns + per-column sine.
        const dist = Math.abs(c - center) / Math.max(1, center);
        const env = 1 - dist * dist * 0.85;
        const wave = 0.5 + 0.5 * Math.sin(t * 1.4 + c * 0.18);
        const synth = 0.16 + 0.32 * env * wave;

        const v = live * (1 - idleBlend) + synth * idleBlend;
        const litRows = Math.max(1, Math.round(v * ROWS));
        for (let r = 0; r < ROWS; r++) {
          const fromBottom = ROWS - 1 - r;
          const lit = fromBottom < litRows;
          const alpha = lit ? 0.55 + 0.4 * v : 0.06;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(
            DOT_PITCH_X / 2 + c * DOT_PITCH_X,
            DOT_PITCH_Y / 2 + r * DOT_PITCH_Y,
            DOT_RADIUS,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [audio]);

  return <canvas ref={canvasRef} className="spectrum" aria-hidden="true" />;
}
