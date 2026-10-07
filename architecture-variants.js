/* Shape-specific original concept diagrams. Dimensions are diagram units, never survey data. */
(function(){
  const original=ArchitectureArt.building;let serial=0;
  const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function diagram(r){
    const v=r.visual||{},kind=v.kind;if(!kind||kind==='hall')return original(r);
    const id='variant-'+r.id+'-'+(++serial),gold='#d7bd7e',muted='#729b7c';let body='',component=0;
    const box={l:Infinity,t:Infinity,r:-Infinity,b:-Infinity};
    const point=(x,y,z=0)=>{const p=[230+(x-y)*1.1,165+(x+y)*(kind.includes('earth')?.68:.43)-z];box.l=Math.min(box.l,p[0]);box.r=Math.max(box.r,p[0]);box.t=Math.min(box.t,p[1]);box.b=Math.max(box.b,p[1]);return p;};
    const pts=vs=>vs.map(p=>p.map(n=>n.toFixed(2)).join(',')).join(' ');
    const polygon=(vs,fill='#244c3deb',stroke=gold,width=.8)=>`<polygon points="${pts(vs)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
    const line=(a,b,color=gold,width=.7)=>`<path d="M${a.join(',')}L${b.join(',')}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
    const floor=(x,y,w,d,z=0)=>polygon([point(x-w,y-d,z),point(x+w,y-d,z),point(x+w,y+d,z),point(x-w,y+d,z)],'#21473880',muted,.5);
    const prism=(x,y,w,d,bottom,top,fill='#33533dd9')=>{
      let s=polygon([point(x-w,y+d,bottom),point(x+w,y+d,bottom),point(x+w,y+d,top),point(x-w,y+d,top)],fill);
      s+=polygon([point(x+w,y-d,bottom),point(x+w,y+d,bottom),point(x+w,y+d,top),point(x+w,y-d,top)],'#274b3ceb');
      s+=floor(x,y,w,d,top);return s;
    };
    const lerp=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
    function roofFace(vs,componentId,tier='upper',face='0',light=false){
      let s=polygon(vs,light?'#aaae6c66':'#40674bcc');
      for(let i=1;i<11;i++)s+=line(lerp(vs[0],vs[1],i/11),lerp(vs[3],vs[2],i/11),'#d5bb7966',.45);
      return `<g class="art-roof-face" data-component="${componentId}" data-tier="${tier}" data-face="${face}">${s}</g>`;
    }
    function hall(x,y,w,d,h=55,bays=5,roofKind='hip',baseZ=4){
      const ci='hall-'+(++component);let s=prism(x,y,w,d,baseZ,h,'#335740aa');
      for(let i=0;i<=bays;i++){const dx=x-w+i*w*2/bays;s+=line(point(dx,y+d,baseZ),point(dx,y+d,h),gold,1);if(i<bays)s+=line(point(dx+w/bays,y+d,baseZ+6),point(dx+w/bays,y+d,h-10),muted,.6);}
      const e=h+7,peak=e+25,ridge=roofKind==='gable'?w:w*.7,aw=w+9,ad=d+8;
      const a=point(x-aw,y-ad,e),b=point(x+aw,y-ad,e),c=point(x+aw,y+ad,e),f=point(x-aw,y+ad,e),u=point(x-ridge,y,peak),q=point(x+ridge,y,peak);
      s+=roofFace([a,b,q,u],ci,'upper','north');s+=roofFace([f,a,u,u],ci,'upper','west');s+=roofFace([b,c,q,q],ci,'upper','east');s+=roofFace([c,f,u,q],ci,'upper','south',true);
      s+=line(u,q,gold,1.2);return s;
    }
    function earthRing(radius,inner,height,levels,sides=20,square=false,ci='ring'){
      const outer=[],inside=[],ridge=[];
      for(let i=0;i<sides;i++){
        if(square){const corners=[[-radius,-radius*.8],[radius,-radius*.8],[radius,radius*.8],[-radius,radius*.8]];outer.push(corners[i]);inside.push(corners[i].map(n=>n*inner/radius));ridge.push(corners[i].map(n=>n*.9));}
        else{const a=i/sides*Math.PI*2;outer.push([Math.cos(a)*radius,Math.sin(a)*radius]);inside.push([Math.cos(a)*inner,Math.sin(a)*inner]);ridge.push([Math.cos(a)*(radius-10),Math.sin(a)*(radius-10)]);}
      }
      const order=outer.map((a,i)=>({i,depth:a[0]+a[1]+outer[(i+1)%sides][0]+outer[(i+1)%sides][1]})).sort((a,b)=>a.depth-b.depth);
      let s='';
      for(const {i,depth}of order){const next=(i+1)%sides,a=outer[i],b=outer[next];s+=polygon([point(...a,0),point(...b,0),point(...b,height),point(...a,height)],depth>0?'#9b865bbf':'#6e7755c9',gold,.65);
        for(let level=1;level<levels;level++){const m=lerp(a,b,.5),z=level*height/levels+3;if(depth>=0){const p=point(...m,z);s+=`<rect x="${p[0]-1.7}" y="${p[1]-3}" width="3.4" height="5.5" fill="#183c2d" stroke="#d0b675" stroke-width=".3"/>`;}}}
      for(const {i}of order){const next=(i+1)%sides,a=inside[i],b=inside[next];s+=polygon([point(...a,0),point(...b,0),point(...b,height-2),point(...a,height-2)],'#244b3be6',muted,.5);for(let level=1;level<levels;level++)s+=line(point(...a,level*height/levels),point(...b,level*height/levels),gold,.7);s+=line(point(...a,0),point(...a,height),gold,.6);}
      for(const {i,depth}of order){const n=(i+1)%sides;s+=roofFace([point(...outer[i],height),point(...outer[n],height),point(...ridge[n],height+15),point(...ridge[i],height+15)],ci,'outer',String(i),depth>=0);s+=roofFace([point(...ridge[i],height+15),point(...ridge[n],height+15),point(...inside[n],height),point(...inside[i],height)],ci,'inner',String(i),depth>=0);}
      return s;
    }
    if(kind==='courtyard'){
      const rows=v.rows||2,factor=(v.width||90)/90,spacing=v.layout==='linked-halls'?86:80,half=(rows-1)*spacing/2,plotHalf=half+45;
      body+=floor(0,0,135,plotHalf+15,0);
      const pieces=[];
      for(let row=0;row<rows;row++){const y=-half+row*spacing;pieces.push({depth:y,html:hall(0,y,65*factor,22,row===0&&v.layout==='five-phoenix'?70:52,5)});if(v.layout!=='linked-halls'&&row<rows-1)for(const x of [-105,105])pieces.push({depth:x+y+40,html:hall(x*factor,y+40,22,29,38,3,'gable')});}
      if(v.layout==='linked-halls')body+=hall(0,0,14,spacing/2,26,2,'gable');
      if(r.id==='yangxin')pieces.push({depth:half+32,html:hall(-20,half+32,28,15,38,3,'gable')});
      if(v.tower){body+=prism(-105,-half,18,22,0,128,'#8e8458b8');for(let i=1;i<7;i++)body+=line(point(-123,-half+22,i*18),point(-87,-half+22,i*18),gold,.7);}
      pieces.sort((a,b)=>a.depth-b.depth).forEach(p=>body+=p.html);
      if(v.garden)body+=`<ellipse cx="${point(90,half+18,0)[0]}" cy="${point(90,half+18,0)[1]}" rx="18" ry="7" fill="#82b0a044" stroke="#90ae83" stroke-width=".6"/>`;
    }else if(kind==='round-earth'||kind==='square-earth'){
      const rad=v.radius||v.width||100,levels=v.levels||4,height=levels*18,square=kind==='square-earth';
      body+=floor(0,0,rad+10,square?rad*.8+10:rad+10,0);
      // Courtyard openings are intentional; both slopes of every roof ring are complete.
      const rings=v.rings||1;
      for(let ring=rings-1;ring>=0;ring--){const radius=rad*Math.pow(.55,ring),inner=radius*(ring? .55:.69),h=ring?Math.max(22,height*.42):height;body+=earthRing(radius,inner,h,ring?1:levels,square?4:20,square,'earth-'+ring);}
    }else if(kind==='tower'){
      body+=floor(0,0,68,68,0);const levels=v.levels||3;
      for(let level=0;level<levels;level++){const w=48-level*5,b=level*49;body+=prism(0,0,w,w*.75,b,b+36,'#365740ba');for(let x=-w;x<=w;x+=w/2)body+=line(point(x,w*.75,b),point(x,w*.75,b+36),gold,1);const ci='floor-'+level,e=b+39,p=e+22,rw=w+12,d=w*.75+10,u=point(-w*.6,0,p),q=point(w*.6,0,p),a=point(-rw,-d,e),bb=point(rw,-d,e),c=point(rw,d,e),f=point(-rw,d,e);body+=roofFace([a,bb,q,u],ci,'upper','north');body+=roofFace([f,a,u,u],ci,'upper','west');body+=roofFace([bb,c,q,q],ci,'upper','east');body+=roofFace([c,f,u,q],ci,'upper','south',true);}
    }else if(kind==='iron-truss'){
      const spans=v.spans||5;for(let i=0;i<=spans;i++)body+=prism(-120+i*240/spans,0,5,25,0,35,'#73866b99');
      body+=floor(0,0,124,22,38);body+=polygon([point(-124,22,32),point(124,22,32),point(124,22,38),point(-124,22,38)],'#5f8766aa');
      for(const y of [-22,22])for(let i=0;i<spans;i++){const a=-120+i*240/spans,b=-120+(i+1)*240/spans;body+=line(point(a,y,40),point(b,y,40),'#b9c9a4',1.2)+line(point(a,y,68),point(b,y,68),'#b9c9a4',1.2)+line(point(a,y,40),point(a,y,68),'#b9c9a4',1.2)+line(point(a,y,40),point(b,y,68),'#b9c9a4',1)+line(point(a,y,68),point(b,y,40),'#b9c9a4',1);}body+=line(point(120,22,40),point(120,22,68),'#b9c9a4',1.2);
    }else if(['multi-arch','high-arch','pavilion-bridge','covered-bridge'].includes(kind)){
      const arcs=kind==='high-arch'?1:kind==='multi-arch'?v.arches||7:kind==='pavilion-bridge'?5:1,width=240,depth=kind==='covered-bridge'?21:17;
      const high=kind==='high-arch'?73:kind==='covered-bridge'?35:29,zTop=x=>high+(kind==='high-arch'?50:kind==='multi-arch'?8:0)*(1-(x/120)**2);
      const upper=[];for(let i=0;i<=48;i++){const x=-120+i*5;upper.push(point(x,depth,zTop(x)));}
      let d='M'+upper.map(p=>p.join(',')).join(' L')+' L'+point(120,depth,0).join(',')+' L'+point(-120,depth,0).join(',')+' Z';
      for(let i=0;i<arcs;i++){const span=width/arcs,left=-120+i*span+span*.08,right=-120+(i+1)*span-span*.08,points=[point(left,depth,0),point(right,depth,0)];for(let j=0;j<=18;j++){const t=j/18,x=right-(right-left)*t,z=4+(kind==='high-arch'?68:kind==='covered-bridge'?24:16)*Math.sin(Math.PI*t);points.push(point(x,depth,z));}d+=' M'+points.map(p=>p.join(',')).join(' L')+' Z';}
      if(kind!=='covered-bridge')body+=`<path d="${d}" fill="#8b96727a" fill-rule="evenodd" stroke="${gold}" stroke-width=".9"/>`;
      else for(const y of [-21,21]){const low=[],highPoints=[];for(let i=0;i<=32;i++){const x=-120+i*7.5,z=1+24*(1-(x/120)**2);low.push(point(x,y,z));highPoints.push(point(x,y,z+4));}body+=polygon([...low,...highPoints.reverse()],'#aeb7838f');for(let x=-108;x<=108;x+=24){const z=5+24*(1-(x/120)**2);body+=line(point(x,y,z),point(x,y,35),gold,1.2);}}
      const back=upper.map((p,i)=>point(-120+i*5,-depth,zTop(-120+i*5)));body+=polygon([...back,...upper.slice().reverse()],'#9aab776b');
      for(let x=-114;x<=114;x+=13)body+=line(point(x,depth,zTop(x)),point(x,depth,zTop(x)+7),gold,.65);
      if(kind==='pavilion-bridge'){for(const x of [-85,-42,0,42,85])body+=hall(x,0,16,20,x===0?68:58,2,'hip',31);}
      if(kind==='covered-bridge')body+=hall(0,0,113,24,75,v.bays||7,v.roof==='gable'?'gable':'hip',35);
    }else return original(r);
    const pad=18,viewBox=[box.l-pad,box.t-pad,box.r-box.l+pad*2,box.b-box.t+pad*2].map(x=>x.toFixed(2)).join(' ');
    return `<svg data-building="${r.id}" data-variant="${kind}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escape(r.name)}的${escape(r.form)}概念图，非测绘复原"><g class="art-shape"><g class="art-building">${body}</g></g></svg>`;
  }
  ArchitectureArt.building=diagram;
})();
