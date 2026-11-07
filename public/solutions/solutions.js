/* What I can build: filter the solutions by type of business. */
(() => {
  const btns = [...document.querySelectorAll('.sl-filter button')];
  const cards = [...document.querySelectorAll('.sl-card')];
  const count = document.querySelector('.sl-count');
  const NAMES = { all: 'every business', food: 'food and drink', beauty: 'health and beauty', coach: 'coaches and clinics', trades: 'trades and home services', shop: 'shops', club: 'gyms and clubs', pro: 'professional services' };
  function show(t, fromClick) {
    btns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === t));
    const shown = cards.filter((c) => t === 'all' || c.dataset.types.split(' ').includes(t));
    cards.forEach((c) => { c.hidden = !shown.includes(c); c.classList.remove('is-in'); });
    if (fromClick) { void document.body.offsetWidth; shown.forEach((c) => c.classList.add('is-in')); }
    const n = shown.length;
    count.textContent = n + ' ways I can help ' + NAMES[t] + '.';
    try { history.replaceState(null, '', t === 'all' ? location.pathname : '#' + t); } catch (e) {}
  }
  btns.forEach((b) => b.addEventListener('click', () => show(b.dataset.t, true)));
  const start = location.hash.slice(1);
  show(NAMES[start] ? start : 'all', false);
})();
