import { describe, it, expectTypeOf } from 'vitest';
import type { TrackExhibit, RedHeartTier, ConnectionRef } from '../src/types.ts';

describe('TrackExhibit bass DNA fields', () => {
  it('includes the new fields with correct shapes', () => {
    expectTypeOf<TrackExhibit>().toHaveProperty('genre').toEqualTypeOf<string | null>();
    expectTypeOf<TrackExhibit>().toHaveProperty('episode_focus').toEqualTypeOf<string>();
    expectTypeOf<TrackExhibit>().toHaveProperty('red_heart_tier').toEqualTypeOf<RedHeartTier>();
    expectTypeOf<TrackExhibit>().toHaveProperty('muted_this_episode').toEqualTypeOf<boolean>();
    expectTypeOf<TrackExhibit>().toHaveProperty('bridge_narration_zh').toEqualTypeOf<string | null>();
    expectTypeOf<TrackExhibit>().toHaveProperty('connections_in').toEqualTypeOf<ConnectionRef[]>();
  });
});
