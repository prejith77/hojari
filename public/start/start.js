/* Design your package: one question per screen, then the tools I'd build and a fixed price. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const form = $('.q-form'), steps = $$('.q-step'), bar = $('.q-bar i');
  const back = $('.q-back'), next = $('.q-next'), nav = $('.q-nav');
  const QUESTIONS = 7;
  const answers = { kind: [], online: [], time: [], now: [], team: [], when: [] };
  let at = 0;

  const TOOLS = {
    booking: ['Online booking', 'Customers pick a time that suits them, day or night, with reminders so fewer forget to turn up.'],
    ordering: ['Online ordering and shop', 'Orders and payments through your website, with receipts and stock handled for you.'],
    quotes: ['Quotes and invoices', 'Price a job in minutes, turn it into an invoice in one tap, and late payers get chased for you.'],
    payments: ['Payments and deposits', 'Card payments and deposits online, so a no-show costs you less.'],
    assistant: ['Enquiry assistant', 'Answers the questions you get every day, on your website and WhatsApp, and hands over to you when it should.'],
    records: ['One customer record', 'Every customer, booking and payment in one place that all your tools read from, so nothing is typed twice.'],
    dashboard: ["Owner's dashboard", 'Bookings, sales and reviews on your phone as they happen, without a spreadsheet.'],
    portal: ['Client portal', 'Clients sign in to see progress, documents and invoices, without having to ask you.'],
    followups: ['Reviews and rebookings', 'Asks happy customers for a Google review and invites them back at the right time.'],
    memberships: ['Memberships and courses', 'Sign-ups, monthly payments and members-only content, all looked after.'],
    rota: ['Team and jobs planner', 'Who is working where and when, on one screen the whole team can see.'],
    search: ['Found on Google', 'Pages written for what your customers search, and your Google Business Profile done properly.'],
  };
  const WEIGHTS = {
    online: { book: { booking: 3 }, buy: { ordering: 3 }, price: { quotes: 3 }, pay: { payments: 3 }, ask: { assistant: 3 }, account: { portal: 3 }, join: { memberships: 3 }, find: { search: 3 } },
    time: { answers: { assistant: 2 }, diary: { booking: 2 }, quotes: { quotes: 2 }, chasing: { payments: 1, quotes: 1 }, copying: { records: 2 }, updates: { portal: 2 }, numbers: { dashboard: 2 }, reviews: { followups: 2 }, rota: { rota: 2 } },
  };
  const BUILD_MAP = { booking: 'booking', ordering: 'ordering', loyalty: 'followups', messages: 'assistant', account: 'portal', offers: 'followups', quotes: 'quotes', gallery: 'search' };

  /* Arriving from a price card or from the app builder */
  const params = new URLSearchParams(location.search);
  const plan = params.get('plan');
  let fromBuild = [];
  if (HJ.PRICES[plan]) {
    const note = $('.q-plan');
    note.textContent = 'You picked ' + HJ.PRICES[plan].name + '. Seven quick questions and I’ll show you exactly what it includes for your business.';
    note.hidden = false;
  }
  if (params.get('name')) form.business.value = params.get('name').slice(0, 80);
  if (params.get('features')) fromBuild = params.get('features').split(',').map((f) => BUILD_MAP[f]).filter(Boolean);
  if (params.get('from') === 'build') {
    const note = $('.q-plan');
    note.textContent = 'I’ve kept the app you built. A few questions so I can price it properly.';
    note.hidden = false;
  }

  /* Choices */
  $$('.q-opts').forEach((group) => {
    const name = group.dataset.name, max = +group.dataset.max, single = max === 1;
    const btns = $$('button', group);
    btns.forEach((b) => b.setAttribute(single ? 'aria-checked' : 'aria-pressed', 'false'));
    if (single) btns.forEach((b) => b.setAttribute('role', 'radio'));
    const left = group.parentNode.querySelector('.q-left');
    const sync = () => {
      const n = answers[name].length;
      if (!single) btns.forEach((b) => { b.disabled = n >= max && b.getAttribute('aria-pressed') !== 'true'; });
      if (left) left.textContent = n === 0 ? '' : n >= max ? 'That’s three.' : (max - n) + ' more if you like.';
      next.disabled = !ready();
    };
    group.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (single) {
        btns.forEach((x) => x.setAttribute('aria-checked', x === b));
        answers[name] = [b.dataset.v];
        sync();
        setTimeout(() => { if (steps[at].contains(b)) go(at + 1); }, HJ.reduce ? 0 : 260);
      } else {
        const on = b.getAttribute('aria-pressed') === 'true';
        b.setAttribute('aria-pressed', !on);
        answers[name] = btns.filter((x) => x.getAttribute('aria-pressed') === 'true').map((x) => x.dataset.v);
        sync();
      }
    });
    /* Arrow keys move through a radio group */
    if (single) group.addEventListener('keydown', (e) => {
      const i = btns.indexOf(document.activeElement); if (i < 0) return;
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); btns[(i + d + btns.length) % btns.length].focus(); }
    });
  });

  function ready() {
    const s = steps[at].dataset.step;
    if (s === 'name') return form.business.value.trim().length > 0;
    if (answers[s]) return answers[s].length > 0;
    return true;
  }

  function go(i, fromPop) {
    if (i < 0 || i >= steps.length) return;
    if (i > at && steps[at].dataset.step === 'name' && !form.business.value.trim()) {
      const err = $('.q-err', steps[0]); err.textContent = 'The name of your business, so I know who you are.';
      form.business.setAttribute('aria-invalid', 'true'); form.business.focus(); return;
    }
    const dir = i < at ? 'is-back' : '';
    steps[at].classList.remove('is-on', 'is-back');
    at = i;
    const s = steps[at];
    s.classList.add('is-on'); if (dir) s.classList.add(dir);
    const step = s.dataset.step;
    if (step === 'result') buildResult();
    $$('.q-biz').forEach((el) => { el.textContent = form.business.value.trim() || 'your business'; });
    bar.style.transform = 'scaleX(' + Math.min(1, at / QUESTIONS) + ')';
    back.hidden = at === 0 || step === 'sent';
    nav.hidden = step === 'result' || step === 'sent';
    next.textContent = at === QUESTIONS - 1 ? 'See my package' : 'Next';
    next.disabled = !ready();
    if (!fromPop) { try { history.pushState({ q: at }, '', ''); } catch (e) {} }
    window.scrollTo({ top: 0, behavior: HJ.reduce ? 'auto' : 'smooth' });
    const focusEl = step === 'name' ? form.business : s.querySelector('h1, h2');
    if (focusEl) { if (!focusEl.hasAttribute('tabindex') && focusEl.tagName !== 'INPUT') focusEl.setAttribute('tabindex', '-1'); setTimeout(() => focusEl.focus({ preventScroll: true }), 50); }
  }
  try { history.replaceState({ q: 0 }, '', ''); } catch (e) {}
  addEventListener('popstate', (e) => { if (e.state && typeof e.state.q === 'number' && steps[at].dataset.step !== 'sent') go(e.state.q, true); });

  next.addEventListener('click', () => go(at + 1));
  back.addEventListener('click', () => history.back());
  form.business.addEventListener('input', () => { form.business.removeAttribute('aria-invalid'); $('.q-err', steps[0]).textContent = ''; next.disabled = !ready(); });
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && steps[at].dataset.step === 'name') { e.preventDefault(); go(at + 1); }
  });

  /* The result: up to three tools, the package they need, and the price */
  const list = $('.r-list'), scratch = form.scratch;
  let built = false;
  function pickTools() {
    const score = {};
    const add = (t, n) => { score[t] = (score[t] || 0) + n; };
    ['online', 'time'].forEach((k) => answers[k].forEach((v) => { const w = WEIGHTS[k][v] || {}; Object.keys(w).forEach((t) => add(t, w[t])); }));
    if (/pile of apps/.test(answers.now[0] || '')) add('records', 1);
    if (/6 to 20|More than 20/.test(answers.team[0] || '')) { add('dashboard', 1); add('rota', 1); }
    fromBuild.forEach((t) => add(t, 4));
    const order = Object.keys(TOOLS);
    return Object.keys(score).sort((a, b) => score[b] - score[a] || order.indexOf(a) - order.indexOf(b)).slice(0, 3);
  }
  function buildResult() {
    if (built) return update();
    built = true;
    const chosen = pickTools();
    list.innerHTML = '';
    Object.keys(TOOLS).forEach((k) => {
      const l = document.createElement('label'); l.className = 'r-tool';
      l.innerHTML = '<input type="checkbox" name="tool"><b></b><span></span>';
      const box = l.firstChild; box.value = k; box.checked = chosen.includes(k);
      l.children[1].textContent = TOOLS[k][0];
      if (box.checked) { const why = document.createElement('i'); why.className = 'r-why'; why.textContent = 'From your answers'; why.style.fontStyle = 'normal'; l.children[1].appendChild(why); }
      l.children[2].textContent = TOOLS[k][1];
      list.appendChild(l);
    });
    /* Chosen first, the rest after */
    $$('.r-tool', list).sort((a, b) => b.firstChild.checked - a.firstChild.checked).forEach((l) => list.appendChild(l));
    if (plan === 'signature') scratch.checked = true;
    update();
  }
  function tools() { return $$('input[name="tool"]:checked', list).map((i) => i.value); }
  function pkg() { const n = tools().length; return scratch.checked ? 'signature' : n <= 1 ? 'silver' : 'royal-green'; }
  function update() {
    const t = tools(), p = pkg(), P = HJ.PRICES[p];
    $$('input[name="tool"]', list).forEach((i) => { i.disabled = !i.checked && t.length >= 3; });
    $('.r-n').textContent = t.length + ' of 3 chosen';
    $('.r-grade').textContent = P.name;
    const names = t.map((k) => TOOLS[k][0]);
    const incl = [];
    if (p === 'signature') {
      $('.r-what').textContent = 'Software built from scratch, around how you work';
      incl.push('Your own app, portal or platform, designed with you');
      if (names.length) incl.push('Built in: ' + names.join(', ').toLowerCase());
      incl.push('A website to match', 'Works on any phone and saves to the home screen', 'Built in stages you see and use as we go');
    } else if (p === 'royal-green') {
      $('.r-what').textContent = 'Your website, plus a connected system';
      incl.push('A website of up to 8 pages, written and designed for your customers');
      names.forEach((n) => incl.push(n));
      incl.push('All of it sharing one set of customer records');
      if (!t.includes('dashboard')) incl.push("An owner's dashboard with your numbers on your phone");
      incl.push('Your costs and admin hours measured before launch, and again 30 days after');
    } else {
      $('.r-what').textContent = names.length ? 'Your website, plus one tool' : 'Your website, ready for a tool when you want one';
      incl.push('A website of up to 8 pages, written and designed for your customers');
      names.forEach((n) => incl.push(n));
      incl.push('Google Business Profile set up properly', 'Live within 7 days of your words and photos');
    }
    const ul = $('.r-incl'); ul.innerHTML = '';
    incl.forEach((x) => { const li = document.createElement('li'); li.textContent = x; ul.appendChild(li); });
    paintPrice();
  }
  function paintPrice() {
    if (!built) return;
    const P = HJ.PRICES[pkg()], c = HJ.cur;
    $('.r-build').textContent = HJ.money(P.build[c]);
    $('.r-fbuild').textContent = HJ.money(HJ.founding(P.build[c]));
    $('.r-carep').textContent = HJ.money(P.care[c]);
  }
  list.addEventListener('change', update);
  scratch.addEventListener('change', update);
  HJ.onCurrency(paintPrice);

  /* Send */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (steps[at].dataset.step !== 'result') return;
    const msgs = { name: 'Your name, so I know who to reply to.', email: 'An email address that works, so I can reply.' };
    let first = null;
    Object.keys(msgs).forEach((k) => {
      const el = form[k], bad = !el.value.trim() || !el.checkValidity();
      el.setAttribute('aria-invalid', bad);
      el.parentNode.querySelector('.q-err').textContent = bad ? msgs[k] : '';
      if (bad && !first) first = el;
    });
    if (first) { first.focus(); return; }
    if (form._gotcha.value) return;
    const btn = $('.q-submit'); btn.disabled = true; btn.textContent = 'Sending…';
    const P = HJ.PRICES[pkg()], c = HJ.cur;
    const label = (name) => answers[name].map((v) => { const b = $('.q-opts[data-name="' + name + '"] button[data-v="' + v + '"]'); return b ? b.firstChild.textContent.trim() : v; }).join('; ');
    const fields = {
      name: form.name.value.trim(), email: form.email.value.trim(), whatsapp: form.phone.value.trim() || 'not given',
      business: form.business.value.trim(), website: form.website.value.trim() || 'none yet',
      'what it does': label('kind'), 'customers should be able to': label('online'), 'time goes on': label('time'),
      'has today': label('now'), team: label('team'), when: label('when'),
      package: P.name + (scratch.checked ? ' (something built from scratch)' : ''),
      tools: tools().map((k) => TOOLS[k][0]).join(', ') || 'none chosen',
      price: 'from ' + HJ.money(P.build[c]) + ' (founding ' + HJ.money(HJ.founding(P.build[c])) + '), care ' + HJ.money(P.care[c]) + ' a month',
      notes: form.notes.value.trim() || 'none',
    };
    await HJ.send(fields, 'New package: ' + fields.business + ' (' + P.name + ')');
    $('.q-person').textContent = fields.name.split(' ')[0];
    go(steps.findIndex((s) => s.dataset.step === 'sent'));
  });

  back.hidden = true;
  next.disabled = !ready();
})();
