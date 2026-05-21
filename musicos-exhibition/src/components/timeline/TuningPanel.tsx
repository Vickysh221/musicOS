import { useTuning, TUNING_DEFAULTS, type TuningParams } from '../../store/tuning.js';

interface SliderSpec {
  key: keyof TuningParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

// Only the ep1 playing-ring controls are shown — the intro-procession and
// focal-disc params live in the store but aren't editable from this view.
const GROUPS: { title: string; sliders: SliderSpec[] }[] = [
  {
    title: '当前曲 / Current',
    sliders: [
      { key: 'focalScale', label: '大小 scale', min: 0.8, max: 1.8, step: 0.01 },
      { key: 'focalZBoost', label: '前后 Z', min: -60, max: 120, step: 1 },
      { key: 'focalRecede', label: '激活后退', min: 0, max: 200, step: 1 },
    ],
  },
  {
    title: '内环·列表 / Inner ring',
    sliders: [
      { key: 'arcSpacing', label: '专辑间距', min: 60, max: 1200, step: 1 },
      { key: 'arcDepth', label: '前后深度', min: 0, max: 400, step: 0.5 },
      { key: 'arcRotStep', label: '每步旋转', min: -20, max: 20, step: 0.5 },
      { key: 'ringRecede', label: '激活后退', min: 0, max: 300, step: 1 },
    ],
  },
  {
    title: '外环·关联 / Outer ring',
    sliders: [
      { key: 'outerRadius', label: '半径', min: 400, max: 1400, step: 5 },
      { key: 'ringCenterZ', label: '离相机(中心Z)', min: -1200, max: 0, step: 5 },
      { key: 'outerGapDeg', label: '专辑间角距', min: 0, max: 60, step: 0.5 },
      { key: 'outerFrontGapDeg', label: '正中留空', min: 0, max: 140, step: 1 },
      { key: 'outerRotOffsetDeg', label: '旋转差', min: -90, max: 90, step: 1 },
      { key: 'outerHeight', label: '高低差', min: -200, max: 200, step: 1 },
      { key: 'outerScale', label: '大小', min: 0.4, max: 1.4, step: 0.01 },
      { key: 'outerStaggerZ', label: '前后参差', min: -200, max: 200, step: 1 },
    ],
  },
  {
    title: '相机 / Camera',
    sliders: [
      { key: 'playingRotX', label: '俯仰 tilt', min: -80, max: 80, step: 1 },
      { key: 'playingOffsetX', label: '平移 X', min: -400, max: 400, step: 1 },
      { key: 'playingOffsetY', label: '平移 Y', min: -400, max: 400, step: 1 },
      { key: 'perspective', label: '透视', min: 400, max: 4000, step: 50 },
    ],
  },
  {
    title: '卡片 / Card',
    sliders: [
      { key: 'cardWidth', label: '宽', min: 60, max: 320, step: 1 },
      { key: 'cardHeight', label: '高', min: 60, max: 420, step: 1 },
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
