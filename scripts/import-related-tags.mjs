import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { organizeSceneCategories } from '../app/scene-categories.ts';

// Input: the unmodified CSV from the revision documented in RELATED_TAGS.md.
const input = process.argv[2];
if (!input) throw new Error('Pass the downloaded cooccurrence CSV path');
const dictionary = organizeSceneCategories(JSON.parse(readFileSync('app/danbooru-import.json', 'utf8')));
const tags = dictionary.flatMap(c => c.subcategories.flatMap(s => s.tags));
const normalize = name => name.replaceAll('_', ' ');
const allowed = new Map(tags.map(t => [normalize(t.tag), t]));
const pairs = new Map();
const hash = createHash('sha256');
const stream = createReadStream(input);
stream.on('data', chunk => hash.update(chunk));
// Quoted CSV fields (some Danbooru tags contain commas or quote characters).
const parse = line => {
  const fields = []; let value = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { fields.push(value); value = ''; }
    else value += c;
  }
  fields.push(value); return fields;
};
for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) {
  const [rawA, rawB, rawCount] = parse(line);
  const a = normalize(rawA), b = normalize(rawB || ''), count = Number(rawCount);
  if (a === b || !allowed.has(a) || !allowed.has(b) || !Number.isFinite(count) || count < 20) continue;
  for (const [source, target] of [[a,b],[b,a]]) {
    if (!pairs.has(source)) pairs.set(source, new Map());
    pairs.get(source).set(target, Math.max(count, pairs.get(source).get(target) || 0));
  }
}
const result = {};
for (const [source, candidates] of [...pairs].sort(([a],[b]) => a.localeCompare(b))) {
  // Cosine-style normalization reduces the dominance of ubiquitous tags.
  const score = ([target,count]) => count / Math.sqrt(Math.max(1, allowed.get(source).postCount) * Math.max(1, allowed.get(target).postCount));
  result[allowed.get(source).tag] = [...candidates].sort((a,b) => score(b) - score(a) || b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0,24).map(([target,count]) => [allowed.get(target).tag, count]);
}
const output = JSON.stringify(result);
writeFileSync('app/related-tags.json', output + '\n');
console.log(JSON.stringify({ sourceSha256: hash.digest('hex'), coveredTags: Object.keys(result).length, recommendations: Object.values(result).reduce((n,v) => n + v.length, 0), bytes: Buffer.byteLength(output) }));
