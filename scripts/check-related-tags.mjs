import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { organizeSceneCategories } from '../app/scene-categories.ts';

const categories = organizeSceneCategories(JSON.parse(readFileSync('app/danbooru-import.json', 'utf8')));
const names = new Set(categories.flatMap(c => c.subcategories.flatMap(s => s.tags.map(t => t.tag))));
const bytes = readFileSync('app/related-tags.json');
const data = JSON.parse(bytes);
let edges = 0;
for (const [source, rows] of Object.entries(data)) {
  assert(names.has(source), source);
  assert(rows.length > 0 && rows.length <= 24);
  assert.equal(new Set(rows.map(([name]) => name)).size, rows.length);
  for (const [name, count] of rows) {
    assert(names.has(name), name);
    assert.notEqual(name, source);
    assert(Number.isInteger(count) && count >= 20);
    edges++;
  }
}
assert(data.maid.some(([name]) => name === 'maid headdress'));
assert(!Object.keys(data).some(name => ['masterpiece','best quality','highres'].includes(name)));
console.log({ sources: Object.keys(data).length, edges, gzipBytes: gzipSync(bytes).length });
