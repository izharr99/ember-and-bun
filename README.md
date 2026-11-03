# ScrollCraft Burger

A free, scroll-driven website template for a burger restaurant. The page plays like one continuous story: scroll is the playhead, type is huge, and every section moves.

**Live demo:** https://scrollcraft-burger.vercel.app

Built with Vite, TypeScript (vanilla), GSAP + ScrollTrigger and Lenis. No backend, no API keys, no images to license: every burger layer, side and drink is a hand-built SVG illustration, so the whole site ships in about 70 KB of gzipped JS and CSS.

## Features

- **Exploding burger hero.** The hero pins while scroll pulls the burger apart into labelled layers (name, note, price, calories), then snaps it back together. Scroll up and it reverses.
- **Build your own.** Tap an ingredient (or drag it with a mouse) and it drops onto the bun with a bounce. The stack squashes on impact, auto-scales to fit, and the price and calories update live. Undo, start over, close it up, add to order.
- **The smash.** A pinned section where scroll drives a steel press down onto a ball of beef, with sparks and smoke.
- **Menu rail.** A horizontal, scroll-pinned rail of burgers, sides and drinks. Cards tilt with scroll velocity. Clicking one morphs its artwork into a full-screen detail view (shared-element transition), where burger layers gently separate.
- **Cart and WhatsApp ordering.** Client-side cart in `localStorage`, quantity steppers, name and notes, then a `wa.me` link with the full order prefilled.
- **Reviews marquee** that speeds up and skews with scroll velocity, and a **visit section** with oversized type.
- **Accessible and calm when asked.** Semantic HTML, real buttons, keyboard and Escape support, focus return, live regions for the builder and cart. With `prefers-reduced-motion`, smooth scroll and pinning are off and every section renders as a static layout.
- Mobile first and tested at 390 px wide.

## Make it yours

Everything a restaurant would change lives in **`src/content.json`**:

| Key | What it controls |
| --- | --- |
| `brand` | Name, tagline, description (also used for `<title>` and meta tags) |
| `theme` | Colours and the two Google Fonts (the font link is generated at build time) |
| `currency` | Symbol and number locale, e.g. `"Rs "` + `en-PK` or `"$"` + `en-US` |
| `whatsapp` | Order number in international format without `+`, greeting and button label |
| `hero.layers` | The exploded burger, top to bottom: layer `type`, name, note, price, calories |
| `builder` | Base bun price and calories, max layers, labels, and the ingredient list |
| `menu.items` | Menu cards: name, category, price, calories, badge, description, artwork |
| `sizzle`, `reviews`, `location`, `cart`, `footer` | Copy for the remaining sections |

**Layer types** available for burgers: `bunTop`, `bunBottom`, `patty`, `cheese`, `lettuce`, `tomato`, `onion`, `pickles`, `bacon`, `sauce`. A menu burger is just a list of them, top to bottom:

```json
"art": { "kind": "burger", "layers": ["bunTop", "sauce", "cheese", "patty", "bunBottom"] }
```

Sides and drinks use `{ "kind": "fries" | "rings" | "shake" | "soda" }`.

**Using photos instead.** Put an image in `public/` (for example `public/menu/fries.webp`, ideally square with a transparent background) and set `"image": "/menu/fries.webp"` on the menu item. It replaces the illustration and is lazy loaded.

To add a new illustrated layer, add a draw function and an entry to `LAYERS` in `src/art/layers.ts` and the type name to `LayerType` in `src/types.ts`.

## Run it

```bash
pnpm install
pnpm dev        # local dev server
pnpm build      # type-check and build to dist/
pnpm preview    # serve the production build
```

Deploy `dist/` anywhere static (Vercel, Netlify, GitHub Pages). On Vercel the defaults work with no config.

## Project structure

```
src/
  content.json        all copy, prices, colours, fonts, WhatsApp number
  types.ts            content types
  main.ts             mounts sections and applies the theme
  cart.ts             localStorage cart, drawer, WhatsApp link, fly-to-cart
  art/layers.ts       SVG burger layers and their stacking metrics
  art/items.ts        full burgers, fries, rings, shake, cola
  lib/motion.ts       GSAP, ScrollTrigger and Lenis wiring
  sections/           hero, builder, menu, extras (nav, sizzle, reviews, visit, footer)
```

## Credits

- Illustrations: original SVG made for this template (no third-party images).
- Fonts: [Anton](https://fonts.google.com/specimen/Anton) and [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts (SIL Open Font License).
- Libraries: [GSAP](https://gsap.com) (free standard license), [Lenis](https://github.com/darkroomengineering/lenis) (MIT), [Vite](https://vitejs.dev) (MIT).
- Ember & Bun is a fictional restaurant. The phone number and address are placeholders.

## License

MIT. See [LICENSE](LICENSE).
