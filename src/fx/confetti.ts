import { gsap } from '../lib/motion';

const COLORS = ['var(--ketchup)', 'var(--mustard)', 'var(--pickle)', 'var(--pink)', 'var(--paper)'];

/** Physics-ish confetti: pieces burst upward, then fall with gravity and spin. */
export function confetti(host: HTMLElement, x: number, y: number, count = 36): void {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.cssText = `left:${x}px;top:${y}px;background:${COLORS[i % COLORS.length]};${i % 3 === 0 ? 'border-radius:50%;' : ''}`;
    host.append(p);
    const vx = gsap.utils.random(-260, 260);
    const up = gsap.utils.random(120, 300);
    gsap
      .timeline({ onComplete: () => p.remove() })
      .to(p, { x: vx * 0.5, y: -up, duration: 0.45, ease: 'power2.out' }, 0)
      .to(p, { x: vx, y: 420, duration: 1.1, ease: 'power2.in' }, 0.45)
      .to(p, { rotation: gsap.utils.random(-900, 900), duration: 1.55, ease: 'none' }, 0)
      .to(p, { autoAlpha: 0, duration: 0.3 }, 1.25);
  }
}

/** Grease droplets that squirt out sideways and drop. */
export function splatter(host: HTMLElement, x: number, y: number, count = 18): void {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'grease';
    p.style.cssText = `left:${x}px;top:${y}px`;
    host.append(p);
    const dir = i % 2 ? 1 : -1;
    gsap
      .timeline({ onComplete: () => p.remove() })
      .fromTo(p, { scale: gsap.utils.random(0.5, 1.4) }, { x: dir * gsap.utils.random(60, 280), duration: 0.9, ease: 'power1.out' }, 0)
      .to(p, { y: -gsap.utils.random(40, 200), duration: 0.35, ease: 'power2.out' }, 0)
      .to(p, { y: 120, duration: 0.55, ease: 'power2.in' }, 0.35)
      .to(p, { autoAlpha: 0, duration: 0.2 }, 0.7);
  }
}
