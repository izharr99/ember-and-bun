import { content } from '../types';
import { layerImg } from '../art/layers';
import { esc, html, qs, reducedMotion } from '../lib/util';
import { getLenis, gsap, scrollToTarget } from '../lib/motion';
import { bounceIn } from '../fx/split';
import { splatter } from '../fx/confetti';

export function navBar(): HTMLElement {
  const { brand, nav } = content;
  const el = html(`
    <header class="nav">
      <a class="nav-logo" href="#top" aria-label="${esc(brand.name)} home">${esc(brand.name)}</a>
      <nav aria-label="Primary">
        <ul>${nav.map((n, i) => `<li><a href="${esc(n.href)}" style="--tilt:${i % 2 ? 2 : -2}deg">${esc(n.label)}</a></li>`).join('')}</ul>
      </nav>
    </header>`);
  el.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute('href')!;
    scrollToTarget(href === '#top' ? document.body : href);
  });
  return el;
}

/** A strip of marquee tape whose text slides with scroll. */
export function tapeStrip(tilt: number, flip = false): HTMLElement {
  const words = content.tape.map((w) => `<span>${esc(w)}</span><i aria-hidden="true">★</i>`).join('');
  return html(`
    <div class="tape${flip ? ' tape-alt' : ''}" style="--tilt:${tilt}deg" aria-hidden="true">
      <div class="tape-track">${words}${words}${words}${words}</div>
    </div>`);
}

export function initTapes(): void {
  if (reducedMotion()) return;
  gsap.utils.toArray<HTMLElement>('.tape').forEach((tape, i) => {
    gsap.fromTo(
      tape.firstElementChild,
      { xPercent: i % 2 ? -40 : 0 },
      { xPercent: i % 2 ? 0 : -40, ease: 'none', scrollTrigger: { trigger: tape, start: 'top bottom', end: 'bottom top', scrub: 0.4 } },
    );
  });
}

/** The smash: scroll brings a steel press down onto a ball of beef. Impact shakes the screen. */
export function sizzleSection(): HTMLElement {
  const s = content.sizzle;
  return html(`
    <section class="sizzle torn" aria-labelledby="sizzle-title">
      <div class="sizzle-inner">
        <div class="halftone sizzle-dots" aria-hidden="true"></div>
        <div class="sizzle-type">
          <p class="kicker">${esc(s.kicker)}</p>
          <h2 class="sizzle-lines" id="sizzle-title">
            ${s.lines.map((l) => `<span class="sizzle-line">${esc(l)}</span>`).join('')}
          </h2>
          <p class="lede">${esc(s.copy)}</p>
        </div>
        <figure class="sizzle-photo clip" aria-hidden="true"><img src="${esc(s.image)}" alt="" loading="lazy" decoding="async" width="1600" height="1200"></figure>
        <div class="grill" aria-hidden="true">
          <div class="steam-puffs">${[0, 1, 2, 3].map((i) => `<span style="--i:${i}"></span>`).join('')}</div>
          <div class="press">
            <svg viewBox="0 0 300 190"><g stroke="#1d1410" stroke-width="6" stroke-linejoin="round"><rect x="128" y="-10" width="44" height="160" rx="12" fill="#e8322b"/><rect x="10" y="146" width="280" height="40" rx="10" fill="#d9dde3"/></g><rect x="22" y="154" width="200" height="8" rx="4" fill="#fff"/><rect x="138" y="0" width="8" height="140" rx="4" fill="#fff" opacity=".6"/></svg>
          </div>
          <div class="sizzle-ball"></div>
          <div class="sizzle-patty">${layerImg('patty')}</div>
          <div class="burst sizzle-pow"><span>${esc(s.sound)}</span></div>
          <div class="griddle"></div>
          <div class="flames">${[0, 1, 2, 3, 4, 5].map((i) => `<span style="--i:${i}"></span>`).join('')}</div>
        </div>
      </div>
    </section>`);
}

