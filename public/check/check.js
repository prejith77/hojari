/* The 30-second check. Everything happens on this page: nothing you type or drop is uploaded, stored or sent anywhere. */
(() => {
  /* The wording, in one place: change a line here and the page follows */
  const TOOL = {
    heading: 'Check your <em>messages</em>',
    button: 'Find out in 30 seconds',
  };
  document.querySelectorAll('[data-tool="heading"]').forEach((el) => { if (el.innerHTML !== TOOL.heading) el.innerHTML = TOOL.heading; });
  document.querySelectorAll('[data-tool="button"]').forEach((el) => { el.textContent = TOOL.button; });

  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const out = $('#ck-out'), status = $('#ck-status'), form = $('#ck-form'), err = $('#ck-err');
  const fmt = (n) => Math.round(n).toLocaleString('en-GB');

  /* ---------- Reading an exported chat ---------- */
  /* Android: "18/11/2026, 21:14 - Name: text" or "11/18/26, 9:14 PM - Name: text"
     iPhone:  "[18/11/2026, 21:14:05] Name: text". Day and month order is worked out from the dates themselves. */
  const DATE = '(\\d{1,4})[\\/.\\-](\\d{1,2})[\\/.\\-](\\d{1,4})';
  const TIME = '(\\d{1,2})[:.](\\d{2})(?:[:.](\\d{2}))?(?:\\s*([AaPp])\\.?\\s?[Mm]\\.?)?';
  const RE_IPHONE = new RegExp('^[\\u200E\\u200F]?\\[' + DATE + ',?\\s+' + TIME + '\\]\\s*(.*)$');
  const RE_ANDROID = new RegExp('^[\\u200E\\u200F]?' + DATE + ',?\\s+' + TIME + '\\s+[-\\u2013]\\s(.*)$');
  const SYSTEM = /end-to-end encrypted|security code (?:changed|with)|created (?:this )?group|changed (?:the subject|this group|the group|their phone number|to)|joined using|is now an admin|disappearing messages|message timer|added you|you were added|left$|was removed|blocked this|unblocked this|turned on|turned off/i;
  const MARKS = /[‎‏‪-‮⁦-⁩]/g;

  function readLines(text) {
    const rows = [];
    let cur = null;
    text.replace(/^﻿/, '').replace(/[   ]/g, ' ').replace(/\r\n?/g, '\n').split('\n').forEach((line) => {
      const m = line.match(RE_IPHONE) || line.match(RE_ANDROID);
      if (m) { cur = { a: +m[1], b: +m[2], c: +m[3], aLen: m[1].length, h: +m[4], mi: +m[5], ap: m[7] ? m[7].toLowerCase() : '', rest: m[8] }; rows.push(cur); }
      else if (cur) cur.rest += '\n' + line;
    });
    return rows;
  }
  /* Day/month order: a value over 12 settles it; otherwise pick the order that keeps the chat in time order */
  function settled(rows) {
    if (rows.some((r) => r.aLen === 4)) return 'ymd';
    if (rows.some((r) => r.a > 12)) return 'dmy';
    if (rows.some((r) => r.b > 12)) return 'mdy';
    return '';
  }
  function dateOrder(rows) {
    if (settled(rows)) return settled(rows);
    const score = (order) => { let ok = 0, prev = -Infinity; rows.forEach((r) => { const t = stamp(r, order); if (t >= prev) ok++; prev = t; }); return ok; };
    const d = score('dmy'), m = score('mdy');
    if (d !== m) return d > m ? 'dmy' : 'mdy';
    return rows.some((r) => r.ap) ? 'mdy' : 'dmy';
  }
  function stamp(r, order) {
    let y, mo, d;
    if (order === 'ymd') { y = r.a; mo = r.b; d = r.c; } else if (order === 'mdy') { mo = r.a; d = r.b; y = r.c; } else { d = r.a; mo = r.b; y = r.c; }
    if (y < 100) y += 2000;
    let h = r.h;
    if (r.ap === 'p' && h < 12) h += 12;
    if (r.ap === 'a' && h === 12) h = 0;
    return new Date(y, mo - 1, d, h, r.mi).getTime();
  }
  function toChat(rows, order) {
    const msgs = [];
    rows.forEach((r) => {
      const i = r.rest.indexOf(': ');
      if (i < 1) return; /* no sender: a system line */
      const who = r.rest.slice(0, i).replace(MARKS, '').replace(/^~\s*/, '').trim();
      const text = r.rest.slice(i + 2);
      if (!who || (/^[‎]/.test(text) && SYSTEM.test(text)) || /^Messages and calls are end-to-end encrypted/.test(text.replace(MARKS, ''))) return;
      msgs.push({ t: stamp(r, order), who, text: text.replace(MARKS, '') });
    });
    msgs.sort((x, y) => x.t - y.t);
    return msgs;
  }
  function parseFiles(texts) {
    /* each export comes from one phone, so each file settles its own order; an unclear file follows the rest */
    const all = texts.map(readLines);
    const shared = dateOrder(all.flat());
    return all.map((rows) => toChat(rows, settled(rows) || shared)).filter((c) => c.length);
  }

  /* An iPhone export is a .zip. Read its directory and open the chat inside, without any library */
  async function unzip(buf) {
    const v = new DataView(buf), u8 = new Uint8Array(buf), found = [];
    let end = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { end = i; break; }
    if (end < 0) throw new Error('not a zip');
    let p = v.getUint32(end + 16, true);
    const n = v.getUint16(end + 10, true);
    for (let k = 0; k < n && v.getUint32(p, true) === 0x02014b50; k++) {
      const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true), nameLen = v.getUint16(p + 28, true), extraLen = v.getUint16(p + 30, true), noteLen = v.getUint16(p + 32, true), at = v.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nameLen));
      p += 46 + nameLen + extraLen + noteLen;
      if (!/\.txt$/i.test(name) || /(^|\/)__MACOSX\//.test(name)) continue;
      const start = at + 30 + v.getUint16(at + 26, true) + v.getUint16(at + 28, true);
      const data = u8.subarray(start, start + size);
      let bytes = null;
      if (method === 0) bytes = data;
      else if (method === 8) {
        if (typeof DecompressionStream === 'undefined') throw new Error('no deflate');
        bytes = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      }
      if (bytes) found.push({ name, text: new TextDecoder('utf-8').decode(bytes) });
    }
    const chats = found.filter((f) => /_chat\.txt$/i.test(f.name));
    return (chats.length ? chats : found).map((f) => f.text);
  }
  async function readFile(file) {
    const buf = await file.arrayBuffer();
    const head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
    if (/\.zip$/i.test(file.name) || (head[0] === 0x50 && head[1] === 0x4b && head[2] === 3 && head[3] === 4)) return unzip(buf);
    return [new TextDecoder('utf-8').decode(buf)];
  }

  /* ---------- The numbers ---------- */
  const BUCKETS = [
    ['booking', /\b(?:available|availability|slots?|book|booking|appointments?|reserve|reservation)\b/],
    ['price', /\b(?:prices?|pricing|costs?|how much|rates?|charges?|fees?|quote)\b/],
    ['opening hours', /\b(?:open|opening|close|closing|closed|hours|timings?|what time)\b/],
    ['location', /\b(?:location|address|where|directions|located|parking)\b/],
    ['delivery', /\b(?:deliver|delivery|deliveries|home visits?|pick ?up|collection)\b/],
  ];
  const late = (h) => h >= 21 || h < 8;
  const dayIndex = (t) => { const d = new Date(t); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
  const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

  function measure(chats, me) {
    const cust = [], waits = [];
    let tMin = Infinity, tMax = -Infinity;
    chats.forEach((chat) => {
      let pending = null;
      chat.forEach((m) => {
        tMin = Math.min(tMin, m.t); tMax = Math.max(tMax, m.t);
        if (m.who !== me) { cust.push(m); if (!pending) pending = m; }
        else if (pending) { if (!late(new Date(pending.t).getHours())) waits.push((m.t - pending.t) / 60000); pending = null; }
      });
    });
    const days = cust.length ? dayIndex(tMax) - dayIndex(tMin) + 1 : 1;
    const counts = BUCKETS.map(([name]) => [name, 0]), byDay = Array(7).fill(0), byHour = Array(24).fill(0);
    let repeat = 0, after = 0;
    cust.forEach((m) => {
      const d = new Date(m.t), text = m.text.toLowerCase();
      let hit = false;
      BUCKETS.forEach(([, re], i) => { if (re.test(text)) { counts[i][1]++; hit = true; } });
      if (hit) repeat++;
      if (late(d.getHours())) after++;
      byDay[d.getDay()]++; byHour[d.getHours()]++;
    });
    return {
      kind: 'chat', chats: chats.length, total: cust.length, days, perDay: cust.length / days, after,
      wait: median(waits), slowest: waits.length ? Math.max(...waits) : null,
      counts: counts.filter((c) => c[1]).sort((x, y) => y[1] - x[1]), repeat,
      day: byDay.indexOf(Math.max(...byDay)), hour: byHour.indexOf(Math.max(...byHour)), from: tMin, to: tMax,
    };
  }

  /* ---------- Showing the result ---------- */
  const DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  const hr12 = (h) => (h % 12 || 12) + (h < 12 || h === 24 ? 'am' : 'pm');
  const date = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const dur = (min) => {
    if (min < 1) return 'under a minute';
    if (min < 60) return Math.round(min) + ' min';
    if (min < 1440) { const h = Math.floor(min / 60), m = Math.round(min % 60); return h + ' h' + (m ? ' ' + m + ' min' : ''); }
    const d = Math.floor(min / 1440), h = Math.round((min % 1440) / 60); return d + (d === 1 ? ' day' : ' days') + (h ? ' ' + h + ' h' : '');
  };
  const one = (n) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n));
  const bigWait = (min) => (min < 90 ? { n: Math.max(0, Math.round(min)), unit: Math.round(min) === 1 ? 'minute' : 'minutes' } : { n: one(min / 60), unit: 'hours' });
  let counted = false, prevSource = null, minutesPer = 1;

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function line(dl, label, value, small) {
    const row = el('div'), dt = el('dt', '', label), dd = el('dd');
    if (small) dt.append(' ', el('small', '', small));
    if (typeof value === 'string') dd.textContent = value; else dd.append(...value);
    row.append(dt, dd); dl.append(row);
    return dd;
  }
  function countUp(node, to, decimals) {
    node.textContent = decimals ? to.toFixed(1) : fmt(to);
    if (reduce || counted) return;
    const t0 = performance.now(), dur0 = 900;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur0), v = to * (1 - Math.pow(1 - p, 3));
      node.textContent = decimals ? v.toFixed(1) : fmt(v);
      if (p < 1) requestAnimationFrame(step); else node.textContent = decimals ? to.toFixed(1) : fmt(to);
    };
    requestAnimationFrame(step);
  }

  function render(r, source) {
    const box = el('div', 'ck-res');
    box.tabIndex = -1;
    box.append(el('p', 'ck-src', source));

    /* the one big number: how long a customer usually waits */
    box.append(el('p', 'ck-big-k', 'A customer usually waits'));
    const big = el('p', 'ck-big'), num = el('span', 'ck-num');
    if (r.wait === null) {
      big.classList.add('is-none'); big.textContent = 'No replies to measure';
    } else {
      const w = bigWait(r.wait);
      big.append(num, ' ', el('span', 'ck-unit', w.unit));
      countUp(num, w.n, !Number.isInteger(w.n));
    }
    box.append(big);
    box.append(el('p', 'ck-big-s', r.kind === 'chat' ? 'for your reply between 8am and 9pm, counting from their first unanswered message.' : 'for your reply during the day, from the number you typed.'));

    /* the two facts under it */
    const facts = el('div', 'ck-facts');
    const f1 = el('p'), f1n = el('b', 'ck-num');
    if (r.kind === 'chat') {
      f1.append(f1n, el('span', '', (r.after === 1 ? ' message' : ' messages') + ' arrived after 9pm or before 8am' + (r.total ? ', ' + Math.round(r.after / r.total * 100) + '% of the total' : '')));
      countUp(f1n, r.after);
    } else {
      f1.append(f1n, el('span', '', ' messages a month arrive after 9pm or before 8am'));
      countUp(f1n, r.after);
    }
    facts.append(f1);
    if (r.kind === 'chat') {
      const f2 = el('p');
      f2.append(el('b', '', r.slowest === null ? 'None' : dur(r.slowest)), el('span', '', ' your slowest reply during the day'));
      facts.append(f2);
    }
    box.append(facts);

    /* the detail */
    const dl = el('dl', 'ck-lines');
    if (r.kind === 'chat') {
      line(dl, 'Customer messages', fmt(r.total) + ' in ' + r.days + (r.days === 1 ? ' day' : ' days') + ', about ' + fmt(r.perDay) + ' a day');
      if (r.counts.length) line(dl, 'Asked again and again', r.counts.map(([n, c]) => n + ' ' + fmt(c)).join(', ').replace(/^./, (c) => c.toUpperCase()));
      if (r.total) line(dl, 'Busiest', DAYS[r.day] + ', and between ' + hr12(r.hour) + ' and ' + hr12(r.hour + 1));
    } else {
      line(dl, 'Messages', 'About ' + fmt(r.perDay) + ' a day, ' + fmt(r.perDay * 30) + ' a month');
    }
    const mins = el('input', 'ck-mins');
    Object.assign(mins, { type: 'number', min: '0.25', max: '60', step: '0.25', value: String(minutesPer), inputMode: 'decimal' });
    mins.id = 'ck-mins';
    const minsLabel = el('label', '', ' minutes a reply'); minsLabel.htmlFor = 'ck-mins';
    const hoursB = el('b', 'ck-hours'), hoursUnit = document.createTextNode('');
    const paintHours = () => { const v = one(r.perDay * 30 * minutesPer / 60); hoursB.textContent = String(v); hoursUnit.textContent = v === 1 ? ' hour, at ' : ' hours, at '; };
    paintHours();
    line(dl, 'Hours a month replying', ['About ', hoursB, hoursUnit, mins, minsLabel], 'Estimate');
    mins.addEventListener('input', () => { const v = parseFloat(mins.value); if (v > 0 && v <= 60) { minutesPer = v; paintHours(); } });
    box.append(dl);

    if (r.kind === 'chat' && r.repeat) {
      const close = el('p', 'ck-close'); close.append('The Night Shift could answer ', el('b', '', fmt(r.repeat)), ' of these for you.');
      box.append(close);
    } else if (r.kind === 'manual' && r.after) {
      const close = el('p', 'ck-close'); close.append('The Night Shift could answer the ', el('b', '', fmt(r.after)), ' that arrive after hours for you.');
      box.append(close);
    }

    const cta = el('div', 'ck-cta');
    const a1 = el('a', 'button button-light arrow', 'Walk me through it (15 minutes)'); a1.href = '../call/';
    const a2 = el('a', 'button button-ghost', 'Message me'); a2.href = '../#contact';
    cta.append(a1, a2); box.append(cta);

    const how = el('details', 'ck-note'); how.append(el('summary', '', 'How these numbers are worked out'));
    [
      'With an exported chat, customer messages are every message not sent by the name you picked, and after hours means 9pm to 8am by the times in the chat.',
      'The usual wait is the median: half your replies between 8am and 9pm were quicker, half were slower. It counts from a customer’s first unanswered message to your next message.',
      'A repeat question is a message that mentions booking, price, opening hours, location or delivery.',
      'Hours a month is messages a day, times 30, times your minutes per reply. It is an estimate, so change the minutes to match how you work.',
    ].forEach((t) => how.append(el('p', '', t)));
    box.append(how);

    out.replaceChildren(box);
    const moved = !counted || source !== prevSource;
    counted = true;
    status.textContent = r.wait === null ? 'Done. There were no replies from you during the day to measure.' : 'Done. A customer usually waits ' + bigWait(r.wait).n + ' ' + bigWait(r.wait).unit + ' for your reply.';
    if (moved) {
      if (matchMedia('(max-width: 899px)').matches) box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      box.focus({ preventScroll: true });
    }
    prevSource = source;
  }

  /* ---------- Path one: four numbers ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const day = parseFloat(form.day.value), lateShare = parseFloat(form.late.value), wait = parseFloat(form.wait.value), per = parseFloat(form.per.value);
    const bad = [[form.day, !(day > 0)], [form.late, !(lateShare >= 0 && lateShare <= 100)], [form.wait, !(wait >= 0)], [form.per, !(per > 0 && per <= 60)]];
    bad.forEach(([f, b]) => f.setAttribute('aria-invalid', String(b)));
    const first = bad.find(([, b]) => b);
    if (first) { err.textContent = 'Fill in all four numbers. Rough guesses are fine.'; first[0].focus(); return; }
    err.textContent = '';
    minutesPer = per;
    render({ kind: 'manual', perDay: day, after: day * 30 * lateShare / 100, wait, slowest: null }, 'From the numbers you typed');
  });

  /* ---------- Path two: exported chats ---------- */
  const who = $('#ck-who'), names = $('#ck-names');
  let chats = null, label = '';
  let others = new Set(); /* names taken from file names such as "WhatsApp Chat with Aisha.txt": that's the customer, not you */
  function senders(list) {
    const inChats = new Map(), total = new Map();
    list.forEach((c) => { new Set(c.map((m) => m.who)).forEach((w) => inChats.set(w, (inChats.get(w) || 0) + 1)); c.forEach((m) => total.set(m.who, (total.get(m.who) || 0) + 1)); });
    /* the owner is usually the one name that turns up in every chat */
    return [...total.keys()].sort((a, b) => (others.has(a) - others.has(b)) || (inChats.get(b) - inChats.get(a)) || (total.get(b) - total.get(a)));
  }
  function useChats(list, src) {
    chats = list;
    const ppl = senders(list).slice(0, 8);
    names.replaceChildren(...ppl.map((p, i) => {
      const l = el('label', 'ck-name'), r = el('input');
      Object.assign(r, { type: 'radio', name: 'ck-me', value: p, checked: i === 0 });
      l.append(r, el('span', '', p)); return l;
    }));
    who.hidden = ppl.length < 2;
    const from = Math.min(...list.map((c) => c[0].t)), to = Math.max(...list.map((c) => c[c.length - 1].t));
    label = src + 'From ' + list.length + (list.length === 1 ? ' chat, ' : ' chats, ') + date(from) + ' to ' + date(to);
    run();
  }
  function run() {
    const me = (names.querySelector('input:checked') || {}).value;
    if (!chats || !me) return;
    render(measure(chats, me), label);
  }
  names.addEventListener('change', run);

  async function takeFiles(files) {
    if (!files || !files.length) return;
    status.textContent = 'Reading your chats on this device…';
    others = new Set([...files].map((f) => (f.name.match(/chat (?:with|-)\s*(.+?)\.(?:txt|zip)$/i) || [])[1]).filter(Boolean));
    try {
      const texts = (await Promise.all([...files].map(readFile))).flat();
      const list = parseFiles(texts);
      if (!list.length) throw new Error('empty');
      useChats(list, '');
    } catch (e) {
      const msg = e && e.message === 'no deflate'
        ? 'This browser can’t open .zip files. Unzip the export first and choose the _chat.txt inside, or type the four numbers above.'
        : 'I couldn’t read that as an exported chat. Try the four numbers above instead, they work just as well.';
      out.replaceChildren(el('p', 'ck-fail', msg));
      status.textContent = msg;
      form.day.focus();
    }
  }
  const file = $('#ck-file'), drop = $('#ck-drop');
  file.addEventListener('change', () => { takeFiles(file.files); file.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('is-over')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); takeFiles(e.dataTransfer.files); });

  /* ---------- A made-up sample, for anyone without an export to hand ---------- */
  function sample() {
    let seed = 20261118;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const people = ['Aisha', 'Mariam', 'Hessa', 'Layla', 'Joanna', 'Reem', 'Dana', 'Fatima', 'Sara', 'Priya', 'Noura', 'Hind'];
    const asks = ['How much is a full set?', 'Price for 3 people?', 'Are you open Sunday?', 'What time do you close today?', 'Can I book 4pm tomorrow?', 'Do you have a slot on Saturday morning?', 'Is Thursday available?', 'Where are you exactly?', 'Is there parking near you?', 'How much for a blow-dry?', 'Can I book an appointment for my mum?', 'Do you do home visits?'];
    const chat = ['Thank you!', 'Perfect, see you then', 'Running 10 minutes late, sorry', 'Hello??', 'Hi Noor', 'Ok great', '<Media omitted>', 'Can I bring my sister?'];
    const replies = ['Hi! Yes, we are open 10am to 8pm', 'A full set is AED 180', '4pm is free, shall I put you in?', 'Booked, see you then', 'We are on the ground floor, next to the pharmacy', 'Sorry for the slow reply', 'Yes, Saturday 11am is free'];
    const files = people.map((p) => ({ p, rows: [] }));
    const start = new Date(2026, 9, 5);
    for (let d = 0; d < 28; d++) {
      const n = 9 + Math.floor(rnd() * 8);
      for (let k = 0; k < n; k++) {
        const f = pick(files);
        const night = rnd() < 0.3, h = night ? (rnd() < 0.7 ? 21 + Math.floor(rnd() * 3) : 6 + Math.floor(rnd() * 2)) : 9 + Math.floor(rnd() * 12);
        const t = new Date(start); t.setDate(start.getDate() + d); t.setHours(h, Math.floor(rnd() * 60));
        f.rows.push([t.getTime(), f.p, rnd() < 0.62 ? pick(asks) : pick(chat)]);
        if (rnd() < 0.35) f.rows.push([t.getTime() + 60000, f.p, pick(chat)]);
        let r;
        if (night) { r = new Date(t); if (h >= 21) r.setDate(r.getDate() + 1); r.setHours(8, 20 + Math.floor(rnd() * 70)); r = r.getTime(); }
        else r = t.getTime() + (rnd() < 0.14 ? 120 + rnd() * 180 : 3 + rnd() * 45) * 60000;
        f.rows.push([r, 'Noor', pick(replies)]);
      }
    }
    const p2 = (x) => String(x).padStart(2, '0');
    return files.filter((f) => f.rows.length).map((f) => '05/10/2026, 08:00 - Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.\n' +
      f.rows.sort((a, b) => a[0] - b[0]).map(([t, w, x]) => { const d = new Date(t); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ', ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ' - ' + w + ': ' + x; }).join('\n'));
  }
  $('#ck-sample').addEventListener('click', () => { others = new Set(); useChats(parseFiles(sample()), 'Sample: Noor’s Salon, made-up chat. '); });

  /* for testing the reader on its own */
  window.hjCheck = { parseFiles, measure, unzip };
})();
