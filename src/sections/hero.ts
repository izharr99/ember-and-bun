import { content } from '../types';
import { LAYERS, layerSvg, stackHeight, W } from '../art/layers';
import { esc, html, money, reducedMotion } from '../lib/util';
import { gsap, ScrollTrigger } from '../lib/motion';

/**
 * Signature moment: the "exploding burger". The section pins while scroll scrubs a
 * timeline that separates the stack into labelled layers; scrolling back restacks it.
 */
export function heroSection(): HTMLElement {
  const { hero, anatomy } = content;
  const layers = hero.layers;
  const total = layers.reduce((n, l) => n + l.price, 0);
  const kcal = layers.reduce((n, l) => n + l.calories, 0);

  return html(`
    <section class="hero" id="anatomy" aria-labelledby="hero-title">
      <div class="hero-stage">
        <div class="hero-glow" aria-hidden="true"></div>
        <p class="kicker hero-kicker">${esc(hero.kicker)}</p>
        <h1 class="hero-title" id="hero-title">
          ${hero.headline.map((line) => `<span class="hero-line"><span>${esc(line)}</span></span>`).join('')}
          <span class="sr-only">. ${esc(content.brand.tagline)}</span>
        </h1>
        <div class="steam" aria-hidden="true">
          ${[0, 1, 2].map((i) => `<svg viewBox="0 0 40 160" style="--i:${i}"><path d="M20 160c-14-24 14-40 0-64s14-40 0-64" /></svg>`).join('')}
        </div>
        <div class="hero-burger" aria-hidden="true">
          ${layers.map((l, i) => `<div class="hl" data-i="${i}"><div class="hl-inner">${layerSvg(l.type)}</div></div>`).join('')}
        </div>
        <div class="hero-anatomy">
          <p class="kicker">${esc(anatomy.kicker)}</p>
          <h2 class="hero-anatomy-title">${esc(anatomy.title)}</h2>
        </div>
        <ol class="hero-labels">
          ${layers
            .map(
              (l, i) => `
            <li class="hlabel" data-i="${i}">
              <span class="hlabel-no">${String(i + 1).padStart(2, '0')}</span>
              <span class="hlabel-name">${esc(l.name)}</span>
              <span class="hlabel-note">${esc(l.note)}</span>
              <span class="hlabel-meta">${money(l.price)} <i>/</i> ${l.calories} kcal</span>
            </li>`,
            )
            .join('')}
        </ol>
        <p class="hero-hint" aria-hidden="true"><span></span>${esc(hero.scrollHint)}</p>
        <div class="hero-outro">
          <p>${esc(hero.outro)}</p>
          <p class="hero-outro-meta">${money(total)} <i>/</i> ${kcal} kcal</p>
        </div>
      </div>
    </section>`);
}

interface Geo {
  s: number;
  /** Horizontal offset of the stacked burger from its exploded position (centres it on mobile). */
  dx: number;
  stacked: number[];
  exploded: number[];
}

