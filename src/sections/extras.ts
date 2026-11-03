import { content } from '../types';
import { layerSvg } from '../art/layers';
import { esc, html, qs, reducedMotion } from '../lib/util';
import { getLenis, gsap, scrollToTarget } from '../lib/motion';

export function navBar(): HTMLElement {
  const { brand, nav } = content;
  const el = html(`
    <header class="nav">
      <a class="nav-logo" href="#top" aria-label="${esc(brand.name)} home">${esc(brand.name)}</a>
      <nav aria-label="Primary">
        <ul>${nav.map((n) => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('')}</ul>
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

/** The smash: scroll brings a steel press down onto a ball of beef while sparks fly. */
export function sizzleSection(): HTMLElement {
  const s = content.sizzle;
  return html(`
    <section class="sizzle" aria-labelledby="sizzle-title">
      <div class="sizzle-type">
        <p class="kicker">${esc(s.kicker)}</p>
        <h2 class="sizzle-lines" id="sizzle-title">
          ${s.lines.map((l, i) => `<span class="sizzle-line${i % 2 ? ' is-outline' : ''}">${esc(l)}</span>`).join('')}
        </h2>
        <p class="lede">${esc(s.copy)}</p>
      </div>
      <div class="grill" aria-hidden="true">
        <div class="press">
          <svg viewBox="0 0 300 190"><rect x="132" y="0" width="36" height="150" rx="10" fill="#2a2a2a"/><rect x="138" y="0" width="8" height="150" fill="#fff" opacity=".12"/><rect x="10" y="150" width="280" height="40" rx="8" fill="#b9bcc2"/><rect x="10" y="150" width="280" height="10" rx="5" fill="#fff" opacity=".5"/><rect x="10" y="182" width="280" height="8" fill="#000" opacity=".25"/></svg>
        </div>
        <div class="sizzle-ball"></div>
        <div class="sizzle-patty">${layerSvg('patty')}</div>
        <div class="sparks">${Array.from({ length: 14 }, () => '<i></i>').join('')}</div>
        <div class="smoke">${[0, 1, 2, 3].map((i) => `<span style="--i:${i}"></span>`).join('')}</div>
        <div class="griddle"></div>
      </div>
    </section>`);
}

export function initSizzle(root: HTMLElement): void {
  if (reducedMotion()) return;
  const patty = qs('.sizzle-patty', root);
  const press = qs('.press', root);
  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top top', end: '+=90%', pin: true, scrub: 0.6 },
  });
  tl.fromTo(press, { yPercent: -110 }, { yPercent: 0, ease: 'power2.in', duration: 1 }, 0)
    .to('.sizzle-ball', { scaleX: 1.7, scaleY: 0.35, autoAlpha: 0, ease: 'power2.in', duration: 0.25 }, 0.62)
    .fromTo(patty, { scaleX: 0.5, scaleY: 2, autoAlpha: 0 }, { scaleX: 1, scaleY: 1, autoAlpha: 1, ease: 'power3.out', duration: 0.38 }, 0.62)
    .to({}, { duration: 0.3 });
  gsap.fromTo(
    '.sizzle-line',
    { xPercent: (i) => (i % 2 ? 30 : -30), autoAlpha: 0 },
    {
      xPercent: 0,
      autoAlpha: 1,
      stagger: 0.12,
      scrollTrigger: { trigger: root, start: 'top 80%', end: 'top 15%', scrub: 0.6 },
    },
  );

  // Sparks loop forever while the section is on screen.
  const sparks = gsap.utils.toArray<HTMLElement>('.sparks i', root);
  const loop = gsap.timeline({ repeat: -1, paused: true });
  sparks.forEach((spark, i) => {
    loop.fromTo(
      spark,
      { x: 0, y: 0, autoAlpha: 1, scale: gsap.utils.random(0.5, 1.2) },
      {
        x: gsap.utils.random(-180, 180),
        y: gsap.utils.random(-220, -80),
        autoAlpha: 0,
        duration: gsap.utils.random(0.7, 1.4),
        ease: 'power2.out',
      },
      i * 0.12,
    );
  });
  gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (st) => (st.isActive ? loop.play() : loop.pause()),
    },
  });
}

export function reviewsSection(): HTMLElement {
  const reviews = content.reviews;
  const half = Math.ceil(reviews.length / 2);
  const row = (list: typeof reviews, hidden = false) =>
    list
      .map(
        (r) => `
      <figure class="review"${hidden ? ' aria-hidden="true"' : ''}>
        <span class="stars" aria-label="5 stars">★★★★★</span>
        <blockquote>${esc(r.quote)}</blockquote>
        <figcaption>${esc(r.author)}</figcaption>
      </figure>`,
      )
      .join('');
  // Each row is duplicated so the loop is seamless. Duplicates are hidden from screen readers.
  return html(`
    <section class="reviews" aria-label="Reviews">
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
  gsap.ticker.add((_, delta) => {
    const v = getLenis()?.velocity ?? 0;
    boost += (v * 0.6 - boost) * 0.1;
    for (const r of rows) {
      const loopWidth = r.track.scrollWidth / 3;
      r.x -= (r.dir * (0.05 * delta + Math.abs(boost) * 0.5));
      r.x = gsap.utils.wrap(-loopWidth, 0, r.x);
      r.track.style.transform = `translate3d(${r.x}px,0,0) skewX(${gsap.utils.clamp(-8, 8, -boost * 0.4)}deg)`;
    }
  });
}

export function locationSection(): HTMLElement {
  const l = content.location;
  return html(`
    <section class="visit" id="visit" aria-labelledby="visit-title">
      <p class="kicker">${esc(l.kicker)}</p>
      <h2 class="visit-title" id="visit-title">
        ${l.headline.map((line, i) => `<span class="visit-line${i % 2 ? ' is-outline' : ''}">${esc(line)}</span>`).join(' ')}
      </h2>
      <div class="visit-grid">
        <div>
          <h3 class="visit-h">Find us</h3>
          <address>${esc(l.address)}<br>${esc(l.city)}</address>
          <p><a class="link" href="tel:${esc(l.phone.replace(/\s/g, ''))}">${esc(l.phone)}</a></p>
          <a class="btn btn-primary" href="${esc(l.mapUrl)}" target="_blank" rel="noopener">Get directions</a>
        </div>
        <div>
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
      { xPercent: i % 2 ? 30 : -30 },
      { xPercent: 0, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'top 20%', scrub: 0.5 } },
    );
  });
}

export function footerSection(): HTMLElement {
  const { brand, footer } = content;
  const year = new Date().getFullYear();
  return html(`
    <footer class="footer">
      <p class="footer-brand" aria-hidden="true">${esc(brand.name)}</p>
      <p>${esc(brand.tagline)}</p>
      <p class="footer-note">${esc(footer.note)} &copy; ${year}</p>
    </footer>`);
}

/** Reveal-on-scroll for headings and ledes across sections. */
export function initReveals(): void {
  if (reducedMotion()) return;
  gsap.utils.toArray<HTMLElement>('.section-head > *, .menu-head > *, .visit .kicker, .visit-grid > *').forEach((el) => {
    gsap.from(el, {
      y: 40,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
    });
  });
}
