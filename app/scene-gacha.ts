import type { Category, Tag } from './tag-data';

export type Selection = Record<string, Tag[]>;
export const sceneOptions = {
  gender: { auto: 'おまかせ', female: '女性', male: '男性', neutral: '中性（性別タグなし）' },
  world: { auto: 'おまかせ', modern: '現代', fantasy: 'ファンタジー', japanese: '和風', future: '近未来' },
  clothing: { auto: 'おまかせ', casual: '気軽・シンプル', elegant: '上品', cute: 'かわいい', cool: 'かっこいい' },
  mood: { auto: 'おまかせ', cheerful: '明るい', calm: '穏やか', dramatic: 'ドラマチック', mysterious: 'ミステリアス' },
} as const;
export type SceneSettings = { [K in keyof typeof sceneOptions]: keyof typeof sceneOptions[K] };
export const defaultSceneSettings: SceneSettings = { gender: 'auto', world: 'auto', clothing: 'auto', mood: 'auto' };
type Resolved = { -readonly [K in keyof SceneSettings]: Exclude<SceneSettings[K], 'auto'> };
type Scope = { category?: string; subcategory?: string };
type Wardrobe = string[];
const wardrobes: Record<Resolved['world'], Record<Resolved['clothing'], Wardrobe[]>> = {
  modern: {
    casual: [['shirt','pants','sneakers'], ['hoodie','pants','sneakers'], ['sweater','long skirt','shoes']],
    elegant: [['collared shirt','pants','loafers'], ['dress','shoes'], ['sweater','long skirt','shoes']],
    cute: [['frilled dress','shoes'], ['sweater','pleated skirt','shoes'], ['hoodie','skirt','sneakers']],
    cool: [['jacket','shirt','pants','boots'], ['vest','shirt','pants','loafers']],
  },
  fantasy: {
    casual: [['shirt','pants','boots'], ['robe','boots']],
    elegant: [['dress','cape','shoes'], ['robe','cape','boots']],
    cute: [['frilled dress','shoes'], ['dress','capelet','shoes']],
    cool: [['armor','boots'], ['shirt','pants','cloak','boots']],
  },
  japanese: {
    casual: [['kimono','geta'], ['kimono','haori','geta']],
    elegant: [['kimono','hakama','geta'], ['kimono','haori','geta']],
    cute: [['kimono','hair ribbon','geta']],
    cool: [['kimono','hakama','haori','geta']],
  },
  future: {
    casual: [['hoodie','pants','sneakers'], ['jacket','shirt','pants','sneakers']],
    elegant: [['black dress','shoes'], ['collared shirt','black pants','loafers']],
    cute: [['hoodie','pleated skirt','sneakers'], ['white dress','shoes']],
    cool: [['jacket','shirt','black pants','boots'], ['bodysuit','boots']],
  },
};
const locations: Record<Resolved['world'], string[]> = {
  modern: ['park','garden','street','rooftop'], fantasy: ['forest','castle','garden'],
  japanese: ['shrine','temple','bamboo forest'], future: ['city','rooftop','street'],
};
const moods: Record<Resolved['mood'], string[][]> = {
  cheerful: [['day','smile'], ['day','grin']], calm: [['day','smile'], ['sunset','closed mouth']],
  dramatic: [['sunset','serious'], ['night','serious']], mysterious: [['night','expressionless'], ['night','closed mouth']],
};
const hairColors = ['black hair','brown hair','white hair','grey hair','blue hair','purple hair','pink hair','red hair'];
const hairstyles = ['short hair','medium hair','long hair','bob cut','ponytail','braid'];
const positions = ['standing','sitting','walking'];
const frames = ['full body','cowboy shot','upper body'];
const activities = [['standing'], ['sitting'], ['walking'], ['sitting','holding book','reading']];
const colorPrefix = /^(?:white|black|blue|brown|red|grey|green|pink|purple|yellow|orange|aqua|striped|plaid) /;
const base = (name: string) => name.replace(colorPrefix, '').replace(/^(?:collared|frilled|pleated|long) /, '');
const clothingWords = new Set(Object.values(wardrobes).flatMap(w => Object.values(w).flat(2)).map(base));
const families: string[][] = [hairColors, hairstyles, positions, frames, ['straight hair','wavy hair'], ['1girl','1boy'], ['day','night','sunset'],
  ['smile','grin','serious','expressionless'], [...new Set(Object.values(locations).flat())]];
export const curatedTagNames = [...new Set([
  ...Object.values(wardrobes).flatMap(w => Object.values(w).flat(2)), ...Object.values(locations).flat(),
  ...Object.values(moods).flat(2), ...hairColors, ...hairstyles, ...positions, ...frames,
  'solo','1girl','1boy','looking at viewer','wavy hair','straight hair','holding book','reading','holographic monitor',
])];

