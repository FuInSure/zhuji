import json, pathlib, re, urllib.request, urllib.parse, html, time
from PIL import Image, ImageDraw
ROOT=pathlib.Path(__file__).resolve().parents[1]
catalog=json.loads((ROOT/'data/architectures.json').read_text(encoding='utf-8'))
candidates=json.loads((ROOT/'qa/expansion-photo-candidates.json').read_text(encoding='utf-8'))
credits=json.loads((ROOT/'data/photo-credits.json').read_text(encoding='utf-8'))
PICKS=dict(qianqing=0,kunning=0,yangxin=1,wuying=1,cining=0,huangji=0,chongzheng=1,fenghuang=0,qingning=0,huozhou=0,pingyao=0,nanyang=0,wangjia=0,huangcheng=0,shijia=4,gaojia=0,chengqi=0,huaiyuan=0,yuchang=0,fuyu=0,eryi=0,hegui=1,huxueyan=0,shangshudi=0,luzhai=1,zhongshan=0,baodai=0,wuting=0,seventeen=0,jadebelt=2,tangqi=2,beijian=0,rulong=0)
def exact_file(title):
    params=dict(action='query',format='json',titles=title,prop='imageinfo',iiprop='url|extmetadata',iiurlwidth=1280)
    request=urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params),headers={'User-Agent':'ZhujiEducationalAtlas/1.0'})
    data=json.load(urllib.request.urlopen(request,timeout=30));page=next(iter(data['query']['pages'].values()));info=page['imageinfo'][0];meta=info['extmetadata']
    plain=lambda name:html.unescape(re.sub('<[^>]*>','',meta.get(name,{}).get('value','')))
    return dict(title=title,description=plain('ImageDescription'),author=plain('Artist'),license=plain('LicenseShortName'),licenseUrl=plain('LicenseUrl'),date=plain('DateTimeOriginal'),page=info['descriptionurl'],original=info['url'],thumbnail=info.get('thumburl',info['url']))
for r in catalog['records'][15:]:
    key=r['id']
    if key in credits and (ROOT/credits[key].get('local','missing')).is_file():continue
    if key=='huaian':
        credits[key]=dict(kind='illustration',author='筑迹',title='官署院落形制概念图',description='原创图稿，非建筑实测复原和实景摄影',page=r['sourceIds'][0],date='2026-10-07',license='本项目原创图稿',local='')
        continue
    if key=='wenhua':
        photo=exact_file('File:北京故宫12.JPG')
    else:photo=candidates[key][PICKS[key]]
    assert photo['license'].startswith(('CC BY','CC0','Public domain')),(key,photo['license'])
    photo=dict(photo,kind='historical' if key in ['huozhou','baodai'] else 'photo',local='assets/photos/'+key+'.jpg',changes='Commons提供的缩略图；按容器显示时裁切，内容未改动。')
    if not photo['licenseUrl']:photo['licenseUrl']='https://commons.wikimedia.org/wiki/Commons:Public_domain'
    destination=ROOT/photo['local']
    for attempt in range(4):
        try:
            req=urllib.request.Request(photo['thumbnail'].split('?')[0],headers={'User-Agent':'ZhujiEducationalAtlas/1.0'})
            payload=urllib.request.urlopen(req,timeout=35).read();destination.write_bytes(payload)
            with Image.open(destination) as image:assert image.width>=350 and image.height>=200
            break
        except Exception as error:
            print(key+' retry '+str(error),flush=True)
            if attempt==3:raise
            time.sleep(5+attempt*5)
    credits[key]=photo
    (ROOT/'data/photo-credits.json').write_text(json.dumps(credits,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(key+': '+photo['title']+' / '+photo['license'],flush=True)
    time.sleep(.5)
(ROOT/'data/photo-credits.json').write_text(json.dumps(credits,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'photo-data.js').write_text('window.AtlasPhotos='+json.dumps(credits,ensure_ascii=False)+';\n',encoding='utf-8')
sheet=Image.new('RGB',(1500,1750),'#e7dfcc');draw=ImageDraw.Draw(sheet)
for i,r in enumerate(catalog['records'][15:]):
    x,y=10+i%5*300,10+i//5*250;p=credits[r['id']]
    if p['kind']!='illustration':
        image=Image.open(ROOT/p['local']).convert('RGB');image.thumbnail((280,210));sheet.paste(image,(x,y))
    draw.text((x,y+215),r['id'],fill='#143b37')
sheet.save(ROOT/'qa/扩充建筑图片总览.jpg')
print('Photo records',len(credits))
