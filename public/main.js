/* Hojari: motion and interaction. Every word, number and link is already in the HTML; this adds movement and play. */
(function () {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 900px) and (pointer: fine)').matches;
  const wide = matchMedia('(min-width: 900px)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  /* Some in-app previews draw the page in a frame as tall as the whole page; keep things simple there */
  const embedded = innerHeight > (window.screen.height || innerHeight) * 1.6;
  if (embedded) root.classList.add('embedded');
  const motion = hasGsap && !reduce && !embedded;
  const soft = !desktop; /* phones: no blur filters, they are costly to draw */
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (hasGsap && typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const onceInView = (el, fn, ratio = 0.35) => {
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fn(); io.disconnect(); } }, { threshold: ratio });
    io.observe(el);
  };

  /* Smooth scrolling on desktop */
  let lenis = null;
  if (motion && desktop && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.12 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); const el = id.length > 1 && $(id); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: id === '#top' ? 0 : -20, duration: 1.4 });
    }));
  }

  /* Nav tightens once you start scrolling */
  const nav = $('#nav');
  const navCheck = () => nav.classList.toggle('scrolled', scrollY > 80);
  addEventListener('scroll', navCheck, { passive: true }); navCheck();

  /* Reveal when seen: fires for anything on screen or already scrolled past, so a jump (a menu tap,
     a link, a refresh halfway down) can never leave content hidden */
  const watch = [];
  const seen = () => {
    const vh = innerHeight;
    for (let i = watch.length - 1; i >= 0; i--) {
      const [el, fn] = watch[i];
      if (el.getBoundingClientRect().top < vh * 0.9) { watch.splice(i, 1); fn(); }
    }
  };
  const whenSeen = (el, fn) => { watch.push([el, fn]); requestAnimationFrame(seen); };
  let seenQueued = false;
  const seenSoon = () => { if (!seenQueued) { seenQueued = true; requestAnimationFrame(() => { seenQueued = false; seen(); }); } };
  addEventListener('scroll', seenSoon, { passive: true }); addEventListener('resize', seenSoon);
  setInterval(() => watch.length && seen(), 400);

  /* Headlines: masked lines rise and sharpen */
  const heroTitle = $('.hero-title');
  if (motion && typeof SplitText !== 'undefined') {
    heroTitle.style.visibility = 'hidden';
    const go = () => {
      $$('.split').forEach((el) => {
        const s = el === heroTitle
          ? SplitText.create(el, { type: 'lines,words,chars', mask: 'lines', linesClass: 'line', charsClass: 'hc' })
          : SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
        if (el === heroTitle && !desktop) {
          /* Tap the tear on a phone and the headline jumps */
          addEventListener('tearburst', () => gsap.fromTo(s.chars, { y: 0 }, { y: -18, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1, stagger: { each: 0.025, from: 'center' }, overwrite: true }));
        }
        if (el === heroTitle && desktop) {
          /* The headline leans towards your cursor, letter by letter */
          const ys = s.chars.map((ch) => gsap.quickTo(ch, 'y', { duration: 0.6, ease: 'power3.out' }));
          const rs = s.chars.map((ch) => gsap.quickTo(ch, 'rotation', { duration: 0.6, ease: 'power3.out' }));
          addEventListener('pointermove', (e) => {
            if (scrollY > innerHeight) return;
            s.chars.forEach((ch, i) => {
              const r = ch.getBoundingClientRect();
              const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
              const f = Math.max(0, 1 - Math.hypot(dx, dy) / 240);
              ys[i](-f * f * 28); rs[i](f * Math.sign(dx || 1) * -7);
            });
          }, { passive: true });
        }
        const anim = soft ? { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.08 } : { yPercent: 110, filter: 'blur(8px)', duration: 1, ease: 'power4.out', stagger: 0.09 };
        if (el === heroTitle) { el.style.visibility = ''; gsap.from(s.lines, { ...anim, delay: 0.15 }); }
        else if (el.getBoundingClientRect().top > innerHeight * 0.9) { gsap.set(s.lines, soft ? { yPercent: 110 } : { yPercent: 110, filter: 'blur(8px)' }); whenSeen(el, () => gsap.to(s.lines, soft ? { yPercent: 0, duration: 0.8, ease: 'power4.out', stagger: 0.08 } : { yPercent: 0, filter: 'blur(0px)', duration: 1, ease: 'power4.out', stagger: 0.09 })); }
      });
      gsap.from('.hero-sub, .hero-actions, .hero-note', { y: 18, opacity: 0, filter: soft ? 'none' : 'blur(6px)', duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.5 });
      ScrollTrigger.refresh();
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(go);
    setTimeout(() => { heroTitle.style.visibility = ''; }, 2500);
  }

  /* Blocks of content fade up out of a blur, once */
  if (motion) {
    const sel = '.grader-lede, .check, .grader-result, .stack li, .stack-total, .pricing-sub, .founding, .freebies, .build-head p, .build-grid, .case-status, .case-lede, .case-list li, .case-text .text-link, .case-shots, .work-intro p, .services-head p, .tile, .apps-lede, .apps-note, .app-demo, .bargain-head p, .compare tbody tr, .pricing-head p, .plan, .how-head > p, .how-head .button, .step, .palette-head p, .swatches, .about-lead, .about-cols > div, .qa, .contact-lede, .contact-form, .foot-line';
    const items = $$(sel).filter((el) => el.getBoundingClientRect().top > innerHeight);
    gsap.set(items, soft ? { y: 24, opacity: 0 } : { y: 32, opacity: 0, filter: 'blur(8px)' });
    const show = (els) => gsap.to(els, { y: 0, opacity: 1, filter: soft ? 'none' : 'blur(0px)', duration: soft ? 0.6 : 0.8, ease: 'power3.out', stagger: 0.08, overwrite: true, clearProps: 'filter' });
    let queue = [], timer = 0;
    items.forEach((el) => whenSeen(el, () => { queue.push(el); clearTimeout(timer); timer = setTimeout(() => { show(queue); queue = []; }, 30); }));
  }

  /* GRADES: the held scene. Scroll moves the tear down the grades, Shaabi to Hojari */
  const gradesEl = $('#grades');
  if (motion && (wide || root.classList.contains('webgl')) && gradesEl) {
    gradesEl.classList.add('is-live');
    const items = $$('.grade', gradesEl), rail = $$('.grade-rail span', gradesEl), railBar = $('.grade-rail', gradesEl);
    const names = items.map((g) => (typeof SplitText !== 'undefined' ? SplitText.create($('.grade-name', g), { type: 'chars', mask: 'chars', charsClass: 'ch' }).chars : [$('.grade-name', g)]));
    gsap.set(items, { autoAlpha: 0 }); gsap.set(items[0], { autoAlpha: 1 }); items[0].classList.add('is-active'); rail[0].classList.add('is-on');
    let beat = 0;
    const show = (n, dir) => {
      const out = items[beat], inn = items[n];
      out.classList.remove('is-active'); inn.classList.add('is-active');
      const bl = soft ? 'none' : 'blur(10px)', b0 = soft ? 'none' : 'blur(0px)';
      gsap.to(out, { autoAlpha: 0, y: dir * -40, filter: bl, duration: 0.4, ease: 'power2.in', overwrite: true });
      gsap.fromTo(inn, { autoAlpha: 0, y: dir * 40, filter: bl }, { autoAlpha: 1, y: 0, filter: b0, duration: 0.6, ease: 'power3.out', overwrite: true });
      gsap.fromTo(names[n], { yPercent: dir * 110 }, { yPercent: 0, duration: 0.8, ease: 'power4.out', stagger: 0.035 });
      rail.forEach((r, i) => r.classList.toggle('is-on', i === n));
      beat = n; gradesEl.dataset.beat = n;
    };
    ScrollTrigger.create({
      trigger: gradesEl, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        railBar.style.setProperty('--p', self.progress.toFixed(3));
        const n = Math.min(3, Math.floor(self.progress * 4.0001));
        if (n !== beat) show(n, n > beat ? 1 : -1);
      },
    });
  }

  /* GRADER: your ticks set the grade, and the tear on the right takes it */
  const grades = [
    [0, 'Shaabi', 'The lowest one. Rough, but fixable, and fixing it is my job.'],
    [0, 'Shaabi', 'One tick is a start. Your customers have noticed the other four.'],
    [1, 'Shazri', 'Decent, but forgettable. People close the tab and move on.'],
    [1, 'Shazri', 'Getting there. A couple of fixes would lift you a grade.'],
    [2, 'Najdi', 'Properly good. One step off the top.'],
    [3, 'Hojari', 'The top grade. Honestly, you might not need me. Fancy a chat anyway?'],
  ];
  const graderEl = $('#grader'), form = $('#grader-form');
  if (form) {
    let nameSplit = null;
    const nameEl = $('#grade-name'), lineEl = $('#grade-line'), cta = $('#grade-cta'), poster = $('#grader-poster');
    form.addEventListener('change', () => {
      const n = $$('input:checked', form).length;
      const [idx, g, line] = grades[n];
      if (nameSplit) { nameSplit.revert(); nameSplit = null; }
      const changed = nameEl.textContent !== g;
      nameEl.textContent = g; lineEl.textContent = line;
      graderEl.dataset.grade = idx;
      poster.src = idx === 3 ? 'assets/tear-poster.webp' : 'assets/tear-g' + idx + '.webp';
      if (changed && motion) {
        if (typeof SplitText !== 'undefined') nameSplit = SplitText.create(nameEl, { type: 'chars', mask: 'chars', charsClass: 'ch' });
        const chars = nameSplit ? nameSplit.chars : [nameEl];
        gsap.from(chars, { yPercent: 110, duration: 0.7, ease: 'power4.out', stagger: 0.04 });
        gsap.fromTo(poster, { scale: 0.9 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
      }
      cta.textContent = g === 'Hojari' ? 'Keep it that way' : 'Get me to Hojari';
      cta.href = 'mailto:prejith.ponnachan1@outlook.com?subject=' + encodeURIComponent('My website grades as ' + g) +
        '&body=' + encodeURIComponent('Hi Prejith,\n\nMy website scored ' + n + ' out of 5 (' + g + ').\nMy business is: \nMy website is: \n');
    });
  }

  /* PROMISE: each word lights up as you read down the screen */
  const promise = $('.promise');
  if (motion && promise) {
    $$('.promise-text', promise).forEach((el) => {
      const text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(/\s+/).map((w) => '<span class="w" aria-hidden="true">' + w + '</span>').join(' ');
    });
    const spans = $$('.w', promise);
    let ticking = false;
    const light = () => {
      ticking = false;
      const r = promise.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const lit = p * spans.length * 1.15;
      spans.forEach((sp, i) => sp.style.setProperty('--o', Math.min(1, Math.max(0.16, lit - i)).toFixed(2)));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(light); } }, { passive: true });
    addEventListener('resize', light); light();
  }

  /* WORK: a pinned horizontal run on desktop, pictures drifting inside their frames */
  const work = $('#work'), track = $('.work-track');
  if (motion && wide && work) {
    work.classList.add('is-live');
    const win = $('.work-window', work);
    const dist = () => Math.max(0, track.scrollWidth - win.clientWidth);
    const run = gsap.to(track, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: work, pin: true, scrub: 1, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true } });
    $$('.card-media img', work).forEach((img) => gsap.fromTo(img, { xPercent: -4, scale: 1.12 }, { xPercent: 4, scale: 1.12, ease: 'none',
      scrollTrigger: { containerAnimation: run, trigger: img.closest('.card'), start: 'left right', end: 'right left', scrub: true } }));
  }

  /* WORK on phones: the cards stack, each one sinking back as the next slides over it */
  if (motion && !wide) {
    const cards = $$('.work-track .card');
    let ticking = false;
    const stack = () => {
      ticking = false;
      const vh = innerHeight;
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const p = Math.min(1, Math.max(0, (vh - next.getBoundingClientRect().top) / (vh - 90)));
        card.style.transform = 'scale(' + (1 - p * 0.08).toFixed(4) + ')';
        card.style.setProperty('--dim', p.toFixed(3));
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(stack); } }, { passive: true });
    stack();
  }

  /* Cursor bubble and tilt on the work cards */
  if (motion && desktop) {
    const cur = $('.cursor'); cur.style.display = 'block';
    const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3.out' }), cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3.out' });
    addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
    $$('[data-cursor]').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' }), ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      gsap.set(card, { transformPerspective: 1200 });
      card.addEventListener('pointerenter', () => { cur.firstElementChild.textContent = card.dataset.cursor || 'Visit'; cur.classList.add('is-on'); });
      card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 6); rx(-((e.clientY - r.top) / r.height - 0.5) * 6); });
      card.addEventListener('pointerleave', () => { cur.classList.remove('is-on'); rx(0); ry(0); });
    });
    /* The portrait leans towards you */
    const pt = $('[data-tilt]');
    if (pt) {
      const img = $('img', pt);
      const rx = gsap.quickTo(img, 'rotationX', { duration: 0.8, ease: 'power3.out' }), ry = gsap.quickTo(img, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      gsap.set(img, { transformPerspective: 900 });
      pt.addEventListener('pointermove', (e) => { const r = pt.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 14); rx(-((e.clientY - r.top) / r.height - 0.5) * 14); });
      pt.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }
  }

  /* Spotlight: a soft light follows the cursor across tiles and plans */
  if (desktop) $$('.spot').forEach((c) => c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect(); c.style.setProperty('--x', e.clientX - r.left + 'px'); c.style.setProperty('--y', e.clientY - r.top + 'px');
  }));

  /* SERVICES demos */
  const phoneTile = $('.tile-phone');
  if (phoneTile && !reduce) new IntersectionObserver(([e]) => phoneTile.classList.toggle('is-on', e.isIntersecting), { threshold: 0.4 }).observe(phoneTile);
  onceInView($('#chat'), () => $('#chat').classList.add('is-on'), 0.5);
  onceInView($('#week'), () => $('#week').classList.add('is-on'), 0.6);

  // Booking: pick a day and a time, then book it
  const booker = $('#booker');
  if (booker) {
    const days = $$('.chip', booker), slots = $$('.slot:not(:disabled)', booker), btn = $('#book-btn'), out = $('#booked');
    const full = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };
    let day = 'Mon', time = null;
    const refresh = () => {
      btn.classList.remove('is-done'); out.textContent = '';
      btn.disabled = !time; btn.textContent = time ? `Book ${day} ${time}` : 'Pick a time';
    };
    days.forEach((d) => d.addEventListener('click', () => { days.forEach((x) => { x.classList.toggle('is-on', x === d); x.setAttribute('aria-pressed', x === d); }); day = d.textContent; refresh(); }));
    slots.forEach((s) => s.addEventListener('click', () => { slots.forEach((x) => { x.classList.toggle('is-on', x === s); x.setAttribute('aria-pressed', x === s); }); time = s.textContent; refresh(); }));
    btn.addEventListener('click', () => {
      if (!time) return;
      btn.classList.add('is-done'); btn.textContent = 'Booked';
      out.textContent = `Booked for ${full[day]} at ${time}. That's how easy it should be for your customers.`;
      if (motion) gsap.fromTo(btn, { scale: 0.94 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    });
  }

  /* Phone demo: pick a business, the phone becomes its website */
  const bizData = [
    ['Corner Café', 'Open till 5', 'Flat white £3.20', 'Order ahead, skip the queue', 'Rated 4.8', 'Order ahead', 'Find us', '#7a3f12'],
    ['Moon & Spoon', 'Open till 11', 'Sunday roast £18', 'Tables free tonight', 'Rated 4.7', 'Book a table', 'See the menu', '#5c1f1b'],
    ['Studio Nine', 'Open till 8', 'Cut and finish £45', 'Late appointments on Thursdays', 'Rated 4.9', 'Book now', 'Call us', '#2b5a42'],
    ['Fade Factory', 'Walk-ins welcome', 'Skin fade £22', 'In and out in 30 minutes', 'Rated 4.9', 'Book a cut', 'Call us', '#1d2a3a'],
    ['Back on Track', 'Open till 7', 'First session £55', 'Appointments this week', 'Rated 5.0', 'Book online', 'Call us', '#33465c'],
    ['Bright Street Dental', 'New patients welcome', 'Check-up £45', 'Evening appointments', 'Rated 4.8', 'Book a check-up', 'Call us', '#1f5560'],
    ['Stronger Mondays', 'Mornings and evenings', 'First session free', 'Plans that fit round work', 'Rated 5.0', 'Book a session', 'WhatsApp me', '#4a2c5c'],
    ['Ace Plumbing', 'Call-outs 24/7', 'Boiler service £79', 'Same-day call-outs', 'Rated 4.9', 'Call now', 'Get a quote', '#17120c'],
    ['Petal & Stem', 'Open till 6', 'Bouquets from £35', 'Same-day delivery', 'Rated 4.9', 'Order flowers', 'Call us', '#7d3a52'],
    ['Clear Books', 'Mon to Fri', 'Self assessment £150', 'Fixed monthly fees', 'Rated 4.9', 'Book a free call', 'Email us', '#2f3e2f'],
  ];
  const screen = $('#phone-screen'), bizBtns = $$('.biz .chip');
  const setBiz = (n) => {
    const [name, open, offer, sub, stars, a, b, col] = bizData[n];
    const apply = () => {
      $('#ph-name').textContent = name; $('#ph-open').textContent = open; $('#ph-offer').textContent = offer; $('#ph-sub').textContent = sub;
      $('#ph-stars').firstChild.textContent = stars + ' '; $('#ph-a').textContent = a; $('#ph-b').textContent = b;
      $('#ph-hero').style.backgroundColor = col;
      screen.classList.remove('is-swapping');
    };
    bizBtns.forEach((x, i) => { x.classList.toggle('is-on', i === n); x.setAttribute('aria-pressed', i === n); });
    if (reduce) return apply();
    screen.classList.add('is-swapping'); setTimeout(apply, 220);
  };
  bizBtns.forEach((btn, i) => btn.addEventListener('click', () => setBiz(i)));
  if (screen) $('#ph-hero').style.backgroundColor = bizData[0][7];

  /* Apps demo: a loyalty card. Eight stamps and the coffee's free */
  const appBtn = $('#app-btn');
  if (appBtn) {
    const stamps = $$('#stamps i'), count = $('#app-count'), reward = $('#app-reward'), demo = $('.app-demo');
    let n = 3;
    const paint = () => { count.textContent = n + ' of 8 stamps'; stamps.forEach((st, i) => st.classList.toggle('is-on', i < n)); };
    const confetti = () => {
      if (!motion) return;
      const cols = ['#e3ad5c', '#b8661d', '#d7dcc7', '#2b5a42', '#f2f0eb'];
      const r = appBtn.getBoundingClientRect(), d = demo.getBoundingClientRect();
      for (let i = 0; i < 40; i++) {
        const c = document.createElement('i'); c.className = 'confetti'; c.style.background = cols[i % cols.length];
        c.style.left = (r.left - d.left + r.width / 2) + 'px'; c.style.top = (r.top - d.top) + 'px';
        demo.appendChild(c);
        gsap.to(c, { x: gsap.utils.random(-170, 170), y: gsap.utils.random(-380, -160), rotation: gsap.utils.random(-540, 540), duration: gsap.utils.random(0.8, 1.3), ease: 'power3.out' });
        gsap.to(c, { y: '+=260', opacity: 0, duration: 1, delay: gsap.utils.random(0.8, 1.2), ease: 'power1.in', onComplete: () => c.remove() });
      }
    };
    appBtn.addEventListener('click', () => {
      if (n >= 8) { n = 0; paint(); reward.classList.remove('is-on'); appBtn.textContent = 'Add a stamp'; return; }
      n++; paint();
      if (motion) gsap.fromTo(stamps[n - 1], { scale: 0.4 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
      if (n === 8) { reward.classList.add('is-on'); appBtn.textContent = 'Start a new card'; confetti(); }
    });
  }

  /* Tickers: count up once, always landing on the exact number in the HTML */
  $$('.ticker').forEach((el) => {
    if (!motion) return;
    const to = parseFloat(el.dataset.to), o = { v: 0 };
    onceInView(el, () => gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-GB'); }, onComplete: () => { el.textContent = to.toLocaleString('en-GB'); } }), 0.9);
  });

  /* HOW IT WORKS: the line draws as you read, each step lights as you reach it */
  const steps = $('.steps');
  if (motion && steps) {
    const bar = $('.steps-line', steps);
    bar.style.setProperty('--p', 0);
    ScrollTrigger.create({ trigger: steps, start: 'top 60%', end: 'bottom 60%', onUpdate: (s) => bar.style.setProperty('--p', s.progress.toFixed(3)) });
    $$('.step', steps).forEach((st) => ScrollTrigger.create({ trigger: st, start: 'top 62%', toggleClass: 'is-on' }));
  } else if (steps) $$('.step', steps).forEach((st) => st.classList.add('is-on'));

  /* Magnetic buttons */
  if (motion && desktop) $$('.magnetic').forEach((b) => {
    const x = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3.out' }), y = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3.out' });
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.3); y((e.clientY - r.top - r.height / 2) * 0.3); });
    b.addEventListener('pointerleave', () => { x(0); y(0); });
  });

  /* Contact: open an email with everything filled in */
  const cf = $('#contact-form');
  if (cf) cf.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = cf.name.value.trim(), email = cf.email.value.trim(), biz = cf.business.value.trim();
    $('#sent').textContent = "Opening your email app. If nothing happens, your laptop's being shy, so email me at prejith.ponnachan1@outlook.com.";
    location.href = 'mailto:prejith.ponnachan1@outlook.com?subject=' + encodeURIComponent('New project from ' + name) +
      '&body=' + encodeURIComponent('Hi Prejith,\n\nName: ' + name + '\nEmail: ' + email + '\nMy business: ' + biz + '\n');
  });

  /* Footer: the letters rise into place, then bounce when you poke them */
  const blocks = $$('.blk');
  blocks.forEach((b) => {
    b.addEventListener('click', () => { b.classList.remove('is-boing'); void b.offsetWidth; b.classList.add('is-boing'); });
    b.addEventListener('animationend', () => b.classList.remove('is-boing'));
  });
  if (motion && $('.blocks').getBoundingClientRect().top > innerHeight) { gsap.set(blocks, { yPercent: 60 }); whenSeen($('.blocks'), () => gsap.to(blocks, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.06, clearProps: 'transform' })); }

  /* BUILD: a homepage that puts itself together as you choose */
  const bForm = $('#build-form');
  if (bForm) {
    // label, headline, line, button, three price tiles, a review, a name for Surprise me, shape layout
    const types = [
      ['Café', 'Good coffee, two minutes from your desk.', 'Open from 7. Order ahead and skip the queue.', 'Order ahead', ['Flat white £3.20', 'Breakfast till 11', 'Cakes baked here'], 'Best flat white on the high street.', 'The Daily Grind', [[8, 4], [58, 10], [22, 78]]],
      ['Restaurant', 'Book the table before your mate does.', 'Seasonal menu, proper portions, open till late.', 'Book a table', ['Sunday roast £18', 'Two courses £24', 'Private room'], 'We\'ve been back four times this month.', 'Moon & Spoon', [[44, 0], [6, 24], [40, 80]]],
      ['Salon', 'Leave looking like the photo you showed us.', 'Late appointments on Thursdays. Walk-ins when we can.', 'Book a chair', ['Cut and finish £45', 'Colour from £70', 'Late Thursdays'], 'Finally, someone who listens.', 'Studio Nine', [[48, 2], [6, 30], [30, 82]]],
      ['Barber', 'Fresh trim, no small talk required.', 'Walk in or book online. In and out in 30 minutes.', 'Book a cut', ['Skin fade £22', 'Beard trim £12', 'Kids\' cut £15'], 'Best fade in the city, no contest.', 'Fade Factory', [[10, 20], [52, 4], [30, 80]]],
      ['Nails and beauty', 'Nails you\'ll keep looking at.', 'Gel, acrylics and brows, booked in two taps.', 'Book now', ['Gel manicure £30', 'Brows £18', 'Full set £40'], 'They lasted three weeks. Three!', 'Nailed It Studio', [[56, 18], [14, 6], [20, 82]]],
      ['Personal trainer', 'Stronger by summer. Actually this time.', 'One-to-one sessions and plans that fit round work.', 'Book a free session', ['First session free', '10 sessions £350', 'Online plans'], 'Down two sizes and I actually enjoy it.', 'Stronger Mondays', [[26, 26], [62, 2], [6, 80]]],
      ['Physio', 'Back to running without the wince.', 'Same-week appointments and a plan you can follow.', 'Book a session', ['First session £55', 'Sports massage £45', 'Same-week slots'], 'Sorted my knee in four sessions.', 'Back on Track', [[30, 20], [64, 0], [4, 76]]],
      ['Dentist', 'Check-ups without the dread.', 'New patients welcome. Evening appointments available.', 'Book a check-up', ['Check-up £45', 'Hygienist £60', 'Whitening'], 'I didn\'t even mind going. Weird.', 'Bright Street Dental', [[4, 10], [46, 22], [44, 82]]],
      ['Trades', 'Fixed properly the first time.', 'Same-day call-outs and fixed prices you can see upfront.', 'Get a quote', ['Boiler service £79', 'Same-day call-outs', 'Fully insured'], 'Turned up on time and cleaned up after.', 'Ace Plumbing', [[60, 30], [10, 4], [36, 80]]],
      ['Cleaner', 'Come home to a clean house.', 'Weekly, fortnightly or a one-off deep clean.', 'Get a quote', ['Regular clean £16/hr', 'Deep clean', 'End of tenancy'], 'I didn\'t know my oven was that colour.', 'Shine & Co', [[40, 4], [8, 40], [50, 82]]],
      ['Photographer', 'Photos you\'ll actually frame.', 'Weddings, portraits and brand shoots, booked a year ahead.', 'Check my dates', ['Weddings from £1,200', 'Portraits £150', 'Brand shoots'], 'We cried looking at them. Good crying.', 'Frame & Field', [[18, 0], [50, 30], [12, 84]]],
      ['Accountant', 'Taxes done. Panic cancelled.', 'Fixed monthly fees for sole traders and small companies.', 'Book a free call', ['Self assessment £150', 'Bookkeeping', 'VAT returns'], 'First January I haven\'t panicked.', 'Clear Books', [[62, 6], [20, 18], [8, 84]]],
      ['Florist', 'Flowers that make the card look lazy.', 'Same-day delivery across town, ordered in a minute.', 'Order flowers', ['Bouquets from £35', 'Same-day delivery', 'Weddings'], 'She said yes. The flowers helped.', 'Petal & Stem', [[24, 4], [60, 26], [16, 80]]],
      ['Tutor', 'Grades up, stress down.', 'GCSE and A level maths, online or in person.', 'Book a trial lesson', ['Trial lesson free', 'GCSE maths £35/hr', 'A level £40/hr'], 'Went from a 4 to a 7.', 'Top Marks Tutoring', [[52, 0], [4, 14], [34, 82]]],
      ['Shop', 'Small shop, good taste, free local delivery.', 'New stock every week, wrapped properly if it\'s a gift.', 'Shop now', ['New in this week', 'Gift wrapping', 'Free delivery over £30'], 'Wrapped better than I could ever do it.', 'Kept & Co', [[14, 26], [56, 14], [10, 84]]],
    ];
    const looks = [
      ['Warm', { '--bg': '#f6efe3', '--ink': '#2a1a0d', '--acc': '#9a4f12', '--acc2': '#e3ad5c' }],
      ['Fresh', { '--bg': '#eef3ee', '--ink': '#12261b', '--acc': '#2b5a42', '--acc2': '#9fc7a8' }],
      ['Bold', { '--bg': '#161412', '--ink': '#f4f1ea', '--acc': '#e05a2b', '--acc2': '#e3ad5c' }],
    ];
    const featNames = { booking: 'Online booking', prices: 'Prices', reviews: 'Reviews', gallery: 'Gallery', map: 'Map', whatsapp: 'WhatsApp button' };
    const page = $('#m-page'), mock = $('#mock'), nameIn = $('#b-name'), send = $('#b-send');
    const typeWrap = $('#b-types');
    typeWrap.innerHTML = types.map((x, i) => `<button type="button" class="chip${i ? '' : ' is-on'}" aria-pressed="${i ? 'false' : 'true'}">${x[0]}</button>`).join('');
    const typeBtns = $$('.chip', typeWrap), lookBtns = $$('#b-looks .chip'), featBtns = $$('#b-feats .chip'), viewBtns = $$('#b-view .chip');
    let t = 0, l = 0, view = 'laptop';
    const feats = new Set(['prices', 'reviews']);
    const biz = () => nameIn.value.trim() || 'Your Business';
    const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '') || 'yourbusiness';
    const pressed = (btns, n) => btns.forEach((x, i) => { x.classList.toggle('is-on', i === n); x.setAttribute('aria-pressed', i === n); });
    const updateLink = () => {
      send.href = 'mailto:prejith.ponnachan1@outlook.com?subject=' + encodeURIComponent('My homepage: ' + biz()) +
        '&body=' + encodeURIComponent('Hi Prejith,\n\nI played with the homepage builder.\nBusiness: ' + biz() + '\nWhat we do: ' + types[t][0] +
        '\nWhat it needs: ' + ([...feats].map((f) => featNames[f]).join(', ') || 'just the basics') + '\nLook I liked: ' + looks[l][0] + '\n\nMy website (if I have one): \n');
    };
    const updateName = () => {
      $('#m-logo').textContent = biz(); $('#m-copy').textContent = '© ' + biz(); $('#m-url').textContent = slug(biz()) + '.co.uk';
      updateLink();
    };
    const showFeats = (animate) => {
      $$('[data-f]', page).forEach((el) => {
        const on = feats.has(el.dataset.f), was = !el.hidden;
        el.hidden = !on;
        if (on && !was && animate && motion) gsap.fromTo(el, { opacity: 0, y: 12, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)', clearProps: 'transform' });
        if (on && !was && animate && el.dataset.f !== 'whatsapp' && page.scrollHeight > page.clientHeight) page.scrollTo({ top: el.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop - 20, behavior: reduce ? 'auto' : 'smooth' });
      });
      featBtns.forEach((x) => { const on = feats.has(x.dataset.f); x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      updateLink();
    };
    const toTop = () => { if (page.scrollTop > 0) page.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); };
    const paint = (animate) => {
      if (animate) toTop();
      const [, head, sub, cta, tiles, quote, , art] = types[t];
      $('#m-head').textContent = head; $('#m-sub').textContent = sub; $('#m-cta1').textContent = cta; $('#m-cta2').textContent = cta;
      tiles.forEach((x, i) => { $('#m-t' + (i + 1)).textContent = x; });
      $('#m-quote').textContent = '"' + quote + '"';
      Object.entries(looks[l][1]).forEach(([k, v]) => page.style.setProperty(k, v));
      updateName();
      const shapes = $$('.m-art i', page);
      if (animate && motion) {
        gsap.fromTo($$('.m-hero-text > *, .m-tiles > div, .m-quote', page), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.05, overwrite: true });
        shapes.forEach((sh, i) => gsap.to(sh, { left: art[i][0] + '%', top: art[i][1] + '%', bottom: 'auto', right: 'auto', rotation: gsap.utils.random(-14, 14), duration: 0.9, ease: 'elastic.out(1, 0.6)' }));
      } else shapes.forEach((sh, i) => { sh.style.left = art[i][0] + '%'; sh.style.top = art[i][1] + '%'; sh.style.right = 'auto'; sh.style.bottom = 'auto'; });
    };
    const setView = (v) => {
      view = v; mock.dataset.view = v;
      pressed(viewBtns, v === 'laptop' ? 0 : 1);
      if (motion) gsap.fromTo(page, { opacity: 0.4 }, { opacity: 1, duration: 0.5, delay: 0.25 });
    };
    typeBtns.forEach((btn, i) => btn.addEventListener('click', () => { t = i; pressed(typeBtns, i); paint(true); }));
    lookBtns.forEach((btn, i) => btn.addEventListener('click', () => { l = i; pressed(lookBtns, i); paint(true); }));
    featBtns.forEach((btn) => btn.addEventListener('click', () => { const f = btn.dataset.f; if (feats.has(f)) { feats.delete(f); toTop(); } else feats.add(f); showFeats(true); }));
    viewBtns.forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.v)));
    nameIn.addEventListener('input', () => {
      updateName();
      if (motion) gsap.fromTo('#m-logo', { scale: 1.08 }, { scale: 1, duration: 0.3, ease: 'power2.out', overwrite: true });
    });

    // Surprise me: a random business, look and set of features, and its name typed in for you
    let typing = 0;
    $('#b-surprise').addEventListener('click', () => {
      let n = t; while (n === t) n = Math.floor(Math.random() * types.length);
      t = n; l = Math.floor(Math.random() * looks.length);
      feats.clear();
      Object.keys(featNames).forEach((f) => { if (Math.random() < 0.5) feats.add(f); });
      if (feats.size < 2) { feats.add('reviews'); feats.add('prices'); }
      pressed(typeBtns, t); pressed(lookBtns, l);
      paint(true); showFeats(true);
      const name = types[t][6];
      clearInterval(typing);
      if (!motion) { nameIn.value = name; updateName(); return; }
      nameIn.value = ''; let k = 0;
      typing = setInterval(() => { nameIn.value = name.slice(0, ++k); updateName(); if (k >= name.length) clearInterval(typing); }, 45);
    });
    paint(false); showFeats(false);
  }

  /* NOW BUILDING: the two screenshots drift apart as you scroll */
  if (motion && wide && $('.case-shots')) {
    gsap.fromTo('.shot-b', { y: 60 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.case', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* A little hello when you switch tabs */
  const realTitle = document.title;
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? 'Come back, the tear misses you' : realTitle; });

  /* Footer: count the pokes */
  const pokeOut = $('#poke');
  if (pokeOut) {
    let pokes = 0;
    const lines = { 1: 'Boing.', 3: 'They like it.', 6: 'Easy, they bruise.', 10: 'Right, you clearly have time. Fancy a website?', 20: 'Twenty pokes. You\'d be great to work with.', 40: 'Okay, now you\'re just showing off.' };
    $$('.blk').forEach((blk) => blk.addEventListener('click', () => { pokes++; if (lines[pokes]) pokeOut.textContent = lines[pokes]; }));
  }

  /* BARGAIN: strike through the old price once you see it */
  onceInView($('.stack-total'), () => $('.stack-total').classList.add('is-on'), 0.5);

  /* PRICING: monthly or yearly */
  const billBtns = $$('.bill .chip');
  billBtns.forEach((btn) => btn.addEventListener('click', () => {
    const mode = btn.dataset.bill;
    billBtns.forEach((x) => { const on = x === btn; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    $$('.plan .amt').forEach((el) => {
      const to = +el.dataset[mode], from = +el.textContent.replace(/[^0-9]/g, '');
      if (!motion) { el.textContent = to; return; }
      const o = { v: from };
      gsap.to(o, { v: to, duration: 0.6, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); }, onComplete: () => { el.textContent = to; } });
      gsap.fromTo(el, { y: -6 }, { y: 0, duration: 0.5, ease: 'back.out(2)' });
    });
    $$('.plan .per').forEach((el) => { el.textContent = el.dataset[mode]; });
  }));

  addEventListener('load', () => hasGsap && ScrollTrigger.refresh());
})();
