(function(){
  'use strict';
  const $=s=>document.querySelector(s),D=AtlasData,content=AtlasBookContent;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog=$('#book-dialog'),spread=$('#book-spread'),chapters=['历史','故事','题咏','图版'];
  let record=null,page=0,timer=null,returnTarget=null;
  const sourceLinks=ids=>ids.map(id=>{const s=D.sources.find(s=>s.id===id);return s?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.publisher)} · ${esc(s.title)} ↗</a>`:'';}).join('');
  function picture(kind='regular'){
    const p=AtlasPhotos[record.id],c=content[record.id];
    if(!p||p.kind==='illustration')return `<figure class="book-photo concept-photo ${kind}"><div class="concept-stage">${ArchitectureArt.building(record)}</div><figcaption><span>${esc(record.name)} · 院落形制概念图</span><small>本项目原创图稿 · 非实景摄影、非测绘复原</small></figcaption></figure>`;
    return `<figure class="book-photo ${kind}"><img src="${esc(p.local)}" alt="${esc(c.photoCaption)}" decoding="async"><figcaption><span>${esc(c.photoCaption)}</span><small>摄影 ${esc(p.author)} · <a href="${esc(p.page)}" target="_blank" rel="noopener noreferrer">原图</a> · <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a><br>拍摄／原文件日期 ${esc(p.date)} · 显示时按容器裁切</small></figcaption></figure>`;
  }
  const art=()=>`<figure class="book-art"><div class="book-model-stage">${ArchitectureArt.building(record)}</div><figcaption>形制概念图稿 · 代码绘制，非测绘复原</figcaption></figure>`;
  const head=(number,title)=>`<span class="book-kicker">${number} / ${esc(record.province)} · ${esc(record.dynasty)}</span><h2>${title}</h2>`;
  const paragraphs=items=>items.map(text=>`<p>${esc(text)}</p>`).join('');
  function draw(){
    const c=content[record.id],r=record;
    const events=(r.events||[]).map(event=>`<li><b>${esc(event.label)}</b><span>${esc(event.event)}</span></li>`).join('');
    let left,right;
    if(page===0){
      left=head('壹',esc(r.name))+`<p class="book-subtitle">${esc(r.city)} · ${esc(r.date.label)}</p><div class="book-prose">${paragraphs([c.history])}</div><ol class="book-chronology">${events}</ol><details class="book-evidence"><summary>本章史料依据</summary>${sourceLinks(r.sourceIds)}</details>`;
      right=picture('opening-photo');
    }else if(page===1){
      left=head('贰',esc(c.storyTitle))+`<span class="book-text-label">据文献整理的建筑故事</span><div class="book-prose">${paragraphs(c.story)}</div><details class="book-evidence"><summary>故事与营造依据</summary>${sourceLinks(r.sourceIds)}</details>`;
      right=art()+`<div class="book-structure"><span>营造线索</span><strong>${esc(r.form)}</strong><p>${esc(r.summary)}</p></div>`;
    }else if(page===2){
      left=head('叁',esc(c.poemTitle))+`<div class="book-poem">${c.poem.map(line=>`<p>${esc(line)}</p>`).join('')}</div><p class="book-original">本项目原创题咏 · 现代创作<br>取意于建筑形制，不作为古代文献。</p>`;
      right=picture('poem-photo');
    }else{
      left=head('肆','图版与笔记')+picture('plate-photo');
      right=`<span class="book-kicker">看见的建筑，与记载的建筑</span>${art()}<div class="book-prose small"><p>${esc(r.note)}</p></div><button id="book-dossier" class="book-dossier">尺寸、构件与完整资料 ↗</button><details class="book-evidence"><summary>照片授权与文献目录</summary><p>${esc(AtlasPhotos[r.id].changes)}</p>${sourceLinks(r.sourceIds)}</details>`;
    }
    spread.innerHTML=`<article class="book-page book-left">${left}<span class="folio">${String(page*2+1).padStart(2,'0')}</span></article><article class="book-page book-right">${right}<span class="folio">${String(page*2+2).padStart(2,'0')}</span></article>`;
    $('#book-title').textContent=r.name;$('#book-subject').textContent=r.type+' · '+r.province;
    $('#book-page-status').textContent=chapters[page]+' / '+(page+1)+' · 4';
    $('#book-prev').disabled=page===0;$('#book-next').disabled=page===3;
    document.querySelectorAll('[data-book-chapter]').forEach(b=>{const active=Number(b.dataset.bookChapter)===page;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    $('#book-dossier')?.addEventListener('click',()=>AtlasApp.showDetails());
    spread.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.replaceWith(document.createRange().createContextualFragment(`<div class="photo-unavailable">图片暂时无法读取<br><a href="${esc(AtlasPhotos[r.id].page)}" target="_blank" rel="noopener noreferrer">查看原始照片 ↗</a></div>`));},{once:true}));
  }
  function go(target){
    if(!record)return;target=Math.max(0,Math.min(3,target));if(target===page)return;
    clearTimeout(timer);dialog.classList.remove('turn-forward','turn-back');
    const direction=target>page?'turn-forward':'turn-back';page=target;draw();
    void dialog.offsetWidth;dialog.classList.add(direction);
    timer=setTimeout(()=>dialog.classList.remove(direction),650);
  }
  function open(id){
    const next=D.records.find(r=>r.id===id);if(!next||!content[id])return;
    returnTarget=document.activeElement?.closest?.('[data-record]')?.dataset.record||id;
    record=next;page=0;clearTimeout(timer);dialog.classList.remove('turn-forward','turn-back');draw();
    $('#chart-tooltip').hidden=true;if(!dialog.open)dialog.showModal();
    $('#book-close').focus({preventScroll:true});
  }
  $('#book-close').addEventListener('click',()=>dialog.close());
  $('#book-prev').addEventListener('click',()=>go(page-1));$('#book-next').addEventListener('click',()=>go(page+1));
  document.querySelectorAll('[data-book-chapter]').forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.bookChapter))));
  dialog.addEventListener('keydown',event=>{
    if(document.querySelector('#detail-dialog').open||event.target.closest('details[open]'))return;
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
      event.preventDefault();go(page+(event.key==='ArrowRight'?1:-1));
      if(event.target.closest('[role="tab"]'))document.querySelector(`[data-book-chapter="${page}"]`).focus();
    }
    if(event.key==='Home'||event.key==='End'){event.preventDefault();go(event.key==='Home'?0:3);}
  });
  dialog.addEventListener('close',()=>{clearTimeout(timer);dialog.classList.remove('turn-forward','turn-back');const node=document.querySelector(`#atlas-chart [data-record="${returnTarget}"]`)||document.querySelector(`[data-cluster="${[...AtlasMap.groups].find(([,g])=>g.records.some(r=>r.id===returnTarget))?.[0]}"]`);node?.focus({preventScroll:true});});
  window.AtlasBook={open,go,get record(){return record;},get page(){return page;}};
})();
