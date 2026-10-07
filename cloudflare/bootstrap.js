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