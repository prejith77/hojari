/* Inner pages: blocks rise into place once as they reach the screen, and headings rise and sharpen word by word,
   the same way as on the homepage.
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

    /* each word of a heading gets its own piece, gold words included; screen readers hear the heading whole */
    const kept = new Map();
    heads.forEach((h) => {
      kept.set(h, { nodes: [...h.childNodes].map((n) => n.cloneNode(true)), label: h.getAttribute('aria-label') });
      if (!h.hasAttribute('aria-label')) h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      const texts = [];
      const walk = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) texts.push(walk.currentNode);
      let n = 0;
      texts.forEach((t) => {
        const bits = t.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        bits.forEach((b) => {
          if (!b) return;
          if (/^\s+$/.test(b)) { frag.appendChild(document.createTextNode(b)); return; }
          const w = document.createElement('span');
          w.className = 'rv-w'; w.setAttribute('aria-hidden', 'true'); w.textContent = b;
          w.style.setProperty('--rv-wd', Math.min(n++, 12) * 50 + 'ms');
          frag.appendChild(w);
        });
        t.replaceWith(frag);
      });
      h.dataset.rvWords = n;
      h.classList.add('rv-h');
    });
    blocks.forEach((el) => el.classList.add('rv'));
    document.documentElement.classList.add('js');

    const waiting = new Set([...heads, ...blocks]);
    /* once shown, the element goes back to exactly how it was: no classes, no delays, nothing left blurred */
    const settle = (el) => {
      const k = kept.get(el);
      if (k) {
        el.replaceChildren(...k.nodes);
        if (k.label === null) el.removeAttribute('aria-label');
        delete el.dataset.rvWords;
        kept.delete(el);
      }
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
        setTimeout(() => settle(el), d + 1100 + Math.min(+(el.dataset.rvWords || 0), 12) * 50);
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
