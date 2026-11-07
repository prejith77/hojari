"""At deploy time, put the stylesheet inside the page so phones don't wait for a second file before showing anything."""
import re

tag = '<link rel="stylesheet" href="styles.css">'
css = open('public/styles.css').read()
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
css = re.sub(r'\s*\n\s*', '\n', css).strip()
assert '</style' not in css
# the homepage, and the grade page, which shares the homepage stylesheet (it uses <base href="/">)
for page in ('public/index.html', 'public/grade/index.html'):
    html = open(page).read()
    assert tag in html, page
    open(page, 'w').write(html.replace(tag, '<style>' + css + '</style>', 1))
    print('inlined', len(css), 'bytes of CSS into', page)
