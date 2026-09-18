---
title: 《深入理解 AI Agent》精读
date: 2026-09-15 22:30:00
---

# 《深入理解 AI Agent》精读

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

{% mermaid %}
graph LR
    CH1["第 1 章<br/>AI Agent 入门"] --- A["三要素"]
    CH1 --- B["ReAct 循环"]
    CH1 --- C["学习机制"]
    CH1 --- D["模型即 Agent"]
    CH1 --- E["Harness 工程"]
    CH1 --- F["工程演进五波"]
    CH1 --- G["编排模式"]
    CH1 --- H["五个设计模式"]
    CH1 --- I["护栏与安全"]
    A --- A1["LLM 大脑"]
    A --- A2["上下文 眼睛"]
    A --- A3["工具 手脚"]
    B --- B1["思考→行动→观察"]
    C --- C1["上下文适应"]
    C --- C2["外部产物"]
    C --- C3["参数更新"]
    D --- D1["RL 内化决策"]
    D --- D2["循环搬到服务端"]
    E --- E1["Context 上下文"]
    E --- E2["Tools 工具"]
    E --- E3["Constrain 约束"]
    E --- E4["Verify 验证"]
    E --- E5["Correct 纠正"]
    F --- F1["提示→上下文→Harness→Loop→Graph"]
    G --- G1["工作流"]
    G --- G2["自主 Agent"]
    G --- G3["混合"]
    H --- H1["提议-审核"]
    H --- H2["渐进式披露"]
    H --- H3["只增不改"]
    H --- H4["边界集+保留集"]
    H --- H5["最小diff+可回滚"]
    I --- I1["上下文层"]
    I --- I2["执行层"]
    I --- I3["数据层"]
    style CH1 fill:#d1e7dd,stroke:#198754
{% endmermaid %}

### 第 2 章 · 上下文工程（🔄 进行中）

{% mermaid %}
graph LR
    CH2["第 2 章<br/>上下文工程"] --- A["API 消息结构 ✅"]
    CH2 --- B["ReAct 终止 ✅"]
    CH2 --- C["KV Cache ✅"]
    CH2 --- D["Chat Template ✅"]
    CH2 --- E["思考链保留 ✅"]
    CH2 --- F["注意力可视化 ✅"]
    CH2 --- G["提示工程 ⬜"]
    CH2 --- H["提示注入攻防 ⬜"]
    CH2 --- I["Agent Skills ⬜"]
    CH2 --- J["状态栏 ⬜"]
    CH2 --- K["上下文压缩 ⬜"]
    A --- A1["四种角色"]
    A --- A2["无状态调用"]
    C --- C1["前缀不变性"]
    C --- C2["Prompt Cache"]
    C --- C3["三铁律"]
    E --- E1["R1 剥离 → V4 回传"]
    F --- F1["两个三角形"]
    G --- G1["系统提示词"]
    G --- G2["工具定义设计"]
    I --- I1["渐进式披露"]
    J --- J1["尾部元信息"]
    K --- K1["分层压缩"]
    K --- K2["隔离优于压缩"]
    style CH2 fill:#fff3cd,stroke:#b8860b
{% endmermaid %}

## 为什么值得精读

1. **对路**：我要做的就是生产级 agent，这本书的核心论点（差距在 Harness 不在模型）就是工程视角，和我的后端底子同构
2. **能动手**：每章配可复现实验，正好用 [学习路径](/learning/) 里「自己造」的阶段做练手场
3. **有对照**：读的时候带着问题——我此前理解的 agent 开发和书里讲的差在哪？每篇笔记都会写这个对照
