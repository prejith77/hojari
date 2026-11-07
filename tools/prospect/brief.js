/* Prospect brief: everything worth knowing about a business's website before writing to them.
   Usage: node tools/prospect/brief.js https://example.com [outDir]
   Writes brief.json plus phone and laptop screenshots to outDir. Reviews, competitors and
   Lighthouse are gathered separately (see README.md). */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = process.argv[2];
if (!url) { console.error('Usage: node brief.js <url> [outDir]'); process.exit(1); }
const out = process.argv[3] || path.join(process.cwd(), 'brief-' + new URL(url).hostname);
fs.mkdirSync(out, { recursive: true });

/* What the page is built with and which tools it pays for, from its own code */
const FINGERPRINTS = {
  'WordPress': /wp-content|wp-includes/i, 'Wix': /wixstatic|wix\.com|_wixCIDX/i, 'Squarespace': /squarespace/i,
  'Shopify': /cdn\.shopify|myshopify/i, 'Webflow': /webflow/i, 'GoDaddy builder': /godaddy|img1\.wsimg/i, 'Framer': /framerusercontent|framer\.com/i,
  'Elementor': /elementor/i, 'Divi': /et_pb_|\/themes\/Divi\//, 'WooCommerce': /woocommerce/i,
  'Google Analytics': /gtag\(|google-analytics|googletagmanager/i, 'Meta Pixel': /fbq\(|connect\.facebook\.net/i, 'TikTok Pixel': /analytics\.tiktok/i,
  'Hotjar': /hotjar/i, 'Microsoft Clarity': /clarity\.ms/i,
  'Calendly': /calendly/i, 'Fresha': /fresha/i, 'Booksy': /booksy/i, 'Setmore': /setmore/i, 'Acuity': /acuityscheduling|squarespacescheduling/i,
  'SimplyBook': /simplybook/i, 'Treatwell': /treatwell/i, 'Mindbody': /mindbody/i, 'Square': /squareup|square\.site/i, 'Vagaro': /vagaro/i, 'Zoho': /zoho/i,
  'Stripe': /js\.stripe|stripe\.com/i, 'PayPal': /paypal/i, 'Tabby/Tamara': /tabby|tamara/i,
  'Mailchimp': /mailchimp|list-manage/i, 'Klaviyo': /klaviyo/i, 'HubSpot': /hs-scripts|hubspot/i,
  'Tawk.to': /tawk\.to/i, 'Intercom': /intercom/i, 'Tidio': /tidio/i, 'Crisp': /crisp\.chat/i, 'WhatsApp widget': /elfsight|getbutton|whatsapp-widget/i,
  'Cookie banner': /cookiebot|onetrust|cookieyes|iubenda|complianz/i, 'reCAPTCHA': /recaptcha/i,
};
const ACTION = /\b(book|booking|appointment|reserve|call|contact|enquir|get in touch|buy|shop|order|quote|consultation|schedule)\b/i;

async function inspect(page, label) {
  return page.evaluate((args) => {
    const [ACTION_SRC, label] = args;
    const ACTION = new RegExp(ACTION_SRC, 'i');
    const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
    const textEls = [...document.querySelectorAll('p, li, a, span, button, td, label, small')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2));
    const tinyEls = textEls.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14);
    const tiny = tinyEls.length;
    const tinySamples = tinyEls.slice(0, 6).map((e) => getComputedStyle(e).fontSize + ' ' + e.innerText.trim().replace(/\s+/g, ' ').slice(0, 50));
    const taps = [...document.querySelectorAll('a[href], button, [role=button], input[type=submit]')].filter(vis);
    const smallTaps = taps.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 40 && r.width < 40; }).length;
    const cta = taps.map((e) => ({ text: (e.innerText || e.value || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60), href: e.getAttribute('href') || '', top: Math.round(e.getBoundingClientRect().top + scrollY) }))
      .filter((c) => c.text && ACTION.test(c.text)).sort((a, b) => a.top - b.top);
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);
    const imgs = [...document.querySelectorAll('img')];
    return {
      label,
      title: document.title,
      description: (document.querySelector('meta[name=description]') || {}).content || null,
      canonical: (document.querySelector('link[rel=canonical]') || {}).href || null,
      ogImage: (document.querySelector('meta[property="og:image"]') || {}).content || null,
      viewport: (document.querySelector('meta[name=viewport]') || {}).content || null,
      lang: document.documentElement.lang || null,
      h1: [...document.querySelectorAll('h1')].map((h) => h.innerText.trim().slice(0, 120)),
      sideways: document.documentElement.scrollWidth - innerWidth,
      height: document.documentElement.scrollHeight,
      screens: Math.round(document.documentElement.scrollHeight / innerHeight * 10) / 10,
      tinyText: tiny, tinySamples, textBlocks: textEls.length,
      smallTapTargets: smallTaps, tapTargets: taps.length,
      firstAction: cta[0] || null, actionAboveFold: !!(cta[0] && cta[0].top < innerHeight), actions: cta.slice(0, 8),
      phones: [...new Set(links.filter((l) => l.startsWith('tel:')))],
      emails: [...new Set(links.filter((l) => l.startsWith('mailto:')).map((l) => l.split('?')[0]))],
      whatsapp: [...new Set(links.filter((l) => /wa\.me|whatsapp\.com/.test(l)).map((l) => l.split('?')[0]))],
      social: [...new Set(links.filter((l) => /instagram|facebook|linkedin|tiktok|youtube|x\.com|twitter/.test(l)).map((l) => l.split('?')[0]))].slice(0, 8),
      forms: document.querySelectorAll('form').length,
      imagesNoAlt: imgs.filter((i) => !i.hasAttribute('alt')).length, images: imgs.length,
      prices: (document.body.innerText.match(/(£|\$|€|AED|OMR|USD|GBP)\s?\d[\d,.]*/g) || []).slice(0, 8),
      reviewsOnPage: /review|testimonial|★|stars?\b|rated/i.test(document.body.innerText),
      quotes: document.querySelectorAll('blockquote, q, [class*=testimonial i], [class*=review i], [class*=voice i]').length,
      starRating: /\b[45]\.\d\s?(★|stars?|\/\s?5|out of 5)|★★★★/i.test(document.body.innerText),
      year: (document.body.innerText.match(/©\s?(\d{4})|(\d{4})\s?©/) || []).slice(1).find(Boolean) || null,
    };
  }, [ACTION.source, label]);
}

