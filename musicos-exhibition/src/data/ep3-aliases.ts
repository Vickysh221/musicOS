/**
 * Alias table for callback detection in EP3 narration.
 *
 * Each entry maps an exhibit position to a list of substrings that, when
 * found in subtitle text near a callback marker (你刚才/刚才/之前/...),
 * indicate a reference to that track. Hand-curated against false positives
 * observed in the prototype-min-visual.html run.
 *
 * Where multiple positions share an artist (Black Sabbath × 4 at 3-6,
 * Metallica × 2 at 7 and 14), the artist-name alias maps to the earliest
 * (anchor) occurrence and song-title aliases disambiguate the rest.
 */
export const EP3_ALIASES: Record<number, string[]> = {
  1: ['Cream', 'Sunshine of Your Love', 'Sunshine'],
  2: ['Hendrix', 'Jimi Hendrix', 'Jimi Hendrix Experience', 'Purple Haze'],
  3: ['Black Sabbath', 'Sabbath', 'Iommi'], // anchor — band + eponymous song share name
  4: ['War Pigs'],
  5: ['Iron Man'],
  6: ['Paranoid'],
  7: ['Metallica', 'Master of Puppets', 'Master of Puppets 的'],
  8: ['Deep Purple', 'Smoke on the Water'],
  9: ['Led Zeppelin', 'Zeppelin', 'Immigrant Song'],
  10: ['Aerosmith', 'Walk This Way'],
  11: ['AC/DC', 'AC-DC', 'Back In Black', 'Back in Black'],
  12: ['Ozzy', 'Ozzy Osbourne', 'Crazy Train'],
  13: ['Rage Against the Machine', 'Rage', 'Killing in the Name'],
  14: ['Enter Sandman'], // Metallica alias goes to position 7
  15: ["Guns N' Roses", 'Guns N Roses', 'Sweet Child', "Sweet Child O' Mine"],
  16: ['Nirvana', 'Come As You Are'],
  17: ['Soundgarden', 'Black Hole Sun'],
  18: ['The White Stripes', 'White Stripes', 'Seven Nation Army'],
};
