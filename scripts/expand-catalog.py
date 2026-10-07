"""Append the reviewed 35-building set; never replace the original 15 records."""
import json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'data/architectures.json').read_text(encoding='utf-8'))
notes=json.loads((ROOT/'qa/research/palace-notes.json').read_text(encoding='utf-8'))
sources={}
def source(key,title,publisher,url,supports,verification='正文或检索摘录核对；数值仅按所引段落记录'):
    sources[key]=dict(id=key,title=title,publisher=publisher,url=url,checked='2026-10-07',locator='建筑介绍相关段落',supports=supports,verification=verification)
    return key
def palace(key,name):return source('new-'+key,name,'故宫博物院',notes[name]['url'],'始建或营建时期、重建、屋顶、开间及历史用途')
S={k:palace(k,n) for k,n in [('qianqing','乾清宫'),('kunning','坤宁宫'),('yangxin','养心殿'),('wenhua','文华殿'),('wuying','武英殿'),('cining','慈宁宫'),('huangji','皇极殿')]}
S['yangxin-date']=source('new-yangxin-date','关于养心殿重新开放的公告','故宫博物院','https://www.dpm.org.cn/announce_detail/373148.html','1537年始建')
S['shenyang']=source('new-shenyang','沈阳故宫宫殿导览','沈阳故宫博物院','https://www.sypm.org.cn/daolan_1/11.html','天聪年间1627—1636、硬山殿、三层凤凰楼与宫高殿低；取2026-10-07实读正文口径')
S['huozhou']=source('new-huozhou','第四批全国重点文物保护单位：霍州州署大堂','国务院名单／湖南省政府公报转刊','https://hunan.gov.cn/hnszf/szf/hnzb_18/zb9506/202106/19441848/files/90437dce603f4a58b55efd539a69a95b.pdf','霍州州署大堂、元代、霍州市；未提供确切营建年')
S['huozhou-form']=source('new-huozhou-form','霍州州署大堂建筑介绍','百科知识中文网（辅助资料）','https://www.jendow.com.tw/wiki/霍州州署大堂','面阔、进深五间及悬山屋顶；辅助形制来源，非测绘原件')
S['pingyao']=source('new-pingyao','号称古衙之最，这个地方牛在哪？','山西省政府相关网站','https://sxbh.sx.gov.cn/art/2016/11/21/art_1479209_17329426.html','县衙空间、1346年最早现存附属遗构；不能作为全县衙始建年')
S['nanyang']=source('new-nanyang','南阳府衙','南阳市文化广电和旅游局','https://lyj.nanyang.gov.cn/2019/06-05/176235.html','至元八年1271始建及现存明清官署')
S['nanyang-size']=source('new-nanyang-size','南阳府衙','南阳市政府','https://m.nanyang.gov.cn/2021/01-20/295676.html','南北240m、东西150m、面积36000㎡；此页将1271记为南宋咸淳，纪年表述与文旅页不同')
S['huaian']=source('new-huaian','淮安府署','淮安区人民政府','https://www.zghaq.gov.cn/col/814_747345/art/ff80808165421cbf016554fc0f69081b.html','1370年始建，正堂高10m、面积500余㎡')
S['wangjia']=source('new-wangjia','王家大院掠影','中国建设银行（实地游记）','https://www.ccb.com/chn/2009-11/11/article_2021082106152668280.shtml','清康熙至嘉庆陆续营建、城堡式民居；不同游览范围的总数不合并为全宅测绘值')
S['huangcheng']=source('new-huangcheng','东方古堡，人间晋城：皇城相府','晋城市人民政府','https://www.jcgov.gov.cn/dtxx/ztzl/2023ncsmp/jcmpmljc/csmpdfgb/202307/t20230706_1819140.shtml','1632年河山楼动工及城堡式官宦私宅，七层河山楼')
S['shijia']=source('new-shijia','石家大院','天津政务网','https://www.tj.gov.cn/sq/yztj/mswh/202005/t20200520_2468011.html','1875年起大规模营建、约1万㎡占地及宅院组织')
S['gaojia']=source('new-gaojia','高家大院','游西安（公开旅游介绍，辅助资料）','https://xa.ify.cn/content/192.aspx','明崇祯主体、三院四进砖木四合院、总居住面积2517㎡；原始测绘未取得')
S['gaojia-identity']=source('new-gaojia-identity','高家大院一角','西安市地方志办公室','https://xadfz.xa.gov.cn/xadq/dqtk/1901530303720120321.html','北院门历史街区中的高家大院身份')
S['tulou']=source('new-tulou','Fujian Tulou：ICOMOS评估','UNESCO／ICOMOS','https://whc.unesco.org/archive/advisory_body_evaluation/1113.pdf','福建土楼夯土外墙、木构内廊、围合居住类型；不是全部土楼各自的精确尺寸')
S['chengqi']=source('new-chengqi','承启楼——黄土夯筑的东方智慧','厦门大学建筑与土木工程学院','https://arch.xmu.edu.cn/info/1161/17744.htm','明崇祯年间开建、同心环形居住组织')
S['chengqi-date']=source('new-chengqi-date','承启楼','维基百科（辅助年代来源）','https://zh.wikipedia.org/wiki/承启楼','1709建成；与高校明崇祯始建合用，起点不声称确定到某一年')
S['huaiyuan']=source('new-huaiyuan','云水谣：一首流淌着的美丽歌谣','福建省委台港澳工作办公室','https://www.fjtb.gov.cn/meijing/201311/t20131126_5267800.htm','怀远楼1909、1384.7㎡、14.5m、四层136间')
S['tulou-study']=source('new-tulou-study','福建土楼','中国新闻网作者郑珊云／中国文化研究院','https://chiculture.org.hk/sites/mainsite/files/2019-04/30025_fujiantulou_pdf_cn.pdf','裕昌楼元末明初、18.4m、54m、五层；和贵楼1732、建筑面积3574㎡及五层')
S['yuchang-alt']=source('new-yuchang-alt','裕昌楼','维基百科（辅助年代来源）','https://zh.wikipedia.org/wiki/裕昌楼','1308年记载，与元末明初说法不一致，保留分歧')
S['fuyu']=source('new-fuyu','福裕楼','百度百科（辅助年代来源）','https://bkso.baidu.com/item/福裕楼/8596684','1880年开建与府第式形制，需与官方遗产说明合看')
S['fuyu-form']=source('new-fuyu-form','深岩壁垒中的土楼胸怀','中国非物质文化遗产网','https://www.ihchina.cn/news_1_details/11353.html','洪坑林氏土楼及福裕楼；与1912年建的振成楼区分')
S['eryi']=source('new-eryi','华安土楼：规避等级尊卑，吸取西洋文化','凤凰卫视实地访谈','https://phtv.ifeng.com/program/whdgy/detail_2010_08/30/2356729_0.shtml','当地采访者说明1740开工、1770落成')
S['eryi-form']=source('new-eryi-form','土楼不土，尽显科学与艺术之美','福建省人民政府','https://www.fujian.gov.cn/zwgk/ztzl/sxzygwzxsgzx/sdjj/wvjj/202307/t20230718_6208837.htm','二宜楼依山选址、防卫、通廊与传声洞')
S['hegui']=S['tulou-study']
S['huxueyan']=source('new-huxueyan','胡雪岩故居','杭州市纪检监察网站','https://www.hzlz.gov.cn/articles/21006.html','1872年始建及商人私宅')
S['huxueyan-end']=source('new-huxueyan-end','古井调查资料中的胡雪岩旧居介绍','浙江省政府资料平台','https://zjjcmspublic.oss-cn-hangzhou-zwynet-d01-a.internet.cloud.zj.gov.cn/jcms_files/jcms1/web3028/site/attach/0/130d29cd6c7e4a758eca7b4cde84df84.pdf','旧居1872开工、1875竣工；非把宅第面积推作井或排水尺寸')
S['shangshudi']=source('new-shangshudi','云游泰宁县：尚书第','上海市虹口区政府','https://www.shhk.gov.cn/xwzx/002008/002008040/20230625/cfe7b058-fe0c-46e3-bb5e-a93c27e795b1.html','明天启年间李春烨私人府邸；具体开竣工年未定')
S['shangshudi-form']=source('new-shangshudi-form','文脉春秋·泰宁','福建省住房和城乡建设厅','https://zjt.fj.gov.cn/xxgk/gzdt/bmdt/202510/t20251023_7024723.htm','三厅九栋的空间组织')
S['luzhai']=source('new-luzhai','文化注入，唤醒卢宅老街','上海市杨浦区政府／新华社','https://yptimes.shyp.gov.cn/html/2019-01/12/content_6_4.htm','1456年始建、木石砖雕与明清民居群，非现代街区面积')
S['zhongshan']=source('new-zhongshan','中山桥：历史与现代的交汇','甘肃省文博局','https://www.gswbj.gov.cn/a/2024/08/20/21699.html','1908开工1909通行、中外协作与铁桥结构')
S['zhongshan-size']=source('new-zhongshan-size','奋进新时代：丝路古道文脉兴','平凉市政府部门网站','https://wjw.pingliang.gov.cn/xwdt/mtdt/art/2023/art_daf8f0d56a45429eb58ef81c60ea88fb.html','桥面总宽8.46m、总长255.5m；按此介绍口径，不擅改为常见233m说法')
S['baodai']=source('new-baodai','影像苏州：横作天阙宝带桥','苏州市地方志编纂委员会办公室','https://dfzb.suzhou.gov.cn/dfzb/szdq/202402/c45a745178bc4794952cd94cb5e3332d.shtml','816—819营建与漕运、历次修复，不把唐代等同全部现存构件')
S['wuting']=source('new-wuting','扬州瘦西湖：五亭桥','生态中国网','https://www.eco.gov.cn/news_info/40287.html','乾隆二十二年1757、五亭、十五券洞及石基木亭组合')
S['seventeen']=source('new-seventeen','颐和园内最大的石桥：十七孔桥','北京市公园管理中心','https://gygl.beijing.gov.cn/whgy/whgy_wsgc/201912/t20191206_885494.html','1750年、桥身150m宽8m、十七券洞')
S['jadebelt']=source('new-jadebelt','玉带桥','故宫博物院','https://www.dpm.org.cn/lemmas/242946.html','清漪园营建背景与高薄石拱、青石和汉白玉、桥高出水十米有余；此页未给精确建桥年')
S['jadebelt-date']=source('new-jadebelt-date','玉带桥（北京）','维基百科（辅助年代来源）','https://zh.wikipedia.org/wiki/玉带桥_(北京)','1751—1764建造区间；仅作公开资料时间区间，确年待原档核实')
S['tangqi']=source('new-tangqi','塘栖古镇里的世界遗产：广济桥','杭州网','https://hznews.hangzhou.com.cn/chengshi/content/2014-06/30/content_5342158.htm','1498复建，唐代始建为相传；塘栖七孔桥不是潮州广济桥')
S['tangqi-form']=source('new-tangqi-form','余杭塘栖古镇','杭州网文旅介绍','https://ywhz.hangzhou.com.cn/hssj/content/content_6221264.htm','七孔石拱与大运河文化背景')
S['beijian']=source('new-beijian','泰顺廊桥：古老概念的现代遗存','温州市科学技术协会','https://wzast.wenzhou.gov.cn/art/2024/12/17/art_1340940_58921007.html','1674始建、1803重建、1849重修及木拱体系')
S['rulong']=source('new-rulong','庆元县志：古廊桥','浙江省地方志数字平台','https://dfz.zj.gov.cn/zlyz/ossfs/h5/ZS-K-331126-2010-001-0101/files/basic-html/page217.html','1625修造及木拱廊屋')

