export interface EpisodeMeta {
  id: string;
  number: number;
  titleZh: string;
  titleEn: string;
  anchor: string;
  focus: string;
  year: string;
}

export const EPISODES: EpisodeMeta[] = [
  {
    id: 'ep1',
    number: 1,
    titleZh: 'Miss You',
    titleEn: 'Bassline DNA',
    anchor: 'The Rolling Stones',
    focus: 'bassline_dna',
    year: '1967–2022',
  },
  {
    id: 'ep2',
    number: 2,
    titleZh: '双主角',
    titleEn: 'Estranged',
    anchor: 'Guns N\' Roses',
    focus: 'aria_solo_dialectic',
    year: '1970–2006',
  },
  {
    id: 'ep3',
    number: 3,
    titleZh: '三全音之后',
    titleEn: 'After the Tritone',
    anchor: 'Black Sabbath',
    focus: 'riff_inversion',
    year: '1967–2003',
  },
  {
    id: 'ep4',
    number: 4,
    titleZh: '自译 — Orobroy 的两次着装',
    titleEn: 'Self-Translation — Two Readings of Orobroy',
    anchor: 'Dorantes',
    focus: 'translation_aesthetic',
    year: '1909–2024',
  },
];
