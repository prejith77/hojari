/* Shared by every page: the menu on phones and tablets, and the fill that follows the cursor into a button.
   Without JavaScript the links stay in the footer and the buttons simply change colour. */
(() => {
  const root = document.documentElement;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- The menu: one screen of large links, opened from the button in the bar ----------
     While it is open the page behind is locked and out of reach: Tab goes round the bar and the links only,
     Escape or the button closes it and puts you back on the button, and any link closes it on the way out. */
  const btn = document.querySelector('.menu-btn[aria-controls]');
  const menu = btn && document.getElementById(btn.getAttribute('aria-controls'));
  if (btn && menu) {
    const bar = btn.closest('header') || btn.parentElement;
    const wide = matchMedia('(min-width: 900px)');
    let open = false, timer = 0, held = [];
    /* each line knows its place in the stagger */
    [...menu.children].forEach((el, i) => el.style.setProperty('--i', Math.min(i, 6)));
    const shown = (el) => el.getClientRects().length > 0 && !el.closest('[inert]');
    const stops = () => $$('a[href], button:not([disabled])', bar).filter(shown);

    const set = (on, refocus) => {
      if (on === open) return;
      open = on;
      clearTimeout(timer);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) {
        root.style.setProperty('--bar-h', Math.round(bar.getBoundingClientRect().height) + 'px');
        root.classList.remove('menu-out');
        root.classList.add('menu-on', 'menu-lock');
        /* everything but the bar goes out of reach, and so does the bar's own trial button (the menu has its own) */
        held = [...document.body.children].filter((el) => el !== bar && !el.inert && !/^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName))
          .concat($$('.top-cta, :scope > .button', bar).filter((el) => !menu.contains(el)));
        held.forEach((el) => { el.inert = true; });
        menu.getBoundingClientRect(); /* start from the closed look, so the opening can play */
        root.classList.add('menu-in');
        const first = menu.querySelector('a[href]');
        if (first) first.focus({ preventScroll: true });
      } else {
        root.classList.add('menu-out');
        root.classList.remove('menu-in', 'menu-lock');
        held.forEach((el) => { el.inert = false; });
        held = [];
        /* the whole screen fades out as one, then leaves the page */
        timer = setTimeout(() => root.classList.remove('menu-on', 'menu-out'), calm.matches ? 0 : 200);
        if (refocus) btn.focus({ preventScroll: true });
      }
    };

    btn.addEventListener('click', () => set(!open, false));
    /* a link in the menu (or the wordmark) closes it and carries on to where it goes */
    bar.addEventListener('click', (e) => { if (open && e.target.closest('a[href]')) set(false, false); });
    document.addEventListener('keydown', (e) => {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); set(false, true); return; }
      if (e.key !== 'Tab') return;
      const list = stops();
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1], at = document.activeElement;
      if (!list.includes(at)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
    });
    /* turning a tablet sideways into the laptop layout closes it */
    const toWide = (e) => { if (e.matches) set(false, false); };
    if (wide.addEventListener) wide.addEventListener('change', toWide); else if (wide.addListener) wide.addListener(toWide);
    /* coming back to the page with the browser's back button, the menu is closed */
    addEventListener('pageshow', () => set(false, false));
  }

  /* ---------- Buttons: on a laptop the fill comes in from the side the cursor enters, and leaves by the side it goes out ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const SEL = '.button, .top-cta';
    const side = (b, e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--from', e.clientX < r.left + r.width / 2 ? '1' : '-1');
    };
    document.addEventListener('pointerover', (e) => {
      const b = e.target.closest && e.target.closest(SEL);
      if (b && !(e.relatedTarget && b.contains(e.relatedTarget))) side(b, e);
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const b = e.target.closest && e.target.closest(SEL);
      if (b && !(e.relatedTarget && b.contains(e.relatedTarget))) side(b, e);
    }, { passive: true });
  }
})();
