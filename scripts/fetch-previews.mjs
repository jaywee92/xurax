// Lädt beim Build für jeden Eintrag in resources.json das Vorschaubild (og:image) der Website
// und legt es verkleinert unter public/previews/ ab. So lädt der Browser später nichts von fremden Servern.
// Schlägt ein Abruf fehl, zeigt die Seite eine neutrale Vorschau. Der Build bricht nie ab.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const data = JSON.parse(await readFile(new URL('src/data/resources.json', root), 'utf8'));
const items = data.sections.flatMap((s) => s.groups.flatMap((g) => g.items));
const outDir = new URL('public/previews/', root);
await mkdir(outDir, { recursive: true });

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('sharp fehlt, Bilder werden unverändert gespeichert.');
}

const headers = { 'user-agent': 'Mozilla/5.0 (compatible; xurax-preview/1.0; +https://xurax.de)', accept: 'text/html,image/*;q=0.9,*/*;q=0.8' };
const attr = (tag, name) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];

function findImage(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, 'property') ?? attr(tag, 'name') ?? '').toLowerCase();
    if (['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'].includes(key)) {
      const content = attr(tag, 'content');
      if (content) return content.replace(/&amp;/g, '&');
    }
  }
  return null;
}

async function preview(item) {
  const page = await fetch(item.url, { headers, redirect: 'follow', signal: AbortSignal.timeout(12000) });
  if (!page.ok) throw new Error(`Seite ${page.status}`);
  const src = findImage(await page.text());
  if (!src) throw new Error('kein og:image');
  const imgUrl = new URL(src, page.url);
  const img = await fetch(imgUrl, { headers, signal: AbortSignal.timeout(12000) });
  const type = img.headers.get('content-type') ?? '';
  if (!img.ok || !type.startsWith('image/')) throw new Error(`Bild ${img.status} ${type}`);
  const buf = Buffer.from(await img.arrayBuffer());
  if (buf.length > 8_000_000) throw new Error('Bild zu groß');
  if (sharp && !type.includes('svg')) {
    const name = `${item.id}.webp`;
    await sharp(buf).resize(800, 450, { fit: 'cover', position: 'top' }).webp({ quality: 74 }).toFile(new URL(name, outDir).pathname);
    return `/previews/${name}`;
  }
  const ext = type.includes('svg') ? 'svg' : type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const name = `${item.id}.${ext}`;
  await writeFile(new URL(name, outDir), buf);
  return `/previews/${name}`;
}

const result = {};
const queue = [...items];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        result[item.id] = await preview(item);
        console.log(`ok    ${item.id}`);
      } catch (e) {
        console.log(`fehlt ${item.id}: ${e.message}`);
      }
    }
  }),
);
await writeFile(new URL('src/data/previews.json', root), JSON.stringify(result, null, 2) + '\n');
console.log(`${Object.keys(result).length} von ${items.length} Vorschaubildern geladen.`);
