---
title: Agent 精读（十一）：第 3 章知识图谱——用户记忆和知识库
date: 2026-09-24 19:00:00
categories:
  - Agent 精读
tags:
  - AI Agent
  - 知识图谱
  - 读书笔记
---

> 这是[《深入理解 AI Agent》精读专题](/agent-book/)的第十一篇，也是这个专题的一个新尝试：**每一章维护一篇知识图谱页**，把该章核心知识点画成一张图，并和这一章的精读笔记互相链接。它不是一次性的文章，而是**活的页面**——每读完一部分、每发一篇笔记，图谱就长一块、关联就多一条。当前状态：第 3 章前半部分（用户记忆系统）✅ 已读并成文；RAG 基础（分块、稠密/稀疏检索、混合检索）✅ 已读并成文；结构化索引往后的部分 ⬜ 未读。

![第 3 章知识脉络](/images/agent-book/ch3-memory-scale.svg)

## 第 3 章这张图怎么读

绿色节点是**已读并有笔记关联**的部分，点进对应笔记能看到展开的论述；灰色节点是还没读到的部分，等精读推进后点亮。金色节点是我认为**面试级的核心考点**。

{% mermaid %}
graph TB
    CH3["第 3 章<br/>用户记忆和知识库"] --> MEM["用户记忆（个体尺度）✅"]
    CH3 --> KB["知识库（群体尺度）⬜"]
    CH3 --> BASE["共享底层：检索技术 ✅"]

    MEM --> E1["评估两把尺"]
    E1 --> E11["LoCoMo：被动问答基准<br/>五类 QA + 摘要 + 多模态"]
    E1 --> E12["三层次框架：基础回忆<br/>→ 多会话检索 → 主动服务"]
    E12 --> E13["主动服务 = 无指令的预警与整合<br/>被动 QA 装不下它"]

    MEM --> W1["记忆三问（正交）"]
    W1 --> W11["存在哪里：轨迹=流水账<br/>长期记忆=档案，业务状态=任务阶段"]
    W1 --> W12["怎么存：四种格式光谱"]
    W1 --> W13["存什么：情景 / 语义 / 程序"]

    W12 --> F1["Simple Notes：O(1) 便宜<br/>✗ 关联丢失"]
    W12 --> F2["Enhanced Notes：语义完整<br/>✗ 冗余 · 难更新"]
    W12 --> F3["JSON Cards：部分更新<br/>✗ 刚性分类"]
    F3 --> F31["周末写 Python：三维度明确<br/>问题在容器不在信息"]
    W12 --> F4["Advanced：backstory / person<br/>/ relationship 消歧"]
    F4 --> F41["母亲高血压例子：<br/>没有 person 字段，家人信息会混"]
    F1 --> MIX["混合模式：关键少量 → Advanced<br/>大量非关键 → Simple"]
    F2 --> MIX
    F4 --> MIX

    MEM --> CODE["可执行代码（User as Code）"]
    CODE --> C1["文本天花板：聚合 / 冲突检测<br/>/ 约束执行靠 LLM 心算"]
    C1 --> C2["心算的病：不确定 · 不审计 · 会漏"]
    CODE --> C3["带类型状态 + 规则函数"]
    CODE --> C4["预写日志 + 检查点：<br/>日志是真相源，状态可重建"]
    C4 --> C41["反例 Mem0 v2：直接 UPDATE<br/>错一次不可逆丢历史"]
    CODE --> C5["判据：带类型的数据<br/>+ 可判定的规则"]
    CODE --> C6["计算时机：使用时 → 写入时<br/>算得准是副产品，一定算是本质"]
    C6 --> GOLD["主动服务的工程地基"]

    KB --> KB1["RAG 基础 ✅：分块三类 / 稠密稀疏<br/>/ 倒排索引 · BM25 / 混合检索"]
    KB --> KB2["待读：结构化索引 RAPTOR · GraphRAG<br/>/ 文件系统范式 / 智能体化 RAG<br/>/ 上下文感知检索 / 深度知识提取"]

    KB1 --> R1["两条腿：词有倒排（精确）<br/>向量有图（近似）"]
    KB1 --> R2["倒排索引 = 按词建二级索引<br/>BM25 = 稀有度 + 饱和 + 长度归一"]
    KB1 --> R3["ANN：ANNOY 树静态 / HNSW 图动态<br/>跳表思想：顶层大步跳"]
    KB1 --> R4["混合：RRF 扔分只看排名<br/>→ 跨编码器重排 top50"]

    style CH3 fill:#d1e7dd,stroke:#198754
    style MEM fill:#d1e7dd,stroke:#198754
    style KB fill:#d1e7dd,stroke:#198754
    style BASE fill:#d1e7dd,stroke:#198754
    style GOLD fill:#fff3cd,stroke:#b8860b
    style E13 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style F31 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style C41 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style GOLD fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style R1 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style R2 fill:#fff3cd,stroke:#b8860b,stroke-width:2px
    style KB1 fill:#d1e7dd,stroke:#198754
    style KB2 fill:#f1f3f5,stroke:#adb5bd,stroke-dasharray:5 4
{% endmermaid %}

## 节点 → 笔记关联

每点亮一块，就在这里挂上对应的精读笔记——图谱管全局，笔记管展开。

### 用户记忆系统 ✅

- **评估两把尺**（LoCoMo vs 三层次框架，主动服务为什么被动 QA 装不下）→ [记住一个用户，四种存法，和一次跳出文本](/2026/09/24/agent-book-ch3-memory-formats/) 「先立尺子」一节
- **记忆三问**（三套正交体系，轨迹 vs 长期记忆）→ 同上「记忆三问」一节
- **四种存储格式**（修 bug 链、刚性分类、消歧、母亲高血压验收例子）→ 同上「四种存法，是一条修 bug 链」一节
- **可执行代码**（心算困境、预写日志+检查点、计算时机）→ 同上「第五种存法：把记忆写成代码」一节
- **记忆框架案例 / 压缩整理 / 隐私脱敏** ⬜ 已过目未成文，留待和 RAG 一起收进下篇

### 知识库（RAG）🔄 基础已读

- **RAG 三段流程 + 分块三类** → [词有倒排，向量有图——RAG 检索的两条腿](/2026/09/28/agent-book-ch3-rag-retrieval/) 「先分块」一节
- **稠密路线**（嵌入演进、余弦、ANNOY/HNSW、跳表思想、近似代价）→ 同上「稠密路线」一节
- **稀疏路线**（倒排索引=按词建二级索引、BM25 两修正、稀疏精确稠密近似）→ 同上「稀疏路线」一节
- **混合检索**（互补盲区、RRF、双编码器 vs 跨编码器）→ 同上「混合检索」一节
- **三个检索指标**（recall@k / MRR / nDCG）⬜ 未读透，待补
- **待读**：结构化索引（RAPTOR/GraphRAG）、文件系统范式、知识更新、智能体化 RAG、上下文感知检索、深度知识提取、多模态记忆

## 更新日志

- 2026-09-28：点亮「RAG 基础」区块（两条腿、倒排索引与 BM25、ANN、混合检索），关联笔记第十二篇
- 2026-09-24：页面创建。点亮「用户记忆系统」区块，关联笔记第十篇；RAG 区块留白
