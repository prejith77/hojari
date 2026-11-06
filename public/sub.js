/* Shared by the inner pages: prices in your currency (GBP, USD or AED) and sending a message to Prejith. */
(() => {
  const PRICES = {
    silver: { name: 'Silver', build: { GBP: 750, USD: 975, AED: 3500 }, care: { GBP: 49, USD: 65, AED: 235 } },
    'royal-green': { name: 'Royal Green', build: { GBP: 1950, USD: 2500, AED: 9250 }, care: { GBP: 99, USD: 129, AED: 465 } },
    signature: { name: 'Signature', build: { GBP: 3950, USD: 5100, AED: 18750 }, care: { GBP: 149, USD: 195, AED: 700 } },
  };
  const FMT = { GBP: (n) => '£' + n.toLocaleString('en-GB'), USD: (n) => '$' + n.toLocaleString('en-US'), AED: (n) => 'AED ' + n.toLocaleString('en-GB') };
  const guess = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz === 'Asia/Dubai') return 'AED';
      if (/^Asia\/(Muscat|Riyadh|Qatar|Bahrain|Kuwait)$/.test(tz) || tz.startsWith('America/')) return 'USD';
    } catch (e) {}
    return 'GBP';
  };
  let cur;
  try { cur = localStorage.getItem('hj-cur') || guess(); } catch (e) { cur = guess(); }
  if (!FMT[cur]) cur = 'GBP';
  const subs = [];
  function paint() {
    document.querySelectorAll('.cur button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cur === cur));
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
