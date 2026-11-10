/* Book a call: the next ten days except Sundays, then the request goes to my inbox */
(() => {
  const days = document.getElementById('call-days');
  const fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
  const fmtD = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
  const fmtLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const d = new Date(); d.setDate(d.getDate() + 1);
  let n = 0;
  while (n < 10) {
    if (d.getDay() !== 0) {
      const l = document.createElement('label');
      l.innerHTML = '<input type="radio" name="day"><span></span>';
      l.querySelector('input').value = fmtLong.format(d);
      l.querySelector('span').innerHTML = fmt.format(d) + '<small>' + fmtD.format(d) + '</small>';
      days.appendChild(l); n++;
    }
    d.setDate(d.getDate() + 1);
  }
  const form = document.getElementById('call'), err = document.getElementById('call-err'), done = document.getElementById('call-done');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const need = [['name', 'Please tell me your name.'], ['email', 'Please add your email, so I can confirm the time.']];
    let bad = null;
    need.forEach(([k, m]) => { const i = form.elements[k]; const em = i.parentElement.querySelector('em'); const ok = k === 'email' ? /.+@.+\..+/.test(i.value.trim()) : i.value.trim(); i.setAttribute('aria-invalid', ok ? 'false' : 'true'); em.textContent = ok ? '' : m; if (!ok && !bad) bad = i; });
    if (!f.get('day') || !f.get('time')) { err.textContent = 'Please pick a day and a time of day.'; if (!bad) { (form.querySelector('[name=day]') || form).focus(); return; } } else err.textContent = '';
    if (bad) { bad.focus(); return; }
    const fields = { Day: f.get('day'), Time: f.get('time'), How: f.get('how'), Name: f.get('name'), Email: f.get('email'), Business: f.get('business') || '', Phone: f.get('phone') || '', Note: f.get('note') || '', _replyto: f.get('email') };
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    const ok = await window.HJ.send(fields, 'Call request: ' + f.get('name'));
    if (ok) { form.hidden = true; done.hidden = false; done.focus(); } else btn.disabled = false;
  });
})();
