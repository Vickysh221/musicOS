export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['''.]/g, '')       // drop apostrophes and dots (e.g. Mk.gee → mkgee)
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '');    // trim leading/trailing hyphens
}

export function fileSlug(position: number, artist: string, song: string): string {
  const pad = String(position).padStart(2, '0');
  return `${pad}_${slugify(artist)}_${slugify(song)}`;
}
