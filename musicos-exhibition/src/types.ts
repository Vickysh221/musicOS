export type RedHeartTier = 'hit' | 'adjacent' | 'blind_spot';

export interface RedHeartSeed {
  type: 'song' | 'artist' | 'album';
  value: string;
}

export type ConnectionKind =
  | 'bassline_prototype'
  | 'groove_dna'
  | 'personnel_bridge_bass'
  | 'gear_lineage_bass';

export type EvidenceBasis = 'musicological' | 'historical' | 'sensory';

export type NarrativeWeight = 'anchor' | 'pillar' | 'supporting' | 'bridge';

export type ArchiveReason =
  | 'redundant_with_strong'
  | 'low_focus_relevance'
  | 'no_concrete_anchor'
  | 'already_told'
  | 'off_topic_for_episode';

export interface ArchivedConnection {
  connection_id: string;
  archive_reason: ArchiveReason;
}

export interface ConnectionRef {
  id: string;
  other_position: number;
  other_label: string;
  kind: ConnectionKind;
  evidence_basis: EvidenceBasis;
  narration_zh: string;
  narration_en: string;
}

export type ExhibitType =
  | 'opening'
  | 'ancestor'
  | 'anchor'
  | 'lateral'
  | 'descendant'
  | 'interlude'
  | 'thematic_closure';

export type TranscriptStatus = 'complete' | 'placeholder' | 'missing';

export type Mechanism = 'M1' | 'M2' | 'M3' | 'M4';

interface ExhibitBase {
  position: number;
  exhibit_type: ExhibitType;
  transcript_zh: string | null;
  transcript_en: string | null;
  transcript_zh_status: TranscriptStatus;
  transcript_en_status: TranscriptStatus;
  narrator_persona_zh: string | null;
  narrator_persona_en: string | null;
}

export interface TrackExhibit extends ExhibitBase {
  kind: 'track';
  node_id: string;
  year: number;
  artist: string;
  song: string;
  album: string;
  is_base_node: boolean;
  mechanism_tags: Mechanism[];
  netease_song_id: string | null;
  audio_url: string | null;
  album_cover_url: string | null;
  duration_seconds: number | null;
  unavailable: boolean;
  genre: string | null;
  episode_focus: string;
  red_heart_tier: RedHeartTier;
  red_heart_matched_seeds: RedHeartSeed[];
  muted_this_episode: boolean;
  bridge_narration_zh: string | null;
  bridge_narration_en: string | null;
  connections_in: ConnectionRef[];
  connections_out: ConnectionRef[];
  connections_lateral: ConnectionRef[];
  narrative_weight: NarrativeWeight | null;
  strong_connection_id: string | null;
  archived_weak_connections: ArchivedConnection[];
}

export interface NonTrackExhibit extends ExhibitBase {
  kind: 'narration';
}

export type Exhibit = TrackExhibit | NonTrackExhibit;
