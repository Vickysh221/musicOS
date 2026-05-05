import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseConnections } from './lib/parse-connections.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const VAULT_ROOT = path.resolve(__dirname, '../..');

const FALLBACK_SLUG = 'rolling-stones_some-girls_miss-you';
let slug = process.argv[2];
if (!slug) {
  console.warn(`WARN: no slug argument provided — falling back to '${FALLBACK_SLUG}'. Pass a slug as the first argument: npx tsx scripts/check-connections.ts <slug>`);
  slug = FALLBACK_SLUG;
}

const FILE = path.join(VAULT_ROOT, `playlists/${slug}.connections.json`);
const TRACKLIST_FILE = path.join(VAULT_ROOT, `playlists/${slug}.tracklist.json`);

const raw = JSON.parse(readFileSync(FILE, 'utf8'));
const result = parseConnections(raw);
console.log(`OK · ${result.connection_pairs.length} pairs`);

// Read anchor position from tracklist
const tracklist: Array<{ position: number; is_base_node?: boolean }> = JSON.parse(readFileSync(TRACKLIST_FILE, 'utf8'));
const baseRow = tracklist.find(r => r.is_base_node);
if (!baseRow) {
  console.error('ERROR: no is_base_node=true row found in tracklist');
  process.exit(1);
}
const anchorPosition = baseRow.position;

// Read muted positions from connections file
const mutedPositions: Set<number> = new Set(raw.muted_positions ?? []);

const counts = new Map<number, number>();
for (const p of result.connection_pairs) {
  counts.set(p.from_position, (counts.get(p.from_position) ?? 0) + 1);
  counts.set(p.to_position,   (counts.get(p.to_position) ?? 0) + 1);
}
for (const [pos, n] of counts) {
  if (mutedPositions.has(pos)) continue;
  const cap = pos === anchorPosition ? 7 : 5;
  if (n > cap) {
    console.error(`position ${pos}: ${n} pairs exceeds cap ${cap}`);
    process.exit(1);
  }
}
console.log('cap check OK');

// Coverage check
const inbound = new Set<number>();
const outbound = new Set<number>();
for (const p of result.connection_pairs) {
  outbound.add(p.from_position);
  inbound.add(p.to_position);
}
const totalPositions = tracklist.length;
const errs: string[] = [];
for (let pos = 1; pos <= totalPositions; pos++) {
  if (mutedPositions.has(pos)) continue;
  if (pos !== 1 && !inbound.has(pos)) errs.push(`pos ${pos} has no inbound`);
  if (pos !== totalPositions - 1 && pos !== totalPositions && !outbound.has(pos)) errs.push(`pos ${pos} has no outbound`);
}
if (errs.length) {
  console.error('coverage failures:');
  for (const e of errs) console.error(' -', e);
  process.exit(1);
}
console.log('coverage OK');
