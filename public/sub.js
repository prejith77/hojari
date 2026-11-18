/* Shared by the inner pages: prices in your currency (GBP, USD, EUR, AUD, CAD or AED) and sending a message to Prejith. */
(() => {
  const PRICES = {
    fix: { name: 'The one-week fix', build: { GBP: 450, USD: 585, EUR: 540, AUD: 890, CAD: 850, AED: 2100 }, care: { GBP: 29, USD: 39, EUR: 35, AUD: 59, CAD: 55, AED: 139 } },
    silver: { name: 'Front Door', build: { GBP: 750, USD: 975, EUR: 900, AUD: 1475, CAD: 1425, AED: 3500 }, care: { GBP: 49, USD: 65, EUR: 59, AUD: 99, CAD: 95, AED: 235 } },
    'royal-green': { name: 'Night Shift', build: { GBP: 1950, USD: 2500, EUR: 2350, AUD: 3850, CAD: 3700, AED: 9250 }, care: { GBP: 99, USD: 129, EUR: 119, AUD: 195, CAD: 189, AED: 465 } },
    signature: { name: 'Head Office', build: { GBP: 3950, USD: 5100, EUR: 4750, AUD: 7750, CAD: 7450, AED: 18750 }, care: { GBP: 149, USD: 195, EUR: 179, AUD: 295, CAD: 285, AED: 700 } },
  };
  const FMT = { GBP: (n) => '£' + n.toLocaleString('en-GB'), USD: (n) => '$' + n.toLocaleString('en-US'), EUR: (n) => '€' + n.toLocaleString('en-GB'), AUD: (n) => 'A$' + n.toLocaleString('en-AU'), CAD: (n) => 'C$' + n.toLocaleString('en-CA'), AED: (n) => 'AED ' + n.toLocaleString('en-GB') };
  const guess = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz === 'Europe/London' || tz === 'Europe/Belfast') return 'GBP';
      if (tz === 'Asia/Dubai') return 'AED';
      if (tz.startsWith('Australia/')) return 'AUD';
      if (/^America\/(Toronto|Montreal|Vancouver|Edmonton|Calgary|Winnipeg|Regina|Halifax|St_Johns|Moncton|Whitehorse|Yellowknife|Iqaluit|Glace_Bay|Goose_Bay|Swift_Current|Dawson_Creek|Fort_Nelson|Nipigon|Thunder_Bay|Rankin_Inlet|Resolute|Cambridge_Bay|Inuvik|Atikokan|Creston|Blanc-Sablon|Dawson)$/.test(tz)) return 'CAD';
      if (tz.startsWith('Europe/')) return 'EUR';
    } catch (e) {}
    return 'USD';
  };
  let cur;
  try { cur = localStorage.getItem('hj-cur') || guess(); } catch (e) { cur = guess(); }
  if (!FMT[cur]) cur = 'GBP';
  const subs = [];
  function paint() {
    document.querySelectorAll('.cur button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cur === cur));
    /* any price marked up with data-gbp shows in the visitor's currency */
    document.querySelectorAll('[data-gbp]').forEach((el) => { const v = +el.dataset[cur.toLowerCase()]; if (v) el.textContent = FMT[cur](v); });
    subs.forEach((f) => f(cur));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.cur button'); if (!b) return;
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
