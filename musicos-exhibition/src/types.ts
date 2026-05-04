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
}

export interface NonTrackExhibit extends ExhibitBase {
  kind: 'narration';
}

export type Exhibit = TrackExhibit | NonTrackExhibit;
