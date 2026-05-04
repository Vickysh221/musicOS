export interface ParsedTrack {
  position: number;
  artist: string;
  song: string;
  year: number;
  netease_song_id: string | null;
  curatorial_note: string;
}

export function parsePlaylist(md: string): ParsedTrack[] {
  const tracks: ParsedTrack[] = [];

  // Track sections: ## Track N: Artist — Song (Year)
  // The em-dash is —. Year is a 4-digit number in parentheses.
  const headerRe = /^## Track (\d+): (.+?) — (.+?) \((\d{4})\)\s*$/gm;
  const matches = [...md.matchAll(headerRe)];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]!;
    const position = Number(m[1]);
    const artist = m[2]!.trim();
    const song = m[3]!.trim();
    const year = Number(m[4]);

    // Section body: from end of this header to start of next header (or EOF)
    const start = m.index! + m[0]!.length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : md.length;
    const section = md.slice(start, end);

    // NetEase ID extraction
    const idMatch = section.match(/music\.163\.com\/#\/song\?id=(\d+)/);
    const netease_song_id = idMatch ? idMatch[1]! : null;

    // Curatorial note: find the large prose paragraph(s)
    // Structure: italic line (*...*), blank line, bold+prose paragraph, blank line, more prose, bold M-tag line, link line
    // We want the prose paragraphs — skip the italic header line, skip **M-tag**: lines at the end, skip link lines
    const paragraphs = section
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      // Skip italic-only lines (the sub-heading like *From Cold Sweat / Funky Drummer era*)
      .filter((p) => !/^\*[^*]+\*$/.test(p))
      // Skip lines starting with [ (NetEase links)
      .filter((p) => !p.startsWith('['))
      // Skip lines starting with # (headers)
      .filter((p) => !p.startsWith('#'));

    // The curatorial note is the main prose paragraph — the one that starts with **bold** and contains the most content
    // Typically the first qualifying paragraph after filtering
    const curatorial_note = paragraphs.find((p) => p.length > 50) ?? '';

    tracks.push({ position, artist, song, year, netease_song_id, curatorial_note });
  }

  return tracks;
}
