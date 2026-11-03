import type { LayerType } from '../types';
import { seeded } from '../lib/util';

/**
 * Illustrated burger layers. Every layer is drawn in a 400-unit-wide coordinate space.
 * `h` is the drawing height, `t` is how much vertical room the layer takes up when
 * stacked (drips, frills and bun edges overlap the layer below).
 */
export interface LayerSpec {
  h: number;
  t: number;
  draw: () => string;
}

export const W = 400;

/** Shared gradients, injected once into the document. */
export const DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="g-bun" cx="35%" cy="22%" r="85%">
      <stop offset="0" stop-color="#ffd27a"/>
      <stop offset=".45" stop-color="#e4923a"/>
      <stop offset="1" stop-color="#9c4d17"/>
    </radialGradient>
    <linearGradient id="g-heel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9a54a"/>
      <stop offset="1" stop-color="#9a4b16"/>
    </linearGradient>
    <linearGradient id="g-crumb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbe3ae"/>
      <stop offset="1" stop-color="#e9be76"/>
    </linearGradient>
    <radialGradient id="g-patty" cx="40%" cy="20%" r="90%">
      <stop offset="0" stop-color="#8a4520"/>
      <stop offset=".55" stop-color="#55260f"/>
      <stop offset="1" stop-color="#2e1407"/>
    </radialGradient>
    <linearGradient id="g-cheese" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd23f"/>
      <stop offset="1" stop-color="#f59a0b"/>
    </linearGradient>
    <linearGradient id="g-lettuce" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b6ea6a"/>
      <stop offset="1" stop-color="#3f962a"/>
    </linearGradient>
    <linearGradient id="g-sauce" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff6a3a"/>
      <stop offset="1" stop-color="#c62a12"/>
    </linearGradient>
    <radialGradient id="g-tomato" cx="50%" cy="40%" r="60%">
      <stop offset="0" stop-color="#ff7a5c"/>
      <stop offset="1" stop-color="#d3301e"/>
    </radialGradient>
    <linearGradient id="g-bacon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c8492f"/>
      <stop offset="1" stop-color="#7d2114"/>
    </linearGradient>
    <linearGradient id="g-pickle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a6c95a"/>
      <stop offset="1" stop-color="#5d8a26"/>
    </linearGradient>
    <radialGradient id="g-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#000" stop-opacity=".55"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
</svg>`;

/** Wavy horizontal edge from x0 to x1 around baseline y. */
function wave(x0: number, x1: number, y: number, amp: number, steps: number, rnd: () => number, reverse = false): string {
  const pts: string[] = [];
  const dx = (x1 - x0) / steps;
  for (let i = 1; i <= steps; i++) {
    const x = reverse ? x1 - i * dx : x0 + i * dx;
    const cx = reverse ? x + dx / 2 : x - dx / 2;
    const cy = y + (rnd() - 0.5) * amp * 2;
    pts.push(`Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${(y + (rnd() - 0.5) * amp).toFixed(1)}`);
  }
  return pts.join(' ');
}

function bunTop(): string {
  const rnd = seeded(7);
  const seeds: string[] = [];
  const spots = [
    [120, 52], [160, 34], [205, 28], [250, 36], [290, 54], [95, 82], [140, 70], [185, 58], [232, 62],
    [275, 78], [318, 88], [70, 112], [115, 104], [165, 92], [212, 94], [258, 104], [305, 118], [340, 124],
    [190, 124], [140, 128], [90, 136], [240, 132],
  ];
  for (const [x, y] of spots) {
    const r = Math.round((rnd() - 0.5) * 70);
    seeds.push(
      `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="7" ry="3.4" fill="#6b3410" opacity=".35" transform="translate(1 1.5)"/><ellipse rx="7" ry="3.4" fill="#fff4dc"/></g>`,
    );
  }
  return `
    <path d="M14 150C14 62 104 8 200 8s186 54 186 142c0 12-8 18-20 18H34c-12 0-20-6-20-18Z" fill="url(#g-bun)"/>
    <path d="M18 146Q200 160 382 146v8c0 9-7 14-17 14H35c-10 0-17-5-17-14Z" fill="url(#g-crumb)"/>
    <ellipse cx="135" cy="48" rx="78" ry="20" fill="#fff" opacity=".2" transform="rotate(-14 135 48)"/>
    ${seeds.join('')}`;
}

function bunBottom(): string {
  return `
    <path d="M20 10h360c8 0 11 6 9 14l-11 38c-3 10-10 14-22 14H44c-12 0-19-4-22-14L11 24c-2-8 1-14 9-14Z" fill="url(#g-heel)"/>
    <path d="M22 4c0-3 4-4 10-4h336c6 0 10 1 10 4v12Q200 26 22 16Z" fill="url(#g-crumb)"/>
    <path d="M40 60Q200 70 360 60" stroke="#fff" stroke-opacity=".12" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}

