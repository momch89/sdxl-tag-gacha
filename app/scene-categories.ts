import type { Category } from './tag-data';

export const bangTags = ['blunt bangs','parted bangs','swept bangs','diagonal bangs','short bangs','double-parted bangs','arched bangs','choppy bangs','asymmetrical bangs','wispy bangs','crossed bangs','braided bangs','fanged bangs','long bangs','hair over eyes','hair over one eye','hair between eyes','bangs pinned back'];
export const textureTags = ['straight hair','wavy hair','curly hair','messy hair','fluffy hair','spiked hair','drill hair','dreadlocks','ringlets'];
export const specialColorTags = ['gradient hair','streaked hair','two-tone hair','split-color hair','colored inner hair','colored tips','rainbow hair','multicolored hair'];
export const eyeShapeTags = ['tsurime','tareme','sanpaku','jitome'];
export const pupilTags = ['slit pupils','horizontal pupils','constricted pupils','heart-shaped pupils','star-shaped pupils','flower-shaped pupils','cross-shaped pupils','diamond-shaped pupils','x-shaped pupils','no pupils','white pupils','bright pupils','symbol-shaped pupils','mismatched pupils'];
// Danbooru general-category counts fetched 2026-09-12; kept separate from the source import.
export const eyeColorTags = [
  { tag:'blue eyes', ja:'青い瞳', postCount:2469685 }, { tag:'brown eyes', ja:'茶色の瞳', postCount:1091020 },
  { tag:'green eyes', ja:'緑の瞳', postCount:1195106 }, { tag:'red eyes', ja:'赤い瞳', postCount:1778162 },
  { tag:'purple eyes', ja:'紫の瞳', postCount:1199994 }, { tag:'yellow eyes', ja:'黄色い瞳', postCount:1022316 },
  { tag:'grey eyes', ja:'グレーの瞳', postCount:289747 }, { tag:'pink eyes', ja:'ピンクの瞳', postCount:431119 },
];
export function organizeSceneCategories(source: Category[]): Category[] {
  return source.map(category => {
    const subdivisions = category.id === 'hair' ? [
      ['hair_bangs','前髪',bangTags], ['hair_texture','髪質',textureTags], ['hair_special_color','特殊髪色',specialColorTags],
    ] as const : category.id === 'expression' ? [
      ['eye_shape','目の形',eyeShapeTags], ['eye_pupils','瞳孔',pupilTags],
    ] as const : [];
    const moved = new Set(subdivisions.flatMap(x=>[...x[2]]));
    const all = category.subcategories.flatMap(s=>s.tags);
    const subcategories = category.subcategories.map(s=>({...s,tags:s.tags.filter(t=>!moved.has(t.tag))})).filter(s=>s.tags.length);
    for (const [id,name,names] of subdivisions) subcategories.push({id,name,tags:all.filter(t=>names.includes(t.tag)).map(t=>({...t,microcategory:name})), optional:id==='hair_special_color'||id==='eye_pupils'});
    if(category.id==='expression') subcategories.unshift({id:'eye_color',name:'目の色',tags:eyeColorTags.map(t=>({...t,microcategory:'色タグ（瞳）'}))});
    return {...category,subcategories};
  });
}
