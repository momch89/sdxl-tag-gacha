import type { Category, Tag } from './tag-data';
import { bangTags, textureTags, specialColorTags, eyeShapeTags, pupilTags, eyeColorTags } from './scene-categories.ts';

export type Selection = Record<string, Tag[]>;
export const sceneOptions = {
  gender: { auto: 'おまかせ', female: '女性', male: '男性', neutral: '中性（性別タグなし）' },
  world: { auto: 'おまかせ', modern: '現代', fantasy: 'ファンタジー', japanese: '和風', future: '近未来' },
  clothing: { auto: 'おまかせ', casual: '気軽・シンプル', elegant: '上品', cute: 'かわいい', cool: 'かっこいい', costume: '制服・コスチューム' },
  mood: { auto: 'おまかせ', cheerful: '明るい', calm: '穏やか', dramatic: 'ドラマチック', mysterious: 'ミステリアス' },
} as const;
export type SceneSettings = { [K in keyof typeof sceneOptions]: keyof typeof sceneOptions[K] };
export const defaultSceneSettings: SceneSettings = { gender: 'auto', world: 'auto', clothing: 'auto', mood: 'auto' };
type Resolved = { -readonly [K in keyof SceneSettings]: Exclude<SceneSettings[K], 'auto'> };
type Scope = { category?: string; subcategory?: string };
type Wardrobe = string[];
const wardrobes: Record<Resolved['world'], Record<Resolved['clothing'], Wardrobe[]>> = {
  modern: {
    casual: [['shirt','pants','sneakers'], ['hoodie','pants','sneakers'], ['sweater','long skirt','shoes'], ['t-shirt','jeans','sneakers'], ['cardigan','blouse','skirt','loafers'], ['t-shirt','denim shorts','sandals']],
    elegant: [['collared shirt','pants','loafers'], ['dress','shoes'], ['sweater','long skirt','shoes'], ['blouse','long skirt','shoes'], ['trench coat','collared shirt','pants','loafers'], ['sleeveless dress','cardigan','shoes']],
    cute: [['frilled dress','shoes'], ['sweater','pleated skirt','shoes'], ['hoodie','skirt','sneakers'], ['pinafore dress','blouse','shoes'], ['sailor dress','loafers'], ['sundress','sandals']],
    cool: [['jacket','shirt','pants','boots'], ['vest','shirt','pants','loafers'], ['leather jacket','t-shirt','jeans','boots'], ['bomber jacket','t-shirt','pants','sneakers'], ['turtleneck sweater','pants','boots']],
    costume: [['school uniform','loafers'], ['business suit','collared shirt','necktie','pants','loafers'], ['maid','maid headdress','frilled dress','apron','shoes'], ['nurse','nurse cap','white dress','shoes'], ['chef','chef hat','shirt','pants','apron','shoes'], ['idol','frilled dress','boots'], ['police uniform','boots'], ['military uniform','boots'], ['lab coat','collared shirt','pants','shoes'], ['gym uniform','sneakers'], ['track suit','sneakers'], ['pajamas','slippers'], ['overalls','shirt','sneakers'], ['one-piece swimsuit','sandals'], ['bikini','sandals']],
  },
  fantasy: {
    casual: [['shirt','pants','boots'], ['robe','boots'], ['shirt','pants','hooded cloak','boots']],
    elegant: [['dress','cape','shoes'], ['robe','cape','boots'], ['long skirt','blouse','corset','boots']],
    cute: [['frilled dress','shoes'], ['dress','capelet','shoes'], ['dress','witch hat','boots'], ['pinafore dress','blouse','boots']],
    cool: [['armor','boots'], ['shirt','pants','cloak','boots'], ['armor','tabard','boots'], ['robe','hooded cloak','boots']],
    costume: [['witch','witch hat','robe','boots'], ['magical girl','frilled dress','boots'], ['nun','habit','shoes'], ['maid','maid headdress','frilled dress','apron','shoes'], ['armor','tabard','boots'], ['gothic lolita','frilled dress','boots']],
  },
  japanese: {
    casual: [['kimono','geta'], ['kimono','haori','geta'], ['yukata','geta']],
    elegant: [['kimono','hakama','geta'], ['kimono','haori','geta'], ['kimono','tabi','geta']],
    cute: [['kimono','hair ribbon','geta'], ['yukata','hair ribbon','geta']],
    cool: [['kimono','hakama','haori','geta'], ['kimono','hakama','boots']],
    costume: [['miko','kimono','hakama','tabi','geta'], ['ninja','japanese clothes','boots'], ['samurai','kimono','hakama','boots'], ['china dress','shoes'], ['school uniform','loafers']],
  },
  future: {
    casual: [['hoodie','pants','sneakers'], ['jacket','shirt','pants','sneakers'], ['bomber jacket','t-shirt','jeans','sneakers']],
    elegant: [['black dress','shoes'], ['collared shirt','black pants','loafers'], ['sleeveless dress','long coat','boots']],
    cute: [['hoodie','pleated skirt','sneakers'], ['white dress','shoes'], ['jacket','t-shirt','shorts','sneakers']],
    cool: [['jacket','shirt','black pants','boots'], ['bodysuit','boots'], ['bodysuit','long coat','boots'], ['leather jacket','turtleneck sweater','pants','boots']],
    costume: [['bodysuit','long coat','boots'], ['pilot suit','boots'], ['military uniform','boots'], ['lab coat','bodysuit','boots'], ['idol','sleeveless dress','boots'], ['magical girl','frilled dress','boots']],
  },
};
const locations: Record<Resolved['world'], string[]> = {
  modern: ['park','garden','street','rooftop'], fantasy: ['forest','castle','garden'],
  japanese: ['shrine','temple','bamboo forest'], future: ['city','rooftop','street'],
};
const moods: Record<Resolved['mood'], string[][]> = {
  cheerful: [['day','smile','closed mouth'], ['day','grin','open mouth'], ['day','happy','open mouth'], ['day','light smile','closed mouth','blush'], ['sunset','smile','parted lips'], ['day','laughing','open mouth','closed eyes']],
  calm: [['day','light smile','closed mouth'], ['sunset','smile','closed mouth'], ['day','expressionless','closed mouth'], ['sunset','light smile','half-closed eyes'], ['day','serious','closed mouth']],
  dramatic: [['sunset','serious','parted lips'], ['night','angry','open mouth'], ['sunset','sad','tears','parted lips'], ['night','scowl','closed mouth'], ['sunset','annoyed','closed mouth'], ['sunset','worried','parted lips'], ['night','surprised','open mouth'], ['night','crying','tears','open mouth','closed eyes']],
  mysterious: [['night','expressionless','closed mouth'], ['night','smug','closed mouth'], ['night','serious','parted lips','half-closed eyes'], ['night','light smile','closed mouth'], ['night','smirk','closed mouth'], ['sunset','pout','closed mouth']],
};
const hairColors = ['black hair','brown hair','white hair','grey hair','blue hair','purple hair','pink hair','red hair'];
const hairstyles = ['short hair','medium hair','long hair','bob cut','ponytail','braid'];
const rolledBangs = bangTags.filter(t => !['hair over eyes','hair over one eye','hair between eyes','long bangs'].includes(t));
const rolledTextures = ['straight hair','wavy hair','curly hair','fluffy hair'];
const rolledSpecialColors = ['gradient hair','streaked hair','colored inner hair','colored tips','two-tone hair'];
const rolledEyeShapes = ['tsurime','tareme','sanpaku'];
const pupilPatterns: Record<Resolved['world'], string[][]> = {
  modern: [[], [], ['constricted pupils'], ['bright pupils'], ['white pupils']],
  japanese: [[], [], ['constricted pupils'], ['bright pupils'], ['slit pupils']],
  fantasy: [[], ['slit pupils'], ['horizontal pupils'], ['heart-shaped pupils'], ['star-shaped pupils'], ['flower-shaped pupils'], ['cross-shaped pupils'], ['diamond-shaped pupils'], ['symbol-shaped pupils'], ['no pupils']],
  future: [[], ['constricted pupils'], ['star-shaped pupils'], ['diamond-shaped pupils'], ['x-shaped pupils'], ['white pupils'], ['bright pupils'], ['mismatched pupils'], ['no pupils']],
};
const rolledPupils = [...new Set(Object.values(pupilPatterns).flat(2))];
const positions = ['standing','sitting','kneeling','lying'];
const frames = ['full body','cowboy shot','upper body'];
const activities = [['standing'], ['standing','waving'], ['standing','salute'], ['standing','stretching'], ['standing','looking away'], ['standing','looking back'], ['walking'], ['running'], ['jumping'], ['dancing'], ['sitting'], ['sitting','holding book','reading'], ['sitting','drinking'], ['sitting','eating'], ['sitting','writing'], ['kneeling'], ['lying','on back'], ['lying','on side']];
const colorPrefix = /^(?:white|black|blue|brown|red|grey|green|pink|purple|yellow|orange|aqua|striped|plaid) /;
const base = (name: string) => name.replace(colorPrefix, '').replace(/^(?:collared|frilled|pleated|long) /, '');
const clothingWords = new Set(Object.values(wardrobes).flatMap(w => Object.values(w).flat(2)).map(base));
const feelings = ['smile','light smile','grin','happy','smug','serious','expressionless','angry','annoyed','scowl','sad','worried','surprised','smirk','pout','crying','laughing'];
const movementTags = ['walking','running','jumping','dancing','reading','drinking','eating','writing','stretching','waving','salute'];
const families: string[][] = [hairColors, hairstyles, bangTags, textureTags, specialColorTags, eyeColorTags.map(t=>t.tag), eyeShapeTags, pupilTags, positions, ['on back','on side'], movementTags, frames, ['1girl','1boy'], ['day','night','sunset'],
  feelings, ['open mouth','closed mouth','parted lips'], ['closed eyes','half-closed eyes'], [...new Set(Object.values(locations).flat())]];
