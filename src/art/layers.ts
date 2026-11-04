import type { LayerType } from '../types';

/**
 * Photographic burger layers: transparent WebP cut-outs that share one horizontal scale,
 * so any stack of them reads as a real burger. All measurements use a 400-unit-wide space.
 *
 * - `h`  image height
 * - `up` how far the image rises above the layer's resting line (the far edge of a slice,
 *        hidden behind the layer above when stacked)
 * - `t`  thickness: how far down the next layer starts
 */
export interface LayerSpec {
  src: string;
  h: number;
  up: number;
  t: number;
}

export const W = 400;
const BASE = `${import.meta.env.BASE_URL}img/layers/`;

export const LAYERS: Record<LayerType, LayerSpec> = {
  bunTop: { src: `${BASE}bunTop.webp`, h: 204.4, up: 0, t: 165 },
  cheese: { src: `${BASE}cheese.webp`, h: 234.6, up: 140.4, t: 8 },
  patty: { src: `${BASE}patty.webp`, h: 109.9, up: 26.6, t: 60 },
  lettuce: { src: `${BASE}lettuce.webp`, h: 107.8, up: 39.9, t: 22 },
  bunBottom: { src: `${BASE}bunBottom.webp`, h: 65.9, up: 0, t: 66 },
  tomato: { src: `${BASE}tomato.webp`, h: 59.6, up: 22, t: 22 },
  bacon: { src: `${BASE}bacon.webp`, h: 59.1, up: 18, t: 22 },
  pickles: { src: `${BASE}pickles.webp`, h: 28.4, up: 8, t: 12 },
  sauce: { src: `${BASE}sauce.webp`, h: 65.3, up: 28, t: 16 },
  onion: { src: `${BASE}onion.webp`, h: 47.6, up: 18, t: 14 },
};

/** An <img> for one layer, sized to its container width (aspect ratio reserved, so no layout shift). */
export function layerImg(type: LayerType, alt = '', eager = false): string {
  const { src, h } = LAYERS[type];
  return `<img class="layer-img" src="${src}" width="900" height="${Math.round((h * 900) / W)}" alt="${alt}" decoding="async"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} draggable="false">`;
}

/**
 * Image tops (drawing units, relative to the first layer's resting line) for layers listed
 * top to bottom, plus the total visual height of the stack.
 */
export function stackTops(types: LayerType[]): { tops: number[]; min: number; max: number } {
  let rest = 0;
  let min = Infinity;
  let max = -Infinity;
  const tops = types.map((type) => {
    const { up, h, t } = LAYERS[type];
    const top = rest - up;
    min = Math.min(min, top);
    max = Math.max(max, top + h);
    rest += t;
    return top;
  });
  return { tops, min, max };
}

/** Preload a set of layer images (used by the intro loader). */
export function preloadLayers(types: LayerType[]): Promise<void> {
  return Promise.all(
    [...new Set(types)].map(
      (t) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = LAYERS[t].src;
        }),
    ),
  ).then(() => undefined);
}
