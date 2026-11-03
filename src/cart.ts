import { content } from './types';
import { esc, html, money, qs } from './lib/util';
import { gsap, lockScroll } from './lib/motion';

export interface CartLine {
  id: string;
  name: string;
  price: number;
  qty: number;
  detail?: string;
}

const KEY = `scrollcraft-cart:${content.brand.name}`;
const FORM_KEY = `${KEY}:form`;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode); the cart still works for this visit */
  }
}

let lines: CartLine[] = load<CartLine[]>(KEY, []);
let form = load<{ name: string; notes: string }>(FORM_KEY, { name: '', notes: '' });
const listeners = new Set<() => void>();

const count = () => lines.reduce((n, l) => n + l.qty, 0);
const total = () => lines.reduce((n, l) => n + l.qty * l.price, 0);

function commit(): void {
  save(KEY, lines);
  listeners.forEach((fn) => fn());
}

export function addToCart(line: Omit<CartLine, 'qty'>, qty = 1): void {
  const existing = lines.find((l) => l.id === line.id);
  if (existing) existing.qty += qty;
  else lines.push({ ...line, qty });
  commit();
  bumpButton();
}

function setQty(id: string, qty: number): void {
  lines = lines.map((l) => (l.id === id ? { ...l, qty } : l)).filter((l) => l.qty > 0);
  commit();
}

export function whatsappLink(): string {
  const { whatsapp } = content;
  const body = lines
    .map((l) => `${l.qty} x ${l.name}${l.detail ? ` (${l.detail})` : ''}: ${money(l.qty * l.price)}`)
    .join('\n');
  const extra = [form.name && `Name: ${form.name}`, form.notes && `Notes: ${form.notes}`].filter(Boolean).join('\n');
  const text = `${whatsapp.greeting}\n\n${body}\n\n${content.cart.totalLabel}: ${money(total())}${extra ? `\n${extra}` : ''}`;
  return `https://wa.me/${whatsapp.number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

let button: HTMLButtonElement;

function bumpButton(): void {
  gsap.fromTo(button, { scale: 1.25 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
}

/** Fly a visual clone from an element to the cart button: a small shared-element moment. */
export function flyToCart(from: Element): void {
  const r = from.getBoundingClientRect();
  const b = button.getBoundingClientRect();
  const ghost = from.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    margin: '0',
    zIndex: '90',
    pointerEvents: 'none',
  });
  ghost.setAttribute('aria-hidden', 'true');
  document.body.append(ghost);
  gsap.to(ghost, {
    x: b.left + b.width / 2 - (r.left + r.width / 2),
    y: b.top + b.height / 2 - (r.top + r.height / 2),
    scale: 0.12,
    rotation: 20,
    opacity: 0.6,
    duration: 0.8,
    ease: 'power3.in',
    onComplete: () => ghost.remove(),
  });
}

export function initCart(): void {
  const c = content.cart;
  button = html(`
    <button class="cart-btn" type="button" aria-haspopup="dialog" aria-controls="cart">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
      <span class="sr-only">${esc(c.title)}</span>
      <span class="cart-count" aria-live="polite">0</span>
    </button>`) as HTMLButtonElement;

  const drawer = html(`
    <div class="cart" id="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" hidden>
      <div class="cart-scrim" data-close></div>
      <aside class="cart-panel">
        <header class="cart-head">
          <h2 id="cart-title">${esc(c.title)}</h2>
          <button class="icon-btn" type="button" data-close aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </header>
        <ul class="cart-lines" data-lenis-prevent></ul>
        <p class="cart-empty">${esc(c.empty)}</p>
        <div class="cart-form">
          <label>${esc(c.nameLabel)}<input name="name" autocomplete="name" maxlength="60"></label>
          <label>${esc(c.notesLabel)}<textarea name="notes" rows="2" maxlength="300"></textarea></label>
        </div>
        <footer class="cart-foot">
          <div class="cart-total"><span>${esc(c.totalLabel)}</span><strong></strong></div>
          <a class="btn btn-wa" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.2-.2-.2-.5-.4Z"/></svg>
            ${esc(content.whatsapp.cta)}
          </a>
          <button class="link-btn" type="button" data-clear>${esc(c.clearLabel)}</button>
        </footer>
      </aside>
    </div>`);

  document.body.append(button, drawer);

  const list = qs<HTMLUListElement>('.cart-lines', drawer);
  const empty = qs('.cart-empty', drawer);
  const totalEl = qs('.cart-total strong', drawer);
  const wa = qs<HTMLAnchorElement>('.btn-wa', drawer);
  const countEl = qs('.cart-count', button);
  const nameInput = qs<HTMLInputElement>('input[name="name"]', drawer);
  const notesInput = qs<HTMLTextAreaElement>('textarea[name="notes"]', drawer);
  const panel = qs('.cart-panel', drawer);
  nameInput.value = form.name;
  notesInput.value = form.notes;

  const render = () => {
    list.innerHTML = lines
      .map(
        (l) => `
        <li class="cart-line">
          <div>
            <p class="cart-line-name">${esc(l.name)}</p>
            ${l.detail ? `<p class="cart-line-detail">${esc(l.detail)}</p>` : ''}
            <p class="cart-line-price">${money(l.price * l.qty)}</p>
          </div>
          <div class="stepper" role="group" aria-label="Quantity for ${esc(l.name)}">
            <button type="button" data-id="${esc(l.id)}" data-d="-1" aria-label="Remove one">-</button>
            <span>${l.qty}</span>
            <button type="button" data-id="${esc(l.id)}" data-d="1" aria-label="Add one">+</button>
          </div>
        </li>`,
      )
      .join('');
    const n = count();
    countEl.textContent = String(n);
    button.classList.toggle('has-items', n > 0);
    empty.hidden = n > 0;
    totalEl.textContent = money(total());
    wa.href = n ? whatsappLink() : '#';
    wa.toggleAttribute('aria-disabled', n === 0);
    wa.tabIndex = n ? 0 : -1;
  };

  listeners.add(render);
  render();

  list.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-id]');
    if (!t) return;
    const line = lines.find((l) => l.id === t.dataset.id);
    if (line) setQty(line.id, line.qty + Number(t.dataset.d));
  });

  const onForm = () => {
    form = { name: nameInput.value.trim(), notes: notesInput.value.trim() };
    save(FORM_KEY, form);
    render();
  };
  nameInput.addEventListener('input', onForm);
  notesInput.addEventListener('input', onForm);

  wa.addEventListener('click', (e) => {
    if (!count()) e.preventDefault();
  });

  let lastFocus: HTMLElement | null = null;
  const open = () => {
    lastFocus = document.activeElement as HTMLElement;
    drawer.hidden = false;
    lockScroll(true);
    gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.6, ease: 'expo.out' });
    gsap.fromTo('.cart-scrim', { opacity: 0 }, { opacity: 1, duration: 0.4 });
    qs<HTMLButtonElement>('.icon-btn', drawer).focus();
  };
  const close = () => {
    gsap.to(panel, { xPercent: 100, duration: 0.4, ease: 'power3.in' });
    gsap.to('.cart-scrim', {
      opacity: 0,
      duration: 0.4,
      onComplete: () => {
        drawer.hidden = true;
        lockScroll(false);
        lastFocus?.focus();
      },
    });
  };

  button.addEventListener('click', open);
  drawer.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-close]')) close();
    if (t.closest('[data-clear]')) {
      lines = [];
      commit();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) close();
  });
}
