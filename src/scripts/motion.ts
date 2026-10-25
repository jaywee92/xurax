// Animationen: GSAP (Hero, Scroll), Motion (Einblenden, Hover), Lenis (weiches Scrollen).
// Bei „Bewegung reduzieren“ im Betriebssystem läuft nichts davon.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { animate, hover, inView, stagger } from 'motion';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis: Lenis | undefined;

if (!reduced) {
  lenis = new Lenis({ anchors: true, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function heroIntro() {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;
  const title = hero.querySelector('h1');
  const rest = hero.querySelectorAll('.hero-copy > :not(h1), .hero-actions > *');
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  gsap.set('.hero-copy, .hero-actions', { autoAlpha: 1 });
  if (title) {
    const split = SplitText.create(title, { type: 'words,chars', mask: 'words' });
    tl.from(split.chars, { yPercent: 110, duration: 0.8, stagger: 0.018 });
  }
  tl.from(rest, { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, '-=0.45');

  // Zahlen im Hero hochzählen
  for (const el of hero.querySelectorAll<HTMLElement>('[data-count]')) {
    const counter = { n: 0 };
    tl.to(counter, { n: Number(el.dataset.count), duration: 1.2, ease: 'power2.out', onUpdate: () => (el.textContent = String(Math.round(counter.n))) }, 0.2);
  }
}

function scrollEffects() {
  const featured = document.querySelector('.featured');
  if (featured) {
    gsap.from(featured, {
      scale: 0.94,
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: featured, start: 'top 85%' },
    });
  }
  gsap.to('.hero-copy, .hero-actions', {
    yPercent: -8,
    opacity: 0.4,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

function reveals() {
  for (const group of document.querySelectorAll('.cat-grid, .tip-grid, .tip-list')) {
    const items = group.querySelectorAll<HTMLElement>('.cat, .tip');
    items.forEach((el) => (el.style.opacity = '0'));
    inView(
      group,
      () => {
        animate(items, { opacity: [0, 1], y: [24, 0] }, { delay: stagger(0.03, { startDelay: 0.05 }), duration: 0.5, ease: [0.22, 1, 0.36, 1] });
      },
      { amount: 0.05 },
    );
  }

  hover('.cat, .tip', (el) => {
    animate(el, { y: -3, boxShadow: '0 10px 30px -12px rgb(15 23 42 / 0.25)' }, { type: 'spring', stiffness: 400, damping: 25 });
    return () => animate(el, { y: 0, boxShadow: '0 0 0 0 rgb(15 23 42 / 0)' }, { type: 'spring', stiffness: 400, damping: 30 });
  });
}

// Partikel-Kugel erst nachladen, damit Three.js den Seitenstart nicht bremst.
let stopParticles: (() => void) | undefined;
function particles() {
  const canvas = document.querySelector<HTMLCanvasElement>('.hero-canvas');
  if (!canvas) return;
  import('./particles').then(({ particleHero }) => {
    if (canvas.isConnected) stopParticles = particleHero(canvas);
  });
}

document.addEventListener('astro:page-load', () => {
  particles();
  if (reduced) return;
  heroIntro();
  scrollEffects();
  reveals();
});

document.addEventListener('astro:before-swap', () => {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  stopParticles?.();
  stopParticles = undefined;
});

// Für die Suche: neu eingeblendete Tipps sanft animieren.
export function popIn(els: HTMLElement[]) {
  if (reduced || els.length === 0) return;
  animate(els.slice(0, 40), { opacity: [0, 1], scale: [0.97, 1] }, { duration: 0.25, delay: stagger(0.015) });
}
