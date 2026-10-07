# 筑迹：GitHub＋Cloudflare Workers＋D1 自行部署说明

适用目录：`D:\Xiazai\27计算机设计大赛\训练\练手项目\筑迹`。核对日期：2026-10-07。

本文提供操作步骤和可复制的示例代码。需要你自己新建示例文件、登录账号、创建数据库、上传仓库及发布网站；当前项目的运行代码尚未执行这些部署改造。

目标分工如下：

| 服务 | 放什么 | 起什么作用 |
|---|---|---|
| GitHub 仓库 | 源代码、规范JSON、图片、许可说明 | 保存版本，供Cloudflare拉取构建 |
| Workers Static Assets | 网页、CSS、前端JS、49个图片文件 | 公开网站与图片访问 |
| D1 | 50座建筑、75条来源、50本书内容、50条图版说明、分类配置 | 网站运行时的数据来源 |
| Worker读取接口 | `/api/bootstrap` | 从D1读取资料，交给前端 |

图片文件使用Workers静态资源，D1保存图片路径、作者和授权信息。这个项目不需要为第一版额外开通R2。Workers可以在一次部署中同时发布接口与静态资源。[Cloudflare静态资源说明](https://developers.cloudflare.com/workers/static-assets/)

发布成功后，访问者打开网址即可浏览，无需GitHub或Cloudflare账户。GitHub负责保存代码，网址由Cloudflare提供。

## 1．准备账号和命令行

准备GitHub账号、Cloudflare账号，以及Git、Node.js和npm。建议使用当前受支持的Node.js LTS版本；Wrangler的本地系统要求见[官方安装说明](https://developers.cloudflare.com/workers/wrangler/install-and-update/)。

在PowerShell执行下面的命令，确认已安装：

```powershell
node --version
npm --version
git --version
```

进入项目目录。后续命令都在这里运行：

```powershell
Set-Location -LiteralPath 'D:\Xiazai\27计算机设计大赛\训练\练手项目\筑迹'
npm install --save-dev wrangler@latest
```

Wrangler是Cloudflare的部署工具。本地安装会更新`package.json`并生成`package-lock.json`，这两个文件都要上传到GitHub。

## 2．新增4个文件，并增加构建命令

需要新增的文件位置：

```text
筑迹/
├─ wrangler.jsonc
└─ cloudflare/
   ├─ build.mjs
   ├─ worker.js
   └─ bootstrap.js
```

原来的`index.html`、`app.js`和`book.js`继续保留。下面的构建脚本会生成独立的`public/`发布目录，原来的离线入口不必手动替换。

### 2.1 新建根目录的 `wrangler.jsonc`

先用全0的数据库ID占位，创建D1后必须改为实际输出的ID：

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "zhuji-worker",
  "main": "cloudflare/worker.js",
  "compatibility_date": "2026-10-07",
  "workers_dev": true,
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*", "/data/architectures.json"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "zhuji-db",
      "database_id": "00000000-0000-0000-0000-000000000000"
    }
  ]
}
```

全0是假ID，不能直接用于运行或发布。`DB`必须与下面代码中的`env.DB`一致；`ASSETS`对应静态资源。`run_worker_first`让数据接口先进入Worker，其他网页和图片优先由静态资源服务返回。[配置文档](https://developers.cloudflare.com/workers/static-assets/binding/)

### 2.2 新建 `cloudflare/build.mjs`

它会生成网站发布目录，以及D1可执行的SQL导入文件。每条建筑、来源和书页分别占一行，避免把整份JSON塞进超长SQL。D1单条SQL有100KB限制。[D1限制](https://developers.cloudflare.com/d1/platform/limits/)

```javascript
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
```

这份脚本使用UPSERT：重复导入会更新同ID资料。以后如果删除建筑或来源，需要同步删除D1中相应行；它不会自动删除旧ID。

### 2.3 新建 `cloudflare/worker.js`

这是Cloudflare的运行入口。原来的`server.mjs`继续用于本地预览。

```javascript
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
```

Worker通过`env.DB`绑定访问D1，浏览器只调用公开的读取接口；修改数据库使用你自己的Wrangler登录权限。[D1绑定API](https://developers.cloudflare.com/d1/worker-api/)

`/data/architectures.json`也会从D1返回当前资料，因此原网页里的完整JSON下载入口可以继续使用。CSV和报告是构建时生成的下载副本。

### 2.4 新建 `cloudflare/bootstrap.js`

这个文件在页面启动时先读取D1，再按顺序加载原来的交互代码。

```javascript
(async function () {
  try {
    const response = await fetch('/api/bootstrap', { cache: 'no-store' });
    if (!response.ok) throw new Error('数据接口返回HTTP ' + response.status);
    const bundle = await response.json();
    window.AtlasData = bundle.catalog;
    window.AtlasBookContent = bundle.books;
    window.AtlasPhotos = bundle.photos;

    const files = [
      'model.js', 'architecture-art.js', 'architecture-variants.js',
      'atlas-map.js', 'app.js', 'book.js'
    ];
    for (const file of files) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/' + file;
        script.onload = resolve;
        script.onerror = () => reject(new Error('脚本加载失败：' + file));
        document.head.append(script);
      });
    }
  } catch (error) {
    const message = document.createElement('p');
    message.style.cssText = 'padding:40px;color:#e5d6ab;font-size:16px;line-height:2';
    message.textContent = '筑迹资料暂时无法加载。' + error.message + '。请检查部署后刷新重试。';
    document.body.replaceChildren(message);
  }
})();
```

### 2.5 修改 `package.json` 的 `scripts`

保留原有命令，增加两项。最终`"scripts"`部分应为：

```json
"scripts": {
  "start": "node server.mjs",
  "build:data": "node scripts/build-data.mjs",
  "test": "node --test model.test.cjs",
  "verify": "node verify.mjs",
  "build:cloud": "npm run build:data && node cloudflare/build.mjs",
  "deploy": "wrangler deploy"
}
```

上面的片段只替换`package.json`里的`scripts`对象，不是整个文件；保留安装Wrangler时添加的`devDependencies`。

## 3．生成发布目录和SQL

```powershell
npm run build:cloud
```

成功时会出现两个产物：

- `public/`：在线网站文件，只包含用于公开网页的资源。
- `cloudflare/import.sql`：D1建表与资料导入语句，包含226条资料记录。

在线网页不再加载原来的`data.js`、`book-data.js`、`expansion-books.js`或`photo-data.js`，其运行数据由D1接口提供。原根目录离线页面仍保留原有方式。

## 4．登录Cloudflare，创建D1

```powershell
npx wrangler login
npx wrangler d1 create zhuji-db --location apac
```

第一条会引导你在浏览器登录和授权。第二条创建数据库，输出包含`database_id`的配置。将实际ID填入第2.1步的`wrangler.jsonc`，绑定名仍写`DB`。[D1创建命令](https://developers.cloudflare.com/workers/wrangler/commands/d1/)

也可以在Cloudflare控制台的D1页面创建`zhuji-db`，再复制Database ID填入配置。

## 5．先本地试跑，再导入线上数据库

本地试跑使用`--local`；Wrangler会在本机保存一份测试数据库。

```powershell
npx wrangler d1 execute zhuji-db --local --file=./cloudflare/import.sql
npx wrangler dev
```

浏览器打开终端显示的本地网址，通常是`http://localhost:8787`。检查图谱、分类筛选、聚合展开和建筑书。按`Ctrl+C`停止本地预览。