async function vitals(page) {
  return page.evaluate(() => new Promise((res) => {
    let lcp = 0, cls = 0;
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    setTimeout(() => {
      const res2 = performance.getEntriesByType('resource');
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const bytes = res2.reduce((a, r) => a + (r.transferSize || 0), 0) + (nav.transferSize || 0);
      res({ lcpMs: Math.round(lcp), cls: Math.round(cls * 1000) / 1000, requests: res2.length + 1, kb: Math.round(bytes / 1024), loadMs: Math.round(nav.loadEventEnd || 0) });
    }, 1500);
  }));
}

(async () => {
  const browser = await chromium.launch();
  const report = { url, checkedAt: new Date().toISOString(), errors: [], broken: [], pages: [] };
  let html = '';

  for (const [label, ctxOpts] of [['phone', { ...devices['iPhone 13'] }], ['laptop', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    if (label === 'phone') {
      page.on('pageerror', (e) => report.errors.push(e.message.slice(0, 160)));
      page.on('response', (r) => { if (r.status() >= 400 && r.request().resourceType() !== 'media') report.errors.push(r.status() + ' ' + r.url().slice(0, 120)); });
    }
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 }).catch((e) => { report.errors.push('load failed: ' + e.message.slice(0, 120)); return null; });
    report[label + 'LoadMs'] = Date.now() - t0;
    if (resp) report.status = resp.status();
    report.finalUrl = page.url();
    report.https = page.url().startsWith('https://');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(out, label + '-first-screen.png') });
    if (label === 'phone') { html = await page.content(); report.phoneVitals = await vitals(page); }
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(H, 30000); y += 700) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(600);
    report[label] = await inspect(page, label);
    if (label === 'phone') await page.screenshot({ path: path.join(out, 'phone-full.png'), fullPage: true }).catch(() => {});

    /* Follow the first call to action on a phone and see where it goes */
    if (label === 'phone' && report.phone.firstAction && report.phone.firstAction.href && !report.phone.firstAction.href.startsWith('#')) {
      report.firstActionGoesTo = new URL(report.phone.firstAction.href, page.url()).href;
    }

    /* Internal pages and broken links, from the laptop pass */
    if (label === 'laptop') {
      const origin = new URL(page.url()).origin;
      const internal = [...new Set(await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href.split('#')[0])))]
        .filter((l) => l.startsWith(origin) && !/\.(pdf|jpg|png|webp|zip)$/i.test(l)).slice(0, 25);
      for (const l of internal) {
        const r = await ctx.request.get(l, { timeout: 20000 }).catch(() => null);
        const st = r ? r.status() : 0;
        report.pages.push({ url: l, status: st });
        if (!r || st >= 400) report.broken.push({ url: l, status: st });
      }
    }
    await ctx.close();
  }

  report.tools = Object.keys(FINGERPRINTS).filter((k) => FINGERPRINTS[k].test(html));
  await browser.close();
  fs.writeFileSync(path.join(out, 'brief.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})();
