import type { ItemArt, LayerType } from '../types';
import { LAYERS, W, layerMarkup, stackHeight } from './layers';

const PAD = 30;

/** A full burger as one SVG. Each layer is a <g class="art-layer"> so it can be animated. */
function burgerSvg(types: LayerType[], label: string): string {
  const total = stackHeight(types);
  const base = PAD + total;
  let y = PAD;
  const groups = types.map((type, i) => {
    const g = `<g class="art-layer" data-i="${i}" transform="translate(0 ${y})"><g>${layerMarkup(type)}</g></g>`;
    y += LAYERS[type].t;
    return g;
  });
  // Draw bottom-up so upper layers overlap the ones below.
  groups.reverse();
  return `<svg class="art-svg" viewBox="-20 0 ${W + 40} ${base + 26}" overflow="visible" role="img" aria-label="${label}">
    <ellipse cx="200" cy="${base - 2}" rx="190" ry="18" fill="url(#g-shadow)"/>
    ${groups.join('')}
  </svg>`;
}

const fries = `
  <ellipse cx="200" cy="372" rx="130" ry="14" fill="url(#g-shadow)"/>
  ${[
    [120, 70, -12], [150, 50, -6], [180, 40, -2], [210, 46, 3], [240, 56, 8], [268, 74, 13], [135, 96, -9],
    [165, 84, -4], [195, 78, 1], [225, 82, 6], [255, 98, 10],
  ]
    .map(
      ([x, y, r]) =>
        `<rect x="${x}" y="${y}" width="22" height="190" rx="5" fill="#ffd25e" stroke="#e7a425" stroke-width="3" transform="rotate(${r} ${x} 250)"/>`,
    )
    .join('')}
  <path d="M92 170h216l-30 196H122Z" fill="#e2341d"/>
  <path d="M92 170h216l-6 38H98Z" fill="#ff5a1f"/>
  <path d="M120 250h160l-14 92H134Z" fill="#fff4e3" opacity=".12"/>
  <text x="200" y="300" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="46" fill="#fff4e3">E&amp;B</text>`;

const rings = `
  <ellipse cx="200" cy="360" rx="150" ry="16" fill="url(#g-shadow)"/>
  ${[
    [200, 320, 120], [170, 268, 104], [236, 230, 96], [190, 180, 92], [214, 128, 80],
  ]
    .map(
      ([cx, cy, rx]) => `
      <g transform="rotate(${cx > 200 ? 6 : -6} ${cx} ${cy})">
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.36}" fill="none" stroke="#b46a1e" stroke-width="34"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.36}" fill="none" stroke="#f0a83e" stroke-width="26"/>
        <ellipse cx="${cx}" cy="${cy - 4}" rx="${rx}" ry="${rx * 0.34}" fill="none" stroke="#ffd98a" stroke-width="6" stroke-dasharray="4 10" stroke-linecap="round"/>
      </g>`,
    )
    .join('')}`;

const shake = `
  <ellipse cx="200" cy="378" rx="100" ry="12" fill="url(#g-shadow)"/>
  <rect x="236" y="10" width="16" height="170" rx="6" fill="#ff5a1f" transform="rotate(12 244 180)"/>
  <path d="M120 120c-8-40 30-60 52-46 4-34 60-40 70-6 30-12 56 20 38 52Z" fill="#fff8ee"/>
  <circle cx="214" cy="62" r="18" fill="#d81e2c"/>
  <path d="M214 44c4-18 14-26 24-30" stroke="#5b2b10" stroke-width="3" fill="none"/>
  <path d="M112 128h176l-22 240c-1 6-6 10-12 10h-108c-6 0-11-4-12-10Z" fill="#f2c79a"/>
  <path d="M112 128h176l-3 30c-20 14-36-6-52 8s-34-10-50 4-30-6-50 6-18-8-18-8Z" fill="#9a4a14"/>
  <path d="M128 140h14l-12 220h-8Z" fill="#fff" opacity=".25"/>
  <rect x="104" y="118" width="192" height="14" rx="7" fill="#fff4e3" opacity=".9"/>`;

const soda = `
  <ellipse cx="200" cy="378" rx="96" ry="12" fill="url(#g-shadow)"/>
  <rect x="210" y="6" width="14" height="110" rx="6" fill="#fff4e3" transform="rotate(10 217 116)"/>
  <path d="M118 96h164l-6 26H124Z" fill="#fff4e3"/>
  <path d="M126 122h148l-22 246c-1 6-6 10-12 10h-80c-6 0-11-4-12-10Z" fill="#e2341d"/>
  <path d="M136 200h128l-6 74H142Z" fill="#fff4e3"/>
  <text x="200" y="252" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="40" fill="#e2341d">COLA</text>
  <path d="M140 132h12l-18 220h-8Z" fill="#fff" opacity=".22"/>
  ${[
    [240, 160], [250, 300], [160, 320], [230, 340], [170, 170],
  ]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="5" fill="#fff" opacity=".5"/>`)
    .join('')}`;

const SIDES: Record<Exclude<ItemArt['kind'], 'burger'>, string> = { fries, rings, shake, soda };

export function itemArt(art: ItemArt, label: string): string {
  if (art.kind === 'burger') return burgerSvg(art.layers, label);
  return `<svg class="art-svg" viewBox="0 0 400 400" role="img" aria-label="${label}"><g class="art-side">${SIDES[art.kind]}</g></svg>`;
}
