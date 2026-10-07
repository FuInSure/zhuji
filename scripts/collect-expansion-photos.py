import json, pathlib, runpy, time

ROOT = pathlib.Path(__file__).resolve().parents[1]
query = runpy.run_path(str(ROOT / 'scripts/collect-book-photos.py'))['query']
plan = json.loads((ROOT / 'data/expansion-plan.json').read_text(encoding='utf-8'))
def find(record):
    aliases={'gaojia':'"高家大院" "西安"','zhongshan':'"Zhongshan Bridge" "Lanzhou"','tangqi':'"广济桥" "塘栖"','fenghuang':'"Phoenix Tower" "Manchu"','huozhou':'"霍州署"','pingyao':'"Pingyao" "Yamen"','nanyang':'"南阳府衙"','huaian':'"淮安府署"'}
    term=aliases.get(record['id'],'"'+record['name'].split('（')[0]+'"')+' filetype:bitmap'
    for attempt in range(5):
        try:
            key, candidates = query((record['id'],term))
            if not candidates:
                key, candidates = query((record['id'],'"'+record['photoQuery']+'" filetype:bitmap'))
            break
        except Exception as error:
            print(record['id']+': retry '+str(attempt+1)+' '+str(error),flush=True)
            if attempt==4: return record['id'], []
            time.sleep(8*(attempt+1))
    print(key + ': ' + ' | '.join(c['title']+' ['+c['license']+']' for c in candidates[:4]), flush=True)
    return key, candidates
manifest=ROOT / 'qa/expansion-photo-candidates.json'
results=json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else {}
for record in plan['additions']:
    if results.get(record['id']): continue
    key,candidates=find(record);results[key]=candidates
    manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    time.sleep(1.2)
