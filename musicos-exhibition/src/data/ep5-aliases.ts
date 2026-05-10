/**
 * Alias table for callback detection in EP5 narration (Cloudyな午後 — Translation Aesthetic / City Pop).
 *
 * Each entry maps an exhibit position to a list of substrings that, when found
 * in the active narration paragraph, mark a callback to that earlier track. The
 * matcher (callback-phrase.ts → findCallbackPhrases) prefers the LONGEST match
 * at the earliest offset, so multi-word forms like "中原めいこ的Cloudyな午後"
 * win over the bare artist name.
 *
 * Two pos share an artist (中原めいこ at 14 and 15). Per the EP3 convention the
 * artist-only alias maps to the EARLIEST occurrence (pos 14); song titles
 * disambiguate the rest. "Cloudyな午後" / "Cloudy na Gogo" → pos 15.
 *
 * EN aliases are needed alongside ZH because the EN narration uses
 * Romaji/translation forms (e.g. "Yamashita Tatsuro", "Single Again") that
 * don't match the auto-derived `track.song` / `track.artist` strings.
 */
export const EP5_ALIASES: Record<number, string[]> = {
  1: ['Fire and Rain', 'James Taylor'],
  2: ['Carole King', "It's Too Late", 'Tapestry'],
  3: ['Boz Scaggs', 'Lowdown', 'Silk Degrees', 'David Paich'],
  4: [
    'Steely Dan',
    'Deacon Blues',
    'Aja',
    "Japan's Steely Dan",
    '日本的Steely Dan',
    '日本のSteely Dan',
  ],
  5: [
    'Toto',
    'Georgy Porgy',
    'Jeff Porcaro',
    'Steve Lukather',
    'David Hungate',
    'Miss M',
    'Monterrey Sound Studios',
    'David Foster',
  ],
  6: ['大瀧詠一', 'Otaki Eiichi', 'A Long Vacation', 'Niagara', 'カナリア諸島にて'],
  7: [
    '山下達郎',
    'Yamashita Tatsuro',
    'Yamashita',
    'LOVELAND ISLAND',
    'Loveland Island',
    'FOR YOU',
  ],
  8: [
    '竹内まりや',
    'Takeuchi Mariya',
    'シングル・アゲイン',
    'Single Again',
  ],
  9: ['角松敏生', 'Kadomatsu Toshiki', 'Kadomatsu', 'ANKLET', 'Anklet'],
  10: [
    '稲垣潤一',
    'Inagaki Junichi',
    'Inagaki',
    '夏のクラクション',
    'Natsu no Kurakushon',
  ],
  11: ['ラ・ムー', 'Ra-Mu', 'Ra Mu', 'Late Night Heartache'],
  12: ['杏里', 'Anri', 'SHYNESS BOY', 'Shyness Boy'],
  13: [
    '濱田金吾',
    'Hamada Kingo',
    'Hamada',
    'Bye Bye Mrs. December',
    'Bye Bye Mrs December',
  ],
  // 中原めいこ artist alias → pos 14 (earliest); pos 15 disambiguated by song title.
  14: ['中原めいこ', 'Nakahara Meiko', 'Nakahara', 'Fantasy'],
  15: ['Cloudyな午後', 'Cloudy na Gogo', "Cloudy na Gogo (Cloudy Afternoon)"],
  16: ['Ginger Root', 'Cameron Lew', 'Loretta'],
  17: ['RYUSENKEI', 'Ryusenkei', '3号线', '三号线', 'San Hao Xian'],
};