records=[]
def add(key,name,typ,province,city,region,dynasty,start,end,form,structure,material,refs,summary,story_title,story,poem,visual=None,label=None,kind='始建或建造区间',note='',sizes=(),counts=(),events=()):
    refs=[S.get(x,x) for x in refs]
    r=dict(id=key,name=name,type=typ,province=province,city=city,region=region,dynasty=dynasty,
           date=dict(start=start,end=end,label=label or (str(start)+'年' if start==end else f'{start}—{end}年'),kind=kind,sourceIds=list(refs),intervalMeaning='原文为时期或来源分歧时，范围横线不表示连续施工；单点不表示全部现存构件的年代。'),
           structure=structure,form=form,material=material,rawMaterial=material or '未载明',materialBasis='依据所引文献的结构构件、墙体与屋架描述作体系归类；不是材料检测结果。' if material else '现有依据尚不足以确认整体承重材料，不从外观或瓦片推断。',sizes=[],counts=[],sourceIds=list(refs),
           summary=summary,achievement=story_title,note=note or '图谱定位以所录年代为准；后世修复与现存形制不直接等同始建。',facts=[summary,story[0]],objectLevel='建筑群' if structure=='院落式' else '单体',measurementNotes='尺寸按引用范围独立阅读；未收录不表示数值为0。',events=[],dataGaps=[],visual=visual or {},reading=dict(history=f'{name}位于{province}{city}。'+(label or (str(start)+'年' if start==end else f'{start}—{end}年'))+'是本图谱采用的年代记录。'+summary,storyTitle=story_title,story=story,poemTitle=story_title.split('，')[0],poem=poem,photoCaption=name+'的建筑图版。'))
    r['provenance']={field:dict(sourceIds=list(refs) if field!='material' or material else [],kind='文献记录／明确标注的整理归类') for field in ['identity','date','structure','material']}
    for label_,value,unit,relation,scope in sizes:r['sizes'].append(dict(label=label_,value=value,unit=unit,relation=relation,scope=scope,sourceId=refs[0],locator='建筑介绍相关段落'))
    for label_,value,unit,scope in counts:r['counts'].append(dict(label=label_,value=value,unit=unit,scope=scope,sourceId=refs[0]))
    r['events']=[dict(label=r['date']['label'],start=start,end=end,event=kind,sourceIds=list(refs))]+[dict(label=str(y)+'年',start=y,end=y,event=text,sourceIds=list(refs)) for y,text in events]
    if not r['sizes']:r['dataGaps'].append(dict(field='独立尺寸',reason='本轮未采到可按对象范围引用的尺寸原件。',requiredEvidence='对应建筑的公开测绘或范围明确的修缮资料'))
    if not material:r['dataGaps'].append(dict(field='整体主承重材料',reason='现有介绍不足以确认整体体系。',requiredEvidence='结构测绘或修缮说明'))
    if '时期' in kind or '分歧' in kind:r['dataGaps'].append(dict(field='确切营建年',reason='资料仅给出时期或存在年代分歧。',requiredEvidence='纪年碑、营造档案或断代研究'))
    records.append(r);return r

