# ScrollCraft Burger

A free, scroll-driven website template for a burger restaurant, styled as a loud street-food zine: mustard, ketchup and pickle colours, thick ink outlines, halftone dots, starburst stickers, marquee tape and torn paper edges, all wrapped around real food photography. Scroll is the playhead and everything bounces.

**Live demo:** https://scrollcraft-burger.vercel.app

Built with Vite, TypeScript (vanilla), GSAP + ScrollTrigger and Lenis. No backend, no API keys. All photos are free-licensed, compressed to WebP and total under 1 MB.

## Features

- **Intro loader.** Real photographed ingredients rain down and stack into a burger, the crown flips off and the page tears open (once per tab session, skippable).
- **Exploding burger hero.** Photographic cut-out layers pop apart on scroll with squash and stretch, wobble and flying sesame seeds, get labelled with sticker cards (price and calories), then slam back together with the cheese re-melting.
- **Build your own.** Tap or drag (mouse) an ingredient: it flies in on an arc with gravity, squashes on landing and the whole stack jiggles. The price bounces as it updates. "Close it up" fires confetti; "Add to order" takes a bite out of the bun before it flies into the cart.
- **The smash.** A pinned scene where scroll drives a press onto a ball of beef: screen shake on impact, grease splatter, a comic "SSSSS!" burst, cartoon steam and flickering flames.
- **Menu rail.** A pinned horizontal rail of photo cards that skews with scroll velocity, tilts in 3D and jiggles on hover, with a sticker-peel corner. Clicking a card morphs its photo into a full-screen detail view (shared-element transition).
- **Cart and WhatsApp ordering.** Client-side cart in `localStorage` with a prefilled `wa.me` order link.
- **Zine details.** Letters bounce in one by one and jelly-wobble on hover, scroll-driven marquee tape, sauce drips that run into the menu, torn paper between sections, a fries cursor with sauce splats on click (desktop), and a receipt-style opening-hours card.
- **Accessible and calm when asked.** Semantic HTML, real buttons, keyboard and Escape support, live regions. With `prefers-reduced-motion`, the loader, smooth scroll, pinning and custom cursor are off and every section renders statically.
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
| `menu.items` | Menu cards: name, category, price, calories, badge, description and `image` (a photo in `public/`) |
| `sizzle`, `reviews`, `location`, `cart`, `footer` | Copy for the remaining sections |

**Layer types** available for the hero and builder: `bunTop`, `bunBottom`, `patty`, `cheese`, `lettuce`, `tomato`, `onion`, `pickles`, `bacon`, `sauce`. Each is a transparent WebP in `public/img/layers/` that shares one horizontal scale (900 px wide, the bun spans the full width), so any combination stacks into a believable burger. `src/art/layers.ts` holds each layer's height, how far its far edge rises behind the layer above (`up`) and its thickness (`t`). To swap in your own photos, export cut-outs at the same width and adjust those three numbers.

Section photos (`sizzle.image`, `location.image`) and menu photos are plain paths, so replacing them is a one-line change.

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
  art/layers.ts       photo layer metrics and stacking math
  fx/                 loader, cursor, confetti/grease, letter splitting
  lib/motion.ts       GSAP, ScrollTrigger and Lenis wiring
  sections/           hero, builder, menu, extras (nav, sizzle, reviews, visit, footer)
