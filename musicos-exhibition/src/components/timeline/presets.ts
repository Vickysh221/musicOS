import type { TuningParams } from '../../store/tuning.js';

type Preset = Omit<TuningParams, 'panelOpen'>;

const ARC_DEFAULTS = { arcSpacing: 454, arcDepth: 122, arcRotStep: 13, playingRotX: -19 };

export const INTRO_1: Preset = {
  gapX: 240,
  riseY: -1,
  stepZ: 80,
  jitterDeg: 30,
  cardRotX: -2,
  cardRotY: 79,
  focalScale: 1.25,
  focalLift: 14,
  focalZBoost: 61,
  cardWidth: 203,
  cardHeight: 204,
  stageRotX: 3.5,
  stageRotY: -37.5,
  stageRotZ: 10.5,
  perspective: 400,
  ...ARC_DEFAULTS,
};

export const INTRO_2: Preset = {
  gapX: 40,
  riseY: -1,
  stepZ: 80,
  jitterDeg: 30,
  cardRotX: -2,
  cardRotY: 79,
  focalScale: 1.25,
  focalLift: 14,
  focalZBoost: 61,
  cardWidth: 203,
  cardHeight: 204,
  stageRotX: 3.5,
  stageRotY: -37.5,
  stageRotZ: 10.5,
  perspective: 400,
  ...ARC_DEFAULTS,
};

export const INTRO_3: Preset = {
  gapX: 89,
  riseY: -22,
  stepZ: -32,
  jitterDeg: 0,
  cardRotX: 4,
  cardRotY: 83,
  focalScale: 1.34,
  focalLift: 10,
  focalZBoost: 82,
  cardWidth: 201,
  cardHeight: 204,
  stageRotX: -21,
  stageRotY: -46,
  stageRotZ: -4.5,
  perspective: 4000,
  ...ARC_DEFAULTS,
};

export const PLAYING: Preset = {
  gapX: 240,
  riseY: -50,
  stepZ: -80,
  jitterDeg: 0,
  cardRotX: -8,
  cardRotY: 65,
  focalScale: 1.45,
  focalLift: 0,
  focalZBoost: 20,
  cardWidth: 201,
  cardHeight: 204,
  stageRotX: 0.5,
  stageRotY: -37.5,
  stageRotZ: 6.5,
  perspective: 4000,
  ...ARC_DEFAULTS,
};

export type Phase = 'intro1' | 'intro2' | 'intro3' | 'playing';

export const PRESETS: Record<Phase, Preset> = {
  intro1: INTRO_1,
  intro2: INTRO_2,
  intro3: INTRO_3,
  playing: PLAYING,
};

// Time held on intro1 before kicking off the transition to intro3.
// Kept short so the first frame is barely a flash before the procession glides in.
export const INTRO_STEP_MS = 80;

// Duration of the intro1 → intro3 procession glide, used by both the stage
// CSS transition and the per-card framer-motion tween so they stay in sync.
export const INTRO_TRANSITION_MS = 1400;
