import { create } from 'zustand';
import type { Exhibit } from '../types.js';
import { loadExhibition } from '../lib/load-exhibition.js';

function playableExhibits(exhibits: Exhibit[]): Exhibit[] {
  return exhibits
    .filter((e) => Boolean(e.fusion_audio_url) || (e.kind === 'track' && Boolean(e.audio_url)))
    .slice()
    .sort((a, b) => a.position - b.position);
}

interface ExhibitionStore {
  exhibits: Exhibit[];
  episodeId: string | null;
  language: 'zh' | 'en';
  mode: 'auto' | 'manual';
  playingPosition: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  seekRequest: { time: number; id: number } | null;
  load: (episodeId: string) => Promise<void>;
  setLanguage: (lang: 'zh' | 'en') => void;
  setMode: (mode: 'auto' | 'manual') => void;
  play: (position: number) => void;
  togglePlay: () => void;
  pause: () => void;
  stop: () => void;
  setIsPlaying: (v: boolean) => void;
  setProgress: (currentTime: number, duration: number) => void;
  seekTo: (time: number) => void;
  next: () => void;
  prev: () => void;
}

export const useExhibition = create<ExhibitionStore>((set, get) => ({
  exhibits: [],
  episodeId: null,
  language: 'zh',
  mode: 'manual',
  playingPosition: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  seekRequest: null,
  load: async (episodeId: string) => {
    const current = get().episodeId;
    if (current === episodeId && get().exhibits.length > 0) return;
    // Reset playback when switching episodes
    set({ exhibits: [], episodeId, playingPosition: null, isPlaying: false, currentTime: 0, duration: 0 });
    const exhibits = await loadExhibition(episodeId);
    set({ exhibits, episodeId });
  },
  setLanguage: (language) => set({ language }),
  setMode: (mode) => set({ mode }),
  play: (position) => {
    const { playingPosition } = get();
    if (playingPosition !== position) {
      set({ playingPosition: position, isPlaying: true, currentTime: 0, duration: 0 });
    } else {
      set({ isPlaying: true });
    }
  },
  togglePlay: () => {
    const { isPlaying, playingPosition, exhibits } = get();
    if (playingPosition === null) {
      const first = playableExhibits(exhibits)[0];
      if (first) set({ playingPosition: first.position, isPlaying: true, currentTime: 0, duration: 0 });
      return;
    }
    set({ isPlaying: !isPlaying });
  },
  pause: () => set({ isPlaying: false }),
  stop: () => set({ playingPosition: null, isPlaying: false, currentTime: 0, duration: 0 }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setProgress: (currentTime, duration) => set({ currentTime, duration }),
  seekTo: (time) => set({ seekRequest: { time, id: Date.now() } }),
  next: () => {
    const { exhibits, playingPosition } = get();
    if (playingPosition === null) return;
    const queue = playableExhibits(exhibits);
    const idx = queue.findIndex((e) => e.position === playingPosition);
    const nx = idx >= 0 && idx < queue.length - 1 ? queue[idx + 1] : null;
    if (nx) {
      set({ playingPosition: nx.position, isPlaying: true, currentTime: 0, duration: 0 });
    } else {
      set({ isPlaying: false });
    }
  },
  prev: () => {
    const { exhibits, playingPosition } = get();
    if (playingPosition === null) return;
    const queue = playableExhibits(exhibits);
    const idx = queue.findIndex((e) => e.position === playingPosition);
    const pv = idx > 0 ? queue[idx - 1] : null;
    if (pv) {
      set({ playingPosition: pv.position, isPlaying: true, currentTime: 0, duration: 0 });
    } else {
      set({ currentTime: 0, seekRequest: { time: 0, id: Date.now() } });
    }
  },
}));