function patty(): string {
  const rnd = seeded(11);
  const top = wave(22, 378, 6, 4, 18, rnd);
  const bottom = wave(22, 378, 57, 3, 16, rnd, true);
  const specks: string[] = [];
  for (let i = 0; i < 70; i++) {
    const x = 26 + rnd() * 348;
    const y = 10 + rnd() * 42;
    const light = rnd() > 0.55;
    specks.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + rnd() * 2.4).toFixed(1)}" fill="${light ? '#a65a2a' : '#1f0c04'}" opacity="${light ? 0.55 : 0.5}"/>`,
    );
  }
  return `
    <path d="M22 8 ${top} C396 10 398 52 378 57 ${bottom} C2 52 4 10 22 8Z" fill="url(#g-patty)"/>
    ${specks.join('')}
    <path d="M40 14Q120 6 200 12T360 14" stroke="#b5683a" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}

function cheese(): string {
  const drips = [
    [44, 26], [92, 40], [150, 22], [205, 46], [262, 30], [318, 42], [362, 24],
  ];
  let d = 'M2 2L398 0L396 14';
  const sorted = [...drips].sort((a, b) => b[0] - a[0]);
  for (const [x, len] of sorted) {
    d += `L${x + 16} 14Q${x + 9} 14 ${x + 8} ${len - 6}Q${x} ${len + 4} ${x - 8} ${len - 6}Q${x - 9} 14 ${x - 16} 14`;
  }
  d += 'L4 14Z';
  return `
    <path d="${d}" fill="url(#g-cheese)"/>
    <path d="M10 4L390 2" stroke="#fff6c4" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round"/>`;
}

function lettuce(): string {
  const rnd = seeded(23);
  let d = 'M-6 16';
  d += wave(-6, 406, 10, 6, 14, rnd);
  for (let x = 406; x > -6; x -= 26) {
    const y = 30 + rnd() * 16;
    d += `Q${x - 6} ${y + 6} ${x - 13} ${y}Q${x - 19} ${y - 10} ${x - 26} ${y - 4}`;
  }
  d += 'Z';
  return `
    <path d="${d}" fill="url(#g-lettuce)"/>
    <path d="M30 18Q90 26 150 20T270 22T380 18" stroke="#e4ffb4" stroke-opacity=".55" stroke-width="2" fill="none"/>
    <path d="M60 22l-8 12M140 22l-6 14M220 24l6 12M300 22l-6 14" stroke="#e4ffb4" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`;
}

