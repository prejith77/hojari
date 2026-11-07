/* The free X-ray: a web address in, a short report out within 48 hours. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('.xr-form');
  const q = new URLSearchParams(location.search);
  if (q.get('site')) form.site.value = q.get('site').slice(0, 200);
  const grade = q.get('grade'), score = q.get('score');
  if (grade && /^(Shaabi|Shazri|Najdi|Hojari)$/.test(grade)) {
    const n = $('.xr-from');
    n.textContent = 'Your website scored ' + (score && /^\d{1,2}$/.test(score) ? score + ' out of 10' : '') + ' on the grader, which makes it ' + grade + '. I’ll start the X-ray from there.';
    n.hidden = false;
  }
  const msgs = {
    site: 'Your web address, so I know what to look at.',
    name: 'Your name, so I know who to send it to.',
    email: 'An email address that works, so the report reaches you.',
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form._gotcha.value) return;
    let first = null;
    Object.keys(msgs).forEach((k) => {
      const el = form[k], bad = !el.value.trim() || !el.checkValidity() || (k === 'site' && !/\.[a-z]{2,}/i.test(el.value));
      el.setAttribute('aria-invalid', bad);
      el.parentNode.querySelector('.q-err').textContent = bad ? msgs[k] : '';
      if (bad && !first) first = el;
    });
    if (first) { first.focus(); return; }
    const btn = $('.xr-go'); btn.disabled = true; btn.textContent = 'Sending…';
    const fields = {
      website: form.site.value.trim(), name: form.name.value.trim(), email: form.email.value.trim(),
      whatsapp: form.phone.value.trim() || 'not given', notes: form.notes.value.trim() || 'none',
      grader: grade ? grade + (score ? ' (' + score + '/10)' : '') : 'not used',
    };
    await HJ.send(fields, 'X-ray request: ' + fields.website);
    $('.xr-who').textContent = fields.name.split(' ')[0];
    $('.xr-fields').hidden = true;
    const sent = $('.xr-sent'); sent.hidden = false; sent.focus();
  });
  form.querySelectorAll('input').forEach((el) => el.addEventListener('input', () => { el.removeAttribute('aria-invalid'); const er = el.parentNode.querySelector('.q-err'); if (er) er.textContent = ''; }));
})();
