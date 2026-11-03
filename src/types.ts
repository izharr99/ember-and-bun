import raw from './content.json';

export type LayerType =
  | 'bunTop'
  | 'bunBottom'
  | 'patty'
  | 'cheese'
  | 'lettuce'
  | 'tomato'
  | 'onion'
  | 'pickles'
  | 'bacon'
  | 'sauce';

export type ItemArt =
  | { kind: 'burger'; layers: LayerType[] }
  | { kind: 'fries' | 'rings' | 'shake' | 'soda' };

export interface HeroLayer {
  type: LayerType;
  name: string;
  price: number;
  calories: number;
  note: string;
}

export interface Ingredient {
  type: LayerType;
  name: string;
  price: number;
  calories: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  calories: number;
  badge: string;
  description: string;
  /** Optional path to an image in /public. When empty, the illustrated `art` is used. */
  image: string;
  art: ItemArt;
}

export interface Content {
  brand: { name: string; shortName: string; tagline: string; description: string };
  theme: {
    bg: string;
    surface: string;
    ink: string;
    muted: string;
    accent: string;
    accent2: string;
    fontDisplay: string;
    fontBody: string;
  };
  currency: { symbol: string; locale: string };
  whatsapp: { number: string; greeting: string; cta: string };
  nav: { label: string; href: string }[];
  hero: {
    kicker: string;
    headline: string[];
    scrollHint: string;
    outro: string;
    layers: HeroLayer[];
  };
  anatomy: { kicker: string; title: string };
  builder: {
    kicker: string;
    title: string;
    hint: string;
    basePrice: number;
    baseCalories: number;
    baseName: string;
    maxLayers: number;
    itemName: string;
    finishLabel: string;
    resetLabel: string;
    undoLabel: string;
    addLabel: string;
    ingredients: Ingredient[];
  };
  menu: { kicker: string; title: string; addLabel: string; items: MenuItem[] };
  sizzle: { kicker: string; lines: string[]; copy: string };
  reviews: { quote: string; author: string }[];
  location: {
    kicker: string;
    headline: string[];
    address: string;
    city: string;
    mapUrl: string;
    phone: string;
    hours: { days: string; time: string }[];
  };
  cart: {
    title: string;
    empty: string;
    nameLabel: string;
    notesLabel: string;
    totalLabel: string;
    clearLabel: string;
  };
  footer: { note: string };
}

export const content = raw as unknown as Content;
