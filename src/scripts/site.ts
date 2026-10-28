// Seitenweite Bedienung: „/“ öffnet die Suche, Level-Filter und Inhaltsverzeichnis.

function focusSearch() {
  const q = document.querySelector<HTMLInputElement>('#q');
  if (q) {
    q.focus();
    q.scrollIntoView({ block: 'center' });
    return true;
  }
  return false;
}

document.addEventListener('keydown', (e) => {
  const tag = (document.activeElement as HTMLElement | null)?.tagName ?? '';
  if (e.key !== '/' || /INPUT|TEXTAREA|SELECT/.test(tag)) return;
  e.preventDefault();
  if (!focusSearch()) location.href = '/#suche';
});

document.addEventListener('astro:page-load', () => {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-search-open]')) {
    link.addEventListener('click', (e) => {
      if (focusSearch()) e.preventDefault();
    });
  }
  if (location.hash === '#suche') requestAnimationFrame(focusSearch);

  // Inhaltsverzeichnis rechts: markiert den Tipp, der gerade oben steht.
  const toc = document.querySelector('.toc');
  if (toc) {
    const links = new Map([...toc.querySelectorAll<HTMLAnchorElement>('a')].map((a) => [a.hash.slice(1), a]));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          links.forEach((a, id) => a.classList.toggle('on', id === e.target.id));
        }
      },
      { rootMargin: '-90px 0px -65% 0px' },
    );
    document.querySelectorAll('.tip-row').forEach((el) => io.observe(el));
    document.addEventListener('astro:before-swap', () => io.disconnect(), { once: true });
  }
});

// Segment-Schalter für Level; meldet die Auswahl per Event an die Seite.
export function onLevelFilter(root: ParentNode, cb: (level: string) => void) {
  const seg = root.querySelector('[data-level-filter]');
  if (!seg) return;
  const buttons = [...seg.querySelectorAll<HTMLButtonElement>('button')];
  for (const b of buttons) {
    b.addEventListener('click', () => {
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      cb(b.dataset.level ?? '');
    });
  }
}

// „Kopieren“-Knöpfe bei Prompts und Befehlen.
document.addEventListener('click', async (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]');
  if (!b) return;
  const done = (label: string) => {
    b.textContent = label;
    setTimeout(() => (b.textContent = 'Kopieren'), 1600);
  };
  try {
    await navigator.clipboard.writeText(b.dataset.copy ?? '');
    done('Kopiert');
  } catch {
    const code = b.parentElement?.querySelector('code');
    if (code) getSelection()?.selectAllChildren(code);
    done('Markiert');
  }
});
