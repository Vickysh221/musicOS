import { useEffect, useRef } from 'react';
import { getOrCreateAnalyser, useSharedAudioElement } from '../../hooks/useAudioAnalyser.js';
import './spectrum.css';

const COLS = 16;
const ROWS = 6;
const DOT_RADIUS = 2.4;
const DOT_GAP_X = 12;
const DOT_GAP_Y = 10;

export function Spectrum() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audio = useSharedAudioElement();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = COLS * DOT_GAP_X;
    const height = ROWS * DOT_GAP_Y;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const analyser = audio ? getOrCreateAnalyser(audio) : null;
    const buf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    let rafId = 0;
    const draw = () => {
      if (analyser && buf) analyser.getByteFrequencyData(buf);
      ctx.clearRect(0, 0, width, height);
      for (let c = 0; c < COLS; c++) {
        const v = buf ? (buf[Math.min(buf.length - 1, c * 2)] ?? 0) / 255 : 0;
        const litRows = Math.round(v * ROWS);
        for (let r = 0; r < ROWS; r++) {
          const fromBottom = ROWS - 1 - r;
          const lit = fromBottom < litRows;
          const alpha = lit ? 0.55 + 0.4 * v : 0.06;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(
            DOT_GAP_X / 2 + c * DOT_GAP_X,
            DOT_GAP_Y / 2 + r * DOT_GAP_Y,
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
    return () => cancelAnimationFrame(rafId);
  }, [audio]);

  return <canvas ref={canvasRef} className="spectrum" aria-hidden="true" />;
}
