'use strict';

/**
 * IndexNow 推送：hexo deploy 完成后，对比 sitemap 与上次推送记录，
 * 把新增或有更新的页面 URL 批量推送给 indexnow.org（Bing/Yandex 等）。
 *
 * - key 文件：source/indexnow.txt（内容 = key），部署后以
 *   https://dongxuanmang.github.io/indexnow.txt 可访问
 * - 缓存：indexnow-cache.json 记录 URL -> lastmod，避免重复推送
 */

const fs = require('fs');
const path = require('path');

const HOST = 'dongxuanmang.github.io';
const KEY_LOCATION = `https://${HOST}/indexnow.txt`;
const CACHE_FILE = path.join(__dirname, '..', 'indexnow-cache.json');
const SITEMAP = path.join(__dirname, '..', 'public', 'sitemap.xml');
const KEY_FILE = path.join(__dirname, '..', 'source', 'indexnow.txt');

function parseSitemap(xml) {
  const entries = [];
  const blocks = xml.split('<url>').slice(1);
  for (const block of blocks) {
    const loc = (block.match(/<loc>(.*?)<\/loc>/) || [])[1];
    const lastmod = (block.match(/<lastmod>(.*?)<\/lastmod>/) || [])[1] || '';
    if (loc) entries.push({ loc: loc.trim(), lastmod: lastmod.trim() });
  }
  return entries;
}

function shouldRun() {
  // 仅在真正的部署流程后运行（hexo deploy），generate/server 不触发
  if (!fs.existsSync(SITEMAP) || !fs.existsSync(KEY_FILE)) return false;
  const key = fs.readFileSync(KEY_FILE, 'utf8').trim();
  return key.length === 64;
}

hexo.on('deployAfter', async () => {
  if (!shouldRun()) {
    hexo.log.warn('[indexnow] 缺少 key 文件或 sitemap，跳过推送');
    return;
  }
  const key = fs.readFileSync(KEY_FILE, 'utf8').trim();
  const entries = parseSitemap(fs.readFileSync(SITEMAP, 'utf8'));

  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch (e) { cache = {}; }
  }

  const changed = entries.filter((e) => cache[e.loc] !== e.lastmod);
  if (changed.length === 0) {
    hexo.log.info('[indexnow] 无新增或更新页面，跳过推送');
    return;
  }

  const urlList = changed.map((e) => e.loc);
  hexo.log.info(`[indexnow] 推送 ${urlList.length} 个 URL 到 IndexNow`);

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: KEY_LOCATION,
        urlList,
      }),
    });
    if (res.ok || res.status === 202) {
      hexo.log.info(`[indexnow] 推送成功（HTTP ${res.status}），${urlList.length} 个 URL`);
      const next = { ...cache };
      for (const e of changed) next[e.loc] = e.lastmod;
      fs.writeFileSync(CACHE_FILE, JSON.stringify(next, null, 2));
    } else {
      hexo.log.warn(`[indexnow] 推送未确认（HTTP ${res.status}）：${await res.text()}`);
    }
  } catch (err) {
    hexo.log.warn(`[indexnow] 推送失败，不影响部署结果：${err.message}`);
  }
});
