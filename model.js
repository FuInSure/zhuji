(function(root){
  'use strict';
  function filter(records,filters={}){return records.filter(r=>(!filters.type||r.type===filters.type)&&(!filters.dynasty||r.dynasty===filters.dynasty)&&(!filters.region||r.region===filters.region)&&(!filters.material||(r.material||'未载明')===filters.material)&&(!filters.structure||r.structure===filters.structure)&&(!filters.search||[r.name,r.province,r.city,r.achievement].some(x=>x.includes(filters.search.trim())))&&(filters.start==null||r.date.end>=filters.start)&&(filters.end==null||r.date.start<=filters.end));}
  function fieldFlags(r){return [!!r.name,!!r.type,!!r.province,!!r.date&&Number.isFinite(r.date.start)&&Number.isFinite(r.date.end),!!r.form,!!r.material,Array.isArray(r.sizes)&&r.sizes.length>0,Array.isArray(r.sourceIds)&&r.sourceIds.length>0];}
  function aggregate(records){const counts=key=>records.reduce((out,r)=>{const v=r[key]||'未载明';out[v]=(out[v]||0)+1;return out;},{});const filled=records.reduce((s,r)=>s+fieldFlags(r).filter(Boolean).length,0);return {count:records.length,typeCounts:counts('type'),dynastyCounts:counts('dynasty'),regionCounts:counts('region'),materialCounts:counts('material'),filled,totalFields:records.length*8,completeness:records.length?filled/(records.length*8):null,start:records.length?Math.min(...records.map(r=>r.date.start)):null,end:records.length?Math.max(...records.map(r=>r.date.end)):null,typeCount:new Set(records.map(r=>r.type)).size,matrix:records.reduce((out,r)=>{const key=r.structure+'|'+(r.material||'未载明');out[key]=(out[key]||0)+1;return out;},{})};}
  function validate(data){
    const ids=new Set(),sourceIds=new Set(data.sources.map(s=>s.id));
    if(sourceIds.size!==data.sources.length)throw Error('重复资料ID');
    const checkRefs=refs=>{if(!Array.isArray(refs)||!refs.length||refs.some(id=>!sourceIds.has(id)))throw Error('字段资料引用缺失');};
    for(const r of data.records){
      if(ids.has(r.id))throw Error('重复样本ID');ids.add(r.id);
      if(!data.types.includes(r.type))throw Error('无效建筑类型');
      if(!Number.isFinite(r.date.start)||!Number.isFinite(r.date.end)||r.date.start>r.date.end||r.date.end>=1911)throw Error('样本年代不在范围内');
      if(!data.regions.includes(r.region))throw Error('无效地域');
      if(r.material&&!data.materials.includes(r.material))throw Error('无效材质');
      if(!data.structures.includes(r.structure))throw Error('无效结构分类');
      checkRefs(r.sourceIds);
      for(const s of r.sizes){if(!Number.isFinite(s.value)||s.value<=0||!sourceIds.has(s.sourceId)||!['exact','approx','gt','gte'].includes(s.relation||'exact'))throw Error('尺寸引用或限定关系无效');}
      for(const s of r.counts||[]){if(!Number.isInteger(s.value)||s.value<0||!sourceIds.has(s.sourceId))throw Error('构件计数或引用无效');}
      if(r.date.sourceIds)checkRefs(r.date.sourceIds);
      if(r.provenance)for(const[key,v]of Object.entries(r.provenance)){if(key==='material'&&!r.material){if(v.sourceIds.length)throw Error('未确认材料不得伪设证据');}else checkRefs(v.sourceIds);}
      for(const event of r.events||[]){checkRefs(event.sourceIds);if(event.start!=null&&(!Number.isFinite(event.start)||!Number.isFinite(event.end)||event.start>event.end))throw Error('事件年代无效');}
    }
    return true;
  }
  const model={filter,aggregate,fieldFlags,validate};root.AtlasModel=model;if(typeof module!=='undefined'&&module.exports)module.exports=model;
})(typeof window!=='undefined'?window:globalThis);
