/* Hojari: the Demo Room, The Count and prices in your currency. Plain JS, no dependencies. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Currency: GBP, USD or AED, never shown in OMR ---------- */
  const CUR = {
    GBP: { key: 'gbp', fmt: (n) => '£' + n.toLocaleString('en-GB') },
    USD: { key: 'usd', fmt: (n) => '$' + n.toLocaleString('en-US') },
    AED: { key: 'aed', fmt: (n) => 'AED ' + n.toLocaleString('en-GB') },
  };
  const guess = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz === 'Asia/Dubai') return 'AED';
      if (/^Asia\/(Muscat|Riyadh|Qatar|Bahrain|Kuwait)$/.test(tz) || tz.startsWith('America/')) return 'USD';
    } catch (e) {}
    return 'GBP';
  };
  let cur = 'GBP';
  try { cur = localStorage.getItem('hj-cur') || guess(); } catch (e) { cur = guess(); }
  if (!CUR[cur]) cur = 'GBP';
  const money = (n) => CUR[cur].fmt(Math.round(n));
  function setCur(c, save) {
    if (!CUR[c]) return;
    cur = c;
    if (save) { try { localStorage.setItem('hj-cur', c); } catch (e) {} }
    $$('[data-gbp]').forEach((el) => { el.textContent = money(+el.dataset[CUR[c].key]); });
    $$('.hj-cur button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cur === c));
    $$('.hj-cur-sym').forEach((el) => { el.textContent = c === 'GBP' ? '£' : c === 'USD' ? '$' : 'AED '; });
    count();
    document.dispatchEvent(new CustomEvent('hj:currency', { detail: c }));
  }
  window.hjCurrency = { get: () => cur, money: (n) => money(n), set: (c) => setCur(c, true) };
  $$('.hj-cur button').forEach((b) => b.addEventListener('click', () => setCur(b.dataset.cur, true)));

  /* ---------- The Demo Room tabs ---------- */
  const tabs = $$('.hj-tabs [role="tab"]');
  function pick(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    $$('.hj-side-note').forEach((n) => { n.hidden = n.dataset.for !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
    const id = tab.getAttribute('aria-controls');
    if (id === 'p-dash') drawChart();
    if (id === 'p-chat' && !chatStarted) startChat();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', (e) => {
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); pick(tabs[j], true); }
    });
  });

  /* ---------- Booking ---------- */
  const bk = $('.bk');
  if (bk) {
    const days = $('.bk-days', bk), times = $('.bk-times', bk), go = $('.bk-go', bk), done = $('.bk-done');
    const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const SLOTS = ['09:00', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:00'];
    const state = { svc: $('.bk-services .is-on', bk), day: null, time: null };
    const start = new Date(); start.setHours(12, 0, 0, 0);
    for (let i = 1; i <= 5; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.i = i;
      b.innerHTML = DAY[d.getDay()] + ' <b>' + d.getDate() + '</b><span class="sr"> ' + MON[d.getMonth()] + '</span>';
      b._date = d;
      days.appendChild(b);
    }
    function fillTimes() {
      times.innerHTML = '';
      const seed = (+state.day.dataset.i * 7 + state.svc.dataset.mins.length * 3);
      SLOTS.forEach((s, k) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = s;
        if ((k * 5 + seed) % 4 === 0) { b.disabled = true; b.setAttribute('aria-label', s + ', taken'); }
        times.appendChild(b);
      });
      state.time = null; ready();
    }
    function ready() {
      go.disabled = !state.time;
      go.textContent = state.time ? 'Book ' + state.time + ' on ' + DAY[state.day._date.getDay()] : 'Choose a time';
    }
    function on(group, btn) { $$('button', group).forEach((b) => b.classList.toggle('is-on', b === btn)); }
    $('.bk-services', bk).addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      state.svc = b; on(b.parentNode, b); fillTimes();
    });
    days.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      state.day = b; on(days, b); fillTimes();
    });
    times.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      state.time = b.textContent; on(times, b); ready();
    });
    go.addEventListener('click', () => {
      const d = state.day._date;
      $('.bk-summary', done).textContent = state.svc.dataset.svc + ', ' + DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()] + ' at ' + state.time + '.';
      bk.hidden = true; done.hidden = false;
      $('.bk-again', done).focus({ preventScroll: true });
    });
    $('.bk-again', done).addEventListener('click', () => { done.hidden = true; bk.hidden = false; fillTimes(); });
    state.day = days.firstElementChild; on(days, state.day); fillTimes();
  }

  /* ---------- Quotes ---------- */
  const qt = $('.qt');
  if (qt) {
    const rows = $$('.qt-row input', qt), m2 = $('#qt-m2'), m2out = $('.qt-slider output', qt), slider = $('.qt-slider', qt);
    const doc = $('.qt-doc');
    const lines = () => rows.filter((r) => r.checked).map((r) => {
      const name = r.parentNode.querySelector('span').textContent;
      if (r.dataset.qty) { const q = +m2.value; return [name + ', ' + q + ' m²', (+r.dataset.price) * q / 10]; }
      return [name, +r.dataset.price];
    });
    const gbp = (n) => '£' + Math.round(n).toLocaleString('en-GB');
    function total() {
      const turf = rows.find((r) => r.dataset.qty);
      slider.classList.toggle('is-off', !turf.checked);
      m2.disabled = !turf.checked;
      m2out.textContent = m2.value + ' m²';
      const sum = lines().reduce((a, l) => a + l[1], 0);
      $('.qt-sum', qt).textContent = gbp(sum);
      $('.qt-go', qt).disabled = sum === 0;
      return sum;
    }
    rows.forEach((r) => r.addEventListener('change', total));
    m2.addEventListener('input', total);
    $('.qt-go', qt).addEventListener('click', () => {
      const ul = $('.doc-lines', doc); ul.innerHTML = '';
      lines().forEach(([n, p]) => { const li = document.createElement('li'); li.innerHTML = '<span></span><b></b>'; li.firstChild.textContent = n; li.lastChild.textContent = gbp(p); ul.appendChild(li); });
      $('.qt-sum2', doc).textContent = gbp(total());
      $('.qt-date', doc).textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      $('.qt-paid', doc).hidden = true; $('.qt-accept', doc).hidden = false;
      qt.hidden = true; doc.hidden = false;
      $('#p-quote').scrollTop = 0;
    });
    $('.qt-accept', doc).addEventListener('click', (e) => { e.currentTarget.hidden = true; $('.qt-paid', doc).hidden = false; });
    $('.qt-back', doc).addEventListener('click', () => { doc.hidden = true; qt.hidden = false; });
    total();
  }

  /* ---------- Dashboard ---------- */
  const DS = {
    week: { range: 'This week', bars: [5, 7, 4, 8, 9, 6, 3], k: { bookings: '42', sales: '£3,860', new: '17', rating: '4.9' }, d: { bookings: '+12%', sales: '+8%', new: '+21%', rating: '31 reviews' } },
    month: { range: 'This month', bars: [22, 28, 25, 31, 27, 34, 30, 36, 33, 38, 35, 41], k: { bookings: '186', sales: '£16,240', new: '64', rating: '4.9' }, d: { bookings: '+9%', sales: '+14%', new: '+18%', rating: '118 reviews' } },
  };
  let range = 'week';
  const chart = $('.ds-chart');
  function drawChart() {
    if (!chart) return;
    const r = DS[range], max = Math.max(...r.bars);
    chart.innerHTML = '';
    r.bars.forEach((v) => { const i = document.createElement('i'); i.style.transform = 'scaleY(0.04)'; chart.appendChild(i); requestAnimationFrame(() => requestAnimationFrame(() => { i.style.transform = 'scaleY(' + (v / max).toFixed(3) + ')'; })); });
    chart.style.setProperty('--n', r.bars.length);
    $('.ds-range').textContent = r.range;
    Object.keys(r.k).forEach((k) => { $('[data-k="' + k + '"]').textContent = r.k[k]; $('[data-d="' + k + '"]').textContent = r.d[k]; });
  }
  $$('.ds-toggle button').forEach((b) => b.addEventListener('click', () => {
    range = b.dataset.r;
    $$('.ds-toggle button').forEach((x) => x.classList.toggle('is-on', x === b));
    drawChart();
  }));

  /* ---------- Assistant (scripted, so it never says anything wrong) ---------- */
  const log = $('.ch-log'), quick = $('.ch-quick');
  let chatStarted = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCRIPT = {
    start: { say: ["Hello, this is Harbour Dental. I can answer questions, give you prices or book you in. What can I help with?"], opts: ['price', 'book', 'hours', 'human'] },
    price: { me: 'How much is a check-up?', say: ['A check-up with a scale and polish is £65, and it takes about 40 minutes.', 'New patients get their first X-rays free. Shall I find you a time?'], opts: ['book', 'hours', 'human'] },
    book: { me: 'Can I book an appointment?', say: ['Of course. The next free check-ups are tomorrow at 9:30 and Thursday at 16:15.', 'Tap one and I’ll hold it for you.'], opts: ['slot1', 'slot2', 'human'] },
    slot1: { me: 'Tomorrow at 9:30, please.', say: ['Done. You’re booked in for tomorrow at 9:30. I’ve sent a confirmation, and I’ll remind you the evening before.'], opts: ['hours', 'restart'] },
    slot2: { me: 'Thursday at 16:15 works.', say: ['Done. You’re booked in for Thursday at 16:15. I’ve sent a confirmation, and I’ll remind you the evening before.'], opts: ['hours', 'restart'] },
    hours: { me: 'When are you open?', say: ['Monday to Friday, 8am to 7pm, and Saturday mornings until 1pm. You can book here at any hour.'], opts: ['price', 'book', 'human'] },
    human: { me: 'Can I speak to a person?', say: ['Sure. I’ve passed your message to the front desk with everything you’ve said so far. Sarah will message you back within the hour, so you won’t have to repeat yourself.'], opts: ['restart'] },
    restart: { me: 'Start again', reset: true },
  };
  const LABEL = { price: 'How much is a check-up?', book: 'Book an appointment', hours: 'Opening hours', human: 'Talk to a person', slot1: 'Tomorrow 9:30', slot2: 'Thursday 16:15', restart: 'Start again' };
  function bubble(text, who) {
    const p = document.createElement('p'); p.className = 'ch-msg ' + who; p.textContent = text; log.appendChild(p);
    const panel = $('#p-chat'); panel.scrollTo({ top: panel.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
    return p;
  }
  function options(list) {
    quick.innerHTML = '';
    list.forEach((k) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = LABEL[k]; b.dataset.k = k; quick.appendChild(b); });
  }
  async function run(key) {
    const s = SCRIPT[key];
    if (s.reset) { log.innerHTML = ''; return run('start'); }
    quick.innerHTML = '';
    if (s.me) bubble(s.me, 'me');
    for (const line of s.say) {
      const t = bubble('Typing…', 'bot typing');
      await new Promise((r) => setTimeout(r, reduce ? 150 : 550 + Math.min(900, line.length * 9)));
      t.classList.remove('typing'); t.textContent = line;
    }
    options(s.opts);
  }
  function startChat() { if (!log) return; chatStarted = true; run('start'); }
  quick && quick.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) run(b.dataset.k); });

  /* ---------- The Count ---------- */
  const apps = $('.ct-apps');
  const START = [['Booking system', 45], ['Email marketing', 30], ['Accounts', 28], ['Website builder', 22]];
  function row(name, cost) {
    const d = document.createElement('div'); d.className = 'ct-row';
    d.innerHTML = '<input type="text" aria-label="App name" maxlength="40"><input class="ct-cost" type="number" inputmode="decimal" min="0" step="1" aria-label="Cost per month"><button type="button" aria-label="Remove">×</button>';
    d.children[0].value = name; d.children[0].placeholder = 'App name';
    d.children[1].value = cost; d.children[1].placeholder = '0';
    apps.appendChild(d);
    return d;
  }
  function count() {
    if (!apps) return;
    const h = $('#ct-h'), r = $('#ct-r');
    const soft = $$('.ct-cost', apps).reduce((a, i) => a + Math.max(0, +i.value || 0), 0) * 12;
    const time = (+h.value) * (+r.value) * 52;
    $('output[for="ct-h"]').textContent = h.value + (h.value === '1' ? ' hour' : ' hours');
    $('output[for="ct-r"]').textContent = money(+r.value);
    $('.ct-soft').textContent = money(soft);
    $('.ct-time').textContent = money(time);
    $('.ct-total').textContent = money(soft + time);
    return { soft, time, apps: $$('.ct-row', apps).map((d) => d.children[0].value.trim() + ' ' + money(+d.children[1].value || 0)).filter((x) => x.trim()), hours: h.value, rate: money(+r.value) };
  }
  if (apps) {
    START.forEach(([n, c]) => row(n, c));
    apps.addEventListener('input', count);
    apps.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { b.parentNode.remove(); count(); } });
    $('.ct-add').addEventListener('click', () => { row('', '').children[0].focus(); });
    $('#ct-h').addEventListener('input', count);
    $('#ct-r').addEventListener('input', count);
    $('.ct-send').addEventListener('click', (e) => {
      const c = count();
      const note = 'My numbers: ' + money(c.soft + c.time) + ' a year (' + money(c.soft) + ' on software, ' + money(c.time) + ' on ' + c.hours + ' hours of admin a week at ' + c.rate + ' an hour). Apps: ' + (c.apps.join(', ') || 'none listed');
      if (window.hjLead) { e.preventDefault(); window.hjLead(note); }
    });
  }

  setCur(cur, false);
})();
