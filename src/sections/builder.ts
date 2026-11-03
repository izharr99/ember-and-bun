import { content, type Ingredient, type LayerType } from '../types';
import { LAYERS, layerSvg, W } from '../art/layers';
import { esc, html, money, qs, reducedMotion } from '../lib/util';
import { gsap } from '../lib/motion';
import { addToCart, flyToCart } from '../cart';

/**
 * "Build your own": tap or drag ingredients onto the bun. Each layer drops in with a
 * bounce, the stack squashes on impact and the price updates live.
 */
export function builderSection(): HTMLElement {
  const b = content.builder;
  return html(`
    <section class="builder" id="build" aria-labelledby="build-title">
      <div class="section-head">
        <p class="kicker">${esc(b.kicker)}</p>
        <h2 class="display" id="build-title">${esc(b.title)}</h2>
        <p class="lede">${esc(b.hint)}</p>
      </div>
      <div class="builder-grid">
        <div class="builder-stage" aria-label="Your burger">
          <div class="plate" aria-hidden="true"></div>
          <div class="build-fit"><div class="build-stack"></div></div>
          <p class="build-drop" aria-hidden="true">Drop here</p>
          <ul class="sr-only" aria-live="polite" data-announce></ul>
        </div>
        <div class="builder-panel">
          <ul class="chips">
            ${b.ingredients
              .map(
                (ing, i) => `
              <li>
                <button class="chip" type="button" data-i="${i}">
                  <span class="chip-art">${layerSvg(ing.type)}</span>
                  <span class="chip-name">${esc(ing.name)}</span>
                  <span class="chip-price">+${money(ing.price)}</span>
                </button>
              </li>`,
              )
              .join('')}
          </ul>
          <div class="build-bar">
            <div class="build-total">
              <span class="build-count"></span>
              <strong class="build-price" aria-live="polite"></strong>
              <span class="build-kcal"></span>
            </div>
            <div class="build-actions">
              <button class="btn btn-ghost" type="button" data-act="undo">${esc(b.undoLabel)}</button>
              <button class="btn btn-ghost" type="button" data-act="reset">${esc(b.resetLabel)}</button>
              <button class="btn btn-primary" type="button" data-act="finish">${esc(b.finishLabel)}</button>
              <button class="btn btn-primary" type="button" data-act="add" hidden>${esc(b.addLabel)}</button>
            </div>
          </div>
        </div>
      </div>
    </section>`);
}

interface Placed {
  type: LayerType;
  ing?: Ingredient;
  el: HTMLElement;
}

