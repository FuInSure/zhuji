async function readBundle(env) {
  const { results } = await env.DB.prepare(
    'SELECT collection,item_key,ord,payload FROM zhuji_entries ORDER BY collection,ord,item_key'
  ).all();
  const rows = results.map(row => ({ ...row, value: JSON.parse(row.payload) }));
  const meta = rows.find(row => row.collection === 'meta' && row.item_key === 'config')?.value;
  const records = rows.filter(row => row.collection === 'record').map(row => row.value);
  const sources = rows.filter(row => row.collection === 'source').map(row => row.value);
  const asObject = collection => Object.fromEntries(
    rows.filter(row => row.collection === collection).map(row => [row.item_key, row.value])
  );
  const books = asObject('book');
  const photos = asObject('photo');
  if (!meta || records.length !== 50 || records.some(r => !books[r.id] || !photos[r.id])) {
    throw new Error('数据库尚未完整导入50座资料。');
  }
  return { catalog: { ...meta, records, sources }, books, photos };
}

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/api/bootstrap' || pathname === '/data/architectures.json') {
      if (request.method !== 'GET') {
        return Response.json({ error: '此接口只提供读取。' }, { status: 405, headers: { Allow: 'GET' } });
      }
      try {
        const bundle = await readBundle(env);
        return Response.json(pathname === '/api/bootstrap' ? bundle : bundle.catalog, {
          headers: { 'Cache-Control': 'no-store' }
        });
      } catch (error) {
        console.error(error);
        return Response.json({ error: '资料读取失败，请检查D1绑定和数据导入。' }, { status: 503 });
      }
    }
    if (pathname.startsWith('/api/')) return Response.json({ error: '接口不存在。' }, { status: 404 });
    return env.ASSETS.fetch(request);
  }
};