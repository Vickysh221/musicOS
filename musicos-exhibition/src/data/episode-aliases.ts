import { EP3_ALIASES } from './ep3-aliases.js';
import { EP5_ALIASES } from './ep5-aliases.js';

/**
 * Per-episode curated alias tables for callback phrase detection.
 * Episodes without an entry fall back to empty ({}) — artist+song
 * auto-derived aliases still apply via aliasesForPosition.
 */
export const ALIASES_BY_EPISODE: Record<string, Record<number, string[]>> = {
  ep3: EP3_ALIASES,
  ep5: EP5_ALIASES,
};
