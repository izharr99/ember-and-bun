import './styles.css';
import { content } from './types';
import { DEFS } from './art/layers';
import { initSmoothScroll, ScrollTrigger } from './lib/motion';
import { initCart } from './cart';
import { heroSection, initHero } from './sections/hero';
import { builderSection, initBuilder } from './sections/builder';
import { initMenu, menuSection } from './sections/menu';
import {
  footerSection,
  initLocation,
  initReveals,
  initReviews,
  initSizzle,
  locationSection,
  navBar,
  reviewsSection,
  sizzleSection,
} from './sections/extras';

/** Theme tokens come from content.json so a rebrand never touches CSS. */
function applyTheme(): void {
  const t = content.theme;
  const root = document.documentElement.style;
  root.setProperty('--bg', t.bg);
  root.setProperty('--surface', t.surface);
  root.setProperty('--ink', t.ink);
  root.setProperty('--muted', t.muted);
  root.setProperty('--accent', t.accent);
  root.setProperty('--accent-2', t.accent2);
  root.setProperty('--font-display', `"${t.fontDisplay}", Impact, "Arial Narrow", sans-serif`);
  root.setProperty('--font-body', `"${t.fontBody}", system-ui, sans-serif`);
}

function mount(): void {
  applyTheme();
  document.body.insertAdjacentHTML('afterbegin', DEFS);

  const app = document.getElementById('app')!;
  const hero = heroSection();
  const builder = builderSection();
  const sizzle = sizzleSection();
  const menu = menuSection();
  const reviews = reviewsSection();
  const visit = locationSection();
  app.before(navBar());
  app.append(hero, sizzle, builder, menu, reviews, visit);
  app.after(footerSection());

  initSmoothScroll();
  initCart();
  initHero(hero);
  initSizzle(sizzle);
  initBuilder(builder);
  initMenu(menu);
  initReviews(reviews);
  initLocation(visit);
  initReveals();

  // Web fonts change text metrics; recalculate pin distances once they land.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

mount();
