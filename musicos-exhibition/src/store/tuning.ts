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
  // Arc layout (playing phase only)
  arcSpacing: number;      // px between adjacent card centers along the arc
  arcDepth: number;        // parabolic Z-recession coefficient (px per offset²)
  arcRotStep: number;      // inward rotY per offset step (deg)
  playingRotX: number;     // stage rotateX during playing — bird's-eye tilt (deg)
  playingOffsetX: number;  // screen-space X shift of the arc center (px)
  playingOffsetY: number;  // screen-space Y shift of the arc center (px)
  // Focal scene — disc + stage
  focalDiscSize: number;        // px (square)
  focalStageY: number;          // % viewport height where focal disc center sits
  // Focal scene — vertical cumulative
  verticalSpacing: number;
  verticalDepth: number;
  verticalShrink: number;
  verticalFade: number;
  verticalRotX: number;         // deg tilt for mentioned discs
  verticalRotY: number;         // deg yaw for mentioned discs
  verticalOffsetX: number;      // px lateral drift per stack level
  focalOffsetY: number;
  // Focal scene — horizontal carousel
  carouselScale: number;
  carouselRotX: number;         // deg tilt for all carousel cards
  // Visibility of the tuning panel
  panelOpen: boolean;
}

export const TUNING_DEFAULTS: TuningParams = {
  gapX: 99,
  riseY: -30,
  stepZ: -38,
  jitterDeg: 13,
  cardRotX: 11,
  cardRotY: 90,
  focalScale: 1.43,
  focalLift: 29,
  focalZBoost: 40,
  cardWidth: 202,
  cardHeight: 204,
  stageRotX: -20,
  stageRotY: -54,
  stageRotZ: -4.5,
  perspective: 4000,
  arcSpacing: 440,
  arcDepth: 150,
  arcRotStep: 20,
  playingRotX: 14,
  playingOffsetX: -55,
  playingOffsetY: -169,
  focalDiscSize: 220,
  focalStageY: 55,
  verticalSpacing: 110,
  verticalDepth: 80,
  verticalShrink: 0.08,
  verticalFade: 0.12,
  verticalRotX: 0,
  verticalRotY: 0,
  verticalOffsetX: 0,
  focalOffsetY: 60,
  carouselScale: 0.85,
  carouselRotX: 0,
  panelOpen: false,
};

interface TuningStore extends TuningParams {
  set: <K extends keyof TuningParams>(key: K, value: TuningParams[K]) => void;
  applyPreset: (preset: Partial<TuningParams>) => void;
  reset: () => void;
  togglePanel: () => void;
}

export const useTuning = create<TuningStore>()(
  persist(
    (set) => ({
      ...TUNING_DEFAULTS,
      set: (key, value) => set({ [key]: value } as Partial<TuningParams>),
      applyPreset: (preset) => set(preset as Partial<TuningParams>),
      reset: () => set({ ...TUNING_DEFAULTS, panelOpen: true }),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
    }),
    { name: 'musicos-tuning-v3' },
  ),
);
