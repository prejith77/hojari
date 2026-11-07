/* Build your app in 60 seconds: four choices, and a phone app that builds itself and can be tapped through. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ICON = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    booking: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    ordering: '<path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    loyalty: '<rect x="3" y="6" width="18" height="13" rx="3"/><circle cx="8" cy="12.5" r="1.6"/><circle cx="12" cy="12.5" r="1.6"/><circle cx="16" cy="12.5" r="1.6"/>',
    messages: '<path d="M4 5h16v11H9l-5 4z"/>',
    account: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    offers: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
    quotes: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7M9 8h3"/>',
    gallery: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  };
  const svg = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>';

  const FEATURES = {
    booking: ['Bookings', 'Pick a time'], ordering: ['Order', 'Order and pay'], loyalty: ['Loyalty card', 'Collect stamps'],
    messages: ['Messages', 'Ask us anything'], account: ['My account', 'Your bookings'], offers: ['Offers', 'This week only'],
    quotes: ['Get a quote', 'Price it yourself'], gallery: ['Gallery', 'Our latest work'],
  };
  const TYPES = {
    salon: { label: 'Salon or spa', tag: 'Time for you', hours: 'Open today, 9:00 to 20:00', svc: [['Cut and finish', '45 min', 45], ['Colour', '2 hours', 95], ['Gel manicure', '40 min', 30], ['Hot stone massage', '75 min', 70]], items: [['Argan hair oil', 24], ['Shampoo and conditioner', 32], ['Gift card', 50]], quotes: [['Bridal hair', 180], ['Bridesmaids, each', 65], ['Make-up trial', 60]], stamp: 'Your 8th treatment is on us', offer: [['20% off your first visit', 'WELCOME20'], ['Bring a friend and you both save £10', 'FRIEND10']] },
    cafe: { label: 'Café or restaurant', tag: 'Fresh this morning', hours: 'Open today, 7:00 to 22:00', svc: [['Table for 2', 'Inside or terrace', 0], ['Table for 4', 'Inside or terrace', 0], ['Brunch for 6', 'Weekends', 0]], items: [['Flat white', 3.4], ['Karak chai', 2.8], ['Shakshuka', 9.5], ['Pistachio croissant', 3.9]], quotes: [['Office breakfast for 10', 120], ['Party platter', 85], ['Celebration cake', 45]], stamp: 'Your 8th coffee is on us', offer: [['Free coffee with breakfast before 10', 'EARLY'], ['Two cakes for £6 after 3pm', 'AFTERNOON']] },
    clinic: { label: 'Clinic', tag: 'Looking after you', hours: 'Open today, 8:00 to 19:00', svc: [['Check-up', '30 min', 65], ['Physio session', '45 min', 55], ['Consultation', '20 min', 40]], items: [['Gift voucher', 50], ['Home exercise kit', 25]], quotes: [['Course of 6 physio sessions', 300], ['Teeth whitening', 350], ['Sports massage, 3 sessions', 150]], stamp: 'Your 8th session is half price', offer: [['First consultation free', 'FIRSTVISIT'], ['Family check-ups, 15% off', 'FAMILY15']] },
    trades: { label: 'Trades', tag: 'Done properly', hours: 'Taking jobs Monday to Saturday', svc: [['Free site visit', '30 min', 0], ['Boiler service', '1 hour', 85], ['Emergency call-out', 'Within 2 hours', 120]], items: [['Smoke alarm, fitted', 45], ['Smart thermostat, fitted', 220]], quotes: [['Bathroom refit', 3200], ['New boiler', 2400], ['Garden fence, 10 m', 950], ['Repaint a room', 380]], stamp: 'Your 8th service is free', offer: [['10% off any job booked this month', 'SPRING10'], ['Free check with every boiler service', 'CHECKUP']] },
    fitness: { label: 'Gym or studio', tag: 'Let’s move', hours: 'Open today, 6:00 to 22:00', svc: [['Spin class', '45 min', 12], ['Yoga', '60 min', 12], ['Personal training', '60 min', 40]], items: [['Protein shake', 4.5], ['Class pack of 10', 100], ['Gym towel', 15]], quotes: [['12-week coaching plan', 480], ['Team session for 8', 160], ['Nutrition plan', 90]], stamp: 'Your 8th class is free', offer: [['First week free', 'FIRSTWEEK'], ['Bring a friend to any class', 'BUDDY']] },
    shop: { label: 'Shop', tag: 'New in this week', hours: 'Open today, 10:00 to 21:00', svc: [['Personal shopping', '30 min', 0], ['Click and collect', 'Pick a slot', 0]], items: [['Linen shirt', 45], ['Leather wallet', 38], ['Scented candle', 22], ['Gift wrap', 3]], quotes: [['Corporate gifts, 20 boxes', 600], ['Custom engraving', 25], ['Wedding list', 0]], stamp: 'Your 8th purchase gets 25% off', offer: [['15% off your first order', 'HELLO15'], ['Free delivery over £50', 'FREEDEL']] },
  };
  const COLOURS = [['Forest', '#2b5a42'], ['Amber', '#b8661d'], ['Plum', '#5b2a4a'], ['Ocean', '#1f4e6b'], ['Terracotta', '#b5532f'], ['Charcoal', '#2b2925']];

  const st = { name: 'Saffron & Sage', type: 'salon', colour: '#2b5a42', feats: ['booking', 'loyalty', 'messages'], screen: 'home', step: 0 };
  const app = $('.dv-app'), tabs = $('.dv-tabs'), dv = $('.dv');

  /* Prices follow the visitor's currency, at friendly round numbers */
  const RATE = { GBP: 1, USD: 1.3, AED: 4.75 };
  /* Pounds stay exact; dollars and dirhams round to friendly numbers */
  const conv = (n) => { const v = n * RATE[HJ.cur]; return HJ.cur === 'GBP' ? Math.round(v * 100) / 100 : v < 20 ? Math.round(v * 2) / 2 : Math.round(v / 5) * 5; };
  const price = (n, done) => {
    if (!n) return 'Free';
    const r = done ? n : conv(n);
    const s = r % 1 ? r.toFixed(2) : r.toLocaleString('en-GB');
    return HJ.cur === 'GBP' ? '£' + s : HJ.cur === 'USD' ? '$' + s : 'AED ' + s;
  };

  /* ---------- Controls ---------- */
  const stepTabs = $$('.bd-steps [role="tab"]');
  const panels = stepTabs.map((t) => $('#' + t.getAttribute('aria-controls')));
  const prev = $('.bd-prev'), next = $('.bd-next'), done = $('.bd-done'), navBox = $('.bd-nav');
  function showStep(i, focus) {
    st.step = i;
    stepTabs.forEach((t, j) => { t.setAttribute('aria-selected', j === i); t.tabIndex = j === i ? 0 : -1; t.classList.toggle('is-done', j < i || (!done.hidden && j <= 3)); panels[j].hidden = j !== i; });
    prev.hidden = i === 0;
    next.textContent = i === 3 ? 'Finish my app' : 'Next';
    if (focus) stepTabs[i].focus();
  }
  stepTabs.forEach((t, i) => {
    t.addEventListener('click', () => { done.hidden = true; navBox.hidden = false; showStep(i); });
    t.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); showStep((i + d + 4) % 4, true); }
    });
  });
  prev.addEventListener('click', () => showStep(st.step - 1));
  next.addEventListener('click', () => {
    if (st.step < 3) return showStep(st.step + 1);
    navBox.hidden = true; panels.forEach((p) => { p.hidden = true; }); stepTabs.forEach((t) => t.classList.add('is-done'));
    done.hidden = false;
    const q = new URLSearchParams({ from: 'build', name: st.name, features: st.feats.join(',') });
    $('.bd-price').href = '../start/?' + q.toString();
    if (matchMedia('(max-width: 899px)').matches) $('.bd-device').scrollIntoView({ behavior: HJ.reduce ? 'auto' : 'smooth', block: 'start' });
    go('home');
  });
  $('.bd-again').addEventListener('click', () => { done.hidden = true; navBox.hidden = false; showStep(0); });

  const nameIn = $('#b-name');
  nameIn.addEventListener('input', () => { st.name = nameIn.value.trim() || 'Your business'; paintHero(); });
  nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); showStep(1); } });

  const typeBox = $('[data-k="type"]');
  Object.keys(TYPES).forEach((k) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.v = k;
    b.textContent = TYPES[k].label; b.setAttribute('aria-checked', k === st.type);
    typeBox.appendChild(b);
  });
  typeBox.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    st.type = b.dataset.v;
    $$('button', typeBox).forEach((x) => x.setAttribute('aria-checked', x === b));
    if (st.type === 'trades' && !st.feats.includes('quotes') && st.feats.length < 3) st.feats.push('quotes');
    paintFeats(); go('home', true);
  });

  const sw = $('.bd-swatches');
  COLOURS.forEach(([n, c]) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.v = c;
    b.style.setProperty('--sw', c); b.setAttribute('aria-label', n); b.setAttribute('aria-checked', c === st.colour);
    sw.appendChild(b);
  });
  sw.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    st.colour = b.dataset.v; dv.style.setProperty('--c', st.colour);
    $$('button', sw).forEach((x) => x.setAttribute('aria-checked', x === b));
  });

  const featBox = $('.bd-feats');
  Object.keys(FEATURES).forEach((k) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.v = k;
    b.innerHTML = svg(k) + '<span>' + FEATURES[k][0] + '</span>';
    featBox.appendChild(b);
  });
  function paintFeats() {
    $$('button', featBox).forEach((b) => {
      const on = st.feats.includes(b.dataset.v);
      b.setAttribute('aria-pressed', on);
      b.disabled = !on && st.feats.length >= 3;
    });
    const n = st.feats.length;
    $('.bd-left').textContent = n >= 3 ? 'That’s three, the Hojari standard.' : 'Up to 3. ' + (3 - n) + ' left.';
  }
  featBox.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const k = b.dataset.v;
    st.feats = st.feats.includes(k) ? st.feats.filter((x) => x !== k) : st.feats.concat(k);
    paintFeats(); go('home', true);
  });

  /* ---------- The app ---------- */
  function paintHero() {
    const h = $('.ap-name', app), l = $('.ap-logo', app);
    if (h) h.textContent = st.name;
    if (l) l.textContent = st.name.trim().charAt(0).toUpperCase() || 'Y';
  }
  function paintTabs() {
    const list = ['home'].concat(st.feats);
    tabs.innerHTML = list.map((k) => '<button type="button" data-go="' + k + '"' + (st.screen === k ? ' aria-current="page"' : '') + '>' + svg(k) + (k === 'home' ? 'Home' : FEATURES[k][0].replace('Loyalty card', 'Loyalty').replace('My account', 'Account').replace('Get a quote', 'Quote')) + '</button>').join('');
  }
  const T = () => TYPES[st.type];
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const SCREENS = {
    home() {
      const tiles = st.feats.map((k, i) => '<button type="button" class="ap-tile" style="--i:' + i + '" data-go="' + k + '">' + svg(k) + '<b>' + FEATURES[k][0] + '</b><span>' + FEATURES[k][1] + '</span></button>').join('');
      return '<div class="ap-hero"><div class="ap-brand"><span class="ap-logo"></span><p class="ap-name"></p></div><p class="ap-hi">' + hello + '</p><p class="ap-tag">' + esc(T().tag) + '</p></div>'
        + '<div class="ap-body"><div class="ap-tiles">' + (tiles || '<p class="ap-card" style="grid-column:1/-1">Pick up to three features and they appear here.</p>') + '</div>'
        + '<div class="ap-card"><b style="font-size:14px">' + esc(T().hours) + '</b><p class="ap-sub" style="padding:4px 0 0">Tap anything above. It all works.</p></div></div>';
    },
    booking() {
      return head('Book a time', 'Pick a service, then a time') + '<div class="ap-body"><div class="ap-list" data-pick="svc">'
        + T().svc.map((s, i) => '<button type="button" class="ap-row" data-i="' + i + '"><span>' + esc(s[0]) + '<small>' + esc(s[1]) + '</small></span><b>' + price(s[2]) + '</b></button>').join('')
        + '</div><p class="ap-sub">Tomorrow</p><div class="ap-times">' + ['9:00', '10:30', '12:00', '14:00', '16:30', '18:00'].map((t, i) => '<button type="button"' + (i === 2 ? ' disabled style="opacity:.35;text-decoration:line-through"' : '') + '>' + t + '</button>').join('') + '</div><button type="button" class="ap-btn" data-act="book" disabled>Choose a service and a time</button></div>';
    },
    ordering() {
      return head(st.type === 'cafe' ? 'Order ahead' : 'Shop', st.type === 'cafe' ? 'Skip the queue' : 'Delivered or ready to collect') + '<div class="ap-body"><div class="ap-list">'
        + T().items.map((s, i) => '<div class="ap-row" style="cursor:default"><span>' + esc(s[0]) + '<small>' + price(s[1]) + '</small></span><button type="button" class="ap-add" data-add="' + i + '" aria-label="Add ' + esc(s[0]) + '">+</button></div>').join('')
        + '</div><div class="ap-basket"><button type="button" class="ap-btn" data-act="order" disabled>Your basket is empty</button></div></div>';
    },
    loyalty() {
      return head('Loyalty card', T().stamp) + '<div class="ap-body"><div class="ap-stamps" aria-label="Stamps">' + '<i></i>'.repeat(8) + '</div><p class="ap-sub ap-stampnote"></p><button type="button" class="ap-btn" data-act="stamp">Collect a stamp</button></div>';
    },
    messages() {
      return head('Messages', 'Usually replies straight away') + '<div class="ap-body"><div class="ap-chat"><p class="ap-msg">Hi, welcome to ' + esc(st.name) + '. How can we help?</p></div><div class="ap-quick"><button type="button" data-q="open">Are you open today?</button><button type="button" data-q="park">Is there parking?</button><button type="button" data-q="change">Can I change my booking?</button></div></div>';
    },
    account() {
      const s = T().svc[0];
      return head('Hi, Layla', 'Your account') + '<div class="ap-body"><div class="ap-card"><p class="ap-sub" style="padding:0">Coming up</p><b style="display:block;margin-top:4px;font-size:15px">' + esc(s[0]) + ', Thursday at 10:30</b><p class="ap-sub" style="padding:4px 0 0">We’ll remind you the day before.</p></div><div class="ap-stat"><div><b>12</b><span>Visits</span></div><div><b>5 of 8</b><span>Stamps</span></div></div><div class="ap-list"><div class="ap-row" style="cursor:default">Receipts<small></small><b>›</b></div><div class="ap-row" style="cursor:default">Payment cards<b>›</b></div><div class="ap-row" style="cursor:default">Notifications<b>On</b></div></div></div>';
    },
    offers() {
      return head('Offers', 'Tap one to claim it') + '<div class="ap-body">' + T().offer.map((o, i) => '<div class="ap-offer"><b>' + esc(o[0].replace('£10', price(10)).replace('£6', price(6)).replace('£50', price(50))) + '</b><span class="ap-sub" style="padding:0">Show the code at the till or use it online.</span><button type="button" class="ap-btn" data-claim="' + i + '" style="min-height:42px">Claim</button></div>').join('') + '</div>';
    },
    quotes() {
      return head('Get a quote', 'Tick what you need') + '<div class="ap-body"><div class="ap-list" data-pick="quote">'
        + T().quotes.map((s, i) => '<button type="button" class="ap-row" data-i="' + i + '" aria-pressed="false"><span>' + esc(s[0]) + '</span><b>' + (s[1] ? 'from ' + price(s[1]) : 'Ask') + '</b></button>').join('')
        + '</div><div class="ap-card" style="display:flex;justify-content:space-between;align-items:baseline"><span>Estimate</span><b class="ap-qsum" style="font:400 1.6rem/1 var(--serif)">' + price(0).replace('Free', '–') + '</b></div><button type="button" class="ap-btn" data-act="quote" disabled>Tick at least one</button></div>';
    },
    gallery() {
      return head('Gallery', 'Our latest work') + '<div class="ap-body"><div class="ap-gallery">' + [135, 200, 45, 300, 90, 160].map((a) => '<i style="--a:' + a + 'deg"></i>').join('') + '</div></div>';
    },
  };
  function head(t, s) { return '<div class="ap-body" style="padding-bottom:0"><button type="button" class="ap-back" data-go="home">‹ Home</button><p class="ap-h">' + esc(t) + '</p><p class="ap-sub">' + esc(s) + '</p></div>'; }
  function ok(t, s) { app.innerHTML = '<div class="ap-body"><button type="button" class="ap-back" data-go="home">‹ Home</button><div class="ap-ok"><i></i><b>' + esc(t) + '</b><p>' + esc(s) + '</p></div><button type="button" class="ap-btn" data-go="home">Back to home</button></div>'; app.scrollTop = 0; }

  let stamps = 5, basket = [], svcI = null, timeT = null, picks = [];
  function go(screen, rebuild) {
    if (screen !== 'home' && !st.feats.includes(screen)) screen = 'home';
    st.screen = screen;
    app.innerHTML = SCREENS[screen]();
    app.scrollTop = 0;
    paintHero(); paintTabs();
    svcI = null; timeT = null; basket = []; picks = [];
    if (screen === 'loyalty') paintStamps();
    if (rebuild && screen === 'home') $$('.ap-tile', app).forEach((t) => { t.style.animation = 'none'; t.offsetWidth; t.style.animation = ''; });
  }
  function paintStamps() {
    $$('.ap-stamps i', app).forEach((s, i) => s.classList.toggle('on', i < stamps));
    $('.ap-stampnote', app).textContent = stamps >= 8 ? 'Card full. ' + T().stamp + '.' : (8 - stamps) + ' more to go.';
    $('[data-act="stamp"]', app).textContent = stamps >= 8 ? 'Start a new card' : 'Collect a stamp';
  }
  const reply = { open: 'Yes, ' + '{hours}' + '. You can book in this app at any hour.', park: 'There’s free parking right outside, and a bigger car park two minutes away.', change: 'Of course. Open My account, tap your booking and pick a new time. Or tell me the day that suits you and I’ll sort it.' };

  app.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g) return go(g.dataset.go);
    const row = e.target.closest('.ap-row[data-i]');
    if (row && row.parentNode.dataset.pick === 'svc') {
      svcI = +row.dataset.i; $$('.ap-row', row.parentNode).forEach((r) => r.classList.toggle('is-on', r === row));
    }
    if (row && row.parentNode.dataset.pick === 'quote') {
      const on = row.getAttribute('aria-pressed') !== 'true'; row.setAttribute('aria-pressed', on); row.classList.toggle('is-on', on);
      picks = $$('.ap-row.is-on', row.parentNode).map((r) => +r.dataset.i);
      const sum = picks.reduce((a, i) => a + conv(T().quotes[i][1]), 0);
      $('.ap-qsum', app).textContent = sum ? price(sum, true) : '–';
      const b = $('[data-act="quote"]', app); b.disabled = !picks.length; b.textContent = picks.length ? 'Request this quote' : 'Tick at least one';
    }
    const tm = e.target.closest('.ap-times button');
    if (tm && !tm.disabled) { timeT = tm.textContent; $$('.ap-times button', app).forEach((b) => b.classList.toggle('is-on', b === tm)); }
    if (st.screen === 'booking') {
      const b = $('[data-act="book"]', app);
      if (b) { b.disabled = svcI === null || !timeT; b.textContent = b.disabled ? 'Choose a service and a time' : 'Book ' + timeT + ' tomorrow'; }
    }
    const add = e.target.closest('[data-add]');
    if (add) {
      basket.push(+add.dataset.add);
      const total = Math.round(basket.reduce((a, i) => a + conv(T().items[i][1]), 0) * 100) / 100;
      const b = $('[data-act="order"]', app); b.disabled = false; b.textContent = 'Order ' + basket.length + (basket.length === 1 ? ' item' : ' items') + ' · ' + price(total, true);
      add.animate([{ transform: 'scale(.85)' }, { transform: 'scale(1)' }], { duration: 200, easing: 'cubic-bezier(.23,1,.32,1)' });
    }
    const claim = e.target.closest('[data-claim]');
    if (claim) { const c = document.createElement('span'); c.className = 'ap-code'; c.textContent = T().offer[+claim.dataset.claim][1]; claim.replaceWith(c); }
    const q = e.target.closest('[data-q]');
    if (q) {
      const chat = $('.ap-chat', app);
      const me = document.createElement('p'); me.className = 'ap-msg me'; me.textContent = q.textContent; chat.appendChild(me);
      q.remove();
      setTimeout(() => {
        if (!chat.isConnected) return;
        const r = document.createElement('p'); r.className = 'ap-msg'; r.textContent = reply[q.dataset.q].replace('{hours}', T().hours.toLowerCase().replace('open today, ', 'we’re open ')); chat.appendChild(r);
        app.scrollTo({ top: app.scrollHeight, behavior: HJ.reduce ? 'auto' : 'smooth' });
      }, HJ.reduce ? 0 : 650);
    }
    const act = e.target.closest('[data-act]');
    if (!act || act.disabled) return;
    const a = act.dataset.act;
    if (a === 'book') ok('You’re booked', T().svc[svcI][0] + ', tomorrow at ' + timeT + '. A confirmation is on its way.');
    if (a === 'order') ok(st.type === 'cafe' ? 'Order placed' : 'Thank you', st.type === 'cafe' ? 'It’ll be ready in 10 minutes. We’ll message you.' : 'Paid. We’ll message you when it’s on its way.');
    if (a === 'quote') ok('Quote sent', 'You’ll have a fixed price by tomorrow, and you can accept it in the app.');
    if (a === 'stamp') { stamps = stamps >= 8 ? 0 : stamps + 1; paintStamps(); }
  });
  tabs.addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });

  let built = false;
  HJ.onCurrency(() => { if (built) go(st.screen); });
  dv.style.setProperty('--c', st.colour);
  paintFeats(); showStep(0); go('home'); built = true;
})();