export function initSizzle(root: HTMLElement): void {
  if (reducedMotion()) return;
  const inner = qs('.sizzle-inner', root);
  const grill = qs('.grill', root);
  const patty = qs('.sizzle-patty', root);
  const press = qs('.press', root);
  const IMPACT = 0.62;

  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top top', end: '+=110%', pin: true, scrub: 0.5 },
  });
  tl.fromTo(press, { yPercent: -120, rotation: -6 }, { yPercent: 0, rotation: 0, ease: 'power3.in', duration: IMPACT }, 0)
    .fromTo('.sizzle-ball', { scaleY: 1.1, scaleX: 0.92 }, { scaleY: 0.9, scaleX: 1.05, duration: 0.2, ease: 'sine.inOut' }, IMPACT - 0.2)
    .to('.sizzle-ball', { scaleX: 1.8, scaleY: 0.3, autoAlpha: 0, ease: 'power2.in', duration: 0.12 }, IMPACT)
    .fromTo(patty, { scaleX: 0.5, scaleY: 2.2, autoAlpha: 0 }, { scaleX: 1, scaleY: 1, autoAlpha: 1, ease: 'elastic.out(1, 0.35)', duration: 0.3 }, IMPACT)
    // Screen shake on impact.
    .to(inner, { keyframes: { x: [0, -16, 14, -10, 8, -4, 0], y: [0, 10, -8, 6, -3, 0], ease: 'none' }, duration: 0.14 }, IMPACT)
    .fromTo('.sizzle-pow', { scale: 0, rotation: -40, autoAlpha: 0 }, { scale: 1, rotation: -10, autoAlpha: 1, ease: 'back.out(4)', duration: 0.14 }, IMPACT + 0.02)
    .to(press, { yPercent: -8, duration: 0.12, ease: 'power2.out' }, IMPACT + 0.1)
    .to({}, { duration: 0.15 });

  // Grease bursts out whenever the press hits (in either scroll direction).
  let last = 0;
  tl.call(
    () => {
      const now = performance.now();
      if (now - last < 300) return;
      last = now;
      const r = grill.getBoundingClientRect();
      const pr = patty.getBoundingClientRect();
      splatter(grill, pr.left - r.left + pr.width / 2, pr.top - r.top + pr.height / 2, 20);
    },
    [],
    IMPACT,
  );

  // Letters bounce in as the section arrives.
  gsap.utils.toArray<HTMLElement>('.sizzle-line', root).forEach((line, i) => bounceIn(line, { trigger: root, delay: i * 0.15 }));
}

export function reviewsSection(): HTMLElement {
  const reviews = content.reviews;
  const half = Math.ceil(reviews.length / 2);
  const row = (list: typeof reviews, hidden = false) =>
    list
      .map(
        (r, i) => `
      <figure class="review" style="--tilt:${((i % 3) - 1) * 1.5}deg"${hidden ? ' aria-hidden="true"' : ''}>
        <span class="stars" aria-label="5 stars">★★★★★</span>
        <blockquote>${esc(r.quote)}</blockquote>
        <figcaption>${esc(r.author)}</figcaption>
      </figure>`,
      )
      .join('');
  // Each row is duplicated so the loop is seamless. Duplicates are hidden from screen readers.
  return html(`
    <section class="reviews torn" aria-label="Reviews">
      ${[reviews.slice(0, half), reviews.slice(half)]
        .map((list, i) => `<div class="marquee" data-dir="${i ? -1 : 1}"><div class="marquee-track">${row(list)}${row(list, true)}${row(list, true)}</div></div>`)
        .join('')}
    </section>`);
}

