/* Shared by the inner pages: prices in pounds or UAE dirhams and sending a message to Prejith. */
(() => {
  const PRICES = {
    fix: { name: 'The one-week fix', build: { GBP: 450, AED: 2100 }, care: { GBP: 29, AED: 139 } },
    silver: { name: 'Front Door', build: { GBP: 750, AED: 3500 }, care: { GBP: 49, AED: 235 } },
    'royal-green': { name: 'Night Shift', build: { GBP: 1950, AED: 9250 }, care: { GBP: 99, AED: 465 } },
    signature: { name: 'Head Office', build: { GBP: 3950, AED: 18750 }, care: { GBP: 149, AED: 700 } },
  };
  const FMT = { GBP: (n) => '£' + n.toLocaleString('en-GB'), AED: (n) => 'AED ' + n.toLocaleString('en-GB') };
  /* Two currencies only, as on the homepage: dirhams in the Gulf, pounds everywhere else. A saved choice that is neither falls back to the guess */
  const GULF = /^Asia\/(Dubai|Muscat|Qatar|Bahrain|Kuwait|Riyadh)$/;
  const guess = () => { try { return GULF.test(Intl.DateTimeFormat().resolvedOptions().timeZone || '') ? 'AED' : 'GBP'; } catch (e) { return 'GBP'; } };
  let cur;
  try { cur = localStorage.getItem('hj-cur') || guess(); } catch (e) { cur = guess(); }
  if (!FMT[cur]) cur = guess();
  const subs = [];
  function paint() {
    document.querySelectorAll('.cur button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cur === cur));
    /* any price marked up with data-gbp shows in the visitor's currency */
    document.querySelectorAll('[data-gbp]').forEach((el) => { const v = +el.dataset[cur.toLowerCase()]; if (v) el.textContent = FMT[cur](v); });
    subs.forEach((f) => f(cur));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.cur button'); if (!b) return;
    if (!FMT[b.dataset.cur]) return;
    cur = b.dataset.cur; try { localStorage.setItem('hj-cur', cur); } catch (err) {}
    paint();
  });

  const FORM = 'https://formspree.io/f/mrppjrdb';
  async function send(fields, subject) {
    const body = Object.assign({ _subject: subject }, fields);
    try {
      const r = await fetch(FORM, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('form');
      return true;
    } catch (e) {
      const text = Object.keys(fields).map((k) => k + ': ' + fields[k]).join('\n');
      location.href = 'mailto:hello@hojari.co.uk?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent('Hi Prejith,\n\n' + text + '\n');
      return false;
    }
  }

  window.HJ = {
    PRICES,
    get cur() { return cur; },
    money: (n, c) => FMT[c || cur](Math.round(n)),
    founding: (n) => Math.round(n * 0.7 / 5) * 5,
    onCurrency: (f) => { subs.push(f); f(cur); },
    send,
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
  document.addEventListener('DOMContentLoaded', paint);
})();

/* The shared page motion: reveals on scroll, loaded once */
(() => {
  const me = document.currentScript;
  if (window.hjMotion || !me || document.querySelector('script[data-hj-motion]')) return;
  const s = document.createElement('script');
  s.src = new URL('motion.js', me.src).href; s.defer = true; s.dataset.hjMotion = '';
  document.head.appendChild(s);
})();
