import { content, type MenuItem } from '../types';
import { esc, html, money, qs, reducedMotion } from '../lib/util';
import { gsap, lockScroll, ScrollTrigger } from '../lib/motion';
import { addToCart, flyToCart } from '../cart';

/** Menu photo, framed like a pasted-in zine clipping (tape and halftone come from CSS). */
const artFor = (item: MenuItem): string =>
  `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" width="900" height="900" draggable="false">`;

/**
 * Menu as a horizontal rail. The section pins and vertical scroll drives the track
 * sideways. Opening an item morphs its artwork into the detail view (shared element).
 */
export function menuSection(): HTMLElement {
  const m = content.menu;
  return html(`
    <section class="menu" id="menu" aria-labelledby="menu-title">
      <svg class="drip-wipe" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0h1200v40c-30 0-30 70-60 70s-24-58-54-58-20 96-56 96-26-80-60-80-30 40-62 40-24-60-56-60-30 110-66 110-30-92-64-92-26 46-58 46-28-70-62-70-24 52-56 52-34-84-66-84-28 120-64 120-30-104-62-104-28 52-58 52-30-74-62-74-26 38-56 38-32-58-64-58-30 86-62 86-26-78-60-78V0Z" fill="var(--builder-bg)" stroke="var(--ink)" stroke-width="5" vector-effect="non-scaling-stroke"/>
      </svg>
      <div class="menu-pin">
        <div class="menu-head">
          <p class="kicker">${esc(m.kicker)}</p>
          <h2 class="display split" id="menu-title">${esc(m.title)}</h2>
        </div>
        <div class="menu-viewport">
          <ul class="menu-track">
            ${m.items
              .map(
                (item, i) => `
              <li class="menu-card" style="--tilt:${i % 2 ? 2.5 : -2}deg">
                <button class="menu-open" type="button" data-id="${esc(item.id)}" aria-haspopup="dialog">
                  <span class="menu-cat">${esc(item.category)}</span>
                  ${item.badge ? `<span class="badge">${esc(item.badge)}</span>` : ''}
                  <span class="menu-art">${artFor(item)}</span>
                  <span class="menu-name">${esc(item.name)}</span>
                  <span class="menu-price">${money(item.price)}</span>
                </button>
              </li>`,
              )
              .join('')}
          </ul>
        </div>
        <div class="menu-progress" aria-hidden="true"><span></span></div>
      </div>
      <div class="detail" role="dialog" aria-modal="true" aria-labelledby="detail-name" hidden>
        <div class="detail-bg"></div>
        <div class="detail-inner" data-lenis-prevent>
          <button class="icon-btn detail-close" type="button" aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <div class="detail-art"></div>
          <div class="detail-copy">
            <p class="kicker detail-cat"></p>
            <h3 class="detail-name" id="detail-name"></h3>
            <p class="detail-desc"></p>
            <p class="detail-meta"></p>
            <div class="detail-buy">
              <div class="stepper" role="group" aria-label="Quantity">
                <button type="button" data-q="-1" aria-label="Fewer">-</button>
                <span class="detail-qty">1</span>
                <button type="button" data-q="1" aria-label="More">+</button>
              </div>
              <button class="btn btn-primary detail-add" type="button"></button>
            </div>
          </div>
        </div>
      </div>
    </section>`);
}