add('qianqing','乾清宫','皇宫','北京','故宫','华北','明',1420,1420,'重檐庑殿顶九间殿堂','殿堂木架','木构',['qianqing'],'曾为帝王寝宫，后兼理政；现存建筑为1798年重建。','从寝居，到理政',['雍正移居养心殿之后，乾清宫承担召见、批阅奏章与宴会等功能。','九间面阔与五间进深组织殿堂，功能变化发生在既有宫殿空间中。'],['九间檐影纳晨光，','旧日寝居转殿堂。','风过长阶人已远，','梁间仍见岁时长。'],dict(kind='hall',bays=9,width=88,depth=56),sizes=[('建筑面积',1400,'㎡','exact','单体殿堂，非后三宫区域'),('台面至正脊高',20,'m','gt','原文20余米，不含台基')],counts=[('面阔',9,'间','连廊面阔'),('进深',5,'间','单体')],events=[(1798,'现存建筑重建')])
add('kunning','坤宁宫','皇宫','北京','故宫','华北','明',1420,1420,'重檐庑殿顶九间三间殿堂','殿堂木架','木构',['kunning'],'明代皇后寝宫，清代1655年改造了门窗与室内布局。','一座宫殿，两种生活秩序',['顺治时期仿沈阳清宁宫改造，将入口移到东次间。','东侧暖阁和西侧空间承担不同用途；书中按宫殿身份收录，不把附属仪式空间另计为样本。'],['东门一转入宫深，','九间檐下见时痕。','窗影曾随生活换，','长廊仍把院相邻。'],dict(kind='hall',bays=9,width=100,depth=40),counts=[('连廊面阔',9,'间','单体'),('进深',3,'间','单体')],events=[(1605,'火灾后重建'),(1655,'按清宁宫形式改造')])
add('yangxin','养心殿','皇宫','北京','故宫','华北','明',1537,1537,'工字形殿与卷棚抱厦','殿堂木架','木构',['yangxin','yangxin-date'],'工字形布局将理政、读书与寝居联系起来。','大殿里的小房间',['明间、东暖阁与西暖阁各有分工，西侧又分出三希堂等小空间。','建筑的故事不是只有宏大尺度，也包含隔扇如何分出可停留、可交谈的房间。'],['窗分暖阁一灯明，','几案之间听殿声。','纸上山河梁下事，','夜深仍有墨香清。'],dict(kind='courtyard',layout='linked-halls',rows=2,width=85),sizes=[('前殿通面阔',36,'m','exact','前殿，不是整个养心殿区'),('前殿通进深',12,'m','exact','前殿')])
add('wenhua','文华殿','皇宫','北京','故宫','华北','明',1420,1420,'工字形单檐歇山殿','殿堂木架','木构',['wenhua'],'前后殿以穿廊相连，明清时期曾用于经筵。','前后两殿，一条穿廊',['前殿为文华殿，后殿为主敬殿，中间以穿廊联系。','不同殿室共同组成工字形平面，把讲读与宫廷活动放进一组连续空间。'],['前后檐光一廊连，','书声曾绕殿中天。','风翻旧页无声过，','日影还从柱外迁。'],dict(kind='courtyard',layout='linked-halls',rows=2,width=76),note='故宫建筑介绍称始建明初；另故宫青玉“文华殿宝”介绍记1420年。此处采用后者，现存主体为1683年后重建。',counts=[('前殿面阔',5,'间','前殿'),('前殿进深',3,'间','前殿')],events=[(1683,'开始重建')])
S['wenhua-date']=source('new-wenhua-date','青玉交龙纽文华殿宝','故宫博物院','https://www.dpm.org.cn/collection/seal/233643.html','文华殿1420年始建')
records[-1]['sourceIds'].append(S['wenhua-date']);records[-1]['date']['sourceIds'].append(S['wenhua-date']);records[-1]['provenance']['date']['sourceIds'].append(S['wenhua-date']);records[-1]['events'][0]['sourceIds'].append(S['wenhua-date'])
add('wuying','武英殿','皇宫','北京','故宫','华北','明',1368,1424,'单檐歇山前后殿与穿廊','殿堂木架','木构',['wuying'],'清代武英殿书局在此刊印、装潢宫廷书籍。','宫殿，也容纳刻书的人',['康熙时期左右廊房成为修书处，印刷、装潢等活动在殿区展开。','正殿与敬思殿以前后穿廊连接，殿、廊、院落共同组织工作与储藏。'],['殿前风静纸声轻，','字字曾从此处生。','一廊连起前和后，','书影随檐到日明。'],dict(kind='courtyard',layout='linked-halls',rows=2,width=82),label='明初（图区间1368—1424年）',kind='营建时期范围',note='官网只记明初；1368—1424为本图谱洪武至永乐的整理范围，不是已证实的施工起止年。现存建筑包含1869年重建。',counts=[('正殿面阔',5,'间','单体正殿'),('正殿进深',3,'间','单体正殿')],events=[(1869,'火灾后同年重建')])
add('cining','慈宁宫','皇宫','北京','故宫','华北','明',1536,1536,'重檐歇山七间正殿','殿堂木架','木构',['cining'],'主要用于太后重大典礼，1769年改成重檐形制。','从单檐，到重檐',['乾隆时期将正殿由单檐改为重檐，并调整后寝殿的位置。','因此，1536年表示这处宫殿的始建记录，不能直接解释今天所有屋顶与院落细节。'],['双檐叠影对长阶，','旧制新修岁月排。','宫里春光无定式，','风来仍向廊中来。'],dict(kind='hall',bays=7,width=83,depth=52),counts=[('正殿面阔',7,'间','单体正殿')],events=[(1769,'由单檐改重檐，调整后殿')])
add('huangji','皇极殿','皇宫','北京','故宫宁寿宫区','华北','清',1689,1689,'重檐庑殿九五开间','殿堂木架','木构',['huangji'],'原为宁寿宫，1772—1776年改建时改称皇极殿。','为退居生活，安排礼仪空间',['殿前月台、甬道与宁寿门相接，形成礼仪通行的路径。','乾隆退居后的受贺活动与千叟宴，使这座殿在寝居区域中承担典礼用途。'],['九五檐间纳岁长，','阶前曾聚老年光。','宫名改处门犹在，','风把前尘过殿堂。'],dict(kind='hall',bays=9,width=92,depth=48),counts=[('面阔',9,'间','单体'),('进深',5,'间','单体')],events=[(1772,'开始改建宁寿宫区'),(1776,'改建区间终点')])
for key,name,form,summary,title,story,poem,visual,counts in [
 ('chongzheng','崇政殿','单檐硬山五间殿堂','后金时期临朝理政，殿内采取彻上明造。','抬头，看见梁架',['殿内不装天花板，梁架直接进入人的视线。','装饰性的龙形抱头梁，也参与了殿堂的构造表达。'],['五间梁上龙形动，','殿内抬头见木纹。','未把天花遮旧架，','日光从此辨层深。'],dict(kind='hall',bays=5,width=80,depth=55,roof='gable'),[('面阔',5,'间','单体')]),
 ('fenghuang','凤凰楼','三层三滴水歇山楼阁','三层楼阁位于高台寝宫区的门户。','登楼，也是在穿过门户',['凤凰楼兼有通行、停留与藏书等历史用途。','三层三滴水的屋顶，使进入高台寝宫区的路径获得鲜明的竖向标志。'],['三层檐影接晨辉，','一楼风起旧书归。','高台门外看城远，','云过层檐日未微。'],dict(kind='tower',levels=3),[('楼层',3,'层','楼阁')]),
 ('qingning','清宁宫','五间硬山口袋房','入口位于东次间，室内有南、西、北三面万字炕。','门的位置，改变室内路径',['东次间入口与通常居中的入口不同，使空间展开有了自己的秩序。','宫区建在高台上，与南侧崇政殿形成宫高殿低的布局。'],['门向东间留一转，','三面炕前日影深。','高台把家托起处，','宫墙之内有居心。'],dict(kind='hall',bays=5,width=86,depth=38,roof='gable'),[('面阔',5,'间','单体')])]:
 add(key,name,'皇宫','辽宁','沈阳故宫','东北','后金',1627,1636,form,'殿堂木架','砖木复合' if key=='fenghuang' else '木构',['shenyang'],summary,title,story,poem,visual,label='后金天聪年间（1627—1636）',kind='营建时期范围',note='按博物院当前正文记录天聪时期；范围不是已确认的连续施工工期。',counts=counts)

