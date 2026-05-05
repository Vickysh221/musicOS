import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileSlug } from './lib/slug.ts';

const data = JSON.parse(readFileSync('data/exhibition.json', 'utf8'));
let updated = 0;
let missing = 0;
for (const item of data) {
  if (item.kind !== 'track') continue;
  if (item.album_cover_url) continue;
  const slug = fileSlug(item.position, item.artist, item.song);
  const file = `public/covers/${slug}.jpg`;
  if (existsSync(file)) {
    item.album_cover_url = `/covers/${slug}.jpg`;
    updated++;
    console.log(`OK   ${slug}`);
  } else {
    missing++;
    console.log(`MISS ${slug}`);
  }
}
writeFileSync('data/exhibition.json', JSON.stringify(data, null, 2) + '\n');
console.log(`\nUpdated ${updated} tracks; ${missing} missing`);
