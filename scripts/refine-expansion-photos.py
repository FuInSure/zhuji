import runpy, pathlib, json, urllib.request, time
ROOT=pathlib.Path(__file__).resolve().parents[1]
# Import helpers without running the original download loop.
script=(ROOT/'scripts/download-expansion-photos.py').read_text(encoding='utf-8')
namespace={"__file__":str(ROOT/'scripts/download-expansion-photos.py')}
exec(script[:script.index("for r in catalog['records'][15:]:")],namespace)
credits=namespace['credits']; exact=namespace['exact_file']; candidates=namespace['candidates']
replacements={
 'qianqing':('exact','File:Palace of Heavenly Purity (20220218132818).jpg'),
 'cining':('candidate',2),
 'chongzheng':('exact','File:2014 Manchu Forbidden City Chongzheng Hall 01.jpg'),
 'shijia':('candidate',0),
 'huxueyan':('candidate',1),
 'tangqi':('candidate',3),
}
for key,(mode,value) in replacements.items():
 p=exact(value) if mode=='exact' else candidates[key][value]
 p=dict(p,kind='photo',local='assets/photos/'+key+'.jpg',changes='Commons缩略图，页面显示时按容器裁切，内容未改动。')
 if not p['licenseUrl']:p['licenseUrl']='https://commons.wikimedia.org/wiki/Commons:Public_domain'
 request=urllib.request.Request(p['thumbnail'].split('?')[0],headers={'User-Agent':'ZhujiEducationalAtlas/1.0'})
 (ROOT/p['local']).write_bytes(urllib.request.urlopen(request,timeout=35).read());credits[key]=p
 print(key,p['title'],flush=True);time.sleep(1)
credits['huaian']['page']='https://www.zghaq.gov.cn/col/814_747345/art/ff80808165421cbf016554fc0f69081b.html'
(ROOT/'data/photo-credits.json').write_text(json.dumps(credits,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'photo-data.js').write_text('window.AtlasPhotos='+json.dumps(credits,ensure_ascii=False)+';\n',encoding='utf-8')
