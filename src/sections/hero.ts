import { content } from '../types';
import { LAYERS, layerImg, stackTops, W } from '../art/layers';
import { esc, html, money, reducedMotion } from '../lib/util';
import { gsap, ScrollTrigger } from '../lib/motion';
import { splitChars } from '../fx/split';

/**
 * Signature moment: the "exploding burger". Real photographed layers pop apart as the
 * section scrubs (with squash and stretch, wobble and sesame seeds flying), get labelled
 * like a zine diagram, then slam back together with the cheese re-melting.
 */
export function heroSection(): HTMLElement {
  const { hero, anatomy } = content;
  const layers = hero.layers;
  const total = layers.reduce((n, l) => n + l.price, 0);
  const kcal = layers.reduce((n, l) => n + l.calories, 0);

  return html(`
    <section class="hero" id="anatomy" aria-labelledby="hero-title">
      <div class="hero-stage">
        <div class="halftone hero-dots" aria-hidden="true"></div>
        <p class="kicker hero-kicker">${esc(hero.kicker)}</p>
        <h1 class="hero-title" id="hero-title">
          ${hero.headline.map((line) => `<span class="hero-line">${esc(line)}</span>`).join('')}
        </h1>
        <p class="sr-only">${esc(content.brand.tagline)}</p>
        <div class="burst hero-sticker" aria-hidden="true"><span>${esc(hero.sticker)}</span></div>
        <div class="hero-burger" role="img" aria-label="${esc(layers.map((l) => l.name).join(', '))}">
          ${layers.map((l, i) => `<div class="hl" data-i="${i}"><div class="hl-inner">${layerImg(l.type, '', true)}</div></div>`).join('')}
          <div class="seeds" aria-hidden="true">${Array.from({ length: 14 }, () => '<i></i>').join('')}</div>
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
              <span class="hlabel-card">
                <span class="hlabel-no">${String(i + 1).padStart(2, '0')}</span>
                <span class="hlabel-name">${esc(l.name)}</span>
                <span class="hlabel-note">${esc(l.note)}</span>
                <span class="hlabel-meta">${money(l.price)} / ${l.calories} kcal</span>
              </span>
            </li>`,
            )
            .join('')}
        </ol>
        <p class="hero-hint" aria-hidden="true"><span class="hero-hint-arrow">↓</span>${esc(hero.scrollHint)}</p>
        <div class="hero-outro">
          <p class="hero-outro-title">${esc(hero.outro)}</p>
          <p class="hero-outro-meta">${money(total)} / ${kcal} kcal</p>
        </div>
      </div>
    </section>`);
}

interface Geo {
  /** Horizontal offset of the stacked burger from its exploded position (centres it on mobile). */
  dx: number;
  stacked: number[];
  exploded: number[];
}

export function initHero(root: HTMLElement, ready: Promise<void>): void {
  const stage = root.querySelector<HTMLElement>('.hero-stage')!;
  const burger = root.querySelector<HTMLElement>('.hero-burger')!;
  const els = gsap.utils.toArray<HTMLElement>('.hl', root);
  const inners = gsap.utils.toArray<HTMLElement>('.hl-inner', root);
  const labels = gsap.utils.toArray<HTMLElement>('.hlabel', root);
  const seeds = gsap.utils.toArray<HTMLElement>('.seeds i', root);
  const types = content.hero.layers.map((l) => l.type);
  const n = types.length;
  const geo: Geo = { dx: 0, stacked: [], exploded: [] };
  const lines = gsap.utils.toArray<HTMLElement>('.hero-line', root);

  const layout = () => {
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const narrow = sw < 760;
    const bw = narrow ? Math.min(sw * 0.56, 280) : Math.min(sw * 0.3, sh * 0.52, 460);
    const s = bw / W;
    const bx = narrow ? sw * 0.03 : (sw - bw) / 2;
    const spread = sh * (narrow ? 0.64 : 0.68);
    const { tops, min, max } = stackTops(types);
    const stackH = (max - min) * s;

    geo.dx = (sw - bw) / 2 - bx;
    geo.stacked = tops.map((top) => (top - min) * s - stackH / 2 + sh * (narrow ? 0.18 : 0.08));
    // Exploded: each whole layer image is centred on an even vertical grid.
    const centers = types.map((_, i) => -spread / 2 + (spread * i) / (n - 1) + sh * 0.04);
    geo.exploded = types.map((t, i) => centers[i] - (LAYERS[t].h * s) / 2);

    burger.style.cssText = `left:${bx}px;width:${bw}px`;
    labels.forEach((label, i) => {
      const right = narrow || i % 2 === 0;
      label.classList.toggle('is-left', !right);
      const top = sh / 2 + centers[i];
      if (right) {
        const left = bx + bw + (narrow ? 8 : 44);
        label.style.cssText = `top:${top}px;left:${left}px;right:auto;max-width:${Math.min(sw - left - 10, 300)}px`;
      } else {
        label.style.cssText = `top:${top}px;right:${sw - bx + 44}px;left:auto;max-width:${Math.min(bx - 56, 300)}px`;
      }
    });
  };

  layout();
  lines.forEach((line) => splitChars(line));
  const chars = gsap.utils.toArray<HTMLElement>('.hero-line .char', root);

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
  gsap.set(inners, { transformOrigin: '50% 100%' });
  gsap.set(seeds, { autoAlpha: 0 });

  // Intro (after the loader): letters bounce in, layers drop and squash on landing.
  gsap.set(chars, { autoAlpha: 0 });
  gsap.set(inners, { y: () => -window.innerHeight });
  ready.then(() => {
    const intro = gsap.timeline();
    intro
      .fromTo(
        chars,
        { yPercent: -160, rotation: () => gsap.utils.random(-40, 40), autoAlpha: 0 },
        { yPercent: 0, rotation: 0, autoAlpha: 1, duration: 1, ease: 'bounce.out', stagger: { each: 0.04, from: 'random' } },
        0,
      )
      .from('.hero-sticker', { scale: 0, rotation: -180, duration: 0.9, ease: 'back.out(2.5)' }, 0.5)
      .from('.hero-kicker, .hero-hint', { autoAlpha: 0, y: 20, duration: 0.6, ease: 'back.out(3)', stagger: 0.1 }, 0.4);
    [...inners].reverse().forEach((inner, k) => {
      const at = 0.15 + k * 0.12;
      intro
        .to(inner, { y: 0, duration: 0.45, ease: 'power2.in' }, at)
        .fromTo(inner, { scaleY: 0.7, scaleX: 1.18 }, { scaleY: 1, scaleX: 1, duration: 0.8, ease: 'elastic.out(1.1, 0.3)', immediateRender: false }, at + 0.45);
    });
  });

  const mid = (n - 1) / 2;
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: '+=260%',
      pin: stage,
      scrub: 0.7,
      invalidateOnRefresh: true,
    },
  });

  tl.to('.hero-title', { scale: 0.8, yPercent: -18, autoAlpha: 0.15, duration: 0.3 }, 0)
    .to('.hero-hint, .hero-kicker', { autoAlpha: 0, duration: 0.1 }, 0)
    .to('.hero-sticker', { x: 200, rotation: 200, autoAlpha: 0, duration: 0.25 }, 0)
    .fromTo('.hero-anatomy', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'back.out(3)' }, 0.15);

  // Explode: layers fly apart with stretch on the way and a wobble when they stop.
  els.forEach((el, i) => {
    const at = 0.1 + Math.abs(i - mid) * 0.03;
    const tilt = (i % 2 ? 1 : -1) * 4;
    tl.to(el, { y: () => geo.exploded[i], x: 0, duration: 0.45, ease: 'back.out(1.6)' }, at)
      .to(el, { keyframes: { rotation: [0, tilt * 1.6, -tilt * 0.6, tilt], ease: 'none' }, duration: 0.45 }, at)
      .to(inners[i], { keyframes: { scaleY: [1, 1.25, 0.85, 1.06, 1], scaleX: [1, 0.88, 1.1, 0.97, 1], ease: 'none' }, duration: 0.45 }, at);
  });

  // Sesame seeds pop off the crown as it lifts, then rain back down.
  seeds.forEach((seed, i) => {
    const dir = i % 2 ? 1 : -1;
    tl.fromTo(
      seed,
      { autoAlpha: 0, x: 0, y: 0, rotation: 0 },
      {
        keyframes: {
          autoAlpha: [0, 1, 1, 0],
          x: [0, dir * gsap.utils.random(20, 140), dir * gsap.utils.random(140, 260)],
          y: [0, -gsap.utils.random(60, 200), gsap.utils.random(120, 400)],
          rotation: [0, 180, 540],
          ease: 'none',
        },
        duration: 0.4,
      },
      0.12 + i * 0.012,
    );
  });

  labels.forEach((label, i) => {
    const fromX = label.classList.contains('is-left') ? -60 : 60;
    tl.fromTo(
      label,
      { autoAlpha: 0, x: fromX, scale: 0.4, rotation: fromX / 4 },
      { autoAlpha: 1, x: 0, scale: 1, rotation: i % 2 ? 3 : -3, duration: 0.18, ease: 'back.out(3)' },
      0.38 + i * 0.04,
    );
  });

  // Outro: labels peel away, the burger slams back together, the cheese re-melts.
  tl.to(labels, { autoAlpha: 0, scale: 0.6, duration: 0.08, stagger: 0.01 }, 0.76).to('.hero-anatomy', { autoAlpha: 0, duration: 0.08 }, 0.76);
  els.forEach((el, i) => {
    const at = 0.8 + (n - 1 - i) * 0.01;
    tl.to(el, { y: () => geo.stacked[i], x: () => geo.dx, rotation: 0, duration: 0.14, ease: 'power3.in' }, at).to(
      inners[i],
      { keyframes: { scaleY: [1, 0.75, 1.1, 1], scaleX: [1, 1.15, 0.95, 1], ease: 'none' }, duration: 0.14 },
      at + 0.12,
    );
  });
  const cheeseIdx = types.indexOf('cheese');
  if (cheeseIdx >= 0) {
    tl.to(inners[cheeseIdx], { keyframes: { scaleY: [1, 1.3, 0.9, 1.04, 1], skewX: [0, -6, 4, 0, 0], ease: 'none' }, duration: 0.18 }, 0.9);
  }
  tl.fromTo('.hero-outro', { autoAlpha: 0, scale: 0.3, rotation: -8 }, { autoAlpha: 1, scale: 1, rotation: -2, duration: 0.12, ease: 'back.out(2.5)' }, 0.9).to(
    {},
    { duration: 0.06 },
  );

  // Idle sticker spin and a gentle pointer parallax on mouse devices.
  gsap.to('.hero-sticker', { rotation: '+=360', duration: 14, repeat: -1, ease: 'none' });
  if (window.matchMedia('(hover: hover)').matches) {
    const rx = gsap.quickTo(burger, 'rotationY', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(burger, 'rotationX', { duration: 0.8, ease: 'power3' });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      rx(((e.clientX - r.left) / r.width - 0.5) * 18);
      ry(-((e.clientY - r.top) / r.height - 0.5) * 12);
    });
  }
}
