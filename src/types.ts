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
  /** Path to a photo in /public, ideally around 900px wide WebP. */
  image: string;
}

export interface Content {
  brand: { name: string; shortName: string; tagline: string; description: string };
  theme: {
    paper: string;
    ink: string;
    ketchup: string;
    mustard: string;
    pickle: string;
    pink: string;
    fontDisplay: string;
    fontBody: string;
  };
  loader: { label: string; skip: string };
  tape: string[];
  currency: { symbol: string; locale: string };
  whatsapp: { number: string; greeting: string; cta: string };
  nav: { label: string; href: string }[];
  hero: {
    kicker: string;
    headline: string[];
    scrollHint: string;
    outro: string;
    sticker: string;
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
    chompLabel: string;
    closedLabel: string;
    ingredients: Ingredient[];
  };
  menu: { kicker: string; title: string; addLabel: string; items: MenuItem[] };
  sizzle: { kicker: string; lines: string[]; copy: string; sound: string; image: string; imageAlt: string };
  reviews: { quote: string; author: string }[];
  location: {
    kicker: string;
    headline: string[];
    address: string;
    city: string;
    mapUrl: string;
    phone: string;
    image: string;
    imageAlt: string;
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
