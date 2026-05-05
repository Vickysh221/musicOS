import type { ConnectionKind, EvidenceBasis } from '../../src/types.js';

export interface NarrationVoice {
  voice_zh: string;
  voice_en: string;
}

export interface NarrationModes {
  foreshadow_anonymous_at_from: NarrationVoice;
  foreshadow_named_at_from: NarrationVoice | null;
  callback_named_at_to: NarrationVoice;
}

export interface IntrinsicScore {
  value: number | null;
  dimensions: {
    story_drive: number;
    concrete_carrier: number;
    evidential_strength: number;
    focus_relevance: number;
  };
  rationale: string;
}

export interface ConnectionPair {
  id: string;
  from_position: number;
  to_position: number;
  kind: ConnectionKind;
  evidence_basis: EvidenceBasis;
  backed_by_edge_id: string | null;
  system_sensory_note: string;
  narration_modes: NarrationModes;
  intrinsic_score?: IntrinsicScore;
  user_overrides: UserOverride[];
}

export interface UserOverride {
  type: 'append' | 'replace' | 'reject';
  applies_to:
    | 'foreshadow_anonymous_at_from'
    | 'foreshadow_named_at_from'
    | 'callback_named_at_to'
    | 'sensory_note';
  user_note: string;
  created_at: string;
}

export interface ConnectionsFile {
  playlist_slug: string;
  episode_number: number;
  episode_focus: string;
  episode_title_zh: string;
  episode_title_en: string;
  episode_arc: {
    from: { position: number; label: string };
    to:   { position: number; label: string };
    coda?: { position: number; label: string };
  };
  connection_kinds_in_scope: ConnectionKind[];
  muted_positions: number[];
  position_labels?: Record<string, string>;
  connection_pairs: ConnectionPair[];
}

const FORBIDDEN_TOKEN_RE = /(Track\s+\d+|第\s*\d+\s*首|\[|\])/;

const NARRATION_SIDES = [
  'foreshadow_anonymous_at_from',
  'foreshadow_named_at_from',
  'callback_named_at_to',
] as const;

function validatePair(pair: ConnectionPair, scope: ConnectionKind[]): void {
  if (pair.from_position === pair.to_position) {
    throw new Error(`pair ${pair.id}: self-reference (from_position == to_position)`);
  }
  if (!scope.includes(pair.kind)) {
    throw new Error(`pair ${pair.id}: kind "${pair.kind}" not in scope ${JSON.stringify(scope)}`);
  }
  if (!pair.narration_modes) {
    throw new Error(`pair ${pair.id}: missing narration_modes`);
  }
  for (const side of NARRATION_SIDES) {
    const voice = pair.narration_modes[side];
    if (voice == null) {
      // foreshadow_named_at_from is opt-in nullable; the others are required.
      if (side === 'foreshadow_named_at_from') continue;
      throw new Error(`pair ${pair.id}: narration_modes.${side} is required`);
    }
    const zh = voice.voice_zh ?? '';
    const en = voice.voice_en ?? '';
    if ([...zh].length > 80) {
      throw new Error(
        `pair ${pair.id}: narration_modes.${side}.voice_zh exceeds 80 chars (got ${[...zh].length})`,
      );
    }
    if (en.split(/\s+/).filter(Boolean).length > 30) {
      throw new Error(`pair ${pair.id}: narration_modes.${side}.voice_en exceeds 30 words`);
    }
    if (FORBIDDEN_TOKEN_RE.test(zh) || FORBIDDEN_TOKEN_RE.test(en)) {
      throw new Error(
        `pair ${pair.id}: narration_modes.${side} contains forbidden token (Track N / brackets / 第N首)`,
      );
    }
  }
}

export function parseConnections(raw: unknown): ConnectionsFile {
  const f = raw as ConnectionsFile;
  if (!f.connection_pairs || !Array.isArray(f.connection_pairs)) {
    throw new Error('missing connection_pairs[]');
  }
  if (!Array.isArray(f.connection_kinds_in_scope)) {
    throw new Error('connection_kinds_in_scope must be an array');
  }
  for (const pair of f.connection_pairs) {
    validatePair(pair, f.connection_kinds_in_scope);
  }
  return f;
}
