/* Original architectural concept drawings. These are not survey reconstructions. */
(function(root){
  const p=v=>v.map(n=>n.toFixed(2)).join(',');
  const polygon=(vs,fill,stroke='#b5aa79',width=.9)=>`<polygon points="${vs.map(p).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const path=(vs,stroke='#899777',width=.7,more='')=>`<path d="M${vs.map(p).join(' L')}" fill="none" stroke="${stroke}" stroke-width="${width}" ${more}/>`;
  const lerp=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
  let serial=0;
  function building(r){
    const bounds={left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity};
    const point=(x,y,z=0)=>{const v=[220+(x-y)*1.15,151+(x+y)*.46-z];bounds.left=Math.min(bounds.left,v[0]);bounds.right=Math.max(bounds.right,v[0]);bounds.top=Math.min(bounds.top,v[1]);bounds.bottom=Math.max(bounds.bottom,v[1]);return v;};
    const id='building-'+r.id+'-'+(++serial),gold='#c7b174',faint='#59745e';
    const roof=(vs,light=false)=>{let s=polygon(vs,`url(#${id}-${light?'roof-light':'roof'})`,gold,1);for(let i=1;i<24;i++)s+=path([lerp(vs[0],vs[1],i/24),lerp(vs[3],vs[2],i/24)],light?'#bbaf7c':'#7f9877',.5,'opacity=".55"');return s;};
    const roofFace=(name,tier,vs,light=false)=>`<g class="art-roof-face" data-face="${name}" data-tier="${tier}">${roof(vs,light)}</g>`;
    const footprint=(w,d,octagon=false)=>octagon?[[-w+w*.586,-d],[w-w*.586,-d],[w,-d+d*.586],[w,d-d*.586],[w-w*.586,d],[-w+w*.586,d],[-w,d-d*.586],[-w,-d+d*.586]]:[[-w,-d],[w,-d],[w,d],[-w,d]];
    const edges=vertices=>vertices.map((a,i)=>{const b=vertices[(i+1)%vertices.length];return {a,b,index:i,depth:a[0]+a[1]+b[0]+b[1]};}).sort((a,b)=>a.depth-b.depth);
    const base=(x,y,w,h,z)=>polygon([point(x,y,z),point(x+w,y,z),point(x+w,y+h,z),point(x,y+h,z)],'#19352e55',faint,.6);
    let body='',ambient='';
    if(r.structure==='石拱桥'){
      ambient+=`<ellipse cx="213" cy="204" rx="172" ry="30" fill="url(#${id}-mist)"/>`;
      const outer=[],inner=[],back=[];
      for(let i=0;i<=44;i++){const x=-112+i*224/44,z=58+26*(1-(x/112)**2);outer.push(point(x,19,z));back.push(point(x,-19,z));inner.push(point(x,19,10+53*(1-(x/112)**2)));}
      body+=polygon([...back,...outer.slice().reverse()],`url(#${id}-roof-light)`,gold,1);
      body+=polygon([...outer,...inner.slice().reverse()],`url(#${id}-stone)`,gold,1.1);
      for(let i=0;i<=22;i++){const x=-112+i*224/22;body+=path([point(x,19,58+26*(1-(x/112)**2)),point(x,19,10+53*(1-(x/112)**2))],'#8f9870',.6);}
      for(let i=0;i<=23;i++){const x=-109+i*218/23,z=58+26*(1-(x/112)**2);body+=path([point(x,19,z),point(x,19,z+9)],gold,.8);body+=path([point(x,-19,z),point(x,-19,z+9)],'#a9a273',.6);}
      const frontTop=[],backTop=[];for(let i=0;i<=30;i++){const x=-111+i*222/30,z=68+26*(1-(x/112)**2);frontTop.push(point(x,19,z));backTop.push(point(x,-19,z));}
      body+=path(frontTop,gold,1);body+=path(backTop,'#9eab7e',.8);
      for(const x of [-112,112])body+=polygon([point(x-8,-25,0),point(x+8,-25,0),point(x+8,25,0),point(x-8,25,0)],'#34473866','#62765b',.7);
      for(let i=0;i<4;i++)ambient+=`<path d="M${46+i*10},${214+i*5}q56-12 112 0t112 0t92-1" fill="none" stroke="#607b61" stroke-width=".6" opacity="${.2-i*.035}"/>`;
    }else if(r.structure==='石梁桥'||r.structure==='梁浮组合'){
      ambient+=`<ellipse cx="219" cy="202" rx="172" ry="28" fill="url(#${id}-mist)"/>`;
      for(let i=0;i<7;i++){const x=-104+i*34;body+=polygon([point(x-5,-14,8),point(x+5,-14,8),point(x+5,14,8),point(x-5,14,8)],'#1c3930',faint,.5);body+=polygon([point(x-5,14,8),point(x+5,14,8),point(x+5,14,52),point(x-5,14,52)],`url(#${id}-stone)`,gold,.8);body+=polygon([point(x+5,-14,8),point(x+5,14,8),point(x+5,14,52),point(x+5,-14,52)],'#375243',faint,.6);}
      const spans=r.structure==='梁浮组合'?[[-118,-32],[32,118]]:[[-118,118]];
      for(const[a,b]of spans){body+=polygon([point(a,-20,58),point(b,-20,58),point(b,20,58),point(a,20,58)],`url(#${id}-roof-light)`,gold,1);body+=polygon([point(a,20,51),point(b,20,51),point(b,20,58),point(a,20,58)],'#6d795355',gold,.8);for(let x=a+3;x<b;x+=13)body+=path([point(x,-20,58),point(x,20,58)],faint,.5);}
      if(r.structure==='梁浮组合'){
        // A continuous walking surface joins both fixed spans; the pontoons sit beneath it.
        for(const x of [-22,0,22]){
          body+=polygon([point(x-9,-26,39),point(x+9,-26,39),point(x+8,26,39),point(x-8,26,39)],'#69735599',gold,.8);
          body+=polygon([point(x-8,26,30),point(x+8,26,30),point(x+8,26,39),point(x-8,26,39)],'#355347',gold,.7);
          for(const y of [-15,15])body+=path([point(x,y,39),point(x,y,54)],gold,1.2);
        }
        body+='<g class="art-floating-deck">'+polygon([point(-32,-20,58),point(32,-20,58),point(32,20,58),point(-32,20,58)],'#9b966bcc',gold,1)+polygon([point(-32,20,52),point(32,20,52),point(32,20,58),point(-32,20,58)],'#5d7657',gold,.8);
        for(let x=-29;x<32;x+=7)body+=path([point(x,-20,58),point(x,20,58)],'#365b4b',.7);
        body+='</g>';
      }
      for(let i=0;i<3;i++)ambient+=`<path d="M48,${213+i*7}q72-10 140 0t150 0" fill="none" stroke="#537963" stroke-width=".6" opacity=".2"/>`;
    }else if(r.structure==='铁索桥'){
      ambient+=`<ellipse cx="217" cy="205" rx="170" ry="29" fill="url(#${id}-mist)"/>`;
      for(const x of [-114,114]){body+=base(x-10,-32,20,64,0);body+=polygon([point(x-10,32,0),point(x+10,32,0),point(x+10,32,59),point(x-10,32,59)],`url(#${id}-stone)`,gold,.7);body+=polygon([point(x+10,-32,0),point(x+10,32,0),point(x+10,32,59),point(x+10,-32,59)],'#355447',gold,.7);body+=base(x-10,-32,20,64,59);}
      const deckFront=[],deckBack=[];for(let i=0;i<=38;i++){const x=-112+i*224/38,z=20+37*(x/112)**2;deckFront.push(point(x,17,z));deckBack.push(point(x,-17,z));}
      body+='<g class="art-suspension-deck">'+polygon([...deckBack,...deckFront.reverse()],'#71806299',gold,.7)+'</g>';
      for(const y of [-17,17]){const upper=[],lower=[];for(let i=0;i<=38;i++){const x=-112+i*224/38,z=20+37*(x/112)**2;lower.push(point(x,y,z));upper.push(point(x,y,z+17));}body+=path(lower,gold,1);body+=path(upper,'#adb280',.8);for(let x=-105;x<=105;x+=15){const z=20+37*(x/112)**2;body+=path([point(x,y,z),point(x,y,z+17)],gold,.55);}}
      for(let x=-106;x<=106;x+=7){const z=20+37*(x/112)**2;body+=path([point(x,-17,z),point(x,17,z)],'#9b9a6a',1.7,'opacity=".6"');}
    }else{
      const palace=r.type==='皇宫',octagon=r.form.includes('八角'),wide=octagon?76:(r.visual?.width||(palace?92:83)),depth=octagon?76:(r.visual?.depth||(palace?57:60));
      ambient+=`<ellipse cx="222" cy="214" rx="165" ry="27" fill="url(#${id}-mist)"/>`;
      for(let i=0;i<3;i++)body+=base(-wide-12-i*8,-depth-10-i*8,(wide+12+i*8)*2,(depth+10+i*8)*2,8-i*5);
      if(octagon){
        const walls=footprint(wide,depth,true);
        for(const {a,b,depth:order}of edges(walls)){
          body+=polygon([point(...a,8),point(...b,8),point(...b,72),point(...a,72)],order>0?'#304d3de6':'#1b3c32',faint,.7);
          body+=path([point(...a,8),point(...a,68)],gold,1.2);
          if(order>=0){for(let j=1;j<6;j++){const xy=lerp(a,b,j/6);body+=path([point(...xy,12),point(...xy,55)],'#9eaa7b',.6);}body+=path([point(...a,55),point(...b,55)],gold,.8);}
        }
      }else{
        body+=polygon([point(-wide,depth,8),point(wide,depth,8),point(wide,depth,72),point(-wide,depth,72)],`url(#${id}-wall)`,faint,.6);
        body+=polygon([point(wide,-depth,8),point(wide,depth,8),point(wide,depth,72),point(wide,-depth,72)],'#244235',faint,.6);
        for(let i=0;i<=8;i++){const x=-wide+i*wide*2/8;body+=path([point(x,depth,8),point(x,depth,68)],gold,i%2?1:1.3);if(i<8)for(let j=1;j<=4;j++)body+=path([point(x+j*wide*2/8/5,depth,12),point(x+j*wide*2/8/5,depth,54)],'#889b72',.55,'opacity=".55"');}
        for(let y=-depth;y<=depth;y+=22)body+=path([point(wide,y,8),point(wide,y,68)],'#a1a773',1);
        body+=path([point(-wide,depth,54),point(wide,depth,54)],gold,.7);
        for(let i=0;i<9;i++){const x=-wide+i*wide*2/8;body+=polygon([point(x-5,depth,64),point(x+5,depth,64),point(x+7,depth,71),point(x-7,depth,71)],'#a7aa7560',gold,.4);}
      }
      const hip=r.form.includes('攒尖'),double=palace&&r.form.includes('重檐');
      const inner=footprint(wide-13,depth-8,octagon);
      if(double){
        const outer=footprint(wide+30,depth+25,octagon);
        for(const {a,b,index,depth:order}of edges(outer)){
          const next=(index+1)%outer.length;
          body+=roofFace('edge-'+index,'lower',[point(...a,66),point(...b,66),point(...inner[next],88),point(...inner[index],88)],order>=0);
        }
        for(const {a,b,depth:order}of edges(inner))body+=polygon([point(...a,88),point(...b,88),point(...b,98),point(...a,98)],order>=0?'#284c39':'#193d31',gold,.5);
      }
      const eaveZ=double?98:82,peakZ=double?143:132,roofW=wide+(double?10:18),roofD=depth+(double?8:18);
      if(hip){
        const top=point(0,0,peakZ),corners=footprint(roofW,roofD,octagon);
        for(const {a,b,index,depth:order}of edges(corners))body+=roofFace('edge-'+index,'upper',[point(...a,eaveZ),point(...b,eaveZ),top,top],order>=0);
        point(0,0,peakZ+7);body+=`<circle cx="${top[0]}" cy="${top[1]-4}" r="3" fill="#ccb774"/>`;
      }else{
        const ridgeZ=double?143:121;
        // Four closed facets, including the previously omitted western hip.
        body+=roofFace('north','upper',[point(-roofW,-roofD,eaveZ),point(roofW,-roofD,eaveZ),point(wide-12,0,ridgeZ),point(-wide+12,0,ridgeZ)]);
        body+=roofFace('west','upper',[point(-roofW,roofD,eaveZ),point(-roofW,-roofD,eaveZ),point(-wide+12,0,ridgeZ),point(-wide+12,0,ridgeZ)]);
        body+=roofFace('east','upper',[point(roofW,-roofD,eaveZ),point(roofW,roofD,eaveZ),point(wide-12,0,ridgeZ),point(wide-12,0,ridgeZ)]);
        body+=roofFace('south','upper',[point(roofW,roofD,eaveZ),point(-roofW,roofD,eaveZ),point(-wide+12,0,ridgeZ),point(wide-12,0,ridgeZ)],true);
        body+=path([point(-wide+11,0,ridgeZ+2),point(wide-11,0,ridgeZ+2)],gold,1.3);
      }
      if(!palace){for(const x of [-wide-14,wide+14])body+=path([point(x,-depth,76),point(x,-depth,107),point(x,-depth+18,107),point(x,-depth+18,115),point(x,-depth+38,115),point(x,-depth+38,106),point(x,0,106)],'#b4b078',1);}
    }
    const padding=16,viewBox=[bounds.left-padding,bounds.top-padding,bounds.right-bounds.left+padding*2,bounds.bottom-bounds.top+padding*2].map(v=>v.toFixed(2)).join(' ');
    return `<svg data-building="${r.id}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${r.name}所属建筑形制概念线稿，非测绘复原"><defs><linearGradient id="${id}-roof" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#254d3b" stop-opacity=".65"/><stop offset="1" stop-color="#132d27" stop-opacity=".25"/></linearGradient><linearGradient id="${id}-roof-light" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b1ae735e"/><stop offset="1" stop-color="#617b5130"/></linearGradient><linearGradient id="${id}-stone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a0a37677"/><stop offset="1" stop-color="#46634630"/></linearGradient><linearGradient id="${id}-wall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#536b4630"/><stop offset="1" stop-color="#1e3d2e11"/></linearGradient><radialGradient id="${id}-mist"><stop stop-color="#9fbd8d" stop-opacity=".14"/><stop offset="1" stop-color="#68816a" stop-opacity="0"/></radialGradient></defs><g class="art-shape art-shimmer"><g class="art-ambient" aria-hidden="true">${ambient}</g><g class="art-building">${body}</g></g></svg>`;
  }
  root.ArchitectureArt={building};
})(typeof window!=='undefined'?window:globalThis);