add('huozhou','霍州署大堂','官府','山西','霍州','华北','元',1271,1368,'悬山顶五间元代大堂','殿堂木架','木构',['huozhou','huozhou-form'],'现存州署大堂被列为元代建筑，不把现代复建谯楼作为元代遗构。','官署中，留下的大堂',['现存大堂的梁架与宽阔厅堂，是阅读州级官署的重要对象。','州署整体经历了后世营建与修复，本书将大堂与外围复建部分分开说明。'],['堂前日影入梁间，','元构无声岁月看。','旧署新修须分辨，','一堂风过见长年。'],dict(kind='hall',bays=5,width=82,depth=63,roof='gable'),label='元代（1271—1368年范围）',kind='现存遗构时期范围',note='国保记录只断代为元；不采用未统一核实的1303或1304年。图版采用明代州署平面图，不冒充元代大堂照片。')
add('pingyao','平遥县衙','官府','山西','平遥','华北','元',1346,1346,'多进中轴院落官署','院落式','木构',['pingyao'],'中轴院落分出办公、辅助与生活空间，现存建筑主要为明清营建。','门内门外，空间各有次序',['仪门与大堂等空间逐层展开，办公与生活通过院落划分。','1346年是资料中最早现存附属遗构的年代，不能把整座县衙都定为该年建成。'],['重门次第引庭深，','旧署长廊纳日阴。','一院一阶分职事，','风来还辨往来人。'],dict(kind='courtyard',rows=3,width=95),kind='最早现存附属遗构年代',note='1346用于现存遗构标定，不是全县衙的统一始建年；照片为县衙现今状态。')
add('nanyang','南阳府衙','官府','河南','南阳','华中','元',1271,1271,'多路多进硬山官署','院落式',None,['nanyang-size','nanyang'],'多路院落与中轴大堂共同组织府级官署。','中轴之外，还有左右两路',['中央堂屋与两侧辅助建筑形成主从有序的布局。','公开文旅记载与政府介绍对1271年的朝代纪年措辞不同，书页保留这项差异。'],['堂在中间路向旁，','重门分出院深长。','年月留痕须细读，','风从旧署过回廊。'],dict(kind='courtyard',rows=3,width=108),note='采用1271年；文旅页记元至元八年，另一政府介绍记南宋咸淳七年。尺寸按后者现存官署范围记录，材料未确认。',sizes=[('南北长',240,'m','exact','现存府衙区域'),('东西宽',150,'m','exact','现存府衙区域'),('面积',36000,'㎡','exact','现存府衙区域')])
add('huaian','淮安府署','官府','江苏','淮安','华东','明',1370,1370,'多进官署与高大正堂','院落式',None,['huaian'],'府署长期参与运河沿线的行政活动。','运河边，一座治理的院落',['府署沿用至清末，正堂是官署空间的核心。','收录的高10米、面积500余平方米，只指正堂，不能套用为整个府署的尺度。'],['运河声远到庭前，','堂屋留光院接天。','一署经年持旧路，','风从门外入檐边。'],dict(kind='courtyard',rows=3,width=90),sizes=[('正堂高',10,'m','exact','单体正堂'),('正堂面积',500,'㎡','gt','原文500余平方米，单体正堂')])

