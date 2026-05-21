/**
 * Alias table for callback detection in EP2 narration (Estranged — aria–cabaletta /
 * dual-protagonist lineage).
 *
 * Anchor: position 10 (Guns N' Roses — Estranged). Three artists recur:
 *   Metallica × 3 (pos 8 Fade to Black, 9 One, 12 Nothing Else Matters)
 *   Guns N' Roses × 2 (pos 10 Estranged, 11 November Rain)
 * Per the EP3 convention the artist-only alias maps to the EARLIEST
 * occurrence; song titles disambiguate the rest.
 *
 * EN aliases are not strictly required (EP2 narration is currently zh-only,
 * see transcript_en_status=missing) but are listed defensively for the cases
 * where the localized title diverges from the auto-derived `track.song`
 * (e.g. 椎名林檎 / 丸ノ内サディスティック, 黑豹乐队 → "黑豹").
 */
export const EP2_ALIASES: Record<number, string[]> = {
  1: ['Deep Purple', 'Child in Time', 'Purple Mk II', 'Mk II', 'Blackmore', 'Gillan'],
  2: ['Derek and the Dominos', 'Derek & the Dominos', 'Dominos', 'Layla', 'Clapton'],
  3: ['Led Zeppelin', 'Zeppelin', 'Stairway to Heaven', 'Stairway', 'Jimmy Page', 'Page'],
  4: ["The Who", 'Who', "Won't Get Fooled Again", 'Pete Townshend', 'Townshend'],
  5: ['Lynyrd Skynyrd', 'Skynyrd', 'Free Bird', 'Freebird'],
  6: ['Queen', 'Bohemian Rhapsody', 'Bohemian', 'Brian May', 'Freddie'],
  7: ['Pink Floyd', 'Floyd', 'Comfortably Numb', 'Gilmour', 'David Gilmour'],
  // Metallica anchor — artist alias → pos 8 (earliest occurrence).
  8: ['Metallica', 'Fade to Black', 'Hetfield', 'Kirk Hammett'],
  9: ['One', 'Metallica 的 One', '《One》'],
  10: ["Guns N' Roses", 'Guns N Roses', 'GNR', 'Estranged', 'Axl', 'Axl Rose', 'Slash'],
  11: ['November Rain'],
  12: ['Nothing Else Matters'],
  13: ['黑豹', '黑豹乐队', "Don't Break My Heart", '窦唯'],
  14: ['Oasis', 'Champagne Supernova', 'Champagne', 'Noel Gallagher', 'Gallagher'],
  15: ['Radiohead', 'Paranoid Android', 'Thom Yorke', 'Jonny Greenwood'],
  16: [
    '椎名林檎',
    'Shiina Ringo',
    '丸ノ内サディスティック',
    '丸の内サディスティック',
    'Marunouchi Sadistic',
    'Marunouchi',
  ],
  17: [
    'My Chemical Romance',
    'MCR',
    'Welcome to the Black Parade',
    'Black Parade',
    'Gerard Way',
  ],
  18: ['Muse', 'Knights of Cydonia', 'Cydonia', 'Matt Bellamy', 'Bellamy'],
};
