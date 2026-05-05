import type { TrackExhibit } from '../../types.js';

interface ConnectionRef {
  kind: string;
  [key: string]: unknown;
}

// The plan references connections_in/lateral/out on TrackExhibit, but the
// current TrackExhibit type does not include them. We read them defensively
// from a structural extension so this component compiles and degrades
// gracefully if the data is absent.
type TrackWithConnections = TrackExhibit & {
  connections_in?: ConnectionRef[];
  connections_lateral?: ConnectionRef[];
  connections_out?: ConnectionRef[];
};

interface Props {
  track: TrackExhibit | null;
  index: number;
  total: number;
  visible: boolean;
}

const KIND_LABEL: Record<string, string> = {
  bassline_prototype: 'Bassline Prototype',
  groove_dna: 'Groove DNA',
  personnel_bridge_bass: 'Personnel Bridge',
  gear_lineage_bass: 'Gear Lineage',
};

export function Stepper({ track, index, total, visible }: Props) {
  if (!visible || !track) return null;

  const t = track as TrackWithConnections;
  const incoming = t.connections_in?.[0];
  const lateral = t.connections_lateral?.[0];
  const outgoing = t.connections_out?.[0];

  return (
    <div className="stepper" style={{ opacity: visible ? 1 : 0 }}>
      <div className="stepper__anchor">{track.is_base_node ? 'Anchor' : 'Track'}</div>
      <div className="stepper__count">{index + 1}/{total}</div>
      <div className="stepper__kinds">
        <div className="stepper__kind stepper__kind--ghost">
          {incoming ? KIND_LABEL[incoming.kind] ?? incoming.kind : ''}
        </div>
        <div className="stepper__kind stepper__kind--active">
          {lateral ? KIND_LABEL[lateral.kind] ?? lateral.kind : track.song}
        </div>
        <div className="stepper__kind stepper__kind--ghost">
          {outgoing ? KIND_LABEL[outgoing.kind] ?? outgoing.kind : ''}
        </div>
      </div>
    </div>
  );
}