function sauce(): string {
  const rnd = seeded(31);
  let d = 'M8 10';
  d += wave(8, 392, 6, 3, 12, rnd);
  for (let x = 392; x > 8; x -= 32) {
    const y = 16 + rnd() * 14;
    d += `Q${x - 8} ${y + 4} ${x - 16} ${y}Q${x - 24} ${y - 8} ${x - 32} 14`;
  }
  d += 'Z';
  return `
    <path d="${d}" fill="url(#g-sauce)"/>
    <path d="M30 9Q120 4 210 8T370 8" stroke="#ffc2a6" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

function tomato(): string {
  const slice = (cx: number) => `
    <ellipse cx="${cx}" cy="18" rx="108" ry="16" fill="url(#g-tomato)"/>
    <ellipse cx="${cx}" cy="17" rx="92" ry="11" fill="#ff8a6a" opacity=".55"/>
    ${[-56, -20, 20, 56]
      .map((o) => `<ellipse cx="${cx + o}" cy="17" rx="13" ry="5" fill="#ffd9a8" opacity=".85"/>`)
      .join('')}`;
  return slice(116) + slice(284);
}

function onion(): string {
  const rings = [70, 150, 230, 320]
    .map(
      (cx, i) => `
      <ellipse cx="${cx}" cy="15" rx="${62 - (i % 2) * 8}" ry="10" fill="none" stroke="#8d3a8a" stroke-width="7"/>
      <ellipse cx="${cx}" cy="15" rx="${62 - (i % 2) * 8}" ry="10" fill="none" stroke="#f6dcf5" stroke-width="3"/>`,
    )
    .join('');
  return rings;
}

function pickles(): string {
  return [62, 140, 220, 300, 352]
    .map(
      (cx, i) => `
      <ellipse cx="${cx}" cy="${14 + (i % 2) * 2}" rx="40" ry="11" fill="url(#g-pickle)" stroke="#3f6619" stroke-width="3"/>
      <ellipse cx="${cx}" cy="${14 + (i % 2) * 2}" rx="26" ry="6" fill="none" stroke="#d6eaa0" stroke-opacity=".6" stroke-width="2" stroke-dasharray="3 5"/>`,
    )
    .join('');
}

function bacon(): string {
  const strip = (y: number, phase: number) => {
    let d = `M0 ${y}`;
    for (let x = 0; x < 400; x += 50) {
      d += `Q${x + 25} ${y + (phase ? -8 : 8)} ${x + 50} ${y}`;
    }
    return d;
  };
  return `
    <path d="${strip(12, 0)}" stroke="url(#g-bacon)" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="${strip(12, 0)}" stroke="#f7c6b0" stroke-width="3" fill="none" stroke-dasharray="26 18" stroke-linecap="round"/>
    <path d="${strip(20, 1)}" stroke="url(#g-bacon)" stroke-width="14" fill="none" stroke-linecap="round" opacity=".95"/>
    <path d="${strip(20, 1)}" stroke="#f7c6b0" stroke-width="2.5" fill="none" stroke-dasharray="18 24" stroke-linecap="round"/>`;
}

export const LAYERS: Record<LayerType, LayerSpec> = {
  bunTop: { h: 170, t: 150, draw: bunTop },
  sauce: { h: 34, t: 12, draw: sauce },
  lettuce: { h: 50, t: 22, draw: lettuce },
  cheese: { h: 50, t: 12, draw: cheese },
  patty: { h: 62, t: 50, draw: patty },
  tomato: { h: 36, t: 22, draw: tomato },
  onion: { h: 30, t: 16, draw: onion },
  pickles: { h: 30, t: 14, draw: pickles },
  bacon: { h: 34, t: 18, draw: bacon },
  bunBottom: { h: 78, t: 72, draw: bunBottom },
};

const cache = new Map<LayerType, string>();

/** Inner SVG markup for a layer (memoised; drawings are deterministic). */
export function layerMarkup(type: LayerType): string {
  let m = cache.get(type);
  if (!m) {
    m = LAYERS[type].draw();
    cache.set(type, m);
  }
  return m;
}

/** A standalone <svg> for one layer, sized to its container width. */
export function layerSvg(type: LayerType, label = ''): string {
  const { h } = LAYERS[type];
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="layer-svg" viewBox="0 0 ${W} ${h}" overflow="visible" ${a11y}>${layerMarkup(type)}</svg>`;
}

/** Total stacked height in drawing units for layers listed top to bottom. */
export function stackHeight(types: LayerType[]): number {
  if (!types.length) return 0;
  const last = types[types.length - 1];
  return types.slice(0, -1).reduce((sum, t) => sum + LAYERS[t].t, 0) + LAYERS[last].h;
}
