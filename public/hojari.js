/* Hojari: the homepage's night-to-morning phone, The Count and prices in your currency. Plain JS, no dependencies. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Currency: picked from where the visitor is, never shown in OMR ---------- */
  const CUR = {
    GBP: { key: 'gbp', sym: '£', fmt: (n) => '£' + n.toLocaleString('en-GB') },
    USD: { key: 'usd', sym: '$', fmt: (n) => '$' + n.toLocaleString('en-US') },
    EUR: { key: 'eur', sym: '€', fmt: (n) => '€' + n.toLocaleString('en-GB') },
    AUD: { key: 'aud', sym: 'A$', fmt: (n) => 'A$' + n.toLocaleString('en-AU') },
    CAD: { key: 'cad', sym: 'C$', fmt: (n) => 'C$' + n.toLocaleString('en-CA') },
    AED: { key: 'aed', sym: 'AED ', fmt: (n) => 'AED ' + n.toLocaleString('en-GB') },
  };
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
  /* The homepage shows two currencies only: dirhams in the Gulf, pounds everywhere else */
  const pairEl = $('.hj-cur[data-pair]');
  const pair = pairEl ? pairEl.dataset.pair.split(' ') : null;
  const GULF = /^Asia\/(Dubai|Muscat|Qatar|Bahrain|Kuwait|Riyadh)$/;
  const guessPair = () => { try { return GULF.test(Intl.DateTimeFormat().resolvedOptions().timeZone || '') ? 'AED' : 'GBP'; } catch (e) { return 'GBP'; } };
  let cur = 'GBP';
  try { cur = localStorage.getItem('hj-cur') || guess(); } catch (e) { cur = guess(); }
  if (!CUR[cur]) cur = 'GBP';
  if (pair && !pair.includes(cur)) cur = guessPair();
  const money = (n) => CUR[cur].fmt(Math.round(n));
  /* Rough exchange rates, so a typed price keeps its meaning when the currency changes */
  const RATE = { GBP: 1, USD: 1.3, EUR: 1.2, AUD: 1.96, CAD: 1.88, AED: 4.75 };
  const RANGE = { GBP: [8, 80], USD: [10, 105], EUR: [10, 95], AUD: [16, 160], CAD: [15, 150], AED: [40, 380] };
  const conv = (n, from, to) => Math.round(n * RATE[to] / RATE[from]);
  function setCur(c, save) {
    if (!CUR[c] || (pair && !pair.includes(c))) return;
    if (c !== cur) recount(cur, c);
    cur = c;
    if (save) { try { localStorage.setItem('hj-cur', c); } catch (e) {} }
    $$('[data-gbp]').forEach((el) => { const v = +el.dataset[CUR[c].key]; if (v) el.textContent = money(v); });
    $$('.hj-cur button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cur === c));
    $$('.hj-cur-sym').forEach((el) => { el.textContent = CUR[c].sym; });
    count();
    document.dispatchEvent(new CustomEvent('hj:currency', { detail: c }));
  }
  window.hjCurrency = { get: () => cur, money: (n) => money(n), set: (c) => setCur(c, true) };
  $$('.hj-cur button').forEach((b) => b.addEventListener('click', () => setCur(b.dataset.cur, true)));

  /* ---------- The Count ---------- */
  const apps = $('.ct-apps'), chips = $('.ct-chips');
  /* Typical monthly prices in pounds; they convert to the visitor's currency */
  const START = [['Booking system', 45], ['Email marketing', 30], ['Accounts app', 28], ['Website builder', 22]];
  const PRESETS = [['Online shop', 29], ['Customer records (CRM)', 40], ['Rotas and scheduling', 35], ['Forms and surveys', 20], ['Live chat', 25], ['Reviews app', 30], ['Loyalty app', 35], ['Invoicing app', 15], ['Design app', 11], ['Phone system', 25], ['Email and office apps', 12], ['File storage', 8]].concat(START);
  function recount(from, to) {
    if (!apps) return;
    $$('.ct-cost', apps).forEach((i) => { if (i.value !== '') i.value = conv(+i.value, from, to); });
    const hr = $('#ct-r'), v = conv(+hr.value, from, to);
    hr.min = RANGE[to][0]; hr.max = RANGE[to][1]; hr.value = Math.min(RANGE[to][1], Math.max(RANGE[to][0], v));
  }
  function paintChips() {
    if (!chips) return;
    const have = new Set($$('.ct-row', apps).map((d) => d.children[0].value.trim().toLowerCase()));
    chips.innerHTML = '';
    PRESETS.filter(([n]) => !have.has(n.toLowerCase())).forEach(([n, c]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ct-chip'; b.dataset.n = n; b.dataset.c = c;
      b.innerHTML = '<span></span><b></b>'; b.firstChild.textContent = n; b.lastChild.textContent = '+ ' + money(conv(c, 'GBP', cur));
      chips.appendChild(b);
    });
    $('.ct-presets').hidden = !chips.children.length;
  }
  function row(name, cost) {
    const d = document.createElement('div'); d.className = 'ct-row';
    d.innerHTML = '<input type="text" aria-label="App name" maxlength="60"><input class="ct-cost" type="number" inputmode="decimal" min="0" step="1" aria-label="Cost per month"><button type="button" aria-label="Remove">×</button>';
    d.children[0].value = name; d.children[0].placeholder = 'App name';
    d.children[1].value = cost; d.children[1].placeholder = '0';
    apps.appendChild(d);
    return d;
  }
  function count() {
    if (!apps) return;
    paintChips();
    const h = $('#ct-h'), r = $('#ct-r');
    const soft = $$('.ct-cost', apps).reduce((a, i) => a + Math.max(0, +i.value || 0), 0) * 12;
    const time = (+h.value) * (+r.value) * 52;
    $('output[for="ct-h"]').textContent = h.value + (h.value === '1' ? ' hour' : ' hours');
    $('output[for="ct-r"]').textContent = money(+r.value);
    $('.ct-soft').textContent = money(soft);
    $('.ct-time').textContent = money(time);
    $('.ct-total').textContent = money(soft + time);
    return { soft, time, apps: $$('.ct-row', apps).filter((d) => d.children[0].value.trim() || +d.children[1].value > 0).map((d) => (d.children[0].value.trim() || 'Unnamed app') + ' ' + money(Math.max(0, +d.children[1].value || 0))), hours: h.value, rate: money(+r.value) };
  }
  if (apps) {
    START.forEach(([n, c]) => row(n, conv(c, 'GBP', cur)));
    const hr = $('#ct-r'); hr.min = RANGE[cur][0]; hr.max = RANGE[cur][1]; hr.value = conv(20, 'GBP', cur);
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('.ct-chip'); if (!b) return;
      row(b.dataset.n, conv(+b.dataset.c, 'GBP', cur)); count();
      const next = chips.querySelector('.ct-chip'); if (next) next.focus({ preventScroll: true });
    });
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

  /* ---------- A voice note from Prejith: hidden until the recording is added ---------- */
  const voice = $('.hj-voice');
  if (voice) {
    const au = $('audio', voice), btn = $('.hj-voice-btn', voice), time = $('.hj-voice-time', voice);
    /* Switch on with data-ready="yes" once assets/prejith-hello.mp3 is uploaded */
    if (voice.dataset.ready === 'yes') { voice.hidden = false; au.preload = 'metadata'; }
    const mins = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    btn.addEventListener('click', () => { if (au.paused) au.play(); else au.pause(); });
    au.addEventListener('play', () => { voice.classList.add('is-playing'); btn.setAttribute('aria-label', 'Pause the voice note'); });
    const where = 'Recorded in Muscat';
    au.addEventListener('pause', () => { voice.classList.remove('is-playing'); btn.setAttribute('aria-label', 'Play a voice message from Prejith'); });
    au.addEventListener('loadedmetadata', () => { time.textContent = where + ' · ' + mins(au.duration); });
    au.addEventListener('timeupdate', () => { if (au.duration) { time.textContent = mins(au.currentTime) + ' / ' + mins(au.duration); btn.style.setProperty('--p', (au.currentTime / au.duration).toFixed(3)); } });
    au.addEventListener('ended', () => { btn.style.setProperty('--p', 0); time.textContent = where + ' · ' + mins(au.duration); });
    /* The same note, played from the strip near the top */
    const wp = $('.hj-who-play');
    if (wp && voice.dataset.ready === 'yes') {
      const lbl = $('span', wp); wp.hidden = false;
      wp.addEventListener('click', () => btn.click());
      au.addEventListener('play', () => { wp.classList.add('is-playing'); lbl.textContent = 'Pause'; });
      au.addEventListener('pause', () => { wp.classList.remove('is-playing'); lbl.textContent = 'Hear me say hello'; });
    }
  }

  /* ---------- Homepage hero: a night of messages, then one calm morning ----------
     Without JavaScript, or with reduced motion, the phone simply shows 7:00 am and the Night Shift card.
     With motion it plays once, in about five seconds: at 11:47 pm messages pile up and the badge counts to 37,
     then the clock turns to 7:00 am and they fold into one card. Only transform and opacity move. */
  const stage = $('.hx-stage');
  if (stage && stage.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const phone = $('.hx-phone', stage), notes = $$('.hx-note', stage).reverse(), countEl = $('.hx-count', stage);
    const out = 'cubic-bezier(.23, 1, .32, 1)', inOut = 'cubic-bezier(.77, 0, .175, 1)';
    const pitch = () => (notes[0].offsetHeight || 64) + 8;
    const slotOf = (slot) => {
      /* newest on top; older ones step down, and past the fourth they tuck in behind */
      const tucked = slot > 3;
      return { transform: `translateY(${Math.min(slot, 3) * pitch() + (tucked ? 8 : 0)}px) scale(${tucked ? 0.94 : 1})`, opacity: tucked ? 0 : 1 };
    };
    stage.classList.add('is-night');
    countEl.textContent = '0';
    const T = [300, 720, 1080, 1380, 1640, 1860, 2060];
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    notes.forEach((n, i) => at(T[i], () => {
      n.animate([{ transform: 'translateY(-16px) scale(.96)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: 380, easing: out, fill: 'forwards' });
      for (let k = 0; k < i; k++) notes[k].animate([slotOf(i - k)], { duration: 380, easing: out, fill: 'forwards' });
      /* every other arrival, the phone gives a small buzz */
      if (i % 2 === 0) phone.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(0)' }], { duration: 220, easing: 'linear' });
    }));
    /* the badge climbs to 37 while the messages land */
    const c0 = performance.now() + T[0], cDur = T[T.length - 1] + 500 - T[0];
    const tick = (now) => {
      const p = Math.min(1, Math.max(0, (now - c0) / cDur));
      countEl.textContent = String(Math.round(37 * (1 - Math.pow(1 - p, 2))));
      if (p < 1 && !stage.classList.contains('is-dawn')) requestAnimationFrame(tick); else countEl.textContent = '37';
    };
    requestAnimationFrame(tick);
    /* 7:00 am: the clock turns over, the messages fold away and the card arrives */
    at(3000, () => stage.classList.add('is-dawn'));
    at(3250, () => notes.slice().reverse().forEach((n, k) => {
      const from = getComputedStyle(n).transform;
      n.animate([{ transform: from === 'none' ? 'none' : from, opacity: +getComputedStyle(n).opacity }, { transform: `translateY(${pitch()}px) scale(.88)`, opacity: 0 }], { duration: 460, delay: k * 40, easing: inOut, fill: 'forwards' });
    }));
    at(3800, () => stage.classList.add('is-morning'));
    /* a tap on the phone skips straight to the morning */
    stage.addEventListener('pointerdown', () => { timers.forEach(clearTimeout); stage.classList.add('is-dawn', 'is-morning'); }, { once: true });
  }

  /* ---------- How it works: on laptops the steps light up one by one as you read down ---------- */
  const stepList = $('.hx-steps');
  if (stepList && window.IntersectionObserver && matchMedia('(min-width: 900px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stepList.classList.add('is-scroll');
    const so = new IntersectionObserver((ens) => ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-lit'); so.unobserve(en.target); } }), { rootMargin: '0px 0px -38% 0px' });
    $$('.hx-step', stepList).forEach((li) => so.observe(li));
  }

  setCur(cur, false);

  /* Phones: a bar with the two main actions follows your thumb once the hero has gone, and steps aside at the form */
  const mbar = $('.m-bar'), hero = $('#top'), contactSec = $('#contact');
  if (mbar && hero && window.IntersectionObserver) {
    let pastHero = false, atForm = false;
    const show = () => mbar.classList.toggle('is-on', pastHero && !atForm);
    new IntersectionObserver(([en]) => { pastHero = !en.isIntersecting; show(); }, { rootMargin: '-40% 0px 0px 0px' }).observe(hero);
    /* from the form down to the footer, the bar stays out of the way */
    if (contactSec) { const check = () => { const at = contactSec.getBoundingClientRect().top < innerHeight * 0.85; if (at !== atForm) { atForm = at; show(); } }; addEventListener('scroll', () => requestAnimationFrame(check), { passive: true }); check(); }
  }
  /* The cursor ring steps aside over form fields */
  const ring = $('.ring');
  if (ring) $$('input, textarea, select').forEach((f) => { f.addEventListener('mouseenter', () => ring.classList.add('is-hidden')); f.addEventListener('mouseleave', () => ring.classList.remove('is-hidden')); });
  /* ---------- Motion pass: one job each ---------- */
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Work: on a laptop the long screenshot pans down the page on hover. The distance is the image's height less the frame's */
  const travel = () => $$('.hj-shots').forEach((s) => { const im = $('img.long', s); if (im && im.offsetHeight) s.style.setProperty('--travel', Math.min(0, s.clientHeight - im.offsetHeight) + 'px'); });
  $$('.hj-shots img.long').forEach((im) => { if (im.complete) travel(); else im.addEventListener('load', travel); });
  addEventListener('resize', travel, { passive: true });

  /* Prices: a soft light follows the cursor across the plan cards */
  if (finePointer) $$('.hj-plan').forEach((p) => p.addEventListener('pointermove', (e) => {
    const r = p.getBoundingClientRect(); p.style.setProperty('--mx', (e.clientX - r.left) + 'px'); p.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* Between sections: a thin line of light draws across as each section arrives */
  const seams = $$('main > section:not(.hero):not(.hx-hero)');
  if (window.IntersectionObserver && !calm) {
    seams.forEach((s) => s.classList.add('has-seam'));
    const so = new IntersectionObserver((ens) => ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('seam-on'); so.unobserve(en.target); } }), { rootMargin: '0px 0px -30% 0px' });
    seams.forEach((s) => so.observe(s));
  } else seams.forEach((s) => s.classList.add('has-seam', 'seam-on'));
})();