add('wangjia','王家大院','民居','山西','灵石静升','华北','清',1662,1820,'依山城堡式院落群','院落式','砖木复合',['wangjia'],'清康熙至嘉庆间陆续营建，院落依山展开。','院中有院，顺着地势生长',['高家崖、红门堡等区域共同呈现城堡式住宅组织。','宅院数量和面积随开放范围变化，因此本轮不合并不同介绍中的总数。'],['层院依山接旧门，','阶随坡势入檐阴。','高低错落人家路，','一堡风来几院深。'],dict(kind='courtyard',rows=3,width=110,terrace=True),label='清康熙至嘉庆时期（1662—1820）',kind='陆续营建时期范围',note='时间为多期营建的朝代范围，非158年的单一施工工期；尺寸总数因区域口径不同暂未合并。')
add('huangcheng','皇城相府','民居','山西','阳城北留','华北','明',1632,1632,'城堡式官宦私宅与高楼','院落式','砖木复合',['huangcheng'],'以1632年河山楼营建标定早期阶段，宅院延续明清多期建造。','高楼，成为宅院的庇护',['河山楼与藏兵洞是住宅中的防卫性空间。','它是官员的私人宅居建筑群，不按衙署或皇宫分类；1632也不表示全部房屋同时建成。'],['高楼守住院中天，','门在堡间路相连。','宅里长留庇护意，','檐风轻过旧家园。'],dict(kind='courtyard',rows=2,width=105,tower=True),kind='早期核心建筑营建年',counts=[('河山楼层数',7,'层','单体河山楼')])
add('shijia','石家大院','民居','天津','杨柳青','华北','清',1875,1875,'多组四合院商宅','院落式','砖木复合',['shijia'],'清末大规模营建，甬道与院落组织商宅生活。','把生活，分到不同院落',['宅院入口、厅堂和居住空间形成递进关系。','砖雕、木雕与石雕出现在不同构件上，共同构成宅院的细部。'],['青砖门里又开庭，','细刻梁边日影生。','甬道牵来人家事，','一院春风一院明。'],dict(kind='courtyard',rows=2,width=94),kind='大规模营建起点',sizes=[('占地面积',10000,'㎡','approx','原文约1万平方米，宅院范围')])
add('gaojia','高家大院（西安）','民居','陕西','西安北院门144号','西北','明',1628,1644,'三院四进砖木四合院','院落式','砖木复合',['gaojia','gaojia-identity'],'主体营建记为明崇祯时期，位于北院门历史街区。','热闹街巷，转入安静院中',['从北院门街进入宅院，空间从街巷转为层层院落。','记录中的居住面积与房屋数来自公开旅游介绍，原始测绘仍待进一步核实。'],['街声转入院中轻，','四进门前日影停。','旧宅留窗看岁月，','长廊深处见家声。'],dict(kind='courtyard',rows=2,width=80),label='明崇祯时期（1628—1644）',kind='营建时期范围',note='不把网上常见1641年直接作为已确认精确年；本条采用原文崇祯时期。',sizes=[('总居住面积',2517,'㎡','exact','辅助旅游介绍所称居住面积，测绘口径待核')])
add('chengqi','承启楼','民居','福建','永定高头','华东','明',1628,1709,'四重同心圆土楼','围合土楼','土木复合',['chengqi','chengqi-date','tulou'],'外环、内环与中心空间构成多重同心居住组织。','一重圆，包着另一重圆',['从入口走入，不只遇到一圈房间，还会穿过内部的环形空间。','图谱将崇祯时期的开建记录与1709年建成分开理解，起点不是已确认的1628年某次开工。'],['圆墙环抱院中天，','一重檐后又一圈。','家声沿着回廊走，','日影从心向外迁。'],dict(kind='round-earth',rings=3,levels=4,radius=105),label='明崇祯开建，1709年建成',kind='开建时期与建成记录',note='1628是崇祯时期起界，不宣称81年连续施工；1709建成采用辅助年代资料，待营造档案进一步核验。')
add('huaiyuan','怀远楼','民居','福建','南靖坎下村','华东','清',1909,1909,'双环圆形土楼','围合土楼','土木复合',['huaiyuan','tulou'],'四层圆楼与内部空间共同组织简氏家庭住宅。','环形廊道，围住共同的院子',['楼外夯土墙与楼内木构通廊承担不同构造功能。','四层的垂直叠置和圆形的水平围合，让家庭生活共享中心空间。'],['四层檐影绕庭圆，','墙外山光入院天。','木廊来往留声息，','一门开启到人间。'],dict(kind='round-earth',rings=2,levels=4,radius=88),kind='所引介绍的建成年',sizes=[('占地面积',1384.7,'㎡','exact','单体土楼'),('楼高',14.5,'m','exact','单体土楼')],counts=[('楼层',4,'层','外环'),('房间总数',136,'间','所引资料单体统计')])
add('yuchang','裕昌楼','民居','福建','南靖下版村','华东','元',1308,1368,'五层圆形土楼与木廊','围合土楼','土木复合',['tulou-study','yuchang-alt','tulou'],'木廊柱有倾斜现象，外墙与内部木构各有功能。','看似倾斜，仍须读懂构造',['楼内廊柱的倾斜是其醒目特点，不能仅凭视觉认定工程安全。','年代资料分别记1308和元末明初，保留分歧，不把两个记载拼成60年施工史。'],['五层廊影绕圆墙，','木柱微斜岁月长。','眼见须从资料读，','一庭天色在中央。'],dict(kind='round-earth',rings=1,levels=5,radius=92),label='1308／元末明初（年代分歧）',kind='来源分歧',note='范围1308—1368用于呈现不同年代记载，不表示连续施工；1368是元明交替整理点。',sizes=[('直径',54,'m','exact','所引研究介绍单体'),('楼高',18.4,'m','exact','所引研究介绍单体')],counts=[('楼层',5,'层','外环')])
add('fuyu','福裕楼','民居','福建','永定洪坑村','华东','清',1880,1880,'府第式五凤楼住宅','院落式','土木复合',['fuyu','fuyu-form','tulou'],'府第式土楼以厅堂和横屋展开，不是圆形环楼。','土楼，也有舒展的院落',['福裕楼的府第式组织与附近圆形土楼不同，厅堂形成清楚的中轴关系。','1880年开建采用辅助介绍；本样本不与1912年建成的振成楼混同。'],['厅堂沿轴次第开，','横屋相接院风来。','土墙未必围成圆，','家在重檐与阶台。'],dict(kind='courtyard',rows=3,width=104,layout='five-phoenix'),note='始建年为公开辅助资料，原始营造档案未收录；形制依据非遗介绍。')
add('eryi','二宜楼','民居','福建','华安大地村','华东','清',1740,1770,'双环圆形土楼','围合土楼','土木复合',['eryi','eryi-form','tulou'],'依山选址，通廊、防卫与传声洞共同参与居住组织。','厚墙之中，藏着交流的路',['外围防卫并不意味着内外完全隔绝，建筑中还有传声洞等交流安排。','楼的朝向回应山势，内部空间与环境选择需要一起阅读。'],['圆墙守住一山青，','细隙传来院外声。','风向曾随门向定，','人家在此过阴晴。'],dict(kind='round-earth',rings=2,levels=4,radius=110))
add('hegui','和贵楼','民居','福建','南靖璞山村','华东','清',1732,1732,'五层方形土楼','围合土楼','土木复合',['hegui','tulou'],'方形围合与五层楼面展示另一种土楼形制。','在湿地上，安排一座方楼',['资料记录它建在沼泽地上，基础安排是理解建筑的重要线索。','高层土楼并非都为圆形，和贵楼以方形院落把生活空间向四边展开。'],['方墙围起一庭光，','五层檐影向天长。','湿地之上留居所，','脚下根基不可忘。'],dict(kind='square-earth',levels=5,width=100),sizes=[('建筑面积',3574,'㎡','exact','原文建筑面积，不当作占地面积')],counts=[('楼层',5,'层','主体土楼')])
add('huxueyan','胡雪岩故居','民居','浙江','杭州元宝街','华东','清',1872,1875,'宅院与园林相连的商人住宅','院落式','砖木复合',['huxueyan','huxueyan-end'],'宅院与园林空间相互联系，1872开工、1875竣工。','居住与游赏，沿院落相遇',['这处私宅把日常居住与园林游赏放在同一组空间中。','从厅堂到回廊，观看距离不断变化；本图稿只表达院落组织，不复原全部宅园。'],['回廊一转看园深，','窗借花光入室阴。','商宅旧事留门里，','一院风来一院春。'],dict(kind='courtyard',rows=2,width=94,garden=True))
add('shangshudi','尚书第（泰宁）','民居','福建','泰宁尚书街','华东','明',1621,1627,'三厅九栋明代私人府邸','院落式','砖木复合',['shangshudi','shangshudi-form'],'李春烨私人宅邸，以多厅多栋组织居住。','一条中轴，容纳多座厅屋',['多厅与横屋共同形成宅邸的层次，而不是单一大厅的扩大。','名字虽含尚书，这是私人居所，书中归入民居，不归为办公衙署。'],['三厅次第对晴光，','九栋相连院更长。','官名之外人家在，','门里风声到旧堂。'],dict(kind='courtyard',rows=3,width=102),label='明天启时期（1621—1627）',kind='营建时期范围',counts=[('厅',3,'座','三厅九栋布局'),('栋',9,'栋','三厅九栋布局')])
add('luzhai','卢宅（东阳）','民居','浙江','东阳','华东','明',1456,1456,'多进院落与木雕厅堂','院落式','木构',['luzhai'],'明清宅院群保存木、石、砖雕等装饰工艺。','在构件上，读一户人家的审美',['雕刻出现在梁枋、门窗和其他构件上，将结构与装饰联系起来。','卢宅古建筑群与后来开发的街区不采用同一面积口径，图谱也不合并两者。'],['木上花纹随影明，','重门院落接家声。','细雕留在梁间处，','风过长廊见旧情。'],dict(kind='courtyard',rows=3,width=98))

