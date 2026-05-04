import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseConnections } from './lib/parse-connections.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const VAULT_ROOT = path.resolve(__dirname, '../..');
const FILE = path.join(VAULT_ROOT, 'playlists/rolling-stones_some-girls_miss-you.connections.json');

const raw = JSON.parse(readFileSync(FILE, 'utf8'));
const result = parseConnections(raw);
console.log(`OK · ${result.connection_pairs.length} pairs`);

const counts = new Map<number, number>();
for (const p of result.connection_pairs) {
  counts.set(p.from_position, (counts.get(p.from_position) ?? 0) + 1);
  counts.set(p.to_position,   (counts.get(p.to_position) ?? 0) + 1);
}
for (const [pos, n] of counts) {
  const cap = pos === 6 ? 7 : 5;
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
const errs: string[] = [];
for (let pos = 1; pos <= 18; pos++) {
  if (pos === 8) continue; // muted
  if (pos !== 1 && !inbound.has(pos)) errs.push(`pos ${pos} has no inbound`);
  if (pos !== 17 && pos !== 18 && !outbound.has(pos)) errs.push(`pos ${pos} has no outbound`);
}
if (errs.length) {
  console.error('coverage failures:');
  for (const e of errs) console.error(' -', e);
  process.exit(1);
}
console.log('coverage OK');
