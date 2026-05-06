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
];