add('zhongshan','中山桥（兰州）','桥梁','甘肃','兰州','西北','清',1908,1909,'钢铁桁架梁桥','铁桁梁桥','铁构',['zhongshan-size','zhongshan'],'钢铁构件与中外工程协作跨越黄河。','材料远行，才有河上的路',['构件运输、设计和施工由不同地域的人参与，共同完成黄河铁桥。','照片里的拱形加固与现今设施需要与1909年建成形制分别理解。'],['铁架牵来两岸通，','河声从此过桥中。','远行构件终成路，','一线人间跨水风。'],dict(kind='iron-truss',spans=5),sizes=[('总长',255.5,'m','exact','所引平凉政府介绍口径，不与233m口径混用'),('桥面总宽',8.46,'m','exact','所引资料桥面总宽')])
add('baodai','宝带桥','桥梁','江苏','苏州','华东','唐',816,819,'长列多孔石拱桥','石拱桥','石构',['baodai'],'桥梁与运河纤道联系，经历多次修复。','把纤道，跨过一道水口',['建桥使沿运河的道路可以跨过澹台湖水道。','唐代营建记录与照片中的历代修复部分应分别阅读，不以始建年给所有石块断代。'],['长桥卧水孔相连，','岸上纤声过旧年。','唐迹留名桥历改，','河光仍向石间穿。'],dict(kind='multi-arch',arches=13,profile='flat'),note='概念图以重复券洞表达长桥，不按图稿数孔；始建记录不代表全部现存石构。')
add('wuting','五亭桥','桥梁','江苏','扬州瘦西湖','华东','清',1757,1757,'石基券洞与五亭木构组合','石拱桥','石木复合',['wuting'],'五座风亭与石构桥基共同组成桥上游赏空间。','桥上，也是一处停留的地方',['桥亭把通行和观景叠在同一座桥上，亭与亭之间有联系。','桥下十五券洞与桥上五亭属于不同构件计数，不能彼此混用。'],['五亭檐下水光柔，','桥上停人桥下舟。','月入券中分作影，','一湖风色在桥头。'],dict(kind='pavilion-bridge',pavilions=5),counts=[('风亭',5,'座','桥上亭'),('券洞',15,'个','桥基券洞')])
add('seventeen','十七孔桥','桥梁','北京','颐和园','华北','清',1750,1750,'十七券洞石拱桥','石拱桥','石构',['seventeen'],'连接昆明湖东堤与南湖岛，券洞构成长桥节奏。','由岸入岛，走过十七道弧线',['桥梁既是一条通行路径，也成为湖区的景观。','十七个券洞在水面上连续展开，桥的结构与观看节奏同时出现。'],['十七弧光接远汀，','长桥把岛向人迎。','水中倒影连天色，','一步清风一步明。'],dict(kind='multi-arch',arches=17),sizes=[('桥身长',150,'m','exact','公园介绍桥身口径'),('桥宽',8,'m','exact','单体石桥')],counts=[('券洞',17,'个','单体')])
add('jadebelt','玉带桥（颐和园）','桥梁','北京','颐和园西堤','华北','清',1751,1764,'高薄单孔石拱桥','石拱桥','石构',['jadebelt','jadebelt-date'],'高而薄的石拱、青石与汉白玉形成西堤桥梁轮廓。','把一道弧线，抬到水面之上',['与平缓的多孔桥不同，玉带桥以高拱成为西堤上的视觉标志。','公开时间区间来自辅助年代介绍，故宫词条只明确清漪园背景，因此不采用未经证实的1750单点。'],['一弯玉色起湖烟，','人向高桥望远天。','薄拱留空容水过，','堤边风月在其间。'],dict(kind='high-arch'),kind='公开资料建造区间',note='1751—1764为辅助年代资料区间，准确建造纪年仍待营造档案核定。',sizes=[('高出水面',10,'m','gt','原文十米有余，非拱净高')])
add('tangqi','广济桥（塘栖）','桥梁','浙江','杭州塘栖','华东','明',1498,1498,'七孔石拱运河桥','石拱桥','石构',['tangqi','tangqi-form'],'现存石桥为明代复建，与潮州同名桥不同。','同一个桥名，不同的过河办法',['这座广济桥通过七孔石拱跨越运河，不使用潮州广济桥的中央浮舟结构。','唐代始建在资料中是相传，本记录使用1498年复建，不把传说画成确切年代。'],['七孔连成运水间，','石阶把岸向桥牵。','同名自有不同法，','一渡风来认旧湾。'],dict(kind='multi-arch',arches=7),kind='现存桥复建完成年',counts=[('桥孔',7,'个','塘栖广济桥')])
add('beijian','北涧桥','桥梁','浙江','泰顺泗溪','华东','清',1674,1674,'叠梁木拱廊桥','木拱廊桥','木构',['beijian'],'叠梁木拱支承桥面，上覆廊屋供行人停留。','在桥上，撑起一条有屋顶的路',['廊屋提供遮蔽，木拱则承担跨越，两部分不能只按外观合为屋顶。','1803年的重建与1849年的重修也属于建筑的时间记录。'],['木拱横穿溪涧声，','廊檐留住一程晴。','人从风雨中间过，','桥上还有可停庭。'],dict(kind='covered-bridge',bays=9,roof='gable'),events=[(1803,'重建'),(1849,'重修')])
add('rulong','如龙桥','桥梁','浙江','庆元举水月山','华东','明',1625,1625,'木拱桥与精细廊屋','木拱廊桥','木构',['rulong'],'县志记1625年修造，廊屋与木拱共同构成桥梁。','廊屋，让跨越有了层次',['桥上屋顶、通行廊道与桥下木拱分别承担不同作用。','本记录按县志修造年定位，不替代更早始建年代的考证。'],['木拱承风过水湾，','廊中檐影接山岚。','如龙未必凭传说，','一桥年月在文间。'],dict(kind='covered-bridge',bays=7,roof='layered'),kind='县志记载修造年')