export const curatedTagNames = [...new Set([
  ...Object.values(wardrobes).flatMap(w => Object.values(w).flat(2)), ...Object.values(locations).flat(),
  ...Object.values(moods).flat(2), ...activities.flat(), ...hairColors, ...hairstyles, ...rolledBangs, ...rolledTextures, ...rolledSpecialColors, ...eyeColorTags.map(t=>t.tag), ...rolledEyeShapes, ...rolledPupils, ...positions, ...frames,
  'solo','1girl','1boy','male focus','handsome','looking at viewer','wavy hair','straight hair','holding book','reading','holographic monitor',
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
    if (unique.includes('surprised') && unique.includes('closed mouth')) return '驚いた表情と閉じた口が両立しません。';
    if (unique.includes('closed eyes') && unique.includes('looking at viewer')) return '閉じた目と正面を見る指定が両立しません。';
    if (unique.includes('reading') && (unique.includes('looking at viewer') || unique.includes('walking'))) return '読書と視線・動作の指定が両立しません。';
    if (['reading','drinking','eating','writing'].some(t=>unique.includes(t)) && !unique.includes('sitting')) return 'この動作には座りポーズが必要です。';
    if (unique.includes('reading') && !unique.includes('holding book')) return '読書には本を持つ指定が必要です。';
    if (['on back','on side'].some(t=>unique.includes(t)) && !unique.includes('lying')) return '寝姿勢の向きには寝そべる指定が必要です。';
    if (unique.includes('looking away') && unique.includes('looking at viewer')) return '視線の向きが両立しません。';
    if (['walking','running','jumping','dancing'].some(t=>unique.includes(t)) && positions.some(t=>unique.includes(t))) return '移動動作と静止ポーズが両立しません。';
    if (['waving','salute','stretching'].some(t=>unique.includes(t)) && !unique.includes('standing')) return 'この動作には立ちポーズが必要です。';
    if (unique.includes('1girl') && ['male focus','handsome'].some(t=>unique.includes(t))) return '女性指定と男性向けの特徴が両立しません。';
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
      const genderFixed = fixed.includes('1girl') ? 'female' : ['1boy','male focus','handsome'].some(t=>fixed.includes(t)) ? 'male' : null;
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
        const expression = choose(moods[resolved.mood]);
        const people = resolved.gender === 'male' ? ['1boy','male focus','handsome','solo'] : resolved.gender === 'female' ? ['1girl','solo'] : ['solo'];
        const names = [...people, choose(hairColors), choose(hairstyles), choose(rolledBangs), choose(rolledTextures), ...(random()<0.35 ? [choose(rolledSpecialColors)] : []),
          choose(eyeColorTags).tag, ...(random()<0.75 ? [choose(rolledEyeShapes)] : []), ...choose(pupilPatterns[resolved.world]),
          ...outfit, choose(locations[resolved.world]), ...(resolved.world === 'future' ? ['holographic monitor'] : []), ...expression, ...activity, choose(frames), ...(activity.some(t=>['reading','looking away'].includes(t)) || expression.includes('closed eyes') ? [] : ['looking at viewer'])];
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
