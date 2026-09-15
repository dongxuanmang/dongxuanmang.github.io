// 给 default 布局（文章与页面）注入 mermaid 渲染能力
// 配合 {% mermaid %} 标签插件：构建端输出 <div class="mermaid">，这里负责加载库并渲染
hexo.extend.injector.register(
  'head_end',
  () =>
    '<script src="/js/mermaid.min.js"></script>' +
    '<script>' +
    '(function () {' +
    '  function renderMermaid() {' +
    '    if (!document.querySelector(".mermaid") || typeof mermaid === "undefined") return;' +
    '    mermaid.initialize({ startOnLoad: true, securityLevel: "loose" });' +
    '  }' +
    '  if (document.readyState === "loading") {' +
    '    document.addEventListener("DOMContentLoaded", renderMermaid);' +
    '  } else {' +
    '    renderMermaid();' +
    '  }' +
  '})();' +
  '</script>',
  'default'
);
