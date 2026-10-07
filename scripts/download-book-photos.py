import concurrent.futures, json, pathlib, urllib.request
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[1]
PICKS = dict(zhaozhou=0, luoyang=0, anping=0, guangji=0, lugou=3, neixiang=0,
             taihe=0, zhonghe=2, baohe=1, dazheng=0, luding=1, zhili=0,
             qiao=3, yinyu=0, chengzhi=1)
candidates = json.loads((ROOT / 'qa/photo-candidates.json').read_text(encoding='utf-8'))
photos = {key: dict(candidates[key][index], local='assets/photos/' + key + '.jpg',
                    changes='使用Commons提供的缩略图；页面显示时按容器裁切，未改动原始内容。')
          for key, index in PICKS.items()}
(ROOT / 'assets/photos').mkdir(parents=True, exist_ok=True)

def download(item):
    key, photo = item
    assert photo['license'].startswith(('CC BY', 'CC0', 'Public domain'))
    request = urllib.request.Request(photo['thumbnail'].split('?')[0],
                                     headers={'User-Agent': 'ZhujiEducationalAtlas/1.0'})
    with urllib.request.urlopen(request, timeout=40) as response:
        payload = response.read()
    target = ROOT / photo['local']
    target.write_bytes(payload)
    with Image.open(target) as image:
        assert image.width >= 350 and image.height >= 200
    print(key + ': ' + str(len(payload)) + ' bytes', flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    list(pool.map(download, photos.items()))
(ROOT / 'data/photo-credits.json').write_text(json.dumps(photos, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'photo-data.js').write_text('window.AtlasPhotos=' + json.dumps(photos, ensure_ascii=False) + ';\n', encoding='utf-8')
sheet = Image.new('RGB', (1250, 950), '#e9e0cc')
draw = ImageDraw.Draw(sheet)
for index, (key, photo) in enumerate(photos.items()):
    image = Image.open(ROOT / photo['local']).convert('RGB')
    image.thumbnail((235, 265))
    x, y = 10 + (index % 5) * 250, 10 + (index // 5) * 315
    sheet.paste(image, (x, y))
    draw.text((x, y + 275), key, fill='#142c2c')
sheet.save(ROOT / 'qa/photo-contact-sheet.jpg')
