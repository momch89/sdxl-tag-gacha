import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSceneGacha, defaultSceneSettings, sceneOptions } from '../app/scene-gacha.ts';
import { organizeSceneCategories } from '../app/scene-categories.ts';

const categories = organizeSceneCategories(JSON.parse(readFileSync(new URL('../app/danbooru-import.json', import.meta.url), 'utf8')));
const engine = createSceneGacha(categories);
assert.deepEqual(engine.missing, [], 'All curated tags must exist in the dictionary');
const blank = Object.fromEntries(categories.flatMap(c=>c.subcategories.map(s=>[s.id,[]])));
let seed = 93721;
const random = () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed / 4294967296; };
let runs = 0;
for (const gender of Object.keys(sceneOptions.gender).filter(x=>x!=='auto'))
for (const world of Object.keys(sceneOptions.world).filter(x=>x!=='auto'))
for (const clothing of Object.keys(sceneOptions.clothing).filter(x=>x!=='auto'))
for (const mood of Object.keys(sceneOptions.mood).filter(x=>x!=='auto'))
for (let n=0;n<12;n++) {
  const result = engine.roll(blank, {}, {gender,world,clothing,mood}, '', {}, random);
  assert.notEqual(result.selection,blank, result.message);
  const tags = Object.values(result.selection).flat().map(t=>t.tag);
  assert.equal(engine.conflicts(tags),'', tags.join(', '));
  assert.ok(tags.length>=14 && tags.length<=30, tags.length);
  for (const id of ['hair_bangs','hair_texture','eye_color','eye_shape']) assert.equal(result.selection[id].length,1,id);
  for (const id of ['hair_special_color','eye_pupils']) assert.ok(result.selection[id].length<=1,id);
  assert.equal(tags.includes('1girl'),gender==='female');
  assert.equal(tags.includes('1boy'),gender==='male');
  assert.equal(tags.includes('holographic monitor'),world==='future');
  if(tags.includes('reading')) assert.ok(tags.includes('holding book') && !tags.includes('looking at viewer'));
  assert.ok(Object.values(result.selection).filter(t=>t.length).length < 26);
  const hairId = categories.find(c=>c.id==='hair').subcategories[0].id;
  const locked = engine.roll(result.selection, {[hairId]:true}, {gender,world,clothing,mood}, '', {}, random);
  assert.deepEqual(locked.selection[hairId], result.selection[hairId]);
  runs++;
}
const scene = engine.roll(blank, {}, defaultSceneSettings, '', {}, random).selection;
for(const category of categories) {
  const next=engine.roll(scene,{},defaultSceneSettings,'',{category:category.id},random);
  for(const other of categories.filter(c=>c.id!==category.id)) for(const sub of other.subcategories) assert.deepEqual(next.selection[sub.id],scene[sub.id]);
  assert.equal(engine.conflicts(Object.values(next.selection).flat().map(t=>t.tag)),'');
}
for (const free of ['1girl, 1boy','standing, sitting','unknown custom prompt']) assert.equal(engine.roll(scene,{},defaultSceneSettings,free,{},random).selection,scene);
console.log(`${runs} conditioned scenes checked; locks, partial rerolls and incompatible free inputs passed.`);
