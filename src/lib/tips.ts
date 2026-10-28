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

export const groupOf = (id: string) =>
  id.startsWith('cc-') ? 'Claude Code'
  : ['api-agents', 'skills'].includes(id) ? 'Entwickeln'
  : ['security', 'resources'].includes(id) ? 'Allgemein'
  : 'Claude nutzen';

export const groups = ['Claude nutzen', 'Claude Code', 'Entwickeln', 'Allgemein'].map((name) => ({
  name,
  categories: categories.filter((c) => groupOf(c.id) === name),
}));

// Kategorienamen ohne Präfix, z. B. „Workflow“ statt „Claude Code: Workflow“
export const shortName = (name: string) => name.replace(/^Claude Code: /, '').replace(/^Claude\.ai: /, '');

export const tipUrl = (category: Category, tip: Tip) => `/kategorie/${category.id}/#${tip.id}`;

// Startpfad für Neue: fünf Einsteiger-Tipps aus verschiedenen Kategorien
const pathIds = ['sag-genau-was-du-willst', 'ein-projekt-pro-thema-kunde', 'artifact-ausdruecklich-anfordern', 'lange-chats-neu-starten', 'gib-claude-eine-pruefmoeglichkeit'];
export const startPath = pathIds
  .map((id) => allTips.find(({ tip }) => tip.id === id))
  .filter((x): x is (typeof allTips)[number] => Boolean(x));

export function countByLevel(tips: Tip[]) {
  return Object.fromEntries(levels.map((l) => [l, tips.filter((t) => t.level === l).length])) as Record<Level, number>;
}

export function sourcesFor(tip: Tip): Source[] {
  return tip.sources.map((id) => sources[id]).filter(Boolean);
}
