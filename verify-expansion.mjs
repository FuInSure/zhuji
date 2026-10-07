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
  async function check(name,expression){assert.ok(await evaluate(expression),name);checks.push(name);console.log('PASS',name);}
  async function screenshot(name,full=false,keepTooltip=false){await evaluate(`document.querySelector('#toast').classList.remove('visible');${keepTooltip?'':"document.querySelector('#chart-tooltip').hidden=true"}`);await delay(400);const options={format:'png',captureBeyondViewport:full};if(full){const m=await send('Page.getLayoutMetrics');options.clip={x:0,y:0,width:m.cssContentSize.width,height:m.cssContentSize.height,scale:1};}const r=await send('Page.captureScreenshot',options);await fs.writeFile(path.join(qa,name),Buffer.from(r.data,'base64'));}
  async function hover(selector){const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({behavior:'instant',block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await delay(60);}
  async function svgPoint(selector,x,y,press=false){const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({behavior:'instant',block:'center'});const p=new DOMPoint(${x},${y}).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await delay(60);if(press){await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});}}




  await send('Page.enable');await send('Runtime.enable');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:`http://127.0.0.1:${servicePort}/`});await until(()=>evaluate(`document.readyState==='complete'&&!!window.AtlasBook`),'50座页面');
  await screenshot('50座图谱初检.png');console.log(await evaluate(`({count:AtlasData.records.length,groups:[...AtlasMap.groups.values()].map(g=>({n:g.records.length,names:g.records.map(r=>r.name)})),books:Object.keys(AtlasBookContent).length,photos:Object.keys(AtlasPhotos).length})`));
  const figures=[];
  for(const id of await evaluate('AtlasData.records.map(r=>r.id)')){
    figures.push(await evaluate(`(()=>{AtlasApp.select(${JSON.stringify(id)});AtlasBook.open(${JSON.stringify(id)});AtlasBook.go(1);const f=document.querySelector('.book-art');return '<article class="audit-card"><h2>'+AtlasBook.record.name+'</h2>'+f.outerHTML+'</article>';})()`));
    await evaluate(`document.querySelector('#book-dialog').close()`);await delay(15);
  }
  await evaluate(`document.querySelector('main').style.display='none';document.body.insertAdjacentHTML('beforeend','<section id="art-audit">'+${JSON.stringify(figures.join(''))}+'</section>');const style=document.createElement('style');style.textContent='#art-audit{padding:30px;display:grid;grid-template-columns:repeat(5,1fr);gap:25px;background:#092c30}.audit-card{min-width:0}.audit-card h2{font:18px serif;color:#eddaa9;text-align:center;margin:0 0 12px}.audit-card .book-art{height:245px;margin:0}';document.head.append(style);`);
  await screenshot('50座模型初检.png',true);
  const issues=await evaluate(`[...document.querySelectorAll('#art-audit svg')].map(svg=>{const b=svg.querySelector('.art-building').getBBox(),v=svg.viewBox.baseVal,r=svg.getBoundingClientRect(),g=svg.querySelector('.art-building').getBoundingClientRect();return {id:svg.dataset.building,inside:b.x>=v.x&&b.y>=v.y&&b.x+b.width<=v.x+v.width&&b.y+b.height<=v.y+v.height,dx:g.x+g.width/2-r.x-r.width/2,dy:g.y+g.height/2-r.y-r.height/2}}).filter(x=>!x.inside||Math.abs(x.dx)>3||Math.abs(x.dy)>3)`);console.log('Model issues',issues);console.log('Runtime errors',runtimeErrors);await fs.writeFile(path.join(qa,'expansion-probe.json'),JSON.stringify({issues,runtimeErrors},null,2));await send('Browser.close');
}finally{ws?.close();browser.kill();server.kill();}
