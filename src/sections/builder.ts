import { content, type Ingredient, type LayerType } from '../types';
import { LAYERS, layerImg, W } from '../art/layers';
import { esc, html, money, qs, reducedMotion } from '../lib/util';
import { gsap } from '../lib/motion';
import { addToCart, flyToCart } from '../cart';
import { confetti } from '../fx/confetti';

const BITE =
  '<svg class="bite" viewBox="0 0 100 100" aria-hidden="true"><path d="M100 0v100c-14 0-20-12-30-14s-20 6-28-2-4-20-12-28-20-4-26-14S6 10 8 0Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round"/></svg>';

/**
 * "Build your own": tap or drag ingredients onto the bun. Each one flies in on an arc
 * with gravity, squashes on landing and makes the whole stack jiggle. Closing the bun
 * fires confetti; adding to the order takes a bite out of it first.
 */
export function builderSection(): HTMLElement {
  const b = content.builder;
  return html(`
    <section class="builder torn" id="build" aria-labelledby="build-title">
      <div class="section-head">
        <p class="kicker">${esc(b.kicker)}</p>
        <h2 class="display split" id="build-title">${esc(b.title)}</h2>
        <p class="lede">${esc(b.hint)}</p>
      </div>
      <div class="builder-grid">
        <div class="builder-stage" aria-label="Your burger">
          <div class="halftone stage-dots" aria-hidden="true"></div>
          <div class="plate" aria-hidden="true"></div>
          <div class="build-fit"><div class="build-stack"></div></div>
          <p class="build-drop" aria-hidden="true">Drop it here!</p>
          <p class="burst build-sticker" aria-hidden="true"><span></span></p>
          <ul class="sr-only" aria-live="polite" data-announce></ul>
        </div>
        <div class="builder-panel">
          <ul class="chips">
            ${b.ingredients
              .map(
                (ing, i) => `
              <li>
                <button class="chip" type="button" data-i="${i}" style="--tilt:${(i % 3) - 1}deg">
                  <span class="chip-art">${layerImg(ing.type)}</span>
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
  const sticker = qs('.build-sticker', root);
  const announce = qs('[data-announce]', root);
  const chips = gsap.utils.toArray<HTMLButtonElement>('.chip', root);
  const btn = (act: string) => qs<HTMLButtonElement>(`[data-act="${act}"]`, root);
  const motion = !reducedMotion();

  const placed: Placed[] = [];
  let closed = false;
  let fitScale = 1;

  const scale = () => stack.clientWidth / W;
  /** y (px, relative to the plate baseline) of the image top of the layer at index i (0 = bottom bun). */
  const topOf = (i: number) =>
    (-placed.slice(0, i + 1).reduce((sum, p) => sum + LAYERS[p.type].t, 0) - LAYERS[placed[i].type].up) * scale();

  const refit = () => {
    const height = -Math.min(...placed.map((_, i) => topOf(i))) + 40;
    fitScale = Math.min(1, (stage.clientHeight * 0.8) / height);
    gsap.to(fit, { scale: fitScale, duration: motion ? 0.6 : 0, ease: 'back.out(2)' });
  };

  const positionAll = () => {
    placed.forEach((p, i) => gsap.set(p.el, { y: topOf(i) }));
    refit();
  };

  const update = () => {
    const ings = placed.filter((p) => p.ing).map((p) => p.ing!);
    const price = b.basePrice + ings.reduce((n, i) => n + i.price, 0);
    const kcal = b.baseCalories + ings.reduce((n, i) => n + i.calories, 0);
    const priceEl = qs('.build-price', root);
    if (priceEl.textContent !== money(price) && motion) {
      gsap.fromTo(priceEl, { scale: 1.3, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
    }
    priceEl.textContent = money(price);
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

  /** Everything already on the plate wobbles like jelly when something lands. */
  const jiggle = (power = 1) => {
    if (!motion) return;
    gsap.fromTo(stack, { scaleY: 1 - 0.1 * power, scaleX: 1 + 0.06 * power }, { scaleY: 1, scaleX: 1, duration: 0.9, ease: 'elastic.out(1.2, 0.25)' });
    placed.forEach((p, i) => {
      gsap.to(p.el, {
        keyframes: { rotation: [0, (i % 2 ? 4 : -4) * power, (i % 2 ? -2 : 2) * power, 0] },
        duration: 0.5,
        delay: (placed.length - i) * 0.02,
        ease: 'none',
      });
    });
  };

  const place = (type: LayerType, ing?: Ingredient, from?: Element, animate = true) => {
    const el = html(`<div class="bl"><div class="bl-inner">${layerImg(type, '', true)}</div></div>`);
    el.style.zIndex = String(placed.length + 1);
    stack.append(el);
    placed.push({ type, ing, el });
    const y = topOf(placed.length - 1);
    refit();
    if (!motion || !animate) {
      gsap.set(el, { y });
      return;
    }
    const inner = el.firstElementChild as HTMLElement;
    gsap.set(inner, { transformOrigin: '50% 100%' });
    const sr = stack.getBoundingClientRect();
    let sx = 0;
    let sy = y - stage.clientHeight;
    let s0 = 1;
    if (from) {
      const r = from.getBoundingClientRect();
      sx = (r.left + r.width / 2 - (sr.left + sr.width / 2)) / fitScale;
      sy = (r.top + r.height / 2 - sr.top) / fitScale;
      s0 = Math.max(0.2, r.width / sr.width);
    }
    const apex = Math.min(sy, y) - 160;
    gsap
      .timeline()
      .fromTo(el, { x: sx, scale: s0 }, { x: 0, scale: 1, duration: 0.7, ease: 'none' }, 0)
      .fromTo(el, { y: sy, rotation: gsap.utils.random(-200, 200) }, { y: apex, rotation: 0, duration: 0.32, ease: 'power2.out' }, 0)
      .to(el, { y, duration: 0.38, ease: 'power2.in' }, 0.32)
      .fromTo(inner, { scaleY: 0.55, scaleX: 1.3 }, { scaleY: 1, scaleX: 1, duration: 0.8, ease: 'elastic.out(1.2, 0.3)', immediateRender: false }, 0.7)
      .add(() => jiggle(type === 'patty' || type === 'bunTop' ? 1.4 : 1), 0.7);
    if (ing) {
      const li = document.createElement('li');
      li.textContent = `${ing.name} added`;
      announce.replaceChildren(li);
    }
  };

  const removeTop = (fling = true) => {
    const p = placed.pop();
    if (!p || p.type === 'bunBottom') {
      if (p) placed.push(p);
      return;
    }
    if (p.type === 'bunTop') closed = false;
    gsap.to(p.el, {
      y: '-=300',
      x: fling ? gsap.utils.random(-200, 200) : 0,
      rotation: gsap.utils.random(-180, 180),
      autoAlpha: 0,
      duration: motion ? 0.55 : 0,
      ease: 'back.in(1.7)',
      onComplete: () => p.el.remove(),
    });
    refit();
  };

  const showSticker = (text: string) => {
    sticker.firstElementChild!.textContent = text;
    if (!motion) return;
    gsap
      .timeline()
      .fromTo(sticker, { scale: 0, rotation: -90, autoAlpha: 1 }, { scale: 1, rotation: -8, duration: 0.7, ease: 'back.out(3)' })
      .to(sticker, { scale: 0, rotation: 60, autoAlpha: 0, duration: 0.35, ease: 'back.in(2)' }, 1.4);
  };

  const add = (i: number, from?: Element) => {
    const ing = b.ingredients[i];
    if (!ing || closed || placed.length - 1 >= b.maxLayers) return;
    place(ing.type, ing, from);
    update();
  };

  place('bunBottom', undefined, undefined, false);
  update();

  let dragged = false;
  let ghost: HTMLElement | null = null;

  // Tap / keyboard
  root.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (chip && !dragged) {
      add(Number(chip.dataset.i), qs('.chip-art', chip));
      if (motion) gsap.fromTo(chip, { scale: 0.85 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.3)' });
    }
    dragged = false;
  });

  // Drag with mouse or pen (touch users tap; touch dragging would fight page scroll).
  root.addEventListener('pointerdown', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (!chip || chip.disabled || e.pointerType === 'touch') return;
    const sx = e.clientX;
    const sy = e.clientY;
    const art = qs('.chip-art', chip);
    let lastX = sx;
    const inside = (ev: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      return ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom;
    };
    const onMove = (ev: PointerEvent) => {
      if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
        const r = art.getBoundingClientRect();
        ghost = html(`<div class="drag-ghost" aria-hidden="true">${art.innerHTML}</div>`);
        ghost.style.width = `${r.width * 1.8}px`;
        document.body.append(ghost);
        stage.classList.add('is-target');
        dragged = true;
      }
      if (ghost) {
        // Swing like it is hanging from the pointer.
        const swing = gsap.utils.clamp(-30, 30, (ev.clientX - lastX) * 1.5);
        lastX = ev.clientX;
        gsap.set(ghost, { x: ev.clientX, y: ev.clientY, xPercent: -50, yPercent: -50 });
        gsap.to(ghost, { rotation: swing, duration: 0.3, overwrite: 'auto' });
        stage.classList.toggle('is-over', inside(ev));
      }
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!ghost) return;
      const g = ghost;
      ghost = null;
      stage.classList.remove('is-target', 'is-over');
      if (inside(ev)) {
        add(Number(chip.dataset.i), g);
        g.remove();
      } else {
        const cr = art.getBoundingClientRect();
        gsap.to(g, { x: cr.left + cr.width / 2, y: cr.top + cr.height / 2, scale: 0.5, autoAlpha: 0, duration: 0.4, ease: 'back.in(2)', onComplete: () => g.remove() });
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
    if (motion) {
      gsap.delayedCall(0.75, () => {
        const sr = stage.getBoundingClientRect();
        const tr = placed[placed.length - 1].el.getBoundingClientRect();
        confetti(stage, tr.left + tr.width / 2 - sr.left, tr.top - sr.top + 20, 44);
        showSticker(b.closedLabel);
      });
    }
    btn('add').focus({ preventScroll: true });
  });

  btn('add').addEventListener('click', () => {
    const ings = placed.filter((p) => p.ing).map((p) => p.ing!);
    const price = b.basePrice + ings.reduce((n, i) => n + i.price, 0);
    const id = `custom:${ings.map((i) => i.type).join('-')}`;
    addToCart({ id, name: b.itemName, price, detail: `${b.baseName}, ${ings.map((i) => i.name).join(', ')}` });
    const clear = () => {
      while (placed.length > 1) removeTop(false);
      closed = false;
      update();
    };
    if (!motion) return clear();
    btn('add').disabled = true;
    // Chomp: a bite disappears from the bun, then the burger flies to the cart.
    const top = placed[placed.length - 1].el;
    top.insertAdjacentHTML('beforeend', BITE);
    const bite = qs('.bite', top);
    showSticker(b.chompLabel);
    gsap
      .timeline({
        onComplete: () => {
          flyToCart(fit);
          clear();
          btn('add').disabled = false;
        },
      })
      .fromTo(bite, { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' })
      .add(() => jiggle(1.6), 0.1)
      .to({}, { duration: 0.5 });
  });

  window.addEventListener('resize', positionAll);
}
