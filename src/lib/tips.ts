import data from '../data/tips.json';

export type Level = 'Einsteiger' | 'Fortgeschritten' | 'Profi';

export interface Tip {
  id: string;
  title: string;
  text: string;
  level: Level;
  sources: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  tips: Tip[];
}

export interface Source {
  title: string;
  url: string;
  type: 'offiziell' | 'community';
}

export const categories = data.categories as Category[];
export const sources = data.sources as Record<string, Source>;
export const levels: Level[] = ['Einsteiger', 'Fortgeschritten', 'Profi'];

export const allTips = categories.flatMap((c) => c.tips.map((tip) => ({ tip, category: c })));

export function countByLevel(tips: Tip[]) {
  return Object.fromEntries(levels.map((l) => [l, tips.filter((t) => t.level === l).length])) as Record<Level, number>;
}

export function sourcesFor(tip: Tip): Source[] {
  return tip.sources.map((id) => sources[id]).filter(Boolean);
}
