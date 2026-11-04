import './styles.css';
import { content } from './types';
import { initSmoothScroll, ScrollTrigger } from './lib/motion';
import { initCart } from './cart';
import { playIntro } from './fx/loader';
import { initCursor } from './fx/cursor';
import { initWobble } from './fx/split';
import { heroSection, initHero } from './sections/hero';
import { builderSection, initBuilder } from './sections/builder';
import { initMenu, menuSection } from './sections/menu';
import {
  footerSection,
  initLocation,
  initReveals,
  initReviews,
  initSizzle,
  initTapes,
  locationSection,
  navBar,
  reviewsSection,
  sizzleSection,
  tapeStrip,
} from './sections/extras';

/** Theme tokens come from content.json so a rebrand never touches CSS. */
function applyTheme(): void {
  const t = content.theme;
  const root = document.documentElement.style;
  root.setProperty('--paper', t.paper);
  root.setProperty('--ink', t.ink);
  root.setProperty('--ketchup', t.ketchup);
  root.setProperty('--mustard', t.mustard);
  root.setProperty('--pickle', t.pickle);
  root.setProperty('--pink', t.pink);
  root.setProperty('--font-display', `"${t.fontDisplay}", Impact, sans-serif`);
  root.setProperty('--font-body', `"${t.fontBody}", system-ui, sans-serif`);
}

function mount(): void {
  applyTheme();

  const app = document.getElementById('app')!;
  const hero = heroSection();
  const builder = builderSection();
  const sizzle = sizzleSection();
  const menu = menuSection();
  const reviews = reviewsSection();
  const visit = locationSection();
  app.before(navBar());
  app.append(hero, tapeStrip(-3), sizzle, builder, menu, tapeStrip(2, true), reviews, visit);
  app.after(footerSection());

  initSmoothScroll();
  const ready = playIntro();
  initCart();
  initCursor();
  initWobble();
  initHero(hero, ready);
  initSizzle(sizzle);
  initBuilder(builder);
  initMenu(menu);
  initReviews(reviews);
  initLocation(visit);
  initTapes();
  initReveals();

  // Web fonts change text metrics; recalculate pin distances once they land.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

mount();
