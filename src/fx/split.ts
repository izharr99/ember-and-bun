import { gsap } from '../lib/motion';
import { esc, reducedMotion } from '../lib/util';

/**
 * Split an element's text into per-letter spans (grouped per word so lines wrap
 * naturally). The original text stays available to screen readers via aria-label.
 */
export function splitChars(el: HTMLElement): HTMLElement[] {
  const text = el.textContent?.trim() ?? '';
  el.innerHTML = `<span class="sr-only">${esc(text)}</span>` + text
    .split(/(\s+)/)
    .map((word) =>
      /^\s+$/.test(word)
        ? ' '
        : `<span class="word" aria-hidden="true">${[...word].map((c) => `<span class="char">${esc(c)}</span>`).join('')}</span>`,
    )
    .join('');
  return [...el.querySelectorAll<HTMLElement>('.char')];
}

/** Letters drop in from above and bounce when the element scrolls into view. */
export function bounceIn(el: HTMLElement, opts: { trigger?: Element; delay?: number; immediate?: boolean } = {}): gsap.core.Tween | null {
  const chars = splitChars(el);
  if (reducedMotion()) return null;
  const vars: gsap.TweenVars = {
    yPercent: -140,
    rotation: () => gsap.utils.random(-35, 35),
    autoAlpha: 0,
    duration: 1,
    ease: 'bounce.out',
    stagger: { each: 0.035, from: 'random' },
    delay: opts.delay ?? 0,
  };
  if (!opts.immediate) {
    vars.scrollTrigger = { trigger: opts.trigger ?? el, start: 'top 85%', toggleActions: 'play none none none' };
  }
  return gsap.from(chars, vars);
}

/** Hover wobble: the letter under the pointer jiggles like jelly. */
export function initWobble(): void {
  if (reducedMotion() || !window.matchMedia('(hover: hover)').matches) return;
  document.addEventListener('pointerover', (e) => {
    const c = (e.target as HTMLElement).closest?.('.char');
    if (!c || gsap.isTweening(c)) return;
    gsap.fromTo(
      c,
      { scaleX: 1, scaleY: 1, rotation: 0 },
      { keyframes: { scaleX: [1.35, 0.8, 1.12, 0.95, 1], scaleY: [0.7, 1.25, 0.88, 1.05, 1], rotation: [0, -8, 6, -3, 0] }, duration: 0.7, ease: 'none' },
    );
  });
}
