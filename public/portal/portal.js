/* Client portal demo: a made-up client of a made-up interior design studio. Everything works, nothing is saved. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const signin = $('.pt-signin'), appEl = $('.pt-app'), cta = $('.pt-cta');
  const RATE = { GBP: 1, USD: 1.3, AED: 4.75 };
  const amt = (n) => HJ.money(Math.round(n * RATE[HJ.cur] / 10) * 10);
  const toastEl = $('.pt-toast');
  let toastT;
  const toast = (t) => { toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2600); };

  /* Sign in and out */
  $('.si-card').addEventListener('submit', (e) => {
    e.preventDefault();
    const b = $('.si-go'); b.disabled = true; b.textContent = 'Signing in…';
    setTimeout(() => {
      signin.hidden = true; appEl.hidden = false; cta.hidden = false;
      b.disabled = false; b.textContent = 'Sign in as Amira';
      window.scrollTo({ top: 0 });
      $('#n-over').focus({ preventScroll: true });
    }, HJ.reduce ? 0 : 500);
  });
  $('.pt-out').addEventListener('click', () => { appEl.hidden = true; cta.hidden = true; signin.hidden = false; $('.si-go').focus(); });

  /* Tabs */
  const tabs = $$('.pt-nav [role="tab"]');
  function pick(t, focus) {
    tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
    if (focus) t.focus();
    if (t.id === 'n-msg') setTimeout(() => { const th = $('.pt-thread'); th.lastElementChild && th.lastElementChild.scrollIntoView({ block: 'nearest' }); }, 30);
    if (matchMedia('(max-width: 899px)').matches) appEl.scrollIntoView({ behavior: HJ.reduce ? 'auto' : 'smooth', block: 'start' });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  /* Updates */
  const feed = $('.pt-feed');
  function update(text, when, fresh) {
    const li = document.createElement('li'); if (fresh) li.className = 'new';
    li.innerHTML = '<span></span><small></small>'; li.firstChild.textContent = text; li.lastChild.textContent = when;
    fresh ? feed.prepend(li) : feed.appendChild(li);
  }
  update('Nadia uploaded the final kitchen drawings', 'Wed 21 Oct');
  update('Your oak worktop samples arrived at the studio', 'Sun 18 Oct');
  update('Deposit received, thank you', 'Sat 3 Oct');

  /* Approve the design */
  $('.pt-approve').addEventListener('click', (e) => {
    const b = e.currentTarget, box = $('.pt-needs');
    b.disabled = true; b.textContent = 'Approved';
    box.classList.add('is-done');
    $('.pt-label', box).textContent = 'Done';
    $('h3', box).textContent = 'Kitchen design approved';
    $('.pt-needs-copy p:last-child', box).textContent = 'Thank you. Your units are being ordered today, and the fitters are booked for Monday 16 November.';
    $('.pt-pbar i').style.transform = 'scaleX(.65)';
    $('.pt-pct').textContent = '65%';
    const st = $$('.pt-stages li');
    st[2].className = 'done'; st[2].querySelector('span').textContent = 'Approved today';
    st[3].className = 'now'; st[3].querySelector('span').textContent = 'Booked 16 Nov';
    update('You approved the kitchen design, and the units are being ordered', 'Just now', true);
    say('them', 'Brilliant, thank you Amira! Units are ordered and the fitters are booked for the 16th. I’ll send a reminder the Friday before.', 'Just now');
    toast('Approved. Nadia has been told.');
  });

  /* Documents */
  const DOCS = [
    ['Kitchen design, final drawings', 'PDF', 'Added 21 Oct · 6 pages', () => '<div class="pt-plan"><i>Kitchen</i><i>Island, 2.4 m</i><i>Pantry</i></div><h4>What’s in these drawings</h4><ul><li>Shaker units in sage green, with brushed brass handles</li><li>Solid oak worktops, oiled</li><li>An island 2.4 m long, with seating for three</li><li>A full-height pantry cupboard beside the fridge</li></ul><p>Approve these and we order the units. Anything you change after ordering may add time.</p>'],
    ['Your quote, signed', 'PDF', 'Signed 2 Oct · 3 pages', () => '<h4>Kitchen and living room redesign</h4><ul><li>Design, drawings and project management</li><li>Kitchen units, worktops and fitting</li><li>Living room shelving, lighting and decorating</li></ul><p>Total agreed: <b>' + amt(14800) + '</b>, paid in three stages.</p>'],
    ['Living room mood board', 'PNG', 'Added 14 Oct', () => '<div class="pt-plan" style="grid-template-columns:1fr 1fr 1fr;grid-template-rows:80px 80px"><i style="background:#c9b79a"></i><i style="background:#7d8f6b;grid-row:auto"></i><i style="background:#e9dfcf"></i><i style="background:#9b5a1c"></i><i style="background:#3d5a4c"></i><i style="background:#f3ecdf"></i></div><p>Warm limewash walls, oak shelving either side of the chimney breast and a deep green velvet sofa.</p>'],
    ['Worktop and tile samples', 'PDF', 'Added 18 Oct · 2 pages', () => '<ul><li>Worktop: solid European oak, 40 mm, oiled</li><li>Splashback: handmade zellige tiles in cream</li><li>Floor: large-format stone-effect porcelain</li></ul><p>The samples are at the studio whenever you’d like to see them in person.</p>'],
    ['Fitting schedule', 'PDF', 'Added 28 Oct · 1 page', () => '<ul><li>Mon 16 Nov: old kitchen out, electrics and plumbing</li><li>Thu 19 Nov: units and worktops fitted</li><li>Mon 23 Nov: tiling and appliances</li><li>Wed 25 Nov: living room painting and shelving</li><li>Fri 4 Dec: final walk-round</li></ul>'],
  ];
  const docs = $('.pt-docs');
  function paintDocs() {
    docs.innerHTML = '';
    DOCS.forEach((d, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<button type="button" class="pt-doc" data-doc="' + i + '"><i>' + d[1] + '</i><span><b></b><small></small></span><em>View</em></button>';
      li.querySelector('b').textContent = d[0]; li.querySelector('small').textContent = d[2];
      docs.appendChild(li);
    });
  }
  paintDocs();
  const sheet = $('.pt-sheet');
  function openDoc(i) {
    const d = DOCS[i];
    $('#sheet-title').textContent = d[0];
    $('.pt-sheet-body').innerHTML = d[3]() + '<button type="button" class="button button-dark-ink pt-dl">Download</button>';
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
  }
  document.addEventListener('click', (e) => {
    const d = e.target.closest('[data-doc]'); if (d) openDoc(+d.dataset.doc);
    if (e.target.closest('.pt-dl')) toast('In a real portal, this downloads the file.');
  });
  $('.pt-close').addEventListener('click', () => sheet.close ? sheet.close() : sheet.removeAttribute('open'));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });

  /* Invoices */
  const INV = [
    { name: 'Deposit, 30%', date: 'Paid 3 Oct', gbp: 4440, state: 'paid' },
    { name: 'Units and materials, 40%', date: 'Due 13 Nov', gbp: 5920, state: 'due' },
    { name: 'Final payment, 30%', date: 'Due when you’re happy with the finish', gbp: 4440, state: 'later' },
  ];
  const invs = $('.pt-invs');
  function paintInv() {
    invs.innerHTML = '';
    INV.forEach((v, i) => {
      const li = document.createElement('li'); li.className = 'pt-inv';
      const tag = { paid: 'Paid', due: 'Due', later: 'Later' }[v.state];
      li.innerHTML = '<div><b></b><small></small><br><span class="pt-tag ' + v.state + '">' + tag + '</span>' + (v.state === 'due' ? '<br><button type="button" class="pt-pay" data-pay="' + i + '">Pay ' + amt(v.gbp) + ' now</button>' : '') + '</div><p class="amt">' + amt(v.gbp) + '</p>';
      li.querySelector('b').textContent = v.name; li.querySelector('small').textContent = v.date;
      invs.appendChild(li);
    });
    const paid = INV.filter((v) => v.state === 'paid').reduce((a, v) => a + v.gbp, 0);
    $('[data-amt]').textContent = amt(14800);
    $('.pt-paid').textContent = amt(paid);
    $('.pt-left').textContent = amt(14800 - paid);
    const due = INV.some((v) => v.state === 'due');
    const dot = $('.pt-dot'); if (dot) dot.hidden = !due;
  }
  invs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pay]'); if (!b) return;
    b.disabled = true; b.textContent = 'Paying…';
    setTimeout(() => {
      const v = INV[+b.dataset.pay]; v.state = 'paid'; v.date = 'Paid just now';
      paintInv();
      DOCS.push(['Receipt for ' + v.name.toLowerCase(), 'PDF', 'Added just now', () => '<p>Received with thanks: <b>' + amt(v.gbp) + '</b>, for ' + v.name.toLowerCase() + '.</p><p>Cedar &amp; Co Interiors</p>']);
      paintDocs();
      update('Payment received for ' + v.name.toLowerCase(), 'Just now', true);
      toast('Paid. Your receipt is in Documents.');
    }, HJ.reduce ? 0 : 700);
  });
  HJ.onCurrency(() => { paintInv(); });

  /* Messages */
  const thread = $('.pt-thread');
  function say(who, text, when) {
    const p = document.createElement('p'); p.className = 'pt-m' + (who === 'me' ? ' me' : '');
    p.textContent = text; const s = document.createElement('small'); s.textContent = (who === 'me' ? 'You' : 'Nadia') + ' · ' + when; p.appendChild(s);
    thread.appendChild(p);
    return p;
  }
  say('them', 'Morning Amira! The final kitchen drawings are in Documents. I’ve added the pantry cupboard next to the fridge, like we discussed.', 'Wed 21 Oct, 9:12');
  say('me', 'Love it. Could the island be 10 cm longer?', 'Wed 21 Oct, 18:40');
  say('them', 'Done, it’s in the drawings now. Have a look and approve when you’re happy, and we’ll order the units.', 'Thu 22 Oct, 8:05');
  $('.pt-compose').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('#pt-text'), t = inp.value.trim(); if (!t) return;
    say('me', t, 'Just now').scrollIntoView({ block: 'nearest', behavior: HJ.reduce ? 'auto' : 'smooth' });
    inp.value = '';
    const r = /when|date|start|finish|time/i.test(t) ? 'The fitters start on Monday 16 November, and we’re on track to finish on Friday 4 December.'
      : /pay|cost|price|invoice|money/i.test(t) ? 'Everything is under Invoices, with what’s paid, what’s due and when. Nothing changes without you agreeing first.'
      : 'Thanks Amira, got it. I’ll come back to you on that today.';
    setTimeout(() => { say('them', r, 'Just now').scrollIntoView({ block: 'nearest', behavior: HJ.reduce ? 'auto' : 'smooth' }); }, HJ.reduce ? 0 : 1100);
  });
})();