export function initBuilder(root: HTMLElement): void {
  const b = content.builder;
  const stage = qs('.builder-stage', root);
  const fit = qs('.build-fit', root);
  const stack = qs('.build-stack', root);
  const announce = qs('[data-announce]', root);
  const chips = gsap.utils.toArray<HTMLButtonElement>('.chip', root);
  const btn = (act: string) => qs<HTMLButtonElement>(`[data-act="${act}"]`, root);
  const motion = !reducedMotion();

  const placed: Placed[] = [];
  let closed = false;

  const scale = () => stack.clientWidth / W;
  /** y (px, from the plate baseline upwards) of the top edge of the layer at index i. */
  const topOf = (i: number) => -placed.slice(0, i + 1).reduce((sum, p) => sum + LAYERS[p.type].t, 0) * scale();

  const refit = () => {
    const height = -topOf(placed.length - 1) + 40;
    const room = stage.clientHeight * 0.82;
    const f = Math.min(1, room / height);
    gsap.to(fit, { scale: f, duration: motion ? 0.5 : 0, ease: 'power3.out' });
  };

  const positionAll = () => {
    placed.forEach((p, i) => gsap.set(p.el, { y: topOf(i) }));
    refit();
  };

  const update = () => {
    const ings = placed.filter((p) => p.ing).map((p) => p.ing!);
    const price = b.basePrice + ings.reduce((n, i) => n + i.price, 0);
    const kcal = b.baseCalories + ings.reduce((n, i) => n + i.calories, 0);
    qs('.build-price', root).textContent = money(price);
    qs('.build-kcal', root).textContent = `${kcal} kcal`;
    qs('.build-count', root).textContent = `${ings.length} / ${b.maxLayers} layers`;
    const full = ings.length >= b.maxLayers;
    chips.forEach((c) => (c.disabled = closed || full));
    btn('undo').disabled = closed ? false : ings.length === 0;
    btn('finish').hidden = closed;
    btn('finish').disabled = ings.length === 0;
    btn('add').hidden = !closed;
    root.classList.toggle('is-closed', closed);
  };

  const place = (type: LayerType, ing?: Ingredient, drop = true) => {
    const el = html(`<div class="bl">${layerSvg(type)}</div>`);
    el.style.zIndex = String(placed.length + 1);
    stack.append(el);
    placed.push({ type, ing, el });
    const y = topOf(placed.length - 1);
    if (motion && drop) {
      gsap.fromTo(el, { y: y - stage.clientHeight, rotation: gsap.utils.random(-8, 8) }, {
        y,
        rotation: 0,
        duration: 0.9,
        ease: 'bounce.out',
      });
      gsap.fromTo(stack, { scaleY: 1 }, { scaleY: 0.95, duration: 0.08, delay: 0.32, yoyo: true, repeat: 1, ease: 'power1.inOut' });
    } else gsap.set(el, { y });
    refit();
    if (ing) {
      const li = document.createElement('li');
      li.textContent = `${ing.name} added`;
      announce.replaceChildren(li);
    }
  };

  const removeTop = () => {
    const p = placed.pop();
    if (!p || p.type === 'bunBottom') {
      if (p) placed.push(p);
      return;
    }
    if (p.type === 'bunTop') closed = false;
    gsap.to(p.el, { y: '-=260', autoAlpha: 0, rotation: 12, duration: motion ? 0.45 : 0, ease: 'power2.in', onComplete: () => p.el.remove() });
    refit();
  };

  const add = (i: number) => {
    const ing = b.ingredients[i];
    if (!ing || closed || placed.length - 1 >= b.maxLayers) return;
    place(ing.type, ing);
    update();
  };

  place('bunBottom', undefined, false);
  update();

  let dragged = false;
  let ghost: HTMLElement | null = null;

  // Tap / keyboard
  root.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (chip && !dragged) add(Number(chip.dataset.i));
    dragged = false;
  });

  // Drag with mouse or pen (touch users tap; touch dragging would fight page scroll).
  root.addEventListener('pointerdown', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (!chip || chip.disabled || e.pointerType === 'touch') return;
    const sx = e.clientX;
    const sy = e.clientY;
    const art = qs('.chip-art', chip);
    const onMove = (ev: PointerEvent) => {
      if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
        const r = art.getBoundingClientRect();
        ghost = html(`<div class="drag-ghost" aria-hidden="true">${art.innerHTML}</div>`);
        ghost.style.width = `${r.width * 1.6}px`;
        document.body.append(ghost);
        stage.classList.add('is-target');
        dragged = true;
      }
      if (ghost) {
        gsap.set(ghost, { x: ev.clientX, y: ev.clientY, xPercent: -50, yPercent: -50, rotation: (ev.clientX - sx) * 0.02 });
        const r = stage.getBoundingClientRect();
        const over = ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom;
        stage.classList.toggle('is-over', over);
      }
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!ghost) return;
      const r = stage.getBoundingClientRect();
      const over = ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom;
      const g = ghost;
      ghost = null;
      stage.classList.remove('is-target', 'is-over');
      if (over) {
        g.remove();
        add(Number(chip.dataset.i));
      } else {
        const cr = art.getBoundingClientRect();
        gsap.to(g, { x: cr.left + cr.width / 2, y: cr.top + cr.height / 2, scale: 0.6, autoAlpha: 0, duration: 0.35, onComplete: () => g.remove() });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  btn('undo').addEventListener('click', () => {
    removeTop();
    update();
  });

  btn('reset').addEventListener('click', () => {
    while (placed.length > 1) removeTop();
    closed = false;
    update();
  });

  btn('finish').addEventListener('click', () => {
    if (placed.length < 2) return;
    closed = true;
    place('bunTop');
    update();
    btn('add').focus();
  });

  btn('add').addEventListener('click', () => {
    const ings = placed.filter((p) => p.ing).map((p) => p.ing!);
    const names = ings.map((i) => i.name);
    const price = b.basePrice + ings.reduce((n, i) => n + i.price, 0);
    const id = `custom:${ings.map((i) => i.type).join('-')}`;
    if (motion) flyToCart(fit);
    addToCart({ id, name: b.itemName, price, detail: `${b.baseName}, ${names.join(', ')}` });
    // Clear the plate for the next creation.
    while (placed.length > 1) removeTop();
    closed = false;
    update();
  });

  window.addEventListener('resize', positionAll);
}
