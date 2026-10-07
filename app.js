(function(){
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],D=AtlasData,M=AtlasModel;
  M.validate(D);
  const state={type:null,dynasty:null,region:null,material:null,structure:null,search:'',start:550,end:1910,selected:'zhaozhou',labels:true};
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v,d=0)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d}).format(v);
  const records=()=>M.filter(D.records,state),color=r=>D.colors[r.type],current=()=>D.records.find(r=>r.id===state.selected);
  const source=id=>D.sources.find(s=>s.id===id);
  const measurementText=item=>({approx:'约 ',gt:'> ',gte:'≥ '}[item.relation]||'')+n(item.value,2);
  const tx=(x,y,value,cls='svg-small',more='')=>`<text x="${x}" y="${y}" class="${cls}" ${more}>${esc(value)}</text>`;
  const svg=(w,h,content,label)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${content}</svg>`;
  function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
  let hoverTarget=null;
  function tooltip(html,event){
    const el=$('#chart-tooltip'),host=event.target?.closest?.('dialog')||document.body;
    if(el.parentElement!==host)host.append(el);
    if(html!=null)el.innerHTML=html;
    el.hidden=false;
    const box=el.getBoundingClientRect(),margin=12;
    const left=event.clientX+16+box.width>innerWidth-margin?event.clientX-box.width-16:event.clientX+16;
    const top=event.clientY+16+box.height>innerHeight-margin?event.clientY-box.height-16:event.clientY+16;
    el.style.left=Math.max(margin,Math.min(left,innerWidth-box.width-margin))+'px';
    el.style.top=Math.max(margin,Math.min(top,innerHeight-box.height-margin))+'px';
  }
  function clearHover(){
    hoverTarget?.classList.remove('is-hovered');hoverTarget=null;
    $$('.row-peer,.column-peer,.matrix-header.is-hovered,.matrix-row-label.is-hovered,.is-related').forEach(el=>el.classList.remove('row-peer','column-peer','is-hovered','is-related'));
  }
  function hideTooltip(){$('#chart-tooltip').hidden=true;clearHover();}
  const hoverSelector='[data-cluster],[data-record],[data-dynasty],[data-matrix],[data-material],[data-type],[data-region],[data-help],#fullscreen,#analysis-open,#sources-open,#csv-export,#reset-filters,#labels-toggle,#detail-open,#apply-years';
  const hoverRows=target=>{
    const list=records();if(target.dataset.cluster)return AtlasMap.groups.get(target.dataset.cluster)?.records||[];if(target.dataset.record)return list.filter(r=>r.id===target.dataset.record);
    if(target.dataset.matrix){const[structure,material]=target.dataset.matrix.split('|');return list.filter(r=>r.structure===structure&&(r.material||'未载明')===material);}
    if(target.dataset.dynasty)return list.filter(r=>r.dynasty===target.dataset.dynasty);
    if(target.hasAttribute('data-type'))return target.dataset.type?list.filter(r=>r.type===target.dataset.type):list;
    if(target.dataset.material)return list.filter(r=>(r.material||'未载明')===target.dataset.material);
    if(target.dataset.region)return list.filter(r=>r.region===target.dataset.region);
    return null;
  };
  function hoverContent(target){
    const rows=hoverRows(target),a=M.aggregate(records());
    if(target.dataset.cluster){const g=AtlasMap.groups.get(target.dataset.cluster);if(!g)return null;return `<strong>${esc(g.region)} · ${g.records.length} 座近邻建筑</strong>${g.start===g.end?g.start:g.start+'—'+g.end} 年<span class="tooltip-list">${g.records.slice(0,4).map(r=>esc(r.name)).join('、')}${g.records.length>4?' 等':''}</span><span class="tooltip-action">点击展开名录，再选择建筑翻书。</span>`;}
    if(target.dataset.record){const r=D.records.find(r=>r.id===target.dataset.record);if(!r)return null;const excluded=!records().some(v=>v.id===r.id);return `<strong>${esc(r.name)}</strong>${esc(r.date.label)} · ${r.type}<br><span>${esc(r.province)} · ${esc(r.city)}<br>${esc(r.form)}</span><span class="tooltip-action">${excluded?'当前筛选未包含；点击时间轴恢复显示。':target.closest('#atlas-chart')?'点击建筑，翻开它的历史与故事。':'点击定位到这座建筑。'}</span>`;}
    if(rows){let title,action;
      if(target.dataset.matrix){const parts=target.dataset.matrix.split('|');title=parts.join(' × ');action='点击按结构与材料组合筛选。';}
      else if(target.dataset.dynasty){title=target.dataset.dynasty+' · 朝代样本';action='点击筛选；再次点击取消。';}
      else if(target.hasAttribute('data-type')){title=(target.dataset.type||'全部建筑')+' · 类型';action='点击筛选；再次点击取消。';}
      else if(target.dataset.material){title=target.dataset.material+' · 材料体系';action='点击筛选；未载明表示资料不足。';}
      else{title=target.dataset.region+' · 原址地域';action='点击查看该地域的建筑。';}
      return `<strong>${esc(title)}</strong><span class="tooltip-number">${rows.length}</span> 件 · 当前筛选占比 ${a.count?n(rows.length/a.count*100,1):0}%<span class="tooltip-list">${rows.length?rows.slice(0,4).map(r=>esc(r.name)).join('、')+(rows.length>4?' 等':''):'当前条件下没有样本。'}</span><span class="tooltip-action">${action}</span>`;
    }
    const help={
      count:`<strong>收录建筑样本</strong>当前筛选 ${a.count} 件 / 全库 ${D.records.length} 件。<br><span>这是精选文献样本，不是全国建筑普查。</span>`,
      period:`<strong>覆盖建造年代</strong>${a.count?a.start+'—'+a.end+'年':'当前筛选没有样本'}<br><span>文献中的始建、施工区间与现存重建年代分别说明。</span>`,
      types:`<strong>建筑类型</strong>当前 ${a.typeCount} 类。<br><span>民居、官府、皇宫、桥梁；颜色在全屏保持一致。</span>`,
      quality:`<strong>资料完整度</strong>${a.filled} / ${a.totalFields} 类字段有值。<br><span>有值率不代表已经取得完整测绘。点击百分比查看口径。</span>`,
      sketch:`<strong>形制线稿</strong><span>展示当前建筑所属形制；原始结构与尺寸请查看建筑档案。</span>`,
      summary:current()?`<strong>${esc(current().name)}</strong>${esc(current().summary)}`:null
    };
    if(target.dataset.help)return help[target.dataset.help]||null;
    const actions={'analysis-open':['统计分析','按需查看朝代、类型、材料和时间筛选。'],fullscreen:['全屏展示','展开整个可视化大屏。'], 'sources-open':['资料依据','查看文献、数值限定关系和待核实项。'], 'csv-export':['导出样本','保存当前筛选的建筑、尺寸、构件和来源。'], 'reset-filters':['重置筛选','清除类型、年代、地域、材料和搜索条件。'], 'labels-toggle':['名称标签',state.labels?'统一隐藏全部点位名称。':'统一显示全部点位名称。'], 'detail-open':['翻开建筑书','阅读历史、营造故事、原创题咏与照片。'], 'apply-years':['应用年代区间','按文献建造时间与起止年相交筛选。']};
    const action=actions[target.id];return action?`<strong>${action[0]}</strong><span>${action[1]}</span>`:null;
  }
  function setHover(target,event){
    const changed=target!==hoverTarget;
    if(changed){clearHover();hoverTarget=target;target.classList.add('is-hovered');
      if(target.dataset.matrix){const[structure,material]=target.dataset.matrix.split('|');$$('.matrix-cell').forEach(cell=>{const parts=cell.dataset.matrix.split('|');cell.classList.toggle('row-peer',parts[0]===structure);cell.classList.toggle('column-peer',parts[1]===material);});$$('.matrix-header').find(el=>el.dataset.materialLabel===material)?.classList.add('is-hovered');$$('.matrix-row-label').find(el=>el.dataset.structureLabel===structure)?.classList.add('is-hovered');}
      const rows=hoverRows(target);if(rows&&rows.length){const ids=new Set(rows.map(r=>r.id));$$('#atlas-chart .node,#timeline-chart .timeline-node').forEach(el=>el.classList.toggle('is-related',ids.has(el.dataset.record)||(el.dataset.cluster&&AtlasMap.groups.get(el.dataset.cluster)?.records.some(r=>ids.has(r.id)))));}
    }
    const html=changed?hoverContent(target):null;if(changed&&!html){hideTooltip();return;}tooltip(html,event);
  }
  document.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const target=event.target.closest(hoverSelector);if(!target){hideTooltip();return;}setHover(target,event);});
  document.addEventListener('pointerleave',hideTooltip);
  document.addEventListener('focusin',event=>{const target=event.target.closest(hoverSelector);if(!target)return;const r=target.getBoundingClientRect();setHover(target,{clientX:r.left+r.width/2,clientY:r.bottom,target});});
  document.addEventListener('focusout',()=>hideTooltip());
  document.addEventListener('scroll',hideTooltip,true);
  function chooseFilter(key,value){state[key]=state[key]===value?null:value;render();hideTooltip();}
  function reset(){Object.assign(AtlasMap.view,{start:550,end:1910});Object.assign(state,{type:null,dynasty:null,region:null,material:null,structure:null,search:'',start:550,end:1910});$('#search').value='';$('#year-error').textContent='';render();}
  function select(id){if(!records().some(r=>r.id===id))return;state.selected=id;AtlasMap.reveal(id);render();}
  function render(){
    const oldMetrics=$$('.kpi strong').map(el=>el.textContent);
    const list=records(),a=M.aggregate(list);if(!list.some(r=>r.id===state.selected))state.selected=list[0]?.id||null;
    if(list.length&&!list.some(r=>r.date.start<=AtlasMap.view.end&&r.date.end>=AtlasMap.view.start))Object.assign(AtlasMap.view,{start:550,end:1910});
    $('#stat-count').innerHTML=`${a.count}<small>/ ${D.records.length}</small>`;$('#stat-period').textContent=a.count?`${a.start}—${a.end}`:'—';$('#stat-types').innerHTML=`${a.typeCount}<small>类</small>`;$('#stat-completeness').innerHTML=a.completeness===null?'—':`${n(a.completeness*100,1)}<small>%</small>`;
    $('#type-filters').innerHTML=[{key:'',label:'全部建筑'},...D.types.map(type=>({key:type,label:type}))].map(item=>`<button data-type="${esc(item.key)}" aria-pressed="${(state.type||'')===item.key}">${item.key?`<i style="background:${D.colors[item.key]}"></i>`:''}${item.label}<span>${item.key?D.records.filter(r=>r.type===item.key).length:D.records.length}</span></button>`).join('');
    $('#atlas-status').textContent=`${a.count} 件 · ${new Set(list.map(r=>r.province)).size} 个地域`;
    $('#type-total').textContent=a.count+' 件';$('#empty-state').hidden=list.length>0;
    $('#year-start').value=state.start;$('#year-end').value=state.end;$('#year-range').value=state.end;$('#timeline-period').textContent=`${state.start}—${state.end}`;
    $$('.kpi strong').forEach((el,i)=>{if(oldMetrics[i]!==el.textContent){el.classList.remove('metric-change');void el.offsetWidth;el.classList.add('metric-change');}});
    drawDynasties(a);drawTypes(a);drawMaterials(a);drawMatrix(a);drawAtlas(list);drawTimeline();drawAchievements(list);drawFocus();drawHome(a);drawFilterChips();
  }
  function drawDynasties(a){
    const box=$('#dynasty-chart').getBoundingClientRect(),max=Math.max(...Object.values(a.dynastyCounts),1),w=340,h=Math.max(110,Math.round(box.height/Math.max(box.width,1)*340)),base=30,span=280,bottom=h-28,plotHeight=Math.max(35,bottom-24);let content='';
    [0,1,2].forEach(i=>{const val=max*i/2,y=bottom-val/max*plotHeight;content+=`<line x1="28" x2="320" y1="${y}" y2="${y}" stroke="#215159" stroke-dasharray="3 5"/>`+tx(18,y+4,n(val,1),'axis-tick','text-anchor="end"');});
    D.dynasties.forEach((dyn,i)=>{const count=a.dynastyCounts[dyn]||0,bh=count/max*plotHeight,x=base+i*(span/D.dynasties.length);content+=`<g class="chart-choice bar-column" data-dynasty="${dyn}" role="button" tabindex="0" aria-label="${dyn}，${count}件，点击筛选"><rect x="${x}" y="${bottom-bh}" width="21" height="${Math.max(bh,2)}" fill="${state.dynasty===dyn?'#f6c46a':'url(#dyn-gradient)'}" opacity="${count?1:.2}"/>${count?tx(x+10.5,bottom-8-bh,count,'svg-number','text-anchor="middle"'):''}${tx(x+10.5,h-6,dyn,'svg-small','text-anchor="middle"')}<rect x="${x-4}" y="25" width="29" height="${h-25}" fill="transparent"/></g>`;});
    $('#dynasty-chart').innerHTML=svg(w,h,`<defs><linearGradient id="dyn-gradient" x1="0" y1="1" x2="0" y2="0"><stop stop-color="#147b76"/><stop offset="1" stop-color="#38f4bd"/></linearGradient></defs>${content}`,'当前样本的朝代分布，点击朝代筛选');
  }
  function drawTypes(a){
    const point=(radius,angle)=>[85+radius*Math.cos(angle*Math.PI/180),86+radius*Math.sin(angle*Math.PI/180)];
    const arc=(start,end)=>{const large=end-start>180?1:0,outerA=point(55,start),outerB=point(55,end),innerB=point(41,end),innerA=point(41,start);return `M${outerA} A55 55 0 ${large} 1 ${outerB} L${innerB} A41 41 0 ${large} 0 ${innerA} Z`;};
    let angle=-90,content='<circle cx="85" cy="86" r="48" fill="none" stroke="#194249" stroke-width="14"/>';
    D.types.forEach(type=>{const count=a.typeCounts[type]||0,degrees=a.count?count/a.count*360:0;if(degrees>0){const gap=Math.min(2,degrees/4);content+=`<path d="${arc(angle+gap/2,angle+degrees-gap/2)}" fill="${D.colors[type]}" class="chart-choice donut-segment" data-type="${type}" role="button" tabindex="0" aria-label="${type}，${count}件，悬停查看详情"/>`;angle+=degrees;}});
    content+=tx(85,84,a.count,'svg-number','text-anchor="middle" style="font-size:31px"')+tx(85,105,'收录样本','svg-small','text-anchor="middle" style="font-size:10px"');$('#type-chart').innerHTML=svg(170,170,content,'建筑类型构成，每一段可单独悬停和点击');
    $('#type-breakdown').innerHTML=D.types.map(type=>`<button class="type-row" data-type="${type}" aria-pressed="${state.type===type}"><i style="background:${D.colors[type]}"></i>${type}<span>${a.count?n((a.typeCounts[type]||0)/a.count*100,1):'0'}% · ${a.typeCounts[type]||0}</span></button>`).join('');
  }
  function drawMaterials(a){const max=Math.max(...Object.values(a.materialCounts),1);$('#material-chart').innerHTML=D.materials.map(material=>`<button class="material-row" data-material="${material}" aria-pressed="${state.material===material}"><span>${material}</span><span class="material-track"><i style="width:${(a.materialCounts[material]||0)/max*100}%"></i></span><b>${a.materialCounts[material]||0}</b></button>`).join('');}
  function drawMatrix(a){let content=`<span></span>${D.materials.map(m=>`<span class="matrix-header" data-material-label="${m}">${m.replace('复合','<br>复合')}</span>`).join('')}`;D.structures.forEach(structure=>{content+=`<span class="matrix-row-label" data-structure-label="${structure}">${structure}</span>`+D.materials.map(material=>{const count=a.matrix[structure+'|'+material]||0;return `<button class="matrix-cell" data-matrix="${structure}|${material}" data-count="${count}" aria-pressed="${state.structure===structure&&state.material===material}" aria-label="${structure}与${material}，${count}件，点击筛选" title="${structure} / ${material}：${count}件">${count||'·'}</button>`;}).join('');});$('#matrix-chart').innerHTML=`<div class="matrix-grid">${content}</div>`;}
  function roofMotif(){return `<g fill="none" stroke="#4fc3a7" stroke-width="1" opacity=".065"><path d="M190 325L465 189L740 325L465 462Z M250 332L465 223L680 332L465 432Z M465 189V462 M190 325L190 380L465 517L740 380V325 M250 332V380L465 485L680 380V332 M465 432V485"/><path d="M270 344L465 252L660 344M305 363L465 286L625 363M340 380L465 320L590 380"/></g>`;}
  function drawAtlas(list){AtlasMap.render(D,list,state,nodeGlyph);}
  function drawTimeline(){
    const scale=year=>12+(year-550)/1360*1025,placed=[],points=[];
    const included=new Set(records().map(r=>r.id));
    for(const r of [...D.records].sort((a,b)=>a.date.start-b.date.start)){
      const x=scale(r.date.start);let lane=0;while(placed.some(p=>Math.abs(p.x-x)<12&&p.lane===lane))lane++;
      const y=8+lane*12;placed.push({x,lane});points.push({r,x,y});
    }
    const baseline=Math.max(...points.map(p=>p.y),8)+20,height=baseline+32;
    let content=`<line x1="12" x2="1037" y1="${baseline}" y2="${baseline}" stroke="#295d60" stroke-width="2"/><rect x="${scale(state.start)}" y="${baseline-5}" width="${Math.max(1,scale(state.end)-scale(state.start))}" height="10" fill="#38f4bd18" stroke="#438b78" stroke-width=".6"/>`;
    [600,800,1000,1200,1400,1600,1800,1910].forEach(year=>{const x=scale(year);content+=`<line x1="${x}" x2="${x}" y1="${baseline-4}" y2="${baseline+6}" stroke="#5a8781"/>`+tx(x,baseline+27,year,'axis-tick','text-anchor="middle" style="font-size:11px"');});
    for(const {r,x,y}of points){const selected=r.id===state.selected,visible=included.has(r.id);content+=`<g data-record="${r.id}" class="chart-choice timeline-node" role="button" tabindex="0" aria-label="${r.name}，${r.date.label}，点击定位"><path d="M${x} ${baseline}V${y}" stroke="${color(r)}" opacity="${visible?.65:.15}" stroke-width="${selected?1.6:.6}"/><circle class="timeline-dot" cx="${x}" cy="${y}" r="${selected?4:3}" fill="${color(r)}" stroke="${selected?'#e5ffe7':'none'}" opacity="${visible?1:.25}"/><circle class="timeline-hit" cx="${x}" cy="${y}" r="5.5" fill="transparent"/></g>`;}
    $('#timeline-chart').setAttribute('viewBox',`0 0 1050 ${height}`);$('#timeline-chart').innerHTML=content;
  }
  function nodeGlyph(r){
    if(r.visual?.kind==='round-earth')return '<ellipse cx="0" cy="-2" rx="15" ry="7"/><ellipse cx="0" cy="-2" rx="7" ry="3"/><path d="M-15-2v11q15 11 30 0V-2M0 8v9"/>';
    if(r.structure==='铁桁梁桥')return '<path d="M-17-7h34v14h-34ZM-17-7L-6 7L5-7L17 7M-12 7v6M12 7v6"/>';
    if(r.structure==='木拱廊桥')return '<path d="M-17-2L0-9L17-2M-14-2v8h28V-2M-14 12q14-13 28 0M-7-2v8M0-2v8M7-2v8"/>';
    if(r.type==='桥梁')return r.structure==='石拱桥'?'<path d="M-15 4Q0-10 15 4M-15 9Q0-5 15 9M-15 4v5M15 4v5M-16 11h32"/>':r.structure==='铁索桥'?'<path d="M-15-9v18M15-9v18M-15-5Q0 10 15-5M-15 8h30M-8 3v5M0 6v2M8 3v5"/>':'<path d="M-16 1h32v4h-32ZM-12 5v7M-4 5v7M4 5v7M12 5v7"/>';
    if(r.type==='皇宫')return '<path d="M-17-1L0-10L17-1L13 1L0-6L-13 1ZM-13 4L0-2L13 4M-10 4v8h20V4M-16 13h32M-4 4v8M4 4v8"/>';
    if(r.type==='官府')return '<path d="M-15 1L0-8L15 1M-12 1v11h24V1M-4 3h8v9M-16 13h32"/>';
    return '<path d="M-16 0L-7-6L2 0M-1 0L8-6L17 0M-12 1v11h25V1M-5 6h8v6M-17 13h34"/>';
  }
  function sketch(r){return r?ArchitectureArt.building(r):'';}
  function drawAchievements(list){const chosen=[];for(const type of ['桥梁','皇宫','民居']){const r=list.find(r=>r.type===type&&r.id!=='zhonghe');if(r)chosen.push(r);}for(const r of list)if(chosen.length<3&&!chosen.some(v=>v.id===r.id))chosen.push(r);$('#achievements').innerHTML=chosen.length?chosen.map((r,i)=>`<button class="achievement-item" data-record="${r.id}"><span class="achievement-index">0${i+1}</span><strong>${esc(r.achievement)}</strong><span>${esc(r.name)} ↗</span></button>`).join(''):'<p class="panel-caption">当前筛选没有样本。</p>';}
  function drawFocus(){
    const r=current();$('#focus-content').innerHTML=r?`<button class="selected-book" id="detail-open">${esc(r.name)} <span>翻开建筑书 ↗</span></button>`:'';
  }
  function drawHome(a){
    const max=Math.max(...Object.values(a.dynastyCounts),1);
    $('#home-overview').innerHTML=`<div class="overview-number" data-help="count"><strong>${a.count}<small>件</small></strong><span>文献样本</span></div><div class="overview-number years" data-help="period"><strong>${a.count?a.start+'—'+a.end:'—'}</strong><span>建造年代 / 年</span></div><div class="overview-types"><span class="overview-caption">类型构成</span><div class="mini-type-chart">${D.types.map(type=>{const count=a.typeCounts[type]||0;return count?`<button data-type="${type}" style="flex:${count};--segment-color:${D.colors[type]}" aria-label="${type}，${count}件">${count}</button>`:'';}).join('')||'<span class="mini-empty">暂无样本</span>'}</div></div><div class="overview-dynasties"><span class="overview-caption">朝代分布 / 件</span><div class="mini-dynasty-chart">${D.dynasties.map(dyn=>`<button data-dynasty="${dyn}" aria-pressed="${state.dynasty===dyn}" aria-label="${dyn}，${a.dynastyCounts[dyn]||0}件"><b>${a.dynastyCounts[dyn]||0}</b><i style="height:${(a.dynastyCounts[dyn]||0)/max*26}px"></i><span>${dyn}</span></button>`).join('')}</div></div>`;
  }
  function drawFilterChips(){const labels={type:'类型',dynasty:'朝代',region:'地域',material:'材料',structure:'结构',search:'搜索'};let chips=Object.entries(labels).filter(([key])=>state[key]).map(([key,label])=>`<button class="filter-chip" data-clear="${key}">${label} · ${esc(state[key])}<span>×</span></button>`);if(state.start!==550||state.end!==1910)chips.push(`<button class="filter-chip" data-clear="years">${state.start}—${state.end}<span>×</span></button>`);$('#active-filters').innerHTML=chips.length?chips.join(''):'';}
  function showDetails(){
    const r=current();if(!r)return;const score=M.fieldFlags(r).filter(Boolean).length;
    const dimensions=r.sizes.map(item=>`<div class="measurement-item"><div class="dimension-row"><span>${esc(item.label)}</span><strong>${esc(measurementText(item))}<small>${esc(item.unit)}</small></strong><a href="${source(item.sourceId).url}" target="_blank" rel="noopener noreferrer">依据 ↗</a></div><p class="measurement-scope">${esc(item.scope||'原资料记载')}${item.locator?' · '+esc(item.locator):''}</p></div>`).join('');
    const counts=(r.counts||[]).map(item=>`<div class="dimension-row"><span>${esc(item.label)}</span><strong>${n(item.value)}<small>${esc(item.unit)}</small></strong><a href="${source(item.sourceId).url}" target="_blank" rel="noopener noreferrer">依据 ↗</a></div>${item.scope?`<p class="measurement-scope">${esc(item.scope)}</p>`:''}`).join('');
    const history=(r.events||[]).map(event=>`<li><strong>${esc(event.label)}</strong> · ${esc(event.event)} <a href="${source(event.sourceIds[0]).url}" target="_blank" rel="noopener noreferrer">依据 ↗</a></li>`).join('');
    const gaps=(r.dataGaps||[]).map(g=>`<p><strong>${esc(g.field)}：</strong>${esc(g.reason)}<br>需要：${esc(g.requiredEvidence)}</p>`).join('');
    $('#detail-content').innerHTML=`<div class="dossier-hero"><div><div class="dossier-tags"><span>${r.type}</span><span>${r.dynasty}</span><span>${esc(r.province)}</span><span>${esc(r.objectLevel||'建筑')}</span></div><h2 id="detail-title">${esc(r.name)}</h2><p>${esc(r.summary)}</p></div><div><div class="dossier-art">${sketch(r)}</div><div class="dossier-art-label">所属形制概念线稿 / 非建筑测绘复原</div></div></div><div class="dossier-note">${esc(r.note)}</div><div class="dossier-grid"><section class="dossier-section"><h3>01 / 建筑信息</h3><div class="dossier-fields"><div><span>始建或建造区间</span><strong>${esc(r.date.label)}</strong></div><div><span>年代属性</span><strong>${esc(r.date.kind)}</strong></div><div><span>原址</span><strong>${esc(r.province)} · ${esc(r.city)}</strong></div><div><span>建筑形制</span><strong>${esc(r.form)}</strong></div><div><span>主承重材料／体系归类</span><strong>${esc(r.material||'未载明')}</strong></div><div><span>8类字段有值</span><strong>${score} / 8</strong></div></div><p>${esc(r.materialBasis)}</p></section><section class="dossier-section"><h3>02 / 尺寸与口径</h3>${dimensions||'<p>暂无可引用尺寸。</p>'}<p class="measurement-note">${esc(r.measurementNotes||'')}</p></section><section class="dossier-section"><h3>03 / 构件与空间计数</h3>${counts||'<p>当前未采可引用的构件计数；不按示意线稿数构件。</p>'}</section><section class="dossier-section"><h3>04 / 营造时间记录</h3><ul class="event-list">${history}</ul><p>${esc(r.date.intervalMeaning||'')}</p></section><section class="dossier-section"><h3>05 / 技术特点</h3><ul>${r.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><p>此处为文献整理描述，不构成工程性能评估。</p></section><section class="dossier-section"><h3>06 / 资料依据</h3>${r.sourceIds.map(id=>{const s=source(id);return `<a class="dossier-source" href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗<br><span class="source-meta">${esc(s.publisher)} · ${esc(s.locator||'')}</span></a>`;}).join('')}</section>${gaps?`<section class="dossier-section data-gaps"><h3>仍待核实的资料</h3>${gaps}</section>`:''}</div>`;
    $$('#detail-content .dossier-section').forEach((section,i)=>{const details=document.createElement('details');details.className=section.className;const h=section.querySelector('h3'),summary=document.createElement('summary');summary.textContent=h?.textContent||'更多资料';h?.remove();details.append(summary);while(section.firstChild)details.append(section.firstChild);details.open=i===0;section.replaceWith(details);});
    $('#detail-dialog').showModal();
  }

  $$('.kpi').forEach((card,i)=>card.dataset.help=['count','period','types','quality'][i]);
  $('#source-directory').innerHTML=D.sources.map((s,i)=>`<article class="source-entry"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${String(i+1).padStart(2,'0')} / ${esc(s.title)} ↗</a><small>${esc(s.publisher)} · ${esc(s.locator||'')}</small><p>${esc(s.supports||'')}</p><small>${esc(s.verification||'')}</small></article>`).join('');
  $('#data-summary').textContent=D.records.reduce((sum,r)=>sum+r.sizes.length+(r.counts||[]).length,0)+'项尺寸与构件数值，附来源和限定关系。';
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-type],[data-dynasty],[data-region],[data-material],[data-matrix],[data-record],[data-clear],[data-close]');
    if(b){hideTooltip();if(b.hasAttribute('data-type')){chooseFilter('type',b.dataset.type||null);}else if(b.dataset.dynasty)chooseFilter('dynasty',b.dataset.dynasty);else if(b.dataset.region)chooseFilter('region',b.dataset.region);else if(b.dataset.material)chooseFilter('material',b.dataset.material);else if(b.dataset.matrix){const[structure,material]=b.dataset.matrix.split('|');if(state.structure===structure&&state.material===material){state.structure=null;state.material=null;}else{state.structure=structure;state.material=material;}render();}else if(b.dataset.record){const inAtlas=!!b.closest('#atlas-chart'),inTimeline=!!b.closest('#timeline-chart');if(inTimeline&&!records().some(r=>r.id===b.dataset.record))reset();select(b.dataset.record);if(inAtlas)window.AtlasBook?.open(b.dataset.record);}else if(b.dataset.clear){if(b.dataset.clear==='years'){state.start=550;state.end=1910;}else{state[b.dataset.clear]=b.dataset.clear==='search'?'':null;if(b.dataset.clear==='search')$('#search').value='';}render();}else if(b.hasAttribute('data-close'))b.closest('dialog').close();return;}
    if(e.target.closest('#detail-open')&&current())window.AtlasBook?.open(current().id);
  });
  document.addEventListener('keydown',e=>{const b=e.target.closest('[role="button"]');if(b&&(e.key==='Enter'||e.key===' ')){e.preventDefault();const attr=['data-cluster','data-record','data-dynasty','data-region','data-type'].find(name=>b.hasAttribute(name)),value=attr?b.getAttribute(attr):null;b.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(attr&&attr!=='data-cluster'&&!$('#book-dialog').open){const replacement=$$(`[${attr}]`).find(x=>x.getAttribute(attr)===value&&x.getAttribute('role')==='button');replacement?.focus();}}});
  $('#search').addEventListener('input',e=>{state.search=e.target.value;render();});$('#reset-filters').addEventListener('click',reset);$('#empty-reset').addEventListener('click',reset);
  $('#labels-toggle').addEventListener('click',()=>{state.labels=!state.labels;drawAtlas(records());});
  $('#apply-years').addEventListener('click',()=>{const start=Number($('#year-start').value),end=Number($('#year-end').value);if(!$('#year-start').value||!$('#year-end').value||!Number.isInteger(start)||!Number.isInteger(end)||start<550||end>1910||start>end){$('#year-error').textContent='请输入550—1910内的有效起止年，起始年不得大于截止年。';return;}$('#year-error').textContent='';state.start=start;state.end=end;render();});
  $('#year-range').addEventListener('input',e=>{const end=Number(e.target.value);state.end=end;if(state.start>end)state.start=end;$('#year-error').textContent='';render();});
  function analysisTab(tab){$$('[data-analysis]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.analysis===tab)));$$('[data-analysis-view]').forEach(view=>view.hidden=view.dataset.analysisView!==tab);requestAnimationFrame(()=>render());}
  $('#analysis-open').addEventListener('click',()=>{hideTooltip();$('#analysis-dialog').showModal();requestAnimationFrame(()=>render());});
  $$('[data-analysis]').forEach(b=>b.addEventListener('click',()=>analysisTab(b.dataset.analysis)));
  $('#sources-open').addEventListener('click',()=>$('#sources-dialog').showModal());$('#completeness-open').addEventListener('click',()=>$('#sources-dialog').showModal());
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();}));
  $('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前浏览器限制全屏；可使用浏览器的F11键。');}});
  $('#csv-export').addEventListener('click',()=>{const list=records();if(!list.length){toast('当前筛选没有样本可导出。');return;}const rows=[['建筑名称','类型','省级地域','原址城市','地域分组','朝代','年代起点','年代终点','年代标签','年代属性','结构归类','形制','主承重材料','材料归类依据','尺寸与单位及限定关系','尺寸口径说明','构件与空间计数','待核实项','年代说明','资料链接']];list.forEach(r=>rows.push([r.name,r.type,r.province,r.city,r.region,r.dynasty,r.date.start,r.date.end,r.date.label,r.date.kind,r.structure,r.form,r.material||'未载明',r.materialBasis,r.sizes.map(s=>s.label+':'+measurementText(s)+s.unit+' ['+(s.scope||'')+']').join(' | '),r.measurementNotes||'',(r.counts||[]).map(c=>c.label+':'+c.value+c.unit).join(' | '),(r.dataGaps||[]).map(g=>g.field).join(' | '),r.note,r.sourceIds.map(id=>source(id).url).join(' | ')]));const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='筑迹_建筑样本_'+list.length+'件.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出'+list.length+'件样本及其资料链接。');});
  let resizeTimer;window.addEventListener('resize',()=>{hideTooltip();clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const a=M.aggregate(records());drawDynasties(a);drawTypes(a);},80);});
  document.documentElement.style.setProperty('--material-count',D.materials.length);document.documentElement.style.setProperty('--structure-count',D.structures.length);
  AtlasMap.init({redraw:()=>drawAtlas(records()),getSelection:()=>state.selected,openBook:id=>{select(id);window.AtlasBook?.open(id);}});
  window.AtlasApp={state,records,render,reset,select,showDetails,sketch,analysisTab};render();
})();
