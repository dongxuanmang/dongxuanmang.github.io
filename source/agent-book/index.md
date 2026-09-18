---
title: 《深入理解 AI Agent》精读
date: 2026-09-15 22:30:00
---

> 这是我的精读专题：逐章读李博杰的[开源书《深入理解 AI Agent：设计原理与工程实践》](https://github.com/bojieli/ai-agent-book)，**每一章写下我自己的理解和输出**——不是摘抄，是用我的话重新讲一遍，加上我的追问和实践。
全书围绕一个公式展开：

{% mermaid %}
graph LR
    LLM["🧠 LLM<br/>大脑"] --- CTX["👁️ 上下文<br/>眼睛"]
    CTX --- TOOLS["🤲 工具<br/>手脚"]
    TOOLS --- LLM
    AGENT["Agent = LLM + 上下文 + 工具"]
    style AGENT fill:#fff3cd,stroke:#b8860b
{% endmermaid %}

进生产环境后同一个系统改写为 **Agent = Model + Harness**，其中 Harness = 上下文管理 + 工具接口 + 约束 + 验证 + 纠正——**能跑的 Demo 与可靠产品之间的差距在 Harness，不在模型**。这句是全书题眼，也正好打在我后端工程的积累上。

## 读法约定

- 每章产出：一篇「我的理解」文章（按[我的写作方法](/2026/09/14/about-me/)：痛点开场、递进讲清、结尾给行动），跑通该章至少一个 Starter 实验
- 难度分级来自官方：🟢 入门 → 🔵 进阶 → 🟣 高级 → 🟡 工程 → 🔴 专家 → 🟠 应用
- 完成的章在下面清单里变成链接

## 章节清单与我的输出

### 构建篇（第 1–6 章）

| 章 | 主题 | 官方难度 | 我的理解与输出 |
| :--: | --- | :--: | :--: |
| 1 | AI Agent 入门：三要素、ReAct 循环、Harness 工程 | 🟢 | ✅ [能力边界由 Harness 决定](/2026/09/15/agent-book-ch1-harness/) · [模型即 Agent？循环只是搬到了服务端](/2026/09/16/agent-book-ch1-model-as-agent/) · [Harness 工程解决从 Demo 到生产的设计](/2026/09/16/agent-book-ch1-engineering/) |
| 2 | 上下文工程：KV Cache、提示工程、Skills、压缩（官方称全书最关键一章） | 🟢 | 🔄 [先导：模型的学习与上下文的构成](/2026/09/16/agent-book-ch2-context/) · [前面不能动，后面尽管加](/2026/09/17/agent-book-ch2-api-kv-cache/) · [KV Cache 的账，从 n² 到线性](/2026/09/18/agent-book-ch2-chat-template-kvcache/) |
| 3 | 用户记忆和知识库：记忆策略、RAG、知识图谱 | 🔵 | 📋 未开始 |
| 4 | 工具：MCP 协议、五类工具、主动工具发现 | 🔵 | 📋 未开始 |
| 5 | Coding Agent 与通用 Agent：代码是创造工具的元能力 | 🟣 | 📋 未开始 |
| 6 | 交互：语音、Computer Use、机器人（模态 × 时序） | 🟣 | 📋 未开始 |

### 提升篇（第 7–10 章）

| 章 | 主题 | 官方难度 | 我的理解与输出 |
| :--: | --- | :--: | :--: |
| 7 | Agent 的评估：环境、指标、LLM-as-a-Judge | 🟡 | 📋 未开始 |
| 8 | 模型后训练：SFT/RL、奖励设计、蒸馏 | 🔴 | 📋 未开始 |
| 9 | 持续进化：从轨迹学习，四种更新载体 | 🟠 | 📋 未开始 |
| 10 | 多 Agent 协作：A2A、失败模式、Agent 社会 | 🟠 | 📋 未开始 |

> 每读完一章，把「📋 未开始」替换成文章链接。实验代码在[书仓库](https://github.com/bojieli/ai-agent-book)按章安装（Python 3.11–3.13，支持 uv 复现环境）。

## 章节思维导图

> 每章一张，随精读进度一点点补。✅ = 已读并有输出，⬜ = 还没读到。

### 第 1 章 · AI Agent 入门（✅ 完结）

> 骨架是四个驱动问题；金色节点是全书题眼；边上的关系就是论证的推进方向。

{% mermaid %}
graph LR
    CH1["第 1 章<br/>AI Agent 入门"] --> Q1["① Agent 是什么？"]
    CH1 --> Q2["② 模型变强后<br/>框架还剩什么？"]
    CH1 --> Q3["③ 可靠性从哪来？"]
    CH1 --> Q4["④ 工程重心怎么迁移？"]

    Q1 --> A1["Agent = LLM + 上下文 + 工具"]
    A1 --> A11["LLM = 大脑<br/>行动前先内部推演"]
    A1 --> A12["上下文 = 眼睛<br/>五个部分"]
    A1 --> A13["工具 = 手脚<br/>通用组合 + 专用约束"]
    A12 --> A14["消融实验：组件不等价<br/>缺工具结果 → 就地编造"]
    Q1 --> B1["ReAct：想 → 做 → 看"]
    B1 --> B11["上下文 = 静态前缀 + 轨迹"]

    Q2 --> C1["模型即 Agent"]
    C1 --> C11["RL 内化的是决策"]
    C1 --> C12["执行留在模型外（Formula）"]
    C11 --> C13["循环没消失<br/>只是搬到服务端"]
    C12 --> C13
    C13 --> K1["模型越强<br/>Harness 越关键"]
    Q2 --> C2["苦涩的教训"]
    C2 --> C21["方向认同，节奏务实"]
    C21 --> K1

    Q3 --> D1["Harness 五要素"]
    D1 --> D11["能做事：Context + Tools"]
    D1 --> D12["不做错事：约束/验证/纠正"]
    D12 --> K2["Demo 与可靠产品的差距<br/>在 Harness，不在模型"]
    Q3 --> E1["护栏三层：上下文 → 执行 → 数据<br/>按被绕过难度排序"]
    Q3 --> F1["五个设计模式"]
    F1 --> F11["提议-审核：因为自审不可靠"]
    F1 --> F12["只增不改：可缓存可审计"]

    Q4 --> G1["五波演进，层层包含"]
    G1 --> G11["提示 ⊂ 上下文 ⊂ Harness<br/>⊂ Loop ⊂ Graph"]
    G11 --> G12["模型差异在缩小"]
    G12 --> K3["竞争优势转移<br/>到模型之外"]
    Q4 --> H1["编排：单次调用 → 工作流 → 自主"]
    H1 --> H11["自主必须设退出条件"]

    style CH1 fill:#d1e7dd,stroke:#198754
    style K1 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style K2 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style K3 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
{% endmermaid %}

### 第 2 章 · 上下文工程（🔄 进行中）

> 已读的分支长出洞见层；⬜ 分支留给后面的精读补全。

{% mermaid %}
graph LR
    CH2["第 2 章<br/>上下文工程 🔄"] --> Q1["① 上下文长什么样？✅"]
    CH2 --> Q2["② 循环何时停？✅"]
    CH2 --> Q3["③ 缓存省在哪？✅"]
    CH2 --> Q4["④ 思考草稿怎么传？✅"]
    CH2 --> Q5["⑤ 缓存的边界在哪？✅"]
    CH2 --> Q6["⑥ 往上下文里放什么？⬜"]

    Q1 --> A1["四种角色：system / user<br/>/ assistant / tool"]
    Q1 --> A2["无状态：每次送全量历史"]
    A2 --> A3["框架的核心工作<br/>= 管理 messages 列表"]

    Q2 --> B1["回复不带 tool_calls<br/>→ 退出循环"]

    Q3 --> C1["不缓存：累计 n²"]
    Q3 --> C2["KV Cache：单次推理内<br/>线性增长"]
    C2 --> C21["Prompt Cache：跨请求<br/>约 1/10 价格"]
    C2 --> C22["三铁律：前缀不动 / 只增不改 / 守格式"]
    C22 --> C23["改一个空格<br/>变动点后缓存全废"]
    C22 --> C24["自行拼接 → 偏离训练格式<br/>思考草稿被清空"]

    Q4 --> D1["Chat Template：JSON → token 流"]
    Q4 --> D2["R1 剥离历史思考<br/>每轮从零重推"]
    Q4 --> D3["V4 反转：带 tools<br/>必须原样回传"]
    D2 --> D4["思考 = 草稿纸<br/>收走就丢长程计划"]
    D3 --> D4

    Q5 --> E1["可编辑：改字段 ≈1% 算力<br/>前提是有思维链"]
    Q5 --> E2["可组合：RoPE 重定位拼接<br/>n² → 线性（研究阶段）"]
    Q5 --> E3["vLLM：PagedAttention 分页<br/>+ 连续批处理（延伸阅读）"]

    Q6 --> F1["提示工程 + 注入攻防 ⬜"]
    Q6 --> F2["Skills：渐进式披露 ⬜"]
    Q6 --> F3["状态栏：尾部注入状态 ⬜"]
    Q6 --> F4["上下文压缩 ⬜"]

    style CH2 fill:#fff3cd,stroke:#b8860b
    style A3 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style C22 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style D4 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
{% endmermaid %}

## 为什么值得精读

1. **对路**：我要做的就是生产级 agent，这本书的核心论点（差距在 Harness 不在模型）就是工程视角，和我的后端底子同构
2. **能动手**：每章配可复现实验，正好用 [学习路径](/learning/) 里「自己造」的阶段做练手场
3. **有对照**：读的时候带着问题——我此前理解的 agent 开发和书里讲的差在哪？每篇笔记都会写这个对照