```

## Credits

All photos come from Wikimedia Commons under licences that allow free commercial use and modification. Burger layers and the builder ingredients are cut out, cleaned up and recoloured from these originals; derivatives of CC BY-SA images are shared under the same licence.

| Asset | Source | Author | Licence |
| --- | --- | --- | --- |
| Burger layers (`bunTop`, `cheese`, `patty`, `lettuce`, `bunBottom`) | [Cheeseburger.jpg](https://commons.wikimedia.org/wiki/File:Cheeseburger.jpg) | Renee Comet, National Cancer Institute | Public domain |
| `tomato` | [Tomatoes plain and sliced.jpg](https://commons.wikimedia.org/wiki/File:Tomatoes_plain_and_sliced.jpg) | FoeNyx | CC BY-SA 3.0 |
| `bacon` | [A strip of bacon ... Fairfax County, Virginia.jpg](https://commons.wikimedia.org/wiki/File:2021-01-20_09_49_23_A_strip_of_bacon_in_the_Franklin_Farm_section_of_Oak_Hill,_Fairfax_County,_Virginia.jpg) | Famartin | CC BY-SA 4.0 |
| `pickles` | [Sliced-pickle.jpg](https://commons.wikimedia.org/wiki/File:Sliced-pickle.jpg) | Sir Beluga | CC0 |
| `onion` | [Sliced Onion.jpg](https://commons.wikimedia.org/wiki/File:Sliced_Onion.jpg) | Salma kyari | CC BY-SA 4.0 |
| `sauce` | [Ketchup example 2.jpg](https://commons.wikimedia.org/wiki/File:Ketchup_example_2.jpg) | Yohan euan o4 | CC BY-SA 3.0 |
| Classic Smash | [Cheeseburger with lettuce 2.jpg](https://commons.wikimedia.org/wiki/File:Cheeseburger_with_lettuce_2.jpg) | Kurtkaiser | CC0 |
| Bacon Blaze | [The Blue cheese and Bacon Burger ... .jpg](https://commons.wikimedia.org/wiki/File:The_Blue_-cheese_and_-Bacon_-Burger_from_Taste_Pilot%27s_Grill_at_-Disney_-California_Adventure_is_enough_to_cure_a_burger_jones._-Meaty_with_a_-fresh_bun_and_fresh_fixins!_-foodporn_-disneyland_-Disneyfood_-lunch.jpg) | L.A. Foodie | CC BY 2.0 |
| Garden Stack | [Cheeseburger with lettuce.jpg](https://commons.wikimedia.org/wiki/File:Cheeseburger_with_lettuce.jpg) | Kurtkaiser | CC0 |
| The Tower | [Revel Burger at The Revel Patio Grill.jpg](https://commons.wikimedia.org/wiki/File:Revel_Burger_at_The_Revel_Patio_Grill.jpg) | Revelpatiogrill | CC0 |
| Ember Fries | [French Fries.JPG](https://commons.wikimedia.org/wiki/File:French_Fries.JPG) | StockSnap | CC0 |
| Onion Rings | [Onion Rings - Gourmet Burger Kitchen 2023-10-03.jpg](https://commons.wikimedia.org/wiki/File:Onion_Rings_-_Gourmet_Burger_Kitchen_2023-10-03.jpg) | Andy Li | CC0 |
| Caramel Shake | [Salted Caramel Milkshake.jpg](https://commons.wikimedia.org/wiki/File:Salted_Caramel_Milkshake.jpg) | Xadai | CC0 |
| House Cola | [Glass cola.jpg](https://commons.wikimedia.org/wiki/File:Glass_cola.jpg) | pic_p_ter | Public domain |
| Smash scene | [Smoked burgers and hotdogs flaming on the bbq grill.jpg](https://commons.wikimedia.org/wiki/File:Smoked_burgers_and_hotdogs_flaming_on_the_bbq_grill.jpg) | Luke | Public domain |
| Visit section | [Doyle's Diner Interior North.jpg](https://commons.wikimedia.org/wiki/File:Doyle%27s_Diner_Interior_North.jpg) | Xanadu73 | CC0 |

- Fonts: [Bowlby One](https://fonts.google.com/specimen/Bowlby+One) and [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) via Google Fonts (SIL Open Font License).
- Libraries: [GSAP](https://gsap.com) (free standard license), [Lenis](https://github.com/darkroomengineering/lenis) (MIT), [Vite](https://vitejs.dev) (MIT).
- Ember & Bun is a fictional restaurant. The phone number and address are placeholders.

## License

Code: MIT, see [LICENSE](LICENSE). Photos keep their original licences listed above.
