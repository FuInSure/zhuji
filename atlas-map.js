(function(root){
  'use strict';
  const MIN=550,MAX=1910,view={start:MIN,end:MAX},groups=new Map();
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let redraw=()=>{},openBook=()=>{},getSelection=()=>null;
  function groupRecords(records,regions,start=MIN,end=MAX){
    const scale=810/(end-start),output=[];
    for(const region of regions){
      const rows=records.filter(r=>r.region===region&&r.date.start<=end&&r.date.end>=start).sort((a,b)=>a.date.start-b.date.start||a.name.localeCompare(b.name,'zh-CN'));
      let group=[];
      const flush=()=>{if(group.length){output.push({region,records:group,start:Math.min(...group.map(r=>r.date.start)),end:Math.max(...group.map(r=>r.date.end))});group=[];}};
      for(const r of rows){if(group.length&&(r.date.start-group.at(-1).date.start)*scale>40)flush();group.push(r);}flush();
    }
    return output;
  }
  // Names are never dropped to make room. Move labels, preserving the year/region coordinates.
  function layoutLabels(points){
    const labels=new Map(),occupied=[],limits={left:85,top:26,right:922,bottom:467};
    const widths=new Map(points.map(p=>[p.key,p.text.length*14+6]));
    const overlaps=(a,b,pad=0)=>a.left<b.right+pad&&a.right>b.left-pad&&a.top<b.bottom+pad&&a.bottom>b.top-pad;
    const nodes=points.map(p=>({left:p.x-25,right:p.x+25,top:p.y-25,bottom:p.y+25}));
    const boxAt=(left,ly,width)=>({left,right:left+width,top:ly-20,bottom:ly+8});
    const valid=box=>box.left>=limits.left&&box.right<=limits.right&&box.top>=limits.top&&box.bottom<=limits.bottom&&!occupied.some(b=>overlaps(box,b,6))&&!nodes.some(b=>overlaps(box,b,3));
    for(const point of [...points].sort((a,b)=>widths.get(b.key)-widths.get(a.key)||a.y-b.y||a.x-b.x)){
      const width=widths.get(point.key),candidates=[];
      for(const dy of [0,-42,42,-76,76,-110,110]){
        const ly=point.y+5+dy;
        for(const left of [point.x+32,point.x-32-width,point.x-width/2]){
          const box=boxAt(left,ly,width),nearX=Math.max(box.left,Math.min(point.x,box.right)),nearY=Math.max(box.top,Math.min(point.y,box.bottom));
          if(valid(box))candidates.push({box,ly,distance:Math.hypot(nearX-point.x,nearY-point.y)});
        }
      }
      if(!candidates.length){
        for(let ly=limits.top+20;ly<=limits.bottom-8;ly+=8)for(let left=limits.left;left+width<=limits.right;left+=12){
          const box=boxAt(left,ly,width);if(!valid(box))continue;
          const nearX=Math.max(box.left,Math.min(point.x,box.right)),nearY=Math.max(box.top,Math.min(point.y,box.bottom));
          candidates.push({box,ly,distance:Math.hypot(nearX-point.x,nearY-point.y)});
        }
      }
      candidates.sort((a,b)=>a.distance-b.distance||a.ly-b.ly||a.box.left-b.box.left);
      // The fixed 50-building catalog fits in these bounds; retain the name even for a future dense input.
      const chosen=candidates[0]||{box:boxAt(Math.max(limits.left,Math.min(limits.right-width,point.x-width/2)),Math.min(limits.bottom-8,point.y+47),width),ly:Math.min(limits.bottom-8,point.y+47)};
      const lx=chosen.box.left+3,leaderX=Math.max(chosen.box.left,Math.min(point.x,chosen.box.right)),leaderY=Math.max(chosen.box.top,Math.min(point.y,chosen.box.bottom));
      labels.set(point.key,{text:point.text,lx,ly:chosen.ly,anchor:'start',box:chosen.box,leaderX,leaderY});occupied.push(chosen.box);
    }
    return labels;
  }
  function closeList(){const el=document.querySelector('#cluster-list');if(el){el.hidden=true;el.innerHTML='';}}
  function zoom(factor,centre){
    const oldSpan=view.end-view.start,span=Math.max(80,Math.min(MAX-MIN,oldSpan/factor));
    const chosen=root.AtlasData.records.find(r=>r.id===getSelection());
    const mid=centre??(chosen&&chosen.date.start>=view.start&&chosen.date.start<=view.end?chosen.date.start:(view.start+view.end)/2);
    view.start=Math.max(MIN,Math.min(MAX-span,mid-span/2));view.end=view.start+span;closeList();redraw();
  }
  function reset(){view.start=MIN;view.end=MAX;closeList();redraw();}
  function shift(amount){const span=view.end-view.start;view.start=Math.max(MIN,Math.min(MAX-span,view.start+amount));view.end=view.start+span;closeList();redraw();}
  function reveal(id){const r=root.AtlasData.records.find(r=>r.id===id);if(r&&(r.date.start<view.start||r.date.start>view.end)){const span=view.end-view.start;view.start=Math.max(MIN,Math.min(MAX-span,r.date.start-span/2));view.end=view.start+span;}redraw();}
  function showList(key,target){
    const group=groups.get(key);if(!group)return;const el=document.querySelector('#cluster-list');
    el.innerHTML=`<div class="cluster-list-top"><div><strong>${esc(group.region)} · ${group.records.length} 座建筑</strong><small>${group.start===group.end?group.start:group.start+'—'+group.end} 年 · 选择建筑翻书</small></div><button data-cluster-close aria-label="关闭建筑列表">×</button></div><div class="cluster-list-items">${group.records.map(r=>`<button data-cluster-book="${r.id}"><i style="background:${root.AtlasData.colors[r.type]}"></i><span><strong>${esc(r.name)}</strong><small>${esc(r.date.label)} · ${esc(r.city)}</small></span><b>↗</b></button>`).join('')}</div>`;
    el.hidden=false;
    const stage=document.querySelector('.atlas-space').getBoundingClientRect(),at=target.getBoundingClientRect();
    const width=el.getBoundingClientRect().width,height=el.getBoundingClientRect().height;
    el.style.left=Math.max(0,Math.min(stage.width-width,at.left-stage.left+at.width/2-width/2))+'px';
    el.style.top=Math.max(35,Math.min(stage.height-height-10,at.bottom-stage.top+10))+'px';
    el.querySelector('[data-cluster-book]')?.focus({preventScroll:true});
  }
  function render(data,list,state,glyph){
    groups.clear();closeList();const chart=document.querySelector('#atlas-chart'),scale=year=>90+(year-view.start)/(view.end-view.start)*810;
    const rows=groupRecords(list,data.regions,view.start,view.end),positions=[];
    const span=view.end-view.start,step=[20,50,100,200,300].find(s=>span/s<=7)||300;
    let html='<title id="atlas-title">古建筑时空图谱，近邻建筑聚合显示，可缩放并展开阅读</title>';
    for(let year=Math.ceil(view.start/step)*step;year<=view.end;year+=step){const x=scale(year);html+=`<line x1="${x}" x2="${x}" y1="55" y2="463" stroke="#669684" stroke-dasharray="2 9" opacity=".33"/><text x="${x}" y="507" class="atlas-year" text-anchor="middle">${year}</text>`;}
    html+='<text x="25" y="43" class="atlas-axis-title">原址地域</text><text x="900" y="541" class="atlas-axis-title" text-anchor="end">建造年代 / 年</text>';
    data.regions.forEach((region,i)=>{const y=85+i*58;html+=`<line x1="85" x2="905" y1="${y}" y2="${y}" stroke="#56816f" stroke-dasharray="2 10" opacity=".3"/><g data-region="${region}" role="button" tabindex="0" class="lane-button" aria-label="筛选${region}"><text x="25" y="${y+4}" class="svg-label" style="font-size:17px;fill:#cedbd1">${region}</text><rect x="12" y="${y-23}" width="65" height="47" fill="transparent"/></g>`;});
    rows.forEach((g,i)=>{const selected=g.records.find(r=>r.id===state.selected),single=g.records.length===1,r=selected||g.records[0],year=single?r.date.start:g.records.reduce((sum,r)=>sum+r.date.start,0)/g.records.length;
      const x=Math.max(90,Math.min(900,scale(year))),y=85+data.regions.indexOf(g.region)*58,key='group-'+i;
      g.key=key;groups.set(key,g);positions.push({g,r,x,y,key,selected:!!selected,single,text:single?r.name:g.records[0].name+'等'+g.records.length+'座'});
    });
    const labels=state.labels?layoutLabels(positions):new Map();
    for(const type of data.types){const pts=positions.filter(p=>p.g.records.every(r=>r.type===type)).sort((a,b)=>a.x-b.x);if(pts.length>1){let d='M'+pts[0].x+','+pts[0].y;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],mid=(a.x+b.x)/2;d+=` C${mid},${a.y} ${mid},${b.y} ${b.x},${b.y}`;}html+=`<path d="${d}" fill="none" stroke="${data.colors[type]}" stroke-width=".8" opacity=".18" pointer-events="none"/>`;}}
    for(const p of positions){const label=labels.get(p.key);if(label)html+=`<path class="atlas-label-leader" d="M${p.x},${p.y}L${label.leaderX},${label.leaderY}"/>`;}
    for(const {g,r,x,y,key,selected,single}of positions){const c=data.colors[r.type],label=labels.get(key),interval=Math.max(3,Math.min(905,scale(g.end))-Math.max(90,scale(g.start)));
      const attr=single?`data-record="${r.id}"`:`data-cluster="${key}"`;
      let ring='';if(!single){let angle=-Math.PI/2;for(const type of data.types){const count=g.records.filter(r=>r.type===type).length;if(!count)continue;const next=angle+count/g.records.length*Math.PI*2;if(count===g.records.length)ring+=`<circle cx="${x}" cy="${y}" r="18" fill="none" stroke="${data.colors[type]}" stroke-width="2.4"/>`;else ring+=`<path d="M${x+18*Math.cos(angle)},${y+18*Math.sin(angle)} A18 18 0 ${next-angle>Math.PI?1:0} 1 ${x+18*Math.cos(next)},${y+18*Math.sin(next)}" fill="none" stroke="${data.colors[type]}" stroke-width="2.4"/>`;angle=next;}}
      html+=`<g class="node ${single?'':'atlas-cluster'}" ${attr} role="button" tabindex="0" aria-label="${single?esc(r.name)+'，'+esc(r.date.label):esc(g.region)+'，'+g.records.length+'座建筑，点击展开'}" aria-pressed="${selected}">${g.end>g.start?`<path d="M${Math.max(90,scale(g.start))} ${y}h${interval}" stroke="${c}" stroke-width="2" opacity=".5"/>`:''}${selected?`<circle cx="${x}" cy="${y}" r="25" fill="${c}09" stroke="${c}" class="node-selected"/>`:''}${single?`<g class="node-glyph" transform="translate(${x},${y})" stroke="${c}" pointer-events="none">${glyph(r)}</g><circle class="node-dot" cx="${x}" cy="${y}" r="3" fill="${c}"/>`:`<circle cx="${x}" cy="${y}" r="18" fill="#0d3a36" stroke="${c}" stroke-width=".4"/>${ring}<circle cx="${x}" cy="${y}" r="22" fill="none" stroke="${c}" opacity=".25"/><text x="${x}" y="${y+5}" class="cluster-count" text-anchor="middle" fill="${c}">${g.records.length}</text>`}${label?`<text x="${label.lx}" y="${label.ly}" class="node-label ${single?'':'cluster-label'}" text-anchor="${label.anchor}" style="font-size:14px">${esc(label.text)}</text>`:''}<circle class="hover-halo" cx="${x}" cy="${y}" r="25" fill="none" stroke="${c}"/><circle class="node-hit" cx="${x}" cy="${y}" r="23" fill="transparent"/></g>`;
    }
    chart.innerHTML=html;
    const shown=positions.reduce((sum,p)=>sum+p.g.records.length,0);document.querySelector('#atlas-zoom-status').textContent=Math.round(view.start)+'—'+Math.round(view.end)+'年';
    document.querySelector('#atlas-status').textContent=shown+' / '+list.length+' 座 · 点击聚合点展开';
    document.querySelector('#atlas-zoom-in').disabled=span<=80;document.querySelector('#atlas-zoom-out').disabled=span>=MAX-MIN;
    document.querySelector('#labels-toggle').setAttribute('aria-pressed',String(state.labels));
    document.querySelector('#atlas-window').value=(view.start+view.end)/2;
    document.querySelector('#atlas-window').disabled=span>=MAX-MIN;
  }
  function init(options){
    redraw=options.redraw;openBook=options.openBook;getSelection=options.getSelection;
    document.querySelector('#atlas-zoom-in').addEventListener('click',()=>zoom(2));document.querySelector('#atlas-zoom-out').addEventListener('click',()=>zoom(.5));document.querySelector('#atlas-zoom-reset').addEventListener('click',reset);
    document.querySelector('#atlas-window').addEventListener('input',e=>{const mid=Number(e.target.value),span=view.end-view.start;view.start=Math.max(MIN,Math.min(MAX-span,mid-span/2));view.end=view.start+span;closeList();redraw();});
    document.addEventListener('click',e=>{const cluster=e.target.closest('[data-cluster]'),book=e.target.closest('[data-cluster-book]');if(cluster){showList(cluster.dataset.cluster,cluster);return;}if(book){const id=book.dataset.clusterBook;closeList();openBook(id);return;}if(e.target.closest('[data-cluster-close]')||!e.target.closest('#cluster-list'))closeList();});
    const chart=document.querySelector('#atlas-chart');chart.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){e.preventDefault();zoom(2);}if(e.key==='-'){e.preventDefault();zoom(.5);}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();shift((view.end-view.start)*(e.key==='ArrowLeft'?-.2:.2));}if(e.key==='Escape')closeList();});
  }
  const api={view,groups,groupRecords,layoutLabels,render,init,zoom,reset,reveal,closeList};root.AtlasMap=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
