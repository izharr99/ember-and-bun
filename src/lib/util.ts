import { content } from '../types';

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape a content string before interpolating it into HTML. */
export const esc = (value: string | number): string => String(value).replace(/[&<>"']/g, (c) => ESC[c]);

const numberFormat = new Intl.NumberFormat(content.currency.locale);

export const money = (value: number): string => `${content.currency.symbol}${numberFormat.format(value)}`;

export const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function qs<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

export function html(markup: string): HTMLElement {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild as HTMLElement;
}

/** Small deterministic PRNG so illustrations look identical on every render. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
