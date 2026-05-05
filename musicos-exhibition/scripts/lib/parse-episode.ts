export interface ParsedEpisodeTrack {
  position: number;
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
  // Split into sections by ## headers.
  // Recognised patterns:
  //   ## Track N: Artist — Song (Year)   ← new canonical format (v0.3+)
  //   ## Opening
  //   ## Interlude
  //   ## Closing
  //   ## Exhibit N: …                    ← legacy format (v0.1); kept for back-compat
  const sectionRe = /^## (.+)$/gm;
  const matches = [...md.matchAll(sectionRe)];

  // Helper: extract narration text from a section body
  // Narration is the text after ### Narration (or ### Narration (Anchor Track))
  function extractNarration(sectionBody: string): string {
    const narrationMatch = sectionBody.match(/### Narration[^\n]*\n([\s\S]*)/);
    if (!narrationMatch) {
      // For non-track sections (opening, interlude, closing), the narration is the prose directly
      // Skip metadata lines (starting with **) and --- separators
      return sectionBody
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('**') && line.trim() !== '---')
        .join('\n')
        .trim();
    }
    return narrationMatch[1]!.replace(/\n---\s*$/, '').trim();
  }

  // Helper: extract artist and song from track header like "James Brown — Cold Sweat (1967)"
  const trackHeaderRe = /^(.+?) — (.+?) \(\d{4}\)$/;

  // New format: ## Track N: Artist — Song (Year)
  const trackNHeaderRe = /^Track\s+(\d+)[:\s·]+(.+)$/;
  // Legacy format: ## Exhibit N: …
  const exhibitHeaderRe = /^Exhibit\s+(\d+)[:\s]+(.+)$/;

  let opening = '';
  let interlude = '';
  let closing = '';
  const tracks: ParsedEpisodeTrack[] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]!;
    const sectionTitle = m[1]!.trim();

    // Section body: from end of this header to start of next header (or EOF)
    const start = m.index! + m[0]!.length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : md.length;
    const sectionBody = md.slice(start, end);

    // --- Detect section type ---

    // Non-track sections
    if (/^opening$/i.test(sectionTitle)) {
      opening = extractNarration(sectionBody);
      continue;
    }
    if (/^interlude/i.test(sectionTitle)) {
      interlude = extractNarration(sectionBody);
      continue;
    }
    if (/^closing/i.test(sectionTitle)) {
      closing = extractNarration(sectionBody);
      continue;
    }

    // New canonical format: ## Track N: Artist — Song (Year)
    const trackNMatch = sectionTitle.match(trackNHeaderRe);
    if (trackNMatch) {
      const position = Number(trackNMatch[1]);
      const trackTitle = trackNMatch[2]!.trim();
      const trackMatch = trackTitle.match(trackHeaderRe);
      if (trackMatch) {
        const artist = trackMatch[1]!.trim();
        const song = trackMatch[2]!.trim();
        const narration_zh = extractNarration(sectionBody);
        tracks.push({ position, artist, song, narration_zh });
      }
      continue;
    }

    // Legacy format: ## Exhibit N: …
    const exhibitMatch = sectionTitle.match(exhibitHeaderRe);
    if (exhibitMatch) {
      const exhibitNum = Number(exhibitMatch[1]);
      const exhibitTitle = exhibitMatch[2]!.trim();

      if (exhibitNum === 1) {
        // Opening narration in legacy format
        opening = extractNarration(sectionBody);
      } else if (exhibitTitle.toLowerCase().startsWith('interlude')) {
        interlude = extractNarration(sectionBody);
      } else if (exhibitTitle.toLowerCase().startsWith('closing narration')) {
        closing = extractNarration(sectionBody);
      } else {
        const trackMatch = exhibitTitle.match(trackHeaderRe);
        if (trackMatch) {
          const artist = trackMatch[1]!.trim();
          const song = trackMatch[2]!.trim();
          const narration_zh = extractNarration(sectionBody);
          // Legacy exhibits don't have explicit position; use exhibitNum - 1
          tracks.push({ position: exhibitNum - 1, artist, song, narration_zh });
        }
      }
    }
  }

  return { opening, interlude, closing, tracks };
}