export function initReviews(root: HTMLElement): void {
  if (reducedMotion()) return;
  const rows = gsap.utils.toArray<HTMLElement>('.marquee', root).map((m) => ({
    track: qs('.marquee-track', m),
    dir: Number(m.dataset.dir),
    x: 0,
  }));
  let boost = 0;
  let visible = false;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(root);
  gsap.ticker.add((_, delta) => {
    if (!visible) return;
    const v = getLenis()?.velocity ?? 0;
    boost += (v * 0.6 - boost) * 0.1;
    for (const r of rows) {
      const loopWidth = r.track.scrollWidth / 3;
      r.x -= r.dir * (0.06 * delta + Math.abs(boost) * 0.5);
      r.x = gsap.utils.wrap(-loopWidth, 0, r.x);
      r.track.style.transform = `translate3d(${r.x}px,0,0) skewX(${gsap.utils.clamp(-12, 12, -boost * 0.5)}deg)`;
    }
  });
}

export function locationSection(): HTMLElement {
  const l = content.location;
  return html(`
    <section class="visit torn" id="visit" aria-labelledby="visit-title">
      <div class="halftone visit-dots" aria-hidden="true"></div>
      <figure class="visit-photo clip"><img src="${esc(l.image)}" alt="${esc(l.imageAlt)}" loading="lazy" decoding="async" width="1600" height="1205"></figure>
      <p class="kicker">${esc(l.kicker)}</p>
      <h2 class="visit-title" id="visit-title">
        ${l.headline.map((line) => `<span class="visit-line">${esc(line)}</span>`).join(' ')}
      </h2>
      <div class="visit-grid">
        <div class="visit-card">
          <h3 class="visit-h">Find us</h3>
          <address>${esc(l.address)}<br>${esc(l.city)}</address>
          <p><a class="link" href="tel:${esc(l.phone.replace(/\s/g, ''))}">${esc(l.phone)}</a></p>
          <a class="btn btn-primary" href="${esc(l.mapUrl)}" target="_blank" rel="noopener">Get directions</a>
        </div>
        <div class="receipt">
          <h3 class="visit-h">Hours</h3>
          <dl class="hours">
            ${l.hours.map((h) => `<div><dt>${esc(h.days)}</dt><dd>${esc(h.time)}</dd></div>`).join('')}
          </dl>
        </div>
      </div>
    </section>`);
}

export function initLocation(root: HTMLElement): void {
  if (reducedMotion()) return;
  gsap.utils.toArray<HTMLElement>('.visit-line', root).forEach((line, i) => {
    gsap.fromTo(
      line,
      { xPercent: i % 2 ? 40 : -40, rotation: i % 2 ? 6 : -6 },
      { xPercent: 0, rotation: i % 2 ? 2 : -2, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'top 15%', scrub: 0.5 } },
    );
  });
  gsap.from('.receipt, .visit-card', {
    y: 120,
    rotation: (i) => (i ? -14 : 12),
    autoAlpha: 0,
    duration: 1,
    ease: 'back.out(1.8)',
    stagger: 0.15,
    scrollTrigger: { trigger: '.visit-grid', start: 'top 85%' },
  });
}

export function footerSection(): HTMLElement {
  const { brand, footer } = content;
  const year = new Date().getFullYear();
  return html(`
    <footer class="footer torn">
      <p class="footer-brand split" aria-hidden="true">${esc(brand.name)}</p>
      <p>${esc(brand.tagline)}</p>
      <p class="footer-note">${esc(footer.note)} &copy; ${year}</p>
    </footer>`);
}

/** Bounce-in letters for split headings, and pop-in for stickers and ledes. */
export function initReveals(): void {
  gsap.utils.toArray<HTMLElement>('.split').forEach((el) => bounceIn(el));
  if (reducedMotion()) return;
  gsap.utils.toArray<HTMLElement>('.section-head .lede, .section-head .kicker, .menu-head .kicker, .visit > .kicker').forEach((el) => {
    gsap.from(el, {
      y: 40,
      rotation: -4,
      autoAlpha: 0,
      duration: 0.8,
      ease: 'back.out(2.5)',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });
}
