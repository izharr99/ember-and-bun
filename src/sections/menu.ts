import { content, type MenuItem } from '../types';
import { itemArt } from '../art/items';
import { esc, html, money, qs, reducedMotion } from '../lib/util';
import { gsap, lockScroll, ScrollTrigger } from '../lib/motion';
import { addToCart, flyToCart } from '../cart';

const artFor = (item: MenuItem): string =>
  item.image
    ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" width="600" height="600">`
    : itemArt(item.art, esc(item.name));

/**
 * Menu as a horizontal rail. The section pins and vertical scroll drives the track
 * sideways. Opening an item morphs its artwork into the detail view (shared element).
 */
export function menuSection(): HTMLElement {
  const m = content.menu;
  return html(`
    <section class="menu" id="menu" aria-labelledby="menu-title">
      <div class="menu-pin">
        <div class="menu-head">
          <p class="kicker">${esc(m.kicker)}</p>
          <h2 class="display" id="menu-title">${esc(m.title)}</h2>
        </div>
        <div class="menu-viewport">
          <ul class="menu-track">
            ${m.items
              .map(
                (item, i) => `
              <li class="menu-card" style="--n:${i}">
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
    // Cards tilt with scroll velocity for a physical, hanging-on-a-rail feel.
    const tilt = gsap.quickTo('.menu-card', 'rotation', { duration: 0.6, ease: 'power3' });
    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (st) => tilt(gsap.utils.clamp(-3, 3, st.getVelocity() / -600)),
      onLeave: () => tilt(0),
    });
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
    tl.fromTo(bg, { clipPath: `circle(0% at ${origin})` }, { clipPath: `circle(150% at ${origin})`, duration: 0.8, ease: 'expo.inOut' }, 0)
      .from(artBox, { ...flipFrom(source), duration: 0.9, ease: 'expo.inOut' }, 0)
      .from(copy.children, { autoAlpha: 0, y: 40, stagger: 0.06, duration: 0.6, ease: 'power3.out' }, 0.45);

    // Burgers gently separate in the detail view so you can read the layers.
    const groups = gsap.utils.toArray<SVGGElement>('.art-layer > g', artBox);
    float = gsap.timeline({ delay: 0.8, repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut', duration: 2.2 } });
    if (groups.length) {
      const mid = (groups.length - 1) / 2;
      groups.forEach((g, i) => float!.to(g, { y: (i - mid) * 9 }, 0));
    } else {
      float.to(artBox.querySelector('.art-side'), { y: -12, rotation: 3, svgOrigin: '200 200' }, 0);
    }
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
      .to(artBox.querySelectorAll('.art-layer > g'), { y: 0, duration: 0.4 }, 0)
      .to(artBox, { ...flipFrom(source), duration: 0.7, ease: 'expo.inOut' }, 0.1)
      .to(bg, { clipPath: `circle(0% at ${origin})`, duration: 0.6, ease: 'expo.inOut' }, 0.2);
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
