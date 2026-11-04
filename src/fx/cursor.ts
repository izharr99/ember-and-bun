import { gsap } from '../lib/motion';
import { reducedMotion } from '../lib/util';

const FRIES = `<svg viewBox="0 0 40 40" aria-hidden="true"><g stroke="#1d1410" stroke-width="2.5" stroke-linejoin="round"><rect x="11" y="4" width="5" height="20" rx="1.5" fill="#ffd23f" transform="rotate(-10 13 24)"/><rect x="18" y="2" width="5" height="22" rx="1.5" fill="#ffd23f"/><rect x="25" y="4" width="5" height="20" rx="1.5" fill="#ffd23f" transform="rotate(10 27 24)"/><path d="M8 16h24l-3 20H11Z" fill="#e8322b"/></g></svg>`;
const SPLAT = 'M50 8c7 0 8 14 14 15s14-8 18-3-6 14-2 19 16 4 16 11-14 6-15 12 8 15 2 19-13-6-19-4-6 16-14 16-7-14-13-15-14 9-19 4 4-14 0-18-17-1-17-9 15-7 15-13-10-14-5-18 14 4 19 1 4-19 13-19Z';

/** A sticker cursor that follows with lag, becomes fries over clickable things, and splats sauce on click. */
export function initCursor(): void {
  if (reducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const dot = document.createElement('div');
  dot.className = 'cursor';
  dot.setAttribute('aria-hidden', 'true');
  dot.innerHTML = `<span class="cursor-blob"></span><span class="cursor-fries">${FRIES}</span>`;
  document.body.append(dot);
  document.documentElement.classList.add('has-cursor');

  const xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
  let hot = false;

  let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (!shown) {
      shown = true;
      gsap.set(dot, { x: e.clientX, y: e.clientY, autoAlpha: 1 });
    }
    xTo(e.clientX);
    yTo(e.clientY);
    const over = !!(e.target as HTMLElement).closest?.('a, button, .chip, label, [role="button"]');
    if (over !== hot) {
      hot = over;
      dot.classList.toggle('is-hot', hot);
      gsap.fromTo(dot.firstElementChild, { scale: hot ? 0.6 : 1.4 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
    }
  });
  document.addEventListener('pointerleave', () => gsap.to(dot, { autoAlpha: 0, duration: 0.2 }));
  document.addEventListener('pointerenter', () => gsap.to(dot, { autoAlpha: 1, duration: 0.2 }));

  window.addEventListener('pointerdown', (e) => {
    gsap.fromTo(dot, { scaleX: 1.3, scaleY: 0.7 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 100 100');
    s.setAttribute('class', 'splat');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = `<path d="${SPLAT}" fill="${Math.random() > 0.5 ? '#e8322b' : '#ffc21a'}" stroke="#1d1410" stroke-width="4"/>`;
    s.style.left = `${e.clientX}px`;
    s.style.top = `${e.clientY}px`;
    document.body.append(s);
    gsap
      .timeline({ onComplete: () => s.remove() })
      .fromTo(s, { scale: 0, rotation: gsap.utils.random(0, 360), xPercent: -50, yPercent: -50 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' })
      .to(s, { scale: 0.6, autoAlpha: 0, duration: 0.4 }, 0.6);
  });
}
