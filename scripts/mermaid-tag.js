// 标签插件：{% mermaid %}graph …{% endmermaid %}
// 构建端直接输出 <div class="mermaid">，浏览器端由注入的 mermaid 脚本渲染成图
// 注意：带 ends 的标签，回调签名是 (args, content)，args 是开标签参数数组
hexo.extend.tag.register(
  'mermaid',
  (args, content) => `<div class="mermaid">${String(content).trim()}</div>`,
  { ends: true, async: false }
);
