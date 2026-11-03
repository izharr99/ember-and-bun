import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from './util';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Smooth scroll driven by GSAP's ticker so ScrollTrigger and Lenis stay in sync. */
export function initSmoothScroll(): Lenis | null {
  if (reducedMotion()) return null;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: { offset: 0 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const getLenis = (): Lenis | null => lenis;

/** Pause page scrolling (for overlays). Falls back to overflow hidden without Lenis. */
export function lockScroll(locked: boolean): void {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.classList.toggle('is-locked', locked);
}

export function scrollToTarget(target: string | HTMLElement): void {
  if (lenis) lenis.scrollTo(target, { duration: 1.4 });
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
  }
}

export { gsap, ScrollTrigger };
