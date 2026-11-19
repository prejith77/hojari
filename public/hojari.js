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
    $$('[data-gbp]').forEach((el) => { const v = +el.dataset[CUR[c].key]; if (v) { if (window.hjRollStop) window.hjRollStop(el); el.textContent = money(v); } });
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

  /* ---------- Rolling numbers: digits roll up into place once, odometer style ----------
     Each digit gets a strip of digits that slides up behind a clip; a hidden copy of the final digit holds its width,
     so nothing around it moves. Screen readers get the final number only, and when it lands the element goes back to plain text. */
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || !document.body.animate;
  const rolls = new Map();
  function rollStop(el) { const r = rolls.get(el); if (r) { rolls.delete(el); r.anims.forEach((a) => a.cancel()); } }
  /* builds the roll, paused on its first frame; play() sets it going */
  function rollMake(el, opt = {}) {
    rollStop(el);
    const final = opt.to || el.textContent.trim();
    const digits = final.replace(/\D/g, '');
    if (still || !digits) return null;
    const from = (opt.from || '').replace(/\D/g, '').padStart(digits.length, '0').slice(-digits.length);
    const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = final;
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    const cols = [];
    let k = 0;
    for (const ch of final) {
      if (!/\d/.test(ch)) { vis.append(ch); continue; }
      const d = +ch, left = digits.length - 1 - k;            // left: how many digits sit to its right
      let a = opt.from ? +from[k] : 0, b = d;
      if (b < a) b += 10;
      if (!opt.from && left < 2) b += 10;                      // the last two digits spin one extra turn
      const col = document.createElement('span'); col.className = 'rc-d';
      const ph = document.createElement('span'); ph.className = 'rc-ph'; ph.textContent = ch;
      const strip = document.createElement('span'); strip.className = 'rc-s';
      for (let i = a; i <= b; i++) { const s = document.createElement('span'); s.textContent = i % 10; strip.append(s); }
      col.append(ph, strip); vis.append(col);
      cols.push({ strip, steps: b - a, n: b - a + 1, k });
      k++;
    }
    el.replaceChildren(sr, vis);
    const dur = opt.dur || 1300, delay = opt.delay || 0;
    const anims = cols.map((c) => {
      const an = c.strip.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${(-100 * c.steps / c.n).toFixed(4)}%)` }],
        { duration: dur + c.k * 90, delay: delay + c.k * 70, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'both' });
      an.pause();
      return an;
    });
    const r = { anims, final };
    rolls.set(el, r);
    Promise.all(anims.map((a) => a.finished)).then(() => {
      if (rolls.get(el) !== r) return;
      rolls.delete(el); el.textContent = final;
      if (opt.done) opt.done();
    }).catch(() => {});
    return r;
  }
  function roll(el, opt) {
    const r = rollMake(el, opt);
    if (r) r.anims.forEach((a) => a.play());
    else { if (opt && opt.to) el.textContent = opt.to; if (opt && opt.done) opt.done(); }
  }
  window.hjRoll = roll;
  window.hjRollStop = rollStop;

  /* ---------- Try the Night Shift: a night of messages, then one calm morning, then a phone you can use ----------
     Without JavaScript, or with reduced motion, the phone simply shows 7:00 am and the Night Shift card.
     With motion the story plays once when the phone comes into view, in about nine seconds: at 11:47 pm messages pile up
     and the badge counts to 37, then the clock turns to 7:00 am and they fold into one card. Only transform and opacity move.
     Then it is the visitor's turn: tap a message or the card and they are the customer, chatting with an example salon. */
  const stage = $('.hx-stage');
  if (stage && $('.hx-app', stage)) {
    const motion = !!stage.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = $('.hx-phone', stage), screen = $('.hx-screen', stage), lockview = $('.hx-lockview', stage), app = $('.hx-app', stage);
    const card = $('.hx-card', stage), cardNums = $$('.hx-card li b', stage), noteList = $('.hx-notes', stage);
    const notesDom = $$('.hx-note', stage);
    const after = $('.hx-after'), say = $('#hx-say');
    let morning = false, cardRolled = false, open = false, booked = false, seven = false, opener = null;

    /* It stops being a picture: real buttons, read out properly */
    stage.removeAttribute('role');
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', 'Example phone. Tap a message or the Night Shift card to chat as a customer of Saffron Salon, a made-up salon.');
    phone.removeAttribute('aria-hidden');
    $$('.hx-lock, .hx-badge, .hx-dock, .hx-dawn, .hx-island', stage).forEach((el) => el.setAttribute('aria-hidden', 'true'));
    const hit = (label) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'hx-hit'; b.setAttribute('aria-label', label); return b; };
    const asks = notesDom.map((li) => {
      const who = $('.hx-nt b', li).textContent, said = $('.hx-nt span', li).textContent;
      $$('.hx-ico, .hx-nt, time', li).forEach((el) => el.setAttribute('aria-hidden', 'true'));
      let ask = said, label = 'Reply as ' + who + ': ' + said;
      if (li.classList.contains('is-call')) { ask = null; label = 'Open the chat as ' + said.split(',')[0] + ', who rang twice'; }
      if (li.classList.contains('is-form')) { ask = 'Can I book for 6 people on Friday?'; label = 'Reply to the website enquiry: party of 6, Friday'; }
      const b = hit(label); b.hidden = true; li.append(b);
      b.addEventListener('click', () => openApp(ask ? { text: ask } : { missed: true }, b));
      return b;
    });
    const cardHit = hit('Open the chat with Saffron Salon, as a customer');
    card.append(cardHit);
    cardHit.addEventListener('click', () => openApp(null, cardHit));
    const pill = document.createElement('button');
    pill.type = 'button'; pill.className = 'hx-pill';
    pill.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5H4.5z"/></svg><span></span>';
    pill.lastChild.textContent = 'Message Saffron Salon';
    lockview.append(pill);
    pill.addEventListener('click', () => openApp(null, pill));

    const rollCard = () => {
      if (cardRolled) return;
      cardRolled = true;
      if (motion) cardNums.forEach((b, i) => roll(b, { delay: 300 + i * 140 }));
    };
    const toMorning = () => {
      if (morning) return;
      morning = true;
      asks.forEach((b) => { b.hidden = true; });
      noteList.setAttribute('aria-hidden', 'true'); noteList.inert = true;
      cardHit.hidden = false;
      if (!open) rollCard();
    };

    /* ----- the night: plays once, when the phone comes into view ----- */
    if (motion) {
      const notes = notesDom.slice().reverse(), hits = asks.slice().reverse(), countEl = $('.hx-count', stage);
      const out = 'cubic-bezier(.23, 1, .32, 1)', inOut = 'cubic-bezier(.77, 0, .175, 1)';
      const pitch = () => (notes[0].offsetHeight || 64) + 8;
      const slotOf = (slot) => {
        /* newest on top; older ones step down, and past the fourth they tuck in behind */
        const tucked = slot > 3;
        return { transform: `translateY(${Math.min(slot, 3) * pitch() + (tucked ? 8 : 0)}px) scale(${tucked ? 0.94 : 1})`, opacity: tucked ? 0 : 1 };
      };
      stage.classList.add('is-night');
      cardHit.hidden = true;
      countEl.textContent = '0';
      const T = [600, 1500, 2300, 3000, 3600, 4150, 4650];
      const timers = [];
      const at = (ms, fn) => timers.push(setTimeout(fn, ms));
      let started = false;
      const dawn = () => { timers.forEach(clearTimeout); stage.classList.add('is-dawn', 'is-morning'); toMorning(); };
      const play = () => {
        if (started || morning) return;
        started = true;
        stage.classList.add('is-play');
        notes.forEach((n, i) => at(T[i], () => {
          n.animate([{ transform: 'translateY(-16px) scale(.96)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: 650, easing: out, fill: 'forwards' });
          for (let k = 0; k < i; k++) { notes[k].animate([slotOf(i - k)], { duration: 650, easing: out, fill: 'forwards' }); if (i - k > 3) hits[k].hidden = true; }
          hits[i].hidden = false;
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
        at(6900, () => { stage.classList.add('is-dawn'); asks.forEach((b) => { b.hidden = true; }); });
        at(7300, () => notes.slice().reverse().forEach((n, k) => {
          const from = getComputedStyle(n).transform;
          n.animate([{ transform: from === 'none' ? 'none' : from, opacity: +getComputedStyle(n).opacity }, { transform: `translateY(${pitch()}px) scale(.88)`, opacity: 0 }], { duration: 750, delay: k * 70, easing: inOut, fill: 'forwards' });
        }));
        at(8300, () => { stage.classList.add('is-morning'); toMorning(); });
      };
      if (window.IntersectionObserver) { const po = new IntersectionObserver(([en]) => { if (en.isIntersecting) { po.disconnect(); play(); } }, { threshold: 0.4 }); po.observe(stage); }
      else play();
      /* a tap on the lock screen skips straight to the morning (a tap on a message also opens the chat) */
      lockview.addEventListener('pointerdown', (e) => { if (!morning && !e.target.closest('.hx-hit')) dawn(); });
      stage.hjDawn = dawn;
    } else toMorning();

    /* ----- the chat: the visitor is the customer, the salon answers straight away ----- */
    const log = $('.hx-log', app), chips = $('.hx-chips', app), form = $('.hx-compose', app), input = $('#hx-msg'), clock = $('.hx-now', app);
    const CHIPS = $$('button', chips).map((b) => b.textContent);
    const hc = (() => { try { return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle || 'h23'; } catch (e) { return 'h23'; } })();
    const tick = () => {
      const d = new Date(), m = String(d.getMinutes()).padStart(2, '0');
      clock.textContent = (/h1[12]/.test(hc) ? String(d.getHours() % 12 || 12) : String(d.getHours()).padStart(2, '0')) + ':' + m;
    };
    let clockT = 0;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const toEnd = () => { log.scrollTo({ top: log.scrollHeight, behavior: motion ? 'smooth' : 'auto' }); };
    const add = (node) => { node.classList.add('is-new'); log.append(node); toEnd(); return node; };
    const bubble = (me, text) => {
      const d = document.createElement('div'); d.className = 'hx-msg ' + (me ? 'is-me' : 'is-them');
      const who = document.createElement('span'); who.className = 'sr'; who.textContent = me ? 'You: ' : 'Saffron Salon: ';
      const p = document.createElement('p'); p.textContent = text;
      d.append(who, p);
      return add(d);
    };
    let queue = Promise.resolve();
    /* every answer waits behind a short "typing…", the way a person's would */
    const reply = (fn) => {
      queue = queue.then(async () => {
        const t = document.createElement('div'); t.className = 'hx-msg is-them hx-typing'; t.setAttribute('aria-hidden', 'true');
        t.innerHTML = '<i></i><i></i><i></i>';
        add(t);
        await wait(motion ? 600 + Math.random() * 300 : 120);
        t.remove();
        fn();
      });
      return queue;
    };
    let offer = null, mode = 'chat', pick = null;
    const answer = (text, next) => reply(() => { bubble(false, text); offer = next || null; });

    /* prices: 35 pounds a head, in the visitor's currency, rounded to a friendly number */
    const each = () => { const c = cur; return c === 'GBP' ? 35 : Math.round(35 * RATE[c] / 5) * 5; };
    const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2 };
    const people = (t) => {
      const m = t.match(/\b(\d{1,2})\b/); if (m && +m[1] > 0 && +m[1] <= 20) return +m[1];
      const w = Object.keys(WORDS).find((k) => new RegExp('\\b' + k + '\\b').test(t)); return w ? WORDS[w] : 1;
    };
    const price = (t) => {
      const n = people(t);
      reply(() => {
        const one = each(), f = (v) => CUR[cur].fmt(v);
        bubble(false, n > 1 ? `A cut and finish is ${f(one)} per person, so ${f(one * n)} for ${n} of you. These are example prices. Shall I book you in?`
          : `A cut and finish is ${f(one)}. That's an example price. Shall I book you in?`);
        offer = 'book';
      });
    };

    /* booking: three times on the day asked for, or tomorrow; then a name; then it's booked */
    const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOf = (t) => {
      const now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), d = new Date(next);
      const named = DAYS.findIndex((x) => t.includes(x));
      if (named >= 0 && !t.includes('tomorrow')) { while (d.getDay() !== named) d.setDate(d.getDate() + 1); }
      const name = d.toLocaleDateString('en-GB', { weekday: 'long' });
      const tomorrow = d.getTime() === next.getTime();
      return { date: d, name, label: tomorrow ? 'tomorrow, ' + name : 'on ' + name, full: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) };
    };
    const slots = (day) => {
      offer = null;
      reply(() => {
        const b = bubble(false, `Here's what's free ${day.label}:`);
        const g = document.createElement('div'); g.className = 'hx-slots'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Times free ' + day.label);
        (day.date.getDay() === 0 ? ['10 am', '12:30 pm', '2:30 pm'] : ['10 am', '1:30 pm', '4 pm']).forEach((tm) => {
          const s = document.createElement('button'); s.type = 'button'; s.textContent = tm; s.setAttribute('aria-pressed', 'false');
          s.addEventListener('click', () => {
            if (g.dataset.done || mode === 'name') return;
            g.dataset.done = '1';
            $$('button', g).forEach((o) => { o.setAttribute('aria-disabled', 'true'); o.setAttribute('aria-pressed', String(o === s)); });
            pick = { day, time: tm };
            mode = 'name';
            bubble(true, tm + ', please');
            reply(() => { bubble(false, 'Lovely. What name shall I put it under?'); setChips(['Skip']); input.placeholder = 'Your name'; });
          });
          g.append(s);
        });
        b.append(g);
        toEnd();
      });
    };
    const book = (name) => {
      const who = (name || '').trim().slice(0, 40) || 'Guest';
      const p = pick;
      mode = 'chat'; pick = null; booked = true;
      input.placeholder = 'Message';
      reply(() => {
        bubble(false, `Booked: ${p.day.name} at ${p.time}. You'll get a reminder the day before.`);
        const c = document.createElement('div'); c.className = 'hx-conf';
        c.innerHTML = '<p class="hx-conf-k"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>Booking confirmed<i>Example</i></p><p class="hx-conf-t"></p><p></p><p class="hx-conf-m"></p>';
        const ps = $$('p', c);
        ps[1].textContent = p.day.full; ps[2].textContent = p.time + ', cut and finish'; ps[3].textContent = 'Name: ' + who;
        add(c);
        setChips(CHIPS);
        const s = document.createElement('p'); s.className = 'hx-sys'; s.textContent = 'Now tap the bar at the bottom to see it land on the owner’s phone.';
        add(s);
      });
    };
    function setChips(list) {
      const had = chips.contains(document.activeElement);
      chips.replaceChildren(...list.map((t) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; return b; }));
      chips.scrollLeft = 0;
      if (had) chips.firstChild.focus({ preventScroll: true });
    }

    /* what a customer types, matched on a few plain words */
    const route = (text) => {
      const t = text.toLowerCase();
      const has = (...w) => w.some((x) => t.includes(x));
      if (has('cancel', 'reschedul', 'change my', 'move my')) return answer("No problem. Every booking comes with a link to change or cancel it, up to 24 hours before. Or tell me here and I'll move it for you. Want to pick a new time?", 'book');
      if (has('park')) return answer("Yes, there's free parking right behind the salon. We're at 14 Market Street, next to the library.");
      if (has('where', 'location', 'address', 'find you', 'directions')) return answer("We're at 14 Market Street, next to the library. There's free parking behind the salon, and the bus stops right outside.");
      if (has('price', 'how much', 'cost', 'charge')) return price(t);
      if (has('book', 'appointment', 'slot', 'anything free', 'free on', 'space', 'availab')) return slots(dayOf(t));
      if (has('open', 'hours', 'sunday', 'close')) return answer("Yes, we're open on Sunday from 10 am to 4 pm. Monday to Saturday it's 9 am to 7 pm. Want me to find you a time?", 'book');
      if (has('tomorrow', 'time', 'today')) return slots(dayOf(t));
      if (offer === 'book' && /^(yes|yeah|yep|ok|okay|sure|please|go on|go for it)\b/.test(t)) return slots(dayOf(t));
      if (/^(no|nope|not now|maybe later)\b/.test(t)) return answer("No problem. I'm here whenever you need me.");
      if (/\b(thanks|thank you|cheers)\b/.test(t)) return answer('You’re welcome. See you soon!');
      if (/^(hi|hello|hey|hiya|good (morning|afternoon|evening))\b/.test(t)) return answer('Hello! Thanks for messaging Saffron Salon. Ask me about times, prices or where we are, or I can book you in.');
      return answer("Thanks! I've passed this to the owner, who'll reply first thing. Want to book a time meanwhile?", 'book');
    };
    const send = (text) => {
      text = text.trim();
      if (!text) return;
      if (mode === 'name') { bubble(true, text); book(text); return; }
      bubble(true, text);
      route(text);
    };
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (mode === 'name' && b.textContent === 'Skip') { book(''); return; }
      send(b.textContent);
      /* a question once asked steps aside, like quick replies on a phone; when all four are used they come back */
      if (mode !== 'chat' || !b.isConnected) return;
      const next = b.nextElementSibling || b.previousElementSibling;
      if (!next) { setChips(CHIPS); return; }
      const had = document.activeElement === b;
      b.remove();
      chips.scrollTo({ left: 0, behavior: motion ? 'smooth' : 'auto' });
      if (had) next.focus({ preventScroll: true });
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; send(v); });

    /* ----- opening and closing the chat, like an app on a phone ----- */
    const settle = (fn) => (motion ? setTimeout(fn, 380) : fn());
    function openApp(start, from) {
      if (open) return;
      open = true; opener = from;
      if (!morning && stage.hjDawn) stage.hjDawn(); else toMorning();
      tick(); clearInterval(clockT); clockT = setInterval(tick, 15000);
      app.hidden = false; app.classList.remove('is-leaving');
      lockview.inert = true;
      screen.classList.add('is-app');
      void app.offsetWidth;
      app.classList.add('is-open');
      app.focus({ preventScroll: true });
      const fresh = !$('.hx-msg', log);
      if (start && start.text) send(start.text);
      else if (start && start.missed) answer('Sorry we missed your call! I can answer questions and book you in right here. What do you need?');
      else if (fresh) answer("Hi, you've reached Saffron Salon. We're closed right now, but I can answer questions and book you in. What can I help with?");
    }
    function closeApp() {
      if (!open) return;
      open = false;
      clearInterval(clockT);
      app.classList.remove('is-open'); app.classList.add('is-leaving');
      screen.classList.remove('is-app');
      lockview.inert = false;
      settle(() => { if (!open) { app.hidden = true; app.classList.remove('is-leaving'); } });
      const back = opener && !opener.hidden && opener.isConnected ? opener : cardHit;
      back.focus({ preventScroll: true });
      if (!cardRolled) { if (booked) cardRolled = true; else rollCard(); }
      if (booked && !seven) {
        seven = true;
        const six = cardNums[1];
        const finish = () => {
          if (!after) return;
          after.hidden = false; after.classList.add('is-in');
          if (say) say.textContent = 'Booked. The Night Shift card now says 7 bookings made. ' + $('p', after).textContent;
        };
        setTimeout(() => roll(six, { to: '7', from: '6', dur: 700, done: () => setTimeout(finish, motion ? 450 : 0) }), motion ? 420 : 0);
      }
    }
    $('.hx-back', app).addEventListener('click', closeApp);
    const home = $('.hx-home', app);
    let swipe = null, swiped = false;
    home.addEventListener('click', () => { if (swiped) { swiped = false; return; } closeApp(); });
    home.addEventListener('pointerdown', (e) => { swipe = e.clientY; swiped = false; try { home.setPointerCapture(e.pointerId); } catch (er) {} });
    home.addEventListener('pointermove', (e) => { if (swipe !== null && swipe - e.clientY > 24) { swipe = null; swiped = true; setTimeout(() => { swiped = false; }, 500); closeApp(); } });
    home.addEventListener('pointerup', () => { swipe = null; });
    home.addEventListener('pointercancel', () => { swipe = null; });
    app.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeApp(); } });
  }

  /* ---------- How it works: on laptops the steps light up one by one as you read down ---------- */
  const stepList = $('.hx-steps');
  if (stepList && window.IntersectionObserver && matchMedia('(min-width: 900px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stepList.classList.add('is-scroll');
    const so = new IntersectionObserver((ens) => ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-lit'); so.unobserve(en.target); } }), { rootMargin: '0px 0px -38% 0px' });
    $$('.hx-step', stepList).forEach((li) => so.observe(li));
  }

  setCur(cur, false);

  /* Prices: the three plan prices roll into place once, as they come into view, ending on the exact text the currency switch set */
  const planPrices = $$('.hx-plans .hj-price b[data-gbp]');
  if (planPrices.length && window.IntersectionObserver && !still) {
    const waiting = new Set(planPrices);
    /* each one is set at its first frame while still well below the screen, then rolls once it is in view */
    const near = new IntersectionObserver((ens) => ens.forEach((en) => {
      if (!waiting.has(en.target)) return;
      if (en.isIntersecting) { if (!rolls.has(en.target)) rollMake(en.target); return; }
      /* scrolled straight past it, off the top: it shows its real price at once, never a row of noughts */
      if (en.boundingClientRect.bottom < 0) {
        const r = rolls.get(en.target);
        waiting.delete(en.target); near.unobserve(en.target); seen.unobserve(en.target);
        if (r) { rollStop(en.target); en.target.textContent = r.final; }
      }
    }), { rootMargin: '0px 0px 120% 0px' });
    const seen = new IntersectionObserver((ens) => ens.forEach((en) => {
      if (!en.isIntersecting || !waiting.has(en.target)) return;
      waiting.delete(en.target); seen.unobserve(en.target); near.unobserve(en.target);
      const i = planPrices.indexOf(en.target), r = rolls.get(en.target) || rollMake(en.target);
      if (r) r.anims.forEach((an) => { an.effect.updateTiming({ delay: (an.effect.getTiming().delay || 0) + i * 120 }); an.play(); });
    }), { rootMargin: '0px 0px -12% 0px' });
    planPrices.forEach((el) => { near.observe(el); seen.observe(el); });
  }

  /* Phones: a bar with the two main actions follows your thumb once the hero has gone, and steps aside at the form */
  const mbar = $('.m-bar'), hero = $('#top'), contactSec = $('#contact');
  if (mbar && hero && window.IntersectionObserver) {
    let pastHero = false, atForm = false, atTry = false;
    const show = () => mbar.classList.toggle('is-on', pastHero && !atForm && !atTry);
    /* the phone demo has its own text box and home bar at the bottom, so the bar keeps out of its way */
    const tryPhone = $('.hx-stage');
    if (tryPhone) new IntersectionObserver(([en]) => { atTry = en.isIntersecting; show(); }, { rootMargin: '-15% 0px -15% 0px' }).observe(tryPhone);
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