assert len(records)==35
old_ids={r['id'] for r in data['records']}
assert old_ids.isdisjoint(r['id'] for r in records) or len(data['records'])==50
if len(data['records'])==15:
    data['records']+=records;data['sources']+=list(sources.values())
    data['regions'].insert(-1,'西北');data['materials']+=['土木复合','铁构'];data['structures']+=['围合土楼','铁桁梁桥','木拱廊桥']
else:
    raise SystemExit('Expansion already applied; edit canonical JSON rather than append again.')
# Append date-specific evidence only to the matching field, without altering unrelated source mappings.
data['audit']['updated']='2026-10-07';data['audit']['sampleScope']='50件具名建筑，训练项目固定规模，不继续扩至100件'
filled=sum(bool(r['name'])+bool(r['type'])+bool(r['province'])+bool(r['date'])+bool(r['form'])+bool(r['material'])+bool(r['sizes'])+bool(r['sourceIds']) for r in data['records'])
data['audit']['fieldCoverage']=dict(filled=filled,total=400,percentage=filled/4)
data['audit']['limitations']+=['新增样本中的未收录尺寸不以0或示意模型尺度补齐。','营建时期、现存遗构、来源分歧与连续施工区间分别标注。','辅助来源用于部分确年尚未统一的建筑，资料目录注明其性质。']
(ROOT/'data/architectures.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Expanded to',len(data['records']),'buildings;',len(data['sources']),'sources;',filled,'/400 fields')
