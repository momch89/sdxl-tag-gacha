import importedCategories from './danbooru-import.json';

export type Tag = { tag: string; ja: string; note: string; postCount: number; microcategory?: string };
export type Subcategory = { id: string; name: string; tags: Tag[]; optional?: boolean };
export type Category = { id: string; name: string; icon: string; color: string; subcategories: Subcategory[] };

export const categories = importedCategories as Category[];
export const allTags = categories.flatMap(category => category.subcategories.flatMap(subcategory => subcategory.tags.map(tag => ({ ...tag, category, subcategory }))));
