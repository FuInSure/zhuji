"""Collect original-file metadata; this manifest also preserves image attribution."""
import concurrent.futures, html, json, pathlib, re, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
QUERIES = {
    'zhaozhou': '"Anji Bridge" filetype:bitmap',
    'luoyang': '"Luoyang Bridge" Quanzhou filetype:bitmap',
    'anping': '"Anping Bridge" filetype:bitmap',
    'guangji': '"Guangji Bridge" filetype:bitmap',
    'lugou': '"Lugou Bridge" filetype:bitmap',
    'neixiang': '"Neixiang" "Yamen" filetype:bitmap',
    'taihe': '"Hall of Supreme Harmony" filetype:bitmap',
    'zhonghe': '"Hall of Central Harmony" filetype:bitmap',
    'baohe': '"Hall of Preserving Harmony" filetype:bitmap',
    'dazheng': '"Dazheng Hall" filetype:bitmap',
    'luding': '"Luding Bridge" filetype:bitmap',
    'zhili': '"Zhili" "Governor" filetype:bitmap',
    'qiao': '"Qiao Family" filetype:bitmap',
    'yinyu': '"Yin Yu Tang" filetype:bitmap',
    'chengzhi': '"承志堂" filetype:bitmap',
}

def plain(value):
    return html.unescape(re.sub(r'<[^>]*>', '', value)).strip()

def query(item):
    key, term = item
    params = dict(action='query', format='json', generator='search', gsrsearch=term,
                  gsrnamespace=6, gsrlimit=5, prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=1280)
    request = urllib.request.Request('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params),
                                     headers={'User-Agent': 'ZhujiEducationalAtlas/1.0 (local educational prototype)'})
    data = json.load(urllib.request.urlopen(request, timeout=35))
    candidates = []
    for page in sorted(data.get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 99)):
        info = page.get('imageinfo', [{}])[0]
        meta = info.get('extmetadata', {})
        value = lambda field: plain(meta.get(field, {}).get('value', ''))
        candidates.append(dict(title=page['title'], description=value('ImageDescription'),
                               author=value('Artist'), license=value('LicenseShortName'),
                               licenseUrl=value('LicenseUrl'), date=value('DateTimeOriginal'),
                               page=info.get('descriptionurl'), original=info.get('url'),
                               thumbnail=info.get('thumburl', info.get('url'))))
    return key, candidates

if __name__ == '__main__':
    import sys
    if '--chengzhi' in sys.argv:
        key, candidates = query(('chengzhi', QUERIES['chengzhi']))
        manifest = ROOT / 'qa' / 'photo-candidates.json'
        output = json.loads(manifest.read_text(encoding='utf-8'))
        output[key] = candidates
        manifest.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(candidates, ensure_ascii=False, indent=2))
        raise SystemExit
    output = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for key, candidates in pool.map(query, QUERIES.items()):
            output[key] = candidates
            print(key + ': ' + ' | '.join(c['title'] + ' [' + c['license'] + ']' for c in candidates), flush=True)
    (ROOT / 'qa' / 'photo-candidates.json').write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