再把同一份数据导入远程D1：

```powershell
npx wrangler d1 execute zhuji-db --remote --file=./cloudflare/import.sql
npx wrangler d1 execute zhuji-db --remote --command="SELECT collection,COUNT(*) AS total FROM zhuji_entries GROUP BY collection;"
```

应查到：`record=50`、`source=75`、`book=50`、`photo=50`、`meta=1`。

**`--local`只影响本地测试库，正式网站必须完成`--remote`导入。** D1的文件导入接收SQL，不能直接把`architectures.json`作为SQL执行。[官方导入说明](https://developers.cloudflare.com/d1/best-practices/import-export-data/)

## 6．首次发布，取得公开网址

```powershell
npm run deploy
```

成功时终端会给出类似下面的地址，以你实际输出为准：

```text
https://zhuji-worker.你的账户子域.workers.dev
```

首次发布如果提示设置账户的`workers.dev`子域，按官方提示完成设置。这是网站访问链接，可以转发给其他人。[workers.dev说明](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

验证两个地址：

1. 网站首页：应显示50座建筑，能够分类筛选和翻书。
2. 同一网址后加`/api/bootstrap`：应返回包含`catalog`、`books`、`photos`的JSON，`catalog.records`有50条。

接口返回503时，优先检查D1的`database_id`、`DB`绑定名和远程导入是否完成。可使用`npx wrangler tail`查看Worker的运行日志。

## 7．将这个项目上传到GitHub

只把“筑迹”作为仓库根目录。仓库顶层应该能直接看到`package.json`、`wrangler.jsonc`、`index.html`和`cloudflare/`。

在GitHub创建一个空仓库，例如`zhuji`。可选择Private，授权Cloudflare读取该仓库后仍可发布公开网站。建空仓库时不要勾选自动添加README、`.gitignore`或License，避免与本地初次推送产生额外合并。[GitHub导入本地代码说明](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)

在现有`.gitignore`末尾追加：

```gitignore
node_modules/
.wrangler/
public/
cloudflare/import.sql
qa/
.env
.env.*
.dev.vars
.dev.vars.*
```

`public/`和SQL由构建脚本生成，Cloudflare构建时会重新生成；`assets/photos/`与`data/`的规范数据、许可说明需要上传。`wrangler.jsonc`中的数据库ID是绑定用的资源标识，不是API Token。

在项目目录执行，把占位用户名和仓库网址改成自己的：

```powershell
git init
git config user.name "你的Git用户名"
git config user.email "你的提交邮箱"
git add .
git commit -m "Prepare Zhuji Workers and D1 deployment"
git branch -M main
git remote add origin https://github.com/你的用户名/zhuji.git
git push -u origin main
```

推送时按Git的认证提示登录GitHub。也可使用GitHub Desktop把同一文件夹发布为仓库。账户授权在官方网页完成，不需要把账号凭据写入前端文件。

## 8．连接GitHub，实现后续自动发布

在Cloudflare控制台进入：

```text
Workers & Pages → zhuji-worker → Settings → Builds
```

连接GitHub仓库，按照提示给Cloudflare读取`zhuji`仓库的权限。设置如下：

| 选项 | 本项目填写 |
|---|---|
| Repository | 你的`zhuji`仓库 |
| Production branch | `main` |
| Root directory | 仓库根目录，留空或选择根目录 |
| Build command | `npm run build:cloud` |
| Deploy command | `npx wrangler deploy` |
| Worker name | `zhuji-worker`，与配置文件相同 |

保存并触发一次构建，确认状态成功。Cloudflare会在之后推送到生产分支时自动构建发布；D1继续通过配置中的数据库ID绑定。[Git集成文档](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/)、[构建设置文档](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)

如果你把整个比赛文件夹作为仓库根目录，Root directory才需要填`训练/练手项目/筑迹`；它是仓库内路径，不填`D:\...`这样的本机路径。本说明推荐只上传筑迹项目，方便设置。

## 9．以后怎样更新

**只改布局、颜色或交互：**修改文件后提交并推送，Cloudflare会自动发布。

```powershell
git add .
git commit -m "Update Zhuji interface"
git push
```

**改建筑资料、故事、图版说明：**先重新生成，再同步远程D1，然后提交并推送。原15本书内容在`book-data.js`；新增35本书内容在`data/architectures.json`的`reading`字段；图版元数据在`data/photo-credits.json`。

```powershell
npm run build:cloud
npx wrangler d1 execute zhuji-db --remote --file=./cloudflare/import.sql
git add .
git commit -m "Update Zhuji catalog"
git push
```

**更换图片文件：**替换`assets/photos/`里的对应文件，保留更新后的作者和许可说明，按上面的数据更新流程处理。

GitHub提交不会自动改写D1。本文把网站发布和数据同步分开：网站由Cloudflare Git构建自动发布，数据由你明确运行远程导入命令更新。

## 10．分享与自定义域名

先把首次发布得到的`workers.dev`地址发给别人测试。可用手机打开，并让另一台设备打开，检查首页、书页照片与筛选。

如果已有域名，可在Worker的`Settings → Domains & Routes`添加Custom Domain，按Cloudflare页面提示配置。网站地址就可改成类似`https://zhuji.example.com`。

当前50座资料体积较小，适合先做部署测试；实际可用额度和套餐以[Cloudflare D1配额](https://developers.cloudflare.com/d1/platform/limits/)及[Workers额度](https://developers.cloudflare.com/workers/platform/limits/)为准。

完成标准：GitHub能看到源码；Cloudflare有已发布的Worker；D1中有226条项目资料记录；公众网址能显示50座建筑并打开建筑书；数据接口能返回D1中的资料。
