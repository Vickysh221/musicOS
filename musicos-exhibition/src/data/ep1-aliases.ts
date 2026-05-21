/**
 * Alias table for callback detection in EP1 (Miss You · bassline DNA) narration.
 *
 * Maps an exhibit position to substrings that indicate a reference to that
 * track. Unions with the auto-derived artist+song aliases. Curated here:
 * short forms of long titles, alternate spellings, and distinctive personnel
 * who uniquely point at one track (self-references are filtered downstream, so
 * a member name only ever lights OTHER tracks).
 */
export const EP1_ALIASES: Record<number, string[]> = {
  1: ['James Brown', 'Cold Sweat'],
  2: ['Sly & the Family Stone', 'Sly and the Family Stone', 'Sly Stone', 'Family Affair'],
  3: ['David Bowie', 'Bowie', 'Fame'],
  4: ['Parliament', 'Give Up the Funk', 'Bootsy', 'Bootsy Collins'],
  5: ['Bee Gees', "Stayin' Alive", 'Stayin Alive'],
  6: ['The Rolling Stones', 'Rolling Stones', 'Stones', 'Miss You', 'Bill Wyman'],
  7: ['Blondie', 'Heart of Glass'],
  8: ['Devo', 'Jocko Homo'],
  9: ['Chic', 'Good Times', 'Nile Rodgers', 'Bernard Edwards'],
  10: ['Joy Division', 'Isolation', 'Peter Hook'],
  11: ['Talking Heads', 'Once in a Lifetime'],
  12: ['Queen', 'Another One Bites the Dust', 'John Deacon'],
  13: ['Prince', 'When Doves Cry'],
  14: ['Red Hot Chili Peppers', 'Give It Away', 'Flea'],
  15: ['Daft Punk', 'Get Lucky'],
  16: ['Tame Impala', 'The Less I Know the Better'],
  17: ['Khruangbin', 'María También', 'Maria Tambien'],
  18: ['Mk.gee', 'Mkgee', 'You Dreamed of Me'],
};
