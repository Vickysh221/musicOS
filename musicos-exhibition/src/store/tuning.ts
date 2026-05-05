import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TuningParams {
  // Per-card layout
  gapX: number;            // px between adjacent card centers
  riseY: number;           // px each subsequent card rises (negative y in render)
  stepZ: number;           // px each subsequent card pulls toward camera
  jitterDeg: number;       // hand-placed in-plane rotation range for non-focal cards
  cardRotX: number;        // per-card tilt around horizontal axis (deg)
  cardRotY: number;        // per-card tilt around vertical axis (deg)
  // Focal emphasis
  focalScale: number;
  focalLift: number;       // px translateY lift on focal card
  focalZBoost: number;     // px z bump on focal card
  // Card size
  cardWidth: number;       // px
  cardHeight: number;      // px
  // Stage (whole procession) orientation
  stageRotX: number;       // deg
  stageRotY: number;       // deg
  stageRotZ: number;       // deg
  perspective: number;     // px
  // Visibility of the tuning panel
  panelOpen: boolean;
}

export const TUNING_DEFAULTS: TuningParams = {
  gapX: 56,
  riseY: 18,
  stepZ: 10,
  jitterDeg: 6,
  cardRotX: 0,
  cardRotY: 0,
  focalScale: 1.05,
  focalLift: 12,
  focalZBoost: 40,
  cardWidth: 150,
  cardHeight: 200,
  stageRotX: 22,
  stageRotY: -14,
  stageRotZ: 0,
  perspective: 1600,
  panelOpen: false,
};

interface TuningStore extends TuningParams {
  set: <K extends keyof TuningParams>(key: K, value: TuningParams[K]) => void;
  reset: () => void;
  togglePanel: () => void;
}

export const useTuning = create<TuningStore>()(
  persist(
    (set) => ({
      ...TUNING_DEFAULTS,
      set: (key, value) => set({ [key]: value } as Partial<TuningParams>),
      reset: () => set({ ...TUNING_DEFAULTS, panelOpen: true }),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
    }),
    { name: 'musicos-tuning-v1' },
  ),
);
