import importedCategories from './danbooru-import.json';
import { organizeSceneCategories } from './scene-categories';

export type Tag = { tag: string; ja: string; postCount: number; microcategory?: string };
export type Subcategory = { id: string; name: string; tags: Tag[]; optional?: boolean };
export type Category = { id: string; name: string; icon: string; color: string; subcategories: Subcategory[] };

export const categories = organizeSceneCategories(importedCategories as Category[]);
export const allTags = categories.flatMap(category => category.subcategories.flatMap(subcategory => subcategory.tags.map(tag => ({ ...tag, category, subcategory }))));

export function migrateCharacter(tags: Record<string, Tag[]>, locks: Record<string, boolean> = {}) {
  const nextTags: Record<string, Tag[]> = {};
  const nextLocks: Record<string, boolean> = {};
  const index = new Map(allTags.map(t=>[t.tag,t]));
  const legacy = importedCategories.flatMap(c=>c.subcategories);
  const currentSchema = 'hair_bangs' in tags || 'eye_color' in tags;
  for (const [id, values] of Object.entries(tags)) {
    const destinations = new Set((!currentSchema ? legacy.find(s=>s.id===id)?.tags || values : values).map(t=>index.get(t.tag)?.subcategory.id).filter((s): s is string=>!!s));
    if (categories.some(c=>c.subcategories.some(s=>s.id===id))) destinations.add(id);
    for (const target of destinations) { nextTags[target] ||= []; nextLocks[target] = (nextLocks[target] || false) || (locks[id] ?? true); }
    for (const tag of values) {
      const current = index.get(tag.tag);
      const target = current?.subcategory.id || id;
      nextTags[target] ||= [];
      if (!nextTags[target].some(t=>t.tag===tag.tag)) nextTags[target].push(current || tag);
    }
  }
  return { tags: nextTags, locks: nextLocks };
}
