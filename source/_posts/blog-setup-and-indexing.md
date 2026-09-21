---
title: 博客上线一周，Google 里搜不到我
date: 2026-09-21 22:30:00
categories:
  - 建站笔记
tags:
  - Hexo
  - GitHub Pages
  - SEO
  - IndexNow
---

> 你有没有遇到过：博客兴冲冲上线，过了一周，在搜索引擎里搜自己的内容——什么都搜不到。就像开了家店，装修完了才发现，连块路牌都没有。这篇是我这两天的排查和修复实录，如果你也用 Hexo + GitHub Pages，大概率用得上。

## 先说架构：这个博客是怎么搭的

站点的骨架很简单：

- **Hexo** 静态站点生成器 + landscape 主题，托管在 GitHub Pages（`dongxuanmang.github.io`）
- **双分支**：`main` 存源码（Markdown 文章 + 配置 + 主题脚本），`gh-pages` 存生成产物。`hexo deploy` 自动把 `public/` 推到 gh-pages，源码单独提交到 main——内容和产物分离，换电脑也能恢复
- 日常发布就两条命令：`hexo generate`（生成）+ `hexo deploy`（发布）
- 图表用 mermaid 自托管渲染（一个自定义标签脚本），架构图、流程图直接写在 Markdown 里

这套架构零成本、够用，但有个天然的短板：**它不会主动告诉任何人你的存在**。静态站没有推送机制，搜索引擎不来，你就等于不存在。

## 搜不到，是三层问题叠在一起

排查下来，从浅到深：

1. **技术层**：`sitemap.xml` 404、`robots.txt` 404。搜索引擎发现页面的方式是顺着链接爬，没有 sitemap，它只能靠猜
2. **通道层**：从没在 Google Search Console / Bing Webmaster Tools 提交过——搜索引擎压根不知道这个站存在
3. **权重层**：新站 + 零外链。没人链接你，爬虫就可能几周都不来；就算来了，新站还有观察期

中文内容还有个残酷的第四层：**百度对 github.io 的收录极差**（爬虫可达性问题），短期无解，直接放弃百度，把 Google 和 Bing 做好。

## 修复一：给爬虫一张地图

两步，十分钟：

- 装 `hexo-generator-sitemap` 插件，部署后 `/sitemap.xml` 列出全站每个页面的 URL 和最后更新时间
- `source/robots.txt` 声明站点地图位置，告诉所有爬虫「地图在这」

```text
User-agent: *
Allow: /

Sitemap: https://dongxuanmang.github.io/sitemap.xml
```

## 修复二：Google Search Console（踩了一个坑）

Search Console 是 Google 的站长后台，主动提交收录的官方通道。流程四步：添加资源（选「网址前缀」）→ HTML 文件验证 → 提交 sitemap → 用「网址检查」对首页点「请求编入索引」。

中间踩的坑值得单独写：**验证文件放进 Hexo 的 source/ 后，被 Hexo 当成文章渲染了**——原文件只有一行纯文本，Hexo 给它套上了完整的博客模板（title、meta、样式），而 Google 校验是逐字节比对的，直接失败。

解法是在 `_config.yml` 里声明跳过渲染：

```yaml
skip_render:
  - google*.html
  - robots.txt
```

重新部署一次通过。注意：**验证文件不能删**，删了验证状态会失效。

验证通过后，sitemap 提交 + 首页「请求编入索引」两步走完，Google 会把网址放进优先抓取队列——比干等爬虫快得多。

## 修复三：Bing，意外地顺滑

原本以为 Bing 要再来一遍注册验证，结果发现它支持**从 Google Search Console 一键导入**：用 Google 账号登录授权 → 自动发现已验证的站点 → 免验证导入 → sitemap 直接带入。导入完它已经发现了我全站 34 个 URL。

而且 Bing 抓取比 Google 快——导入当天就能看到页面状态是「Discovered」（已发现），点一下 Request indexing 就进了抓取队列。

## 修复四：IndexNow，发布即推送

前面三条都是「等搜索引擎来」，IndexNow 把方向反过来：**内容一更新，主动推送给搜索引擎**。这是 Bing 主导的开放协议（Yandex、Seznam 也认），三步：

1. 生成一个 32 位十六进制的 API key
2. 把 key 内容放进站点根目录的 `indexnow.txt`（证明你拥有这个站点）
3. 向 `api.indexnow.org` POST 一个 JSON（站点 + key + URL 列表）

我把它接进了 Hexo 的部署流程——写了个几十行的脚本，监听 `hexo deploy` 完成事件，读 sitemap 和上次推送记录做对比，**只推送新增或有更新的页面**，推送完记入缓存。以后日常发布什么都不用多做：

```text
hexo deploy
  → 部署完成
  → 对比 sitemap 与推送缓存，挑出有变化的 URL
  → POST 给 api.indexnow.org（HTTP 202 确认）
```

第一次跑是全量（34 个 URL 一次性入队），之后每次只推改动——比如这篇文章发布的同时，脚本正在把它推给 Bing。通常几小时到一天就能在 Bing 搜到。

实现上有个小坑：Hexo 的 `deployAfter` 是站点实例的事件，要用 `hexo.on('deployAfter')` 监听，而不是 `hexo.extend.filter.register`——文档里两者容易混。

## 修复后的预期

- **Bing**：几天内可见收录（导入当天 sitemap 状态已是 Success）
- **Google**：一到四周，新站有观察期
- 验证收录用 `site:dongxuanmang.github.io`，别用关键词搜——新站权重低，关键词排名要慢慢养
- **最有效的加速器是外链**：把文章同步发到掘金/知乎（哪怕只发摘要 + 原文链接），搜索引擎会更快、更频繁地来。比任何技巧都管用
- 持续更新本身就是信号——这个精读系列天然是个好节奏

## 参考来源

- [Google Search Console](https://search.google.com/search-console)——站点收录与搜索表现的官方控制台
- [IndexNow 协议](https://www.indexnow.org/documentation)——Bing 主导的即时推送协议，一次推送多引擎生效
- [hexo-generator-sitemap](https://github.com/hexojs/hexo-generator-sitemap)——Hexo 的 sitemap 生成插件
