"""After each deploy, tell Bing (and the other IndexNow engines) which pages exist, so changes are picked up straight away."""
import json
import re
import urllib.request

KEY = '61598d9417ee8519f94082c47d0a9382'
HOST = 'hojari.co.uk'

sitemap = open('public/sitemap.xml').read()
urls = re.findall(r'<loc>([^<]+)</loc>', sitemap)
body = json.dumps({
    'host': HOST,
    'key': KEY,
    'keyLocation': f'https://{HOST}/{KEY}.txt',
    'urlList': urls,
}).encode()
req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body,
                             headers={'Content-Type': 'application/json; charset=utf-8'})
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        print('IndexNow', r.status, 'for', len(urls), 'pages')
except Exception as e:  # never fail the deploy over this
    print('IndexNow skipped:', e)
