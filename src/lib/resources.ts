import data from '../data/resources.json';
import previews from '../data/previews.json';

export interface Handoff {
  kind: 'command' | 'prompt' | 'hint' | 'steps';
  label: string;
  code?: string;
  text?: string;
  note?: string;
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  description: string;
  price: string;
  tags: string[];
  handoff: Handoff;
}

export interface ResourceGroup {
  id: string;
  name: string;
  items: Resource[];
}

export interface ResourceSection {
  id: string;
  name: string;
  short: string;
  description: string;
  groups: ResourceGroup[];
}

export const resourceSections = data.sections as ResourceSection[];
export const checked = new Date(data.checked).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
export const sectionById = (id: string) => resourceSections.find((s) => s.id === id)!;
export const countItems = (s: ResourceSection) => s.groups.reduce((n, g) => n + g.items.length, 0);
export const previewFor = (r: Resource): string | undefined => (previews as Record<string, string>)[r.id];
export const domainOf = (url: string) => new URL(url).hostname.replace(/^www\./, '');
export const isFree = (r: Resource) => r.price === 'kostenlos' || r.price === 'teils kostenlos';
export const hasMcp = (r: Resource) => r.tags.includes('MCP');
