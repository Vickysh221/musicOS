import { useTuning, TUNING_DEFAULTS, type TuningParams } from '../../store/tuning.js';

interface SliderSpec {
  key: keyof TuningParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

const GROUPS: { title: string; sliders: SliderSpec[] }[] = [
  {
    title: 'Spacing',
    sliders: [
      { key: 'gapX', label: 'gap X', min: 10, max: 240, step: 1 },
      { key: 'riseY', label: 'rise Y', min: -80, max: 80, step: 1 },
      { key: 'stepZ', label: 'step Z', min: -80, max: 80, step: 1 },
    ],
  },
  {
    title: 'Card rotation',
    sliders: [
      { key: 'cardRotX', label: 'rot X', min: -90, max: 90, step: 1 },
      { key: 'cardRotY', label: 'rot Y', min: -90, max: 90, step: 1 },
      { key: 'jitterDeg', label: 'jitter Z', min: 0, max: 30, step: 0.5 },
    ],
  },
  {
    title: 'Card size',
    sliders: [
      { key: 'cardWidth', label: 'width', min: 60, max: 320, step: 1 },
      { key: 'cardHeight', label: 'height', min: 60, max: 420, step: 1 },
      { key: 'focalScale', label: 'focal scale', min: 0.8, max: 1.8, step: 0.01 },
      { key: 'focalLift', label: 'focal lift', min: -40, max: 60, step: 1 },
      { key: 'focalZBoost', label: 'focal Z+', min: -60, max: 120, step: 1 },
    ],
  },
  {
    title: 'Stage orientation',
    sliders: [
      { key: 'stageRotX', label: 'stage X', min: -60, max: 60, step: 0.5 },
      { key: 'stageRotY', label: 'stage Y', min: -60, max: 60, step: 0.5 },
      { key: 'stageRotZ', label: 'stage Z', min: -60, max: 60, step: 0.5 },
      { key: 'perspective', label: 'perspect.', min: 400, max: 4000, step: 50 },
    ],
  },
  {
    title: 'Arc (playing)',
    sliders: [
      { key: 'arcSpacing', label: 'spacing', min: 60, max: 1200, step: 1 },
      { key: 'arcDepth', label: 'depth', min: 0, max: 150, step: 0.5 },
      { key: 'arcRotStep', label: 'rot/step', min: 0, max: 20, step: 0.5 },
      { key: 'playingRotX', label: 'tilt X', min: -80, max: 80, step: 1 },
      { key: 'playingOffsetX', label: 'offset X', min: -400, max: 400, step: 1 },
      { key: 'playingOffsetY', label: 'offset Y', min: -400, max: 400, step: 1 },
    ],
  },
];

export function TuningPanel() {
  const tuning = useTuning();
  const set = useTuning((s) => s.set);
  const reset = useTuning((s) => s.reset);
  const togglePanel = useTuning((s) => s.togglePanel);

  const copyValues = async () => {
    const { panelOpen: _omit, ...values } = tuning;
    void _omit;
    const json = JSON.stringify(values, null, 2);
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      // ignore
    }
  };

  if (!tuning.panelOpen) {
    return (
      <button className="tuning-toggle" type="button" onClick={togglePanel}>
        Tune
      </button>
    );
  }

  return (
    <div className="tuning-panel">
      <div className="tuning-panel__header">
        <span>Layout tuning</span>
        <div className="tuning-panel__actions">
          <button className="tuning-panel__btn" type="button" onClick={copyValues}>Copy</button>
          <button className="tuning-panel__btn" type="button" onClick={reset}>Reset</button>
          <button className="tuning-panel__btn" type="button" onClick={togglePanel}>×</button>
        </div>
      </div>
      {GROUPS.map((group) => (
        <div key={group.title} className="tuning-panel__group">
          <div className="tuning-panel__group-title">{group.title}</div>
          {group.sliders.map((s) => {
            const value = tuning[s.key] as number;
            const def = TUNING_DEFAULTS[s.key] as number;
            const isModified = Math.abs(value - def) > 1e-6;
            return (
              <div key={s.key} className="tuning-panel__row">
                <label htmlFor={`tune-${s.key}`} style={{ fontWeight: isModified ? 600 : 400 }}>
                  {s.label}
                </label>
                <input
                  id={`tune-${s.key}`}
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={value}
                  onChange={(e) => set(s.key, Number(e.target.value) as TuningParams[typeof s.key])}
                />
                <span className="tuning-panel__val">
                  {Number.isInteger(s.step) ? value.toFixed(0) : value.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
