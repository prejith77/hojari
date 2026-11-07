# Prospect brief

Everything worth knowing about a business's website before writing to them by email or text. Not part of the website: nothing in `tools/` is published.

## Run it

```bash
node tools/prospect/brief.js https://their-site.com /path/to/output
```

It opens the site as an iPhone and as a laptop and writes `brief.json`, `phone-first-screen.png`, `laptop-first-screen.png` and `phone-full.png`.

It records:

- **Speed on a phone:** when the main content appears, layout shift, page weight and number of files.
- **Phone problems:** sideways scrolling, text under 14px (with examples), tap targets that are too small, and how many screens long the page is.
- **The action:** the first booking, contact or buy button, whether it shows on the first screen, and where it goes.
- **Contact routes:** phone, email, WhatsApp, forms and social links.
- **Trust:** testimonials on the page, a star rating, visible prices, and the copyright year.
- **Google basics:** title, description, the canonical address, share image and the main heading.
- **What it's built with and what it pays for:** WordPress, Wix, Shopify, booking apps, payment, chat, analytics and more, from the page's own code.
- **Broken links:** on up to 25 internal pages, plus failed files and script errors.

## Then add by hand

1. Lighthouse on mobile:

   ```bash
   npx lighthouse <url> --only-categories=performance,accessibility,best-practices,seo
   ```

2. Their Google rating and review count, and whether the site shows them.
3. Two local competitors, and the one thing each does better.
4. The one fix you'd make first, with a screenshot that shows the problem.
5. A first message: one specific problem, one screenshot, one result, one small ask. Send them to hojari.co.uk/start/ instead of booking a call.
