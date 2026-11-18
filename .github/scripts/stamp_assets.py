"""Adds the deploy's version to every local script and stylesheet link, so a browser never pairs a new page with an old script."""
import os, re, pathlib

ver = (os.environ.get('GITHUB_SHA') or 'dev')[:8]
pat = re.compile(r'((?:src|href)=")((?!https?:|//|data:)[^"?#]+\.(?:js|css))(")')
n = 0
for f in pathlib.Path('public').rglob('*.html'):
    t = f.read_text(encoding='utf-8')
    s = pat.sub(lambda m: f'{m.group(1)}{m.group(2)}?v={ver}{m.group(3)}', t)
    if s != t:
        f.write_text(s, encoding='utf-8'); n += 1
print(f'stamped {n} pages with v={ver}')
