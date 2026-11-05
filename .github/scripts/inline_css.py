"""At deploy time, put the stylesheet inside the page so phones don't wait for a second file before showing anything."""
import re

page = 'public/index.html'
tag = '<link rel="stylesheet" href="styles.css">'
html = open(page).read()
css = open('public/styles.css').read()
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
css = re.sub(r'\s*\n\s*', '\n', css).strip()
assert tag in html and '</style' not in css
open(page, 'w').write(html.replace(tag, '<style>' + css + '</style>', 1))
print('inlined', len(css), 'bytes of CSS')
