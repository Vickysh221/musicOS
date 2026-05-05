import { describe, it, expect } from 'vitest';
import { parseConnections, type ConnectionsFile } from '../scripts/lib/parse-connections';

const MIN_VALID = {
  playlist_slug: 'rolling-stones_some-girls_miss-you',
  episode_number: 1,
  episode_focus: 'bassline_dna',
  episode_title_zh: 'Miss You · 第 1 期 · bassline DNA 谱系',
  episode_title_en: 'Miss You · Episode 1 · The Bassline DNA Lineage',
  episode_arc: {
    from: { position: 1, label: 'James Brown — Cold Sweat (1967)' },
    to:   { position: 17, label: 'Khruangbin — María También (2018)' },
  },
  connection_kinds_in_scope: ['bassline_prototype'],
  muted_positions: [],
  connection_pairs: [
    {
      id: 'conn_001_to_009_groove_dna',
      from_position: 1,
      to_position: 9,
      direction: 'from_inspires_to',
      kind: 'bassline_prototype',
      evidence_basis: 'historical',
      backed_by_edge_id: null,
      system_sensory_note: 'JB drum/bass interlock 是 Edwards 直接继承的语法。',
      narration_at_from: { voice_zh: '等会儿到 Chic 的 Good Times 你会再撞见这种锁死。', voice_en: 'Later you will meet this lock again in Chic Good Times.' },
      narration_at_to:   { voice_zh: '你刚才在 James Brown 的 Cold Sweat 已经听到这种逻辑。', voice_en: 'You already heard this logic earlier in James Brown Cold Sweat.' },
      user_overrides: [],
    },
  ],
};

describe('parseConnections', () => {
  it('accepts a minimal valid file', () => {
    const result: ConnectionsFile = parseConnections(MIN_VALID);
    expect(result.connection_pairs).toHaveLength(1);
    expect(result.episode_number).toBe(1);
  });

  it('rejects pair where from_position == to_position', () => {
    const bad = structuredClone(MIN_VALID);
    bad.connection_pairs[0].to_position = 1;
    expect(() => parseConnections(bad)).toThrow(/self-reference/);
  });

  it('rejects pair with kind outside connection_kinds_in_scope', () => {
    const bad = structuredClone(MIN_VALID);
    bad.connection_pairs[0].kind = 'gear_lineage_bass';
    expect(() => parseConnections(bad)).toThrow(/not in scope/);
  });

  it('rejects narration_at_from.voice_zh exceeding 80 chars', () => {
    const bad = structuredClone(MIN_VALID);
    bad.connection_pairs[0].narration_at_from.voice_zh = '一'.repeat(81);
    expect(() => parseConnections(bad)).toThrow(/voice_zh.*80/);
  });

  it('rejects narration mentioning "Track N" or square brackets', () => {
    const bad = structuredClone(MIN_VALID);
    bad.connection_pairs[0].narration_at_from.voice_zh = '到 Track 9 你会撞见';
    expect(() => parseConnections(bad)).toThrow(/forbidden token/);
  });

  it('rejects connection_kinds_in_scope when not an array (T2 carry-forward guard)', () => {
    const bad = { ...structuredClone(MIN_VALID), connection_kinds_in_scope: 'bassline_prototype' };
    expect(() => parseConnections(bad)).toThrow(/connection_kinds_in_scope must be an array/);
  });
});