export function initHero(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>('.hero-stage')!;
  const burger = root.querySelector<HTMLElement>('.hero-burger')!;
  const els = gsap.utils.toArray<HTMLElement>('.hl', root);
  const inners = gsap.utils.toArray<HTMLElement>('.hl-inner', root);
  const labels = gsap.utils.toArray<HTMLElement>('.hlabel', root);
  const types = content.hero.layers.map((l) => l.type);
  const n = types.length;
  const geo: Geo = { s: 1, dx: 0, stacked: [], exploded: [] };

  const layout = () => {
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const narrow = sw < 760;
    const bw = narrow ? Math.min(sw * 0.5, 260) : Math.min(sw * 0.3, sh * 0.62, 460);
    const s = bw / W;
    const bx = narrow ? sw * 0.06 : (sw - bw) / 2;
    const spread = sh * (narrow ? 0.6 : 0.64);
    const stackH = stackHeight(types) * s;

    let acc = 0;
    geo.s = s;
    geo.dx = (sw - bw) / 2 - bx;
    geo.stacked = types.map((t) => {
      const y = acc - stackH / 2 + sh * (narrow ? 0.2 : 0.06);
      acc += LAYERS[t].t * s;
      return y;
    });
    const centers = types.map((_, i) => -spread / 2 + (spread * i) / (n - 1) + sh * 0.04);
    geo.exploded = types.map((t, i) => centers[i] - (LAYERS[t].h * s) / 2);

    burger.style.cssText = `left:${bx}px;width:${bw}px`;
    labels.forEach((label, i) => {
      const right = narrow || i % 2 === 0;
      label.classList.toggle('is-left', !right);
      const top = sh / 2 + centers[i];
      if (right) {
        const left = bx + bw + (narrow ? 14 : 40);
        label.style.cssText = `top:${top}px;left:${left}px;right:auto;width:${Math.min(sw - left - 16, 300)}px`;
      } else {
        label.style.cssText = `top:${top}px;right:${sw - bx + 40}px;left:auto;width:${Math.min(bx - 56, 300)}px`;
      }
    });
  };

  layout();

  if (reducedMotion()) {
    root.classList.add('is-static');
    const apply = () => {
      layout();
      els.forEach((el, i) => gsap.set(el, { y: geo.exploded[i] }));
    };
    apply();
    window.addEventListener('resize', apply);
    return;
  }

  ScrollTrigger.addEventListener('refreshInit', layout);
  els.forEach((el, i) => gsap.set(el, { y: geo.stacked[i], x: geo.dx }));
  gsap.set(labels, { autoAlpha: 0 });

  // Intro: layers drop onto the plate one by one, bottom first.
  const intro = gsap.timeline({ delay: 0.2 });
  intro
    .from('.hero-line > span', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.1 })
    .from(
      [...inners].reverse(),
      { y: () => -window.innerHeight, duration: 0.9, ease: 'bounce.out', stagger: 0.12 },
      0.1,
    )
    .from('.hero-kicker, .hero-hint', { autoAlpha: 0, y: 20, duration: 0.8, stagger: 0.1 }, 0.6);

  const mid = (n - 1) / 2;
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: '+=240%',
      pin: stage,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });

  tl.to('.hero-title', { scale: 0.86, autoAlpha: 0.08, duration: 0.3 }, 0)
    .to('.hero-hint, .hero-kicker', { autoAlpha: 0, duration: 0.1 }, 0)
    .to('.steam', { autoAlpha: 0, duration: 0.15 }, 0)
    .fromTo('.hero-anatomy', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.15);

  els.forEach((el, i) => {
    tl.to(
      el,
      { y: () => geo.exploded[i], x: 0, rotation: (i % 2 ? 1 : -1) * 3, duration: 0.5 },
      0.1 + Math.abs(i - mid) * 0.03,
    );
  });

  labels.forEach((label, i) => {
    const fromX = label.classList.contains('is-left') ? -30 : 30;
    tl.fromTo(label, { autoAlpha: 0, x: fromX }, { autoAlpha: 1, x: 0, duration: 0.2, ease: 'power2.out' }, 0.38 + i * 0.04);
  });

  // Outro: labels clear, the burger snaps back together, the tagline lands.
  tl.to(labels, { autoAlpha: 0, duration: 0.08, stagger: 0.01 }, 0.78)
    .to('.hero-anatomy', { autoAlpha: 0, duration: 0.08 }, 0.78);
  els.forEach((el, i) => {
    tl.to(el, { y: () => geo.stacked[i], x: () => geo.dx, rotation: 0, duration: 0.16, ease: 'power3.in' }, 0.8 + (n - 1 - i) * 0.008);
  });
  tl.fromTo('.hero-outro', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.9).to({}, { duration: 0.08 });

  // Gentle pointer parallax on devices with a mouse.
  if (window.matchMedia('(hover: hover)').matches) {
    const rx = gsap.quickTo(burger, 'rotationY', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(burger, 'rotationX', { duration: 0.8, ease: 'power3' });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      rx(((e.clientX - r.left) / r.width - 0.5) * 16);
      ry(-((e.clientY - r.top) / r.height - 0.5) * 10);
    });
  }
}
