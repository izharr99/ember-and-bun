import { content } from '../types';
import { layerImg, preloadLayers, stackTops, W } from '../art/layers';
import { esc, html, reducedMotion } from '../lib/util';
import { gsap, lockScroll } from '../lib/motion';

const SEEN = 'scrollcraft-burger:intro';

/**
 * Intro loader: ingredients rain down and stack into a burger, then the bun flips
 * open and the two halves of the page tear apart to reveal the site.
 * Resolves when the page is revealed. Skipped for reduced motion and repeat visits
 * in the same tab session.
 */
export function playIntro(): Promise<void> {
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN) === '1';
    sessionStorage.setItem(SEEN, '1');
  } catch {
    /* storage unavailable: just play it */
  }
  if (reducedMotion() || seen) return Promise.resolve();

  const layers = content.hero.layers.map((l) => l.type);
  const el = html(`
    <div class="loader" role="status" aria-label="${esc(content.loader.label)}">
      <div class="loader-half loader-top"></div>
      <div class="loader-half loader-bot"></div>
      <div class="loader-stage">
        ${layers.map((t, i) => `<div class="ld-layer" style="z-index:${layers.length - i}">${layerImg(t, '', true)}</div>`).join('')}
      </div>
      <p class="loader-label">${esc(content.loader.label)}<span>.</span><span>.</span><span>.</span></p>
      <button class="loader-skip" type="button">${esc(content.loader.skip)}</button>
    </div>`);
  document.body.append(el);
  lockScroll(true);

  const stage = el.querySelector<HTMLElement>('.loader-stage')!;
  const els = [...el.querySelectorAll<HTMLElement>('.ld-layer')];
  const s = stage.clientWidth / W;

  const st = stackTops(layers);
  const tops = st.tops.map((t) => (t - st.min) * s);
  const offset = (-(st.max - st.min) * s) / 2;

  return new Promise((resolve) => {
    const finish = () => {
      lockScroll(false);
      el.remove();
      resolve();
    };

    const tl = gsap.timeline({ onComplete: finish, paused: true });
    // Start raining once the photos are in (or after a short timeout on slow networks).
    Promise.race([preloadLayers(layers), new Promise((r) => setTimeout(r, 2500))]).then(() => tl.play());
    tl.from('.loader-label', { y: 30, autoAlpha: 0, duration: 0.4, ease: 'back.out(3)' }, 0);
    tl.to('.loader-label span', { y: -8, duration: 0.3, stagger: { each: 0.1, repeat: 7, yoyo: true }, ease: 'power1.inOut' }, 0);

    // Rain: bottom bun first, each layer arcs in, lands, and squashes the stack.
    [...els].reverse().forEach((layer, k) => {
      const i = els.length - 1 - k;
      const at = 0.15 + k * 0.2;
      gsap.set(layer, { y: tops[i] + offset });
      tl.fromTo(
        layer,
        { y: -window.innerHeight * 0.7, x: gsap.utils.random(-120, 120), rotation: gsap.utils.random(-140, 140) },
        { y: tops[i] + offset, x: 0, rotation: 0, duration: 0.5, ease: 'power2.in' },
        at,
      ).fromTo(
        stage,
        { scaleY: 0.86, scaleX: 1.08 },
        { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)', immediateRender: false },
        at + 0.5,
      );
    });

    const open = 0.15 + els.length * 0.2 + 0.35;
    tl.to('.loader-label, .loader-skip', { autoAlpha: 0, duration: 0.2 }, open - 0.2)
      .to(els[0], { y: '-=260', rotation: -28, duration: 0.55, ease: 'back.in(2)' }, open)
      .to(els.slice(1), { y: `+=${window.innerHeight}`, rotation: () => gsap.utils.random(-30, 30), duration: 0.7, ease: 'back.in(1.6)', stagger: 0.03 }, open + 0.1)
      .to(els[0], { y: -window.innerHeight, duration: 0.5, ease: 'power2.in' }, open + 0.45)
      .to('.loader-top', { yPercent: -105, duration: 0.8, ease: 'power3.inOut' }, open + 0.3)
      .to('.loader-bot', { yPercent: 105, duration: 0.8, ease: 'power3.inOut' }, open + 0.3);

    el.querySelector('.loader-skip')!.addEventListener('click', () => tl.progress(1));
  });
}
