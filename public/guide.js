/* The short answer at the top of each guide: the big number counts up once, and the sum follows what the visitor types. */
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (cur, v) => cur + Math.round(v).toLocaleString(cur === '₹' ? 'en-IN' : 'en-GB');

  document.querySelectorAll('.gh').forEach((card) => {
    /* the big number: count up once when it comes into view, if it is a single plain number */
    const big = card.querySelector('.gh-big');
    const m = big && big.textContent.trim().match(/^([^\d]*)(\d[\d,]*\.?\d*)([^\d]*)$/);
    if (m && !still && window.IntersectionObserver) {
      const end = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, final = big.textContent;
      const show = (v) => { big.textContent = m[1] + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-GB')) + m[3]; };
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return; io.disconnect();
        const t0 = performance.now(), dur = 900;
        const tick = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); if (p < 1) { show(end * e); requestAnimationFrame(tick); } else big.textContent = final; };
        show(0); requestAnimationFrame(tick);
      }, { threshold: 0.6 });
      io.observe(big);
    }

    /* the sum */
    const f = card.querySelector('.gh-calc'); if (!f) return;
    const a = f.querySelector('[data-a]'), b = f.querySelector('[data-b]'), out = f.querySelector('output');
    const d = f.dataset, cur = d.cur || '', rate = parseFloat(d.rate) || 1, n = parseFloat(d.n) || 1, cap = parseFloat(d.cap) || Infinity, c = parseFloat(d.c) || 0;
    let shown = null, raf = 0;
    const work = () => {
      const x = Math.max(0, parseFloat(a.value) || 0), y = b ? Math.max(0, parseFloat(b.value) || 0) : 1;
      return d.type === 'div' ? (y ? x / y : 0) : x * Math.min(y * rate, cap) * n + c;
    };
    const paint = () => {
      const to = work();
      if (still || shown === null) { shown = to; out.textContent = fmt(cur, to); return; }
      cancelAnimationFrame(raf);
      const from = shown, t0 = performance.now();
      const tick = (t) => { const p = Math.min(1, (t - t0) / 260), e = 1 - Math.pow(1 - p, 3); shown = from + (to - from) * e; out.textContent = fmt(cur, shown); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    };
    [a, b].forEach((i) => i && i.addEventListener('input', paint));
    paint();
  });
})();

/* The shared page motion: reveals on scroll, loaded once */
(() => {
  const me = document.currentScript;
  if (window.hjMotion || !me || document.querySelector('script[data-hj-motion]')) return;
  const s = document.createElement('script');
  s.src = new URL('motion.js', me.src).href; s.defer = true; s.dataset.hjMotion = '';
  document.head.appendChild(s);
})();
