/* Inner pages: blocks rise into place once as they reach the screen, and headings lift out of a mask.
   Only what starts below the screen is held back, so nothing on the first screen ever waits.
   Without JavaScript, or with reduced motion, everything simply shows. */
(() => {
  if (window.hjMotion) return;
  window.hjMotion = true;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const HEADS = [
    '.pg-sec > h2', '.gd-all-title', '.legal > h2', '.sl h2', '.xr-what h2', '.ck-or > .ck-h2',
  ].join(',');
  const BLOCKS = [
    /* section text and panels */
    '.pg-sec > :not(h2):not(.pg-list):not(.pg-steps):not(.pg-price):not(.pg-guides):not(.pg-qs):not(.pg-links):not(.gd-pick)',
    '.gd-pick', '.pg-end', '.pg-offer', '.sl-end',
    /* lists and cards, which stagger */
    '.pg-list > li', '.pg-steps > li', '.pg-price > *', '.pg-guides > li', '.pg-links > li', '.pg-qs > details',
    /* the legal pages */
    '.legal > p:not(.lede)', '.legal > ul', '.legal > ol',
  ].join(',');

  const run = () => {
    const vh = innerHeight;
    const later = (el) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.top > vh * 0.92 && !el.closest('[hidden], form, .q, .pt');
    };
    const heads = [...document.querySelectorAll(HEADS)].filter((h) => later(h) && !h.closest('.pg-end, .pg-offer, .sl-end'));
    const blocks = [...document.querySelectorAll(BLOCKS)].filter((el) => later(el) && !el.closest('.rv'));
    if (!heads.length && !blocks.length) return;

    heads.forEach((h) => {
      const inner = document.createElement('span');
      inner.className = 'rv-hi';
      while (h.firstChild) inner.appendChild(h.firstChild);
      h.appendChild(inner);
      h.classList.add('rv-h');
    });
    blocks.forEach((el) => el.classList.add('rv'));
    document.documentElement.classList.add('js');

    const waiting = new Set([...heads, ...blocks]);
    /* once shown, the element goes back to exactly how it was: no classes, no delays, nothing left blurred */
    const settle = (el) => {
      el.classList.remove('rv', 'rv-h', 'rv-on');
      el.style.removeProperty('--rv-d');
    };
    const show = (els) => {
      els.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      els.forEach((el, i) => {
        if (!waiting.delete(el)) return;
        io.unobserve(el);
        const d = Math.min(i, 5) * 70;
        if (d) el.style.setProperty('--rv-d', d + 'ms');
        el.classList.add('rv-on');
        setTimeout(() => settle(el), d + 1100);
      });
    };
    const io = new IntersectionObserver((entries) => {
      const now = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      if (now.length) show(now);
    }, { rootMargin: '0px 0px -8% 0px' });
    waiting.forEach((el) => io.observe(el));

    /* a jump (a link to a section, a refresh halfway down) shows everything above the screen straight away */
    let queued = false;
    const check = () => {
      queued = false;
      const passed = [...waiting].filter((el) => el.getBoundingClientRect().top < innerHeight * 0.92);
      if (passed.length) show(passed);
      if (!waiting.size) { removeEventListener('scroll', soon); removeEventListener('resize', soon); }
    };
    const soon = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
    addEventListener('scroll', soon, { passive: true });
    addEventListener('resize', soon, { passive: true });
    addEventListener('beforeprint', () => show([...waiting]));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
