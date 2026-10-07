import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.dirname(fileURLToPath(import.meta.url)),qa=path.join(root,'qa');await fs.mkdir(qa,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){return await new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
const servicePort=await freePort(),debugPort=await freePort();
const server=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(servicePort)},windowsHide:true,stdio:'ignore'});
const browser=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-allow-origins=*',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(qa,'browser-profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;const runtimeErrors=[],checks=[];
async function until(fn,label){const deadline=Date.now()+20000;let error;while(Date.now()<deadline){try{const r=await fn();if(r)return r;}catch(e){error=e;}await delay(100);}throw Error('等待超时：'+label+(error?' / '+error.message:''));}
try{
  await until(async()=>{const r=await fetch(`http://127.0.0.1:${servicePort}/`,{signal:AbortSignal.timeout(800)});return r.ok;},'预览服务');
  await until(async()=>{const r=await fetch(`http://127.0.0.1:${debugPort}/json/version`,{signal:AbortSignal.timeout(800)});return r.ok;},'独立Edge');
  const target=await(await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  let id=0;const pending=new Map();ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')runtimeErrors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  async function click(selector,count=1){const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.scrollIntoView({behavior:'instant',block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:count,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:count,...point});}
  async function check(name,expression){assert.ok(await evaluate(expression),name);checks.push(name);if(!name.includes(' / '))console.log('PASS',name);}
  async function screenshot(name,full=false,keepTooltip=false){await evaluate(`document.querySelector('#toast').classList.remove('visible');${keepTooltip?'':"document.querySelector('#chart-tooltip').hidden=true"}`);await delay(400);const options={format:'png',captureBeyondViewport:full};if(full){const m=await send('Page.getLayoutMetrics');options.clip={x:0,y:0,width:m.cssContentSize.width,height:m.cssContentSize.height,scale:1};}const r=await send('Page.captureScreenshot',options);await fs.writeFile(path.join(qa,name),Buffer.from(r.data,'base64'));}
  async function hover(selector){const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({behavior:'instant',block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await delay(60);}
  async function svgPoint(selector,x,y,press=false){const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({behavior:'instant',block:'center'});const p=new DOMPoint(${x},${y}).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await delay(60);if(press){await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});}}



  await send('Page.enable');await send('Runtime.enable');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1200,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:`http://127.0.0.1:${servicePort}/`});await until(()=>evaluate(`document.readyState==='complete'&&!!window.AtlasBook`),'模型检查');
  const figures=[];
  for(const id of await evaluate('AtlasData.records.map(r=>r.id)')){
    figures.push(await evaluate(`(()=>{AtlasApp.select(${JSON.stringify(id)});AtlasBook.open(${JSON.stringify(id)});AtlasBook.go(1);const f=document.querySelector('.book-art');return '<article class="audit-card"><h2>'+AtlasBook.record.name+'</h2>'+f.outerHTML+'</article>';})()`));
    await evaluate(`document.querySelector('#book-dialog').close()`);await delay(20);
  }
  await evaluate(`document.querySelector('main').style.display='none';document.body.insertAdjacentHTML('beforeend','<section id="art-audit">'+${JSON.stringify(figures.join(''))}+'</section>');const style=document.createElement('style');style.textContent='#art-audit{padding:30px;display:grid;grid-template-columns:repeat(5,1fr);gap:25px;background:#092c30}.audit-card{min-width:0}.audit-card h2{font:18px serif;color:#eddaa9;text-align:center;margin:0 0 12px}.audit-card .book-art{height:260px;margin:0}';document.head.append(style);`);
  const after=!process.argv.includes('--preview');await screenshot(after?'模型修复后.png':'模型总览.png',true);
  if(after){
    await check('50个模型完整落在各自画布内',`[...document.querySelectorAll('#art-audit svg')].every(svg=>{const b=svg.querySelector('.art-building').getBBox(),v=svg.viewBox.baseVal;return b.x>=v.x&&b.y>=v.y&&b.x+b.width<=v.x+v.width&&b.y+b.height<=v.y+v.height})`);
    await check('50个模型在框中水平和垂直居中',`[...document.querySelectorAll('#art-audit svg')].every(svg=>{const r=svg.getBoundingClientRect(),b=svg.querySelector('.art-building').getBoundingClientRect();return Math.abs(b.x+b.width/2-r.x-r.width/2)<3&&Math.abs(b.y+b.height/2-r.y-r.height/2)<3})`);

    await evaluate(`window.inspectRoofMesh=svg=>{const groups=new Map();for(const face of svg.querySelectorAll('.art-roof-face')){const key=(face.dataset.component||'main')+'|'+face.dataset.tier;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(face);}for(const [key,faces]of groups){const [component,tier]=key.split('|'),earth=component.startsWith('earth'),octagon=svg.dataset.building==='dazheng',square=svg.dataset.variant==='square-earth',sideCount=earth?(square?4:20):octagon?8:4,expected=sideCount*(earth||tier==='lower'?2:1);const edges=new Map();for(const face of faces){const points=[...face.querySelector('polygon').points].map(p=>p.x.toFixed(2)+','+p.y.toFixed(2));for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if(a===b)continue;const edge=[a,b].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);}}const boundary=[...edges].filter(([,n])=>n===1);if([...edges.values()].some(n=>n>2)||boundary.length!==expected)return false;const degrees=new Map();boundary.forEach(([edge])=>edge.split('|').forEach(p=>degrees.set(p,(degrees.get(p)||0)+1)));if([...degrees.values()].some(n=>n!==2))return false;}return true;};`);
    await check('屋顶网格边界闭合，没有漏画的面',`[...document.querySelectorAll('#art-audit svg')].every(inspectRoofMesh)`);
    await check('广济桥浮桥与泸定桥桥面已补齐',`document.querySelector('[data-building="guangji"] .art-floating-deck polygon')&&document.querySelector('[data-building="luding"] .art-suspension-deck polygon')`);
    await evaluate(`document.querySelector('#art-audit').remove();document.querySelector('main').style.display='';`);
    for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[390,844]]){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width===390});
      for(const id of await evaluate('AtlasData.records.map(r=>r.id)')){
        await evaluate(`AtlasApp.select(${JSON.stringify(id)});AtlasBook.open(${JSON.stringify(id)});`);
        for(const page of [1,3]){
          await evaluate(`AtlasBook.go(${page})`);
          await check(width+' / '+id+' / '+page+'：模型居中、完整、与说明分开',`(()=>{const figure=document.querySelector('.book-art'),svg=figure.querySelector('svg'),stage=figure.querySelector('.book-model-stage').getBoundingClientRect(),b=svg.querySelector('.art-building').getBoundingClientRect(),caption=figure.querySelector('figcaption').getBoundingClientRect();return b.left>=stage.left+4&&b.right<=stage.right-4&&b.top>=stage.top+4&&b.bottom<=stage.bottom-4&&Math.abs(b.x+b.width/2-stage.x-stage.width/2)<3&&Math.abs(b.y+b.height/2-stage.y-stage.height/2)<3&&caption.top>=stage.bottom+8&&inspectRoofMesh(svg)})()`);
        }
        await evaluate(`document.querySelector('#book-dialog').close()`);await delay(10);
      }
      await evaluate(`AtlasApp.select('dazheng');AtlasBook.open('dazheng');AtlasBook.go(1);`);await screenshot('八角模型书页'+width+'.png');await evaluate(`document.querySelector('#book-dialog').close()`);await delay(20);
    }
    assert.equal(runtimeErrors.length,0);checks.push('模型绘制无浏览器异常');console.log('完成：'+checks.length+'项模型检查通过。');

  }
  await fs.writeFile(path.join(qa,after?'model-verification.json':'model-preview.json'),JSON.stringify({passed:true,checks,runtimeErrors},null,2));await send('Browser.close');
}finally{ws?.close();browser.kill();server.kill();}
