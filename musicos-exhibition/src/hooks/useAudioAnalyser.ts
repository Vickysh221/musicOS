import { useEffect, useState } from 'react';

let sharedAudioEl: HTMLAudioElement | null = null;
const listeners = new Set<(el: HTMLAudioElement | null) => void>();

export function setSharedAudioElement(el: HTMLAudioElement | null) {
  if (sharedAudioEl === el) return;
  sharedAudioEl = el;
  for (const fn of listeners) fn(el);
}

export function useSharedAudioElement(): HTMLAudioElement | null {
  const [el, setEl] = useState<HTMLAudioElement | null>(sharedAudioEl);
  useEffect(() => {
    listeners.add(setEl);
    setEl(sharedAudioEl);
    return () => {
      listeners.delete(setEl);
    };
  }, []);
  return el;
}

let analyserCtx: AudioContext | null = null;
let analyserSource: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let analyserBoundEl: HTMLAudioElement | null = null;

/**
 * Returns a singleton AnalyserNode bound to the given audio element.
 * Reuses the same MediaElementSource — the Web Audio API forbids creating
 * a second source for the same element.
 */
export function getOrCreateAnalyser(audio: HTMLAudioElement): AnalyserNode | null {
  if (analyserBoundEl === audio && analyserNode) return analyserNode;
  // Different element (e.g. <audio key={src}> remounted on track change) —
  // tear the old graph down and rebuild against the new one.
  if (analyserBoundEl && analyserBoundEl !== audio) {
    try { analyserSource?.disconnect(); } catch { /* ignore */ }
    try { analyserNode?.disconnect(); } catch { /* ignore */ }
    try { void analyserCtx?.close(); } catch { /* ignore */ }
    analyserCtx = null;
    analyserSource = null;
    analyserNode = null;
    analyserBoundEl = null;
  }
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!analyserCtx) analyserCtx = new Ctor();
    if (!analyserSource) analyserSource = analyserCtx.createMediaElementSource(audio);
    if (!analyserNode) {
      analyserNode = analyserCtx.createAnalyser();
      analyserNode.fftSize = 128;
      analyserNode.smoothingTimeConstant = 0.78;
      analyserSource.connect(analyserNode);
      analyserNode.connect(analyserCtx.destination);
    }
    analyserBoundEl = audio;
    return analyserNode;
  } catch {
    return null;
  }
}

export function resumeAudioContext() {
  if (analyserCtx && analyserCtx.state === 'suspended') {
    void analyserCtx.resume();
  }
}