// Only compatible, reviewed building blocks enter automatic rolls. The full dictionary remains selectable.
export function createSceneGacha(categories: Category[]) {
  const entries = categories.flatMap(c => c.subcategories.flatMap(s => s.tags.map(t => ({ ...t, categoryId: c.id, subcategoryId: s.id }))));
  const index = new Map(entries.map(t => [t.tag, t]));
  const supported = new Set(curatedTagNames);
  for (const t of entries) if (colorPrefix.test(t.tag) && clothingWords.has(base(t.tag))) supported.add(t.tag);
  const missing = curatedTagNames.filter(t => !index.has(t));
  const parseFree = (text: string) => text.split(',').map(t => t.trim().replaceAll('_',' ').replace(/^\((.*?)(?::[\d.]+)?\)$/, '$1')).filter(Boolean);
  const conflicts = (names: string[]) => {
    const unique = [...new Set(names)];
    for (const family of families) if (unique.filter(t => family.includes(t)).length > 1) return '同時に指定できない人物・髪型・ポーズ・時間・場所があります。';
    const clothes = unique.filter(t => clothingWords.has(base(t))).map(base);
    if (clothes.length && !Object.values(wardrobes).some(w => Object.values(w).some(sets => sets.some(set => clothes.every(t => set.map(base).includes(t)))))) return '服の組み合わせが両立しません。';
    for (const noun of clothingWords) if (unique.filter(t => colorPrefix.test(t) && base(t) === noun).length > 1) return '同じ服に複数の色・柄が指定されています。';
    if (unique.includes('closed mouth') && unique.includes('grin')) return '口を閉じる指定と笑い方が両立しません。';
    if (unique.includes('reading') && (unique.includes('looking at viewer') || unique.includes('walking'))) return '読書と視線・動作の指定が両立しません。';
    return '';
  };
  return {
    missing, conflicts, eligibleSubcategories: new Set(entries.filter(t => curatedTagNames.includes(t.tag)).map(t=>t.subcategoryId)),
    roll(current: Selection, locks: Record<string, boolean>, settings: SceneSettings, freePrompt = '', scope: Scope = {}, random = Math.random) {
      const choose = <T,>(list: T[]): T => list[Math.floor(random() * list.length)];
      const targeted = (s: string, c: string) => !locks[s] && (!scope.category || scope.category === c) && (!scope.subcategory || scope.subcategory === s);
      const retained: Selection = Object.fromEntries(categories.flatMap(c => c.subcategories.map(s => [s.id, targeted(s.id,c.id) ? [] : current[s.id] || []])));
      const fixed = [...Object.values(retained).flat().map(t => t.tag), ...parseFree(freePrompt)];
      const fixedError = conflicts(fixed);
      if (fixedError) return { selection: current, message: `抽選を保留しました。${fixedError}固定タグ・自由入力を確認してください。` };
      const unknown = fixed.filter(t => !supported.has(t));
      // Unreviewed fixed tags can carry cross-category constraints; do not guess their compatibility.
      if (unknown.length) return { selection: current, message: `「${unknown.slice(0,3).join('、')}」との整合性を確認できないため抽選を保留しました。対象の固定を外すか、自由入力を一時的に空にしてください。` };
      const genderFixed = fixed.includes('1girl') ? 'female' : fixed.includes('1boy') ? 'male' : null;
      if (genderFixed && settings.gender !== 'auto' && settings.gender !== genderFixed) return { selection: current, message: '人物の条件と固定された性別タグが異なります。条件か固定タグを変更してください。' };
      for (let attempt = 0; attempt < 240; attempt++) {
        const resolved = Object.fromEntries(Object.entries(sceneOptions).map(([key, values]) => [key, settings[key as keyof SceneSettings] === 'auto' ? choose(Object.keys(values).filter(k => k !== 'auto')) : settings[key as keyof SceneSettings]])) as Resolved;
        if (genderFixed && settings.gender === 'auto') resolved.gender = genderFixed;
        const outfit = [...choose(wardrobes[resolved.world][resolved.clothing])];
        const colorable = outfit.filter(t => ['shirt','sweater','hoodie','pants','skirt','dress','kimono','jacket','robe','cape'].includes(t));
        if (colorable.length) {
          const noun = choose(colorable);
          const variants = entries.filter(t => ['white','black','blue','brown','red'].some(color => t.tag === `${color} ${noun}`));
          if (variants.length) outfit[outfit.indexOf(noun)] = choose(variants).tag;
        }
        const activity = choose(activities);
        const names = ['solo', ...(resolved.gender === 'neutral' ? [] : [resolved.gender === 'female' ? '1girl':'1boy']), choose(hairColors), choose(hairstyles),
          ...outfit, choose(locations[resolved.world]), ...(resolved.world === 'future' ? ['holographic monitor'] : []), ...choose(moods[resolved.mood]), ...activity, choose(frames), ...(activity.includes('reading') ? [] : ['looking at viewer'])];
        const next: Selection = Object.fromEntries(Object.entries(retained).map(([id,tags]) => [id,[...tags]]));
        for (const name of names) {
          const t = index.get(name);
          if (t && targeted(t.subcategoryId,t.categoryId) && !next[t.subcategoryId].some(x => x.tag === name)) next[t.subcategoryId].push(t);
        }
        const resulting = [...Object.values(next).flat().map(t=>t.tag), ...parseFree(freePrompt)];
        if (conflicts(resulting)) continue;
        if (resulting.includes('reading') && !resulting.includes('holding book')) continue;
        if (fixed.includes('holographic monitor') && resolved.world !== 'future') continue;
        // Retained components must also fit the resolved world, wardrobe and mood.
        if (fixed.some(t => clothingWords.has(base(t)) && !wardrobes[resolved.world][resolved.clothing].some(set=>set.map(base).includes(base(t))))) continue;
        if (fixed.some(t => Object.values(locations).flat().includes(t) && !locations[resolved.world].includes(t))) continue;
        if (fixed.some(t => Object.values(moods).flat(2).includes(t) && !moods[resolved.mood].flat().includes(t))) continue;
        const changed = Object.keys(next).some(id => next[id].map(t=>t.tag).join('|') !== (current[id]||[]).map(t=>t.tag).join('|'));
        if (!changed || !Object.values(next).some(tags=>tags.length)) continue;
        return { selection: next, message: `${sceneOptions.gender[resolved.gender]} · ${sceneOptions.world[resolved.world]} · ${sceneOptions.clothing[resolved.clothing]} · ${sceneOptions.mood[resolved.mood]}` };
      }
      return { selection: current, message: '現在の条件・固定タグと両立する候補がありません。固定を減らすか「おまかせ」で試してください。' };
    },
  };
}
