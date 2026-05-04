import { create } from 'zustand';
import type { Exhibit } from '../types.js';
import { loadExhibition } from '../lib/load-exhibition.js';

interface ExhibitionStore {
  exhibits: Exhibit[];
  language: 'zh' | 'en';
  mode: 'auto' | 'manual';
  load: () => Promise<void>;
  setLanguage: (lang: 'zh' | 'en') => void;
  setMode: (mode: 'auto' | 'manual') => void;
}

export const useExhibition = create<ExhibitionStore>((set) => ({
  exhibits: [],
  language: 'zh',
  mode: 'manual',
  load: async () => {
    const exhibits = await loadExhibition();
    set({ exhibits });
  },
  setLanguage: (language) => set({ language }),
  setMode: (mode) => set({ mode }),
}));