export function initMenu(root: HTMLElement): void {
  const items = content.menu.items;
  const motion = !reducedMotion();
  const track = qs('.menu-track', root);
  const pin = qs('.menu-pin', root);
  const viewport = qs('.menu-viewport', root);

  if (motion) {
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (st) => gsap.set('.menu-progress span', { scaleX: st.progress }),
      },
    });
    // The whole rail skews with scroll velocity, like stickers flapping on a moving truck.
    const skew = gsap.quickTo('.menu-card', 'skewX', { duration: 0.5, ease: 'power3' });
    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (st) => skew(gsap.utils.clamp(-10, 10, st.getVelocity() / -250)),
      onLeave: () => skew(0),
      onLeaveBack: () => skew(0),
    });
    // Sauce drips run down from the section above as the menu arrives.
    gsap.fromTo(
      '.drip-wipe',
      { scaleY: 0.25 },
      { scaleY: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: 0.5 } },
    );
    // 3D tilt + jiggle on hover (mouse only).
    if (window.matchMedia('(hover: hover)').matches) {
      gsap.utils.toArray<HTMLElement>('.menu-open', root).forEach((card) => {
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
        const art = qs('.menu-art', card);
        gsap.set(card, { transformPerspective: 700 });
        card.addEventListener('pointerenter', () => {
          gsap.fromTo(art, { scale: 1 }, { keyframes: { scale: [1.18, 0.94, 1.08, 1], rotation: [0, -6, 4, 0] }, duration: 0.7, ease: 'none' });
        });
        card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 22);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 22);
        });
        card.addEventListener('pointerleave', () => {
          rx(0);
          ry(0);
        });
      });
    }
  } else {
    root.classList.add('is-static');
  }

  // Detail view
  const dialog = qs('.detail', root);
  const bg = qs('.detail-bg', dialog);
  const artBox = qs('.detail-art', dialog);
  const copy = qs('.detail-copy', dialog);
  const qtyEl = qs('.detail-qty', dialog);
  const addBtn = qs<HTMLButtonElement>('.detail-add', dialog);
  let current: { item: MenuItem; source: HTMLElement; opener: HTMLElement } | null = null;
  let qty = 1;
  let float: gsap.core.Timeline | null = null;
  let origin = '50% 50%';

  const setQty = (q: number) => {
    qty = Math.max(1, Math.min(20, q));
    qtyEl.textContent = String(qty);
    if (current) addBtn.textContent = `${content.menu.addLabel}  ${money(current.item.price * qty)}`;
  };

  /** Transform that maps the detail artwork's box onto the card artwork's box. */
  const flipFrom = (source: HTMLElement) => {
    const a = source.getBoundingClientRect();
    const b = artBox.getBoundingClientRect();
    return {
      x: a.left + a.width / 2 - (b.left + b.width / 2),
      y: a.top + a.height / 2 - (b.top + b.height / 2),
      scale: a.width / b.width,
    };
  };

  const open = (opener: HTMLElement) => {
    const item = items.find((i) => i.id === opener.dataset.id);
    if (!item) return;
    const source = qs('.menu-art', opener);
    current = { item, source, opener };
    qs('.detail-cat', dialog).textContent = item.category;
    qs('.detail-name', dialog).textContent = item.name;
    qs('.detail-desc', dialog).textContent = item.description;
    qs('.detail-meta', dialog).textContent = `${money(item.price)}  /  ${item.calories} kcal`;
    artBox.innerHTML = source.innerHTML;
    setQty(1);
    dialog.hidden = false;
    lockScroll(true);
    qs<HTMLButtonElement>('.detail-close', dialog).focus({ preventScroll: true });

    if (!motion) return;
    const r = source.getBoundingClientRect();
    origin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
    gsap.set(source, { autoAlpha: 0 });
    const tl = gsap.timeline();
    tl.fromTo(bg, { clipPath: `circle(0% at ${origin})` }, { clipPath: `circle(150% at ${origin})`, duration: 0.7, ease: 'power3.inOut' }, 0)
      .from(artBox, { ...flipFrom(source), rotation: -12, duration: 0.9, ease: 'back.out(1.5)' }, 0)
      .from(copy.children, { autoAlpha: 0, y: 60, rotation: () => gsap.utils.random(-10, 10), stagger: 0.06, duration: 0.7, ease: 'back.out(2.5)' }, 0.35);

    // The photo keeps bobbing like a sticker on a dashboard.
    float = gsap.timeline({ delay: 0.9, repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut', duration: 1.8 } });
    float.to(artBox.firstElementChild, { y: -14, rotation: 3 }, 0);
  };

  const close = () => {
    if (!current) return;
    const { source, opener } = current;
    float?.kill();
    float = null;
    const done = () => {
      dialog.hidden = true;
      gsap.set([artBox, bg, ...copy.children], { clearProps: 'all' });
      gsap.set(source, { autoAlpha: 1 });
      lockScroll(false);
      opener.focus({ preventScroll: true });
      current = null;
    };
    if (!motion) return done();
    gsap
      .timeline({ onComplete: done })
      .to(copy.children, { autoAlpha: 0, y: 20, duration: 0.25, stagger: 0.03 }, 0)
      .to(artBox.firstElementChild, { y: 0, rotation: 0, duration: 0.3 }, 0)
      .to(artBox, { ...flipFrom(source), duration: 0.6, ease: 'back.in(1.2)' }, 0.1)
      .to(bg, { clipPath: `circle(0% at ${origin})`, duration: 0.55, ease: 'power3.inOut' }, 0.2);
  };

  track.addEventListener('click', (e) => {
    const opener = (e.target as HTMLElement).closest<HTMLElement>('.menu-open');
    if (opener) open(opener);
  });
  dialog.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('.detail-close')) close();
    const q = t.closest<HTMLElement>('[data-q]');
    if (q) setQty(qty + Number(q.dataset.q));
  });
  addBtn.addEventListener('click', () => {
    if (!current) return;
    const { item } = current;
    if (motion) flyToCart(artBox);
    addToCart({ id: item.id, name: item.name, price: item.price }, qty);
    close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) close();
  });
}
