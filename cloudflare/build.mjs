import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'data/architectures.json'), 'utf8'));
const photos = JSON.parse(await fs.readFile(path.join(root, 'data/photo-credits.json'), 'utf8'));

const context = vm.createContext({ window: {} });
for (const file of ['book-data.js', 'expansion-books.js']) {
  vm.runInContext(await fs.readFile(path.join(root, file), 'utf8'), context, { timeout: 1000 });
}
const books = context.window.AtlasBookContent;
if (catalog.records.length !== 50 || Object.keys(books).length !== 50 || Object.keys(photos).length !== 50) {
  throw new Error('请先核对完整的50座建筑、书页和图版资料。');
}

const { records, sources, ...meta } = catalog;
const entries = [
  ['meta', 'config', 0, meta],
  ...records.map((r, i) => ['record', r.id, i, r]),
  ...sources.map((s, i) => ['source', s.id, i, s]),
  ...Object.entries(books).map(([id, value], i) => ['book', id, i, value]),
  ...Object.entries(photos).map(([id, value], i) => ['photo', id, i, value])
];
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
const sql = [
  `CREATE TABLE IF NOT EXISTS zhuji_entries (
    collection TEXT NOT NULL,
    item_key TEXT NOT NULL,
    ord INTEGER NOT NULL,
    payload TEXT NOT NULL,
    PRIMARY KEY (collection, item_key)
  );`
];
for (const [collection, key, order, value] of entries) {
  const statement = `INSERT INTO zhuji_entries(collection,item_key,ord,payload)
    VALUES(${quote(collection)},${quote(key)},${order},${quote(JSON.stringify(value))})
    ON CONFLICT(collection,item_key) DO UPDATE SET
    ord=excluded.ord,payload=excluded.payload;`;
  if (Buffer.byteLength(statement, 'utf8') > 100000) throw new Error('单条资料超过D1的SQL长度限制：' + key);
  sql.push(statement);
}
await fs.writeFile(path.join(root, 'cloudflare/import.sql'), sql.join('\n'), 'utf8');

await fs.mkdir(path.join(out, 'data'), { recursive: true });
const files = [
  'styles.css', 'interaction.css', 'scene.css', 'atlas-book.css', 'atlas-scale.css',
  'model.js', 'architecture-art.js', 'architecture-variants.js',
  'atlas-map.js', 'app.js', 'book.js'
];
for (const file of files) await fs.copyFile(path.join(root, file), path.join(out, file));
await fs.cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
for (const file of ['measurements.csv', 'coverage.csv', '补数报告.md', '50座扩充报告.md']) {
  await fs.copyFile(path.join(root, 'data', file), path.join(out, 'data', file));
}

let html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
html = html.replace('</head>', '<script defer src="/bootstrap.js"></script></head>');
await fs.writeFile(path.join(out, 'index.html'), html, 'utf8');
await fs.copyFile(path.join(root, 'cloudflare/bootstrap.js'), path.join(out, 'bootstrap.js'));
console.log('已生成public网站目录和cloudflare/import.sql，共' + entries.length + '条D1记录。');