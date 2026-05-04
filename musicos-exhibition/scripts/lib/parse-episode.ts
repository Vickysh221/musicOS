export interface ParsedEpisodeTrack {
  artist: string;
  song: string;
  narration_zh: string;
}

export interface ParsedEpisode {
  opening: string;
  interlude: string;
  closing: string;
  tracks: ParsedEpisodeTrack[];
}

export function parseEpisode(md: string): ParsedEpisode {
  // Split into exhibit sections by ## Exhibit N: headers
  const exhibitRe = /^## Exhibit (\d+): (.+)$/gm;
  const matches = [...md.matchAll(exhibitRe)];

  // Helper: extract narration text from a section body
  // Narration is the text after ### Narration (or ### Narration (Anchor Track))
  function extractNarration(sectionBody: string): string {
    const narrationMatch = sectionBody.match(/### Narration[^\n]*\n([\s\S]*)/);
    if (!narrationMatch) {
      // For non-track exhibits (opening, interlude, closing), the narration is the prose directly
      // Skip metadata lines (starting with **) and --- separators
      return sectionBody
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('**') && line.trim() !== '---')
        .join('\n')
        .trim();
    }
    return narrationMatch[1]!.replace(/\n---\s*$/, '').trim();
  }

  // Helper: extract artist and song from track exhibit header like "James Brown — Cold Sweat (1967)"
  const trackHeaderRe = /^(.+?) — (.+?) \(\d{4}\)$/;

  let opening = '';
  let interlude = '';
  let closing = '';
  const tracks: ParsedEpisodeTrack[] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]!;
    const exhibitNum = Number(m[1]);
    const exhibitTitle = m[2]!.trim();

    // Section body: from end of this header to start of next header (or EOF)
    const start = m.index! + m[0]!.length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : md.length;
    const sectionBody = md.slice(start, end);

    if (exhibitNum === 1) {
      // Opening narration — prose is directly in the section after metadata
      opening = extractNarration(sectionBody);
    } else if (exhibitTitle.toLowerCase().startsWith('interlude')) {
      // Interlude narration
      interlude = extractNarration(sectionBody);
    } else if (exhibitTitle.toLowerCase().startsWith('closing narration')) {
      // Closing narration
      closing = extractNarration(sectionBody);
    } else {
      // Track exhibit — parse artist and song from the title
      const trackMatch = exhibitTitle.match(trackHeaderRe);
      if (trackMatch) {
        const artist = trackMatch[1]!.trim();
        const song = trackMatch[2]!.trim();
        const narration_zh = extractNarration(sectionBody);
        tracks.push({ artist, song, narration_zh });
      }
    }
  }

  return { opening, interlude, closing, tracks };
}
