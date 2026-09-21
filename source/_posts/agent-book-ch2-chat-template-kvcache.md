---
title: Agent 精读（六）：KV Cache 的账，从 n² 到线性
date: 2026-09-18 21:30:00
categories:
  - Agent 精读
tags:
  - AI Agent
  - KV Cache
  - vLLM
  - 读书笔记
---

> 这是[《深入理解 AI Agent》精读专题](/agent-book/)的第六篇，继续第 2 章。读的是[李博杰的开源书](https://github.com/bojieli/ai-agent-book)第二章的 Chat Template、思考链保留策略与 KV Cache 深水区——外加一段书外的延伸：vLLM 怎么管显存。
> 本章思维导图见 [专题页 · 章节思维导图](/agent-book/#章节思维导图)

## Chat Template：把 JSON 翻译成 token

上一篇说「遵守 API 规范」，这一篇补上原理。API 层面的结构化 JSON 消息，模型并不能直接吃——中间有一层 **Chat Template（聊天模板）**，把它格式化成模型可以接受的 token 流：用特殊标记（如 `<|im_start|>system`）划分每条消息的边界和角色。原文的比喻是信封格式：API 消息是信的内容，Chat Template 规定怎么在信封上写寄件人、收件人；不同模型家族用不同的信封（Qwen、Llama、Gemma 各不相同），API 服务端（vLLM、Ollama 等）自动完成转换。

理解了这层，上一篇的第三条铁律就有了着落：自行拼接消息之所以危险，是因为它绕过了信封——把工具结果当 user 消息发，Chat Template 就会误判「用户换了话题」，顺手清空思考草稿。

## 思考链的保留：R1 剥离，V4 反转

多轮对话里怎么处理历史的思维链？DeepSeek 的策略演进是个好案例：

- **R1 时代：剥离全部历史思考**。多轮对话只回传 `content`，推理过程（`reasoning_content`）忽略——因为 R1 训练时历史 CoT 从不出现在输入里，塞回去属于分布外输入，反而可能干扰输出。代价是：模型每轮都要从零重新思考，容易重复犯错、丢失长程计划，Agent 场景下错误概率更高。
- **V4 时代：彻底反转**。只要请求携带 `tools` 参数，两个 user 消息之间的每条 assistant 消息都必须原样回传 `reasoning_content`，否则 API 直接返回 400 错误。Agent 天然携带 tools，这条强制规则躲不开——Kimi K2、GLM-5 也采用同样的协议。

方向从「省 token」转向「保状态」：中间思考承载着「为什么调这个工具、排除了哪些假设」——草稿纸收走，推理就从零再来。

## KV Cache 的账：n² 与线性

不使用缓存时，每生成一个新 token，都要把整个前缀从头前向计算一遍：前缀长到 N 个 token 时要算 N 组 K、V，**累计计算量与 N² 成正比**。几十轮工具调用的 Agent 任务，代价比想像中大得多。

KV Cache 的做法是：每个 token 的 K、V 只在第一次进入上下文时计算一次，之后留在缓存里。新 token 只需遍历前缀的缓存 K、V 算注意力——**计算量随上下文长度线性增长**。省掉的是历史 token 的 K/V 重算；但注意它不是免费午餐：每个新 token 的注意力仍要遍历全部缓存，长上下文解码依然线性变慢，KV Cache 的显存与带宽正是推理瓶颈。

## 缓存的未来：可编辑、可组合（研究前沿）

书里有一节标着「深水区选读」，讲了一个反直觉的发现：模型在 prefill 阶段其实在「做笔记」——读到「用户所在城市：北京」时，不是原封不动缓存这个字段，而是把「这意味着什么」的结论写进了下游每层的 KV 状态。测量发现，字段自己的那几个 token 的 KV，对最终决策的贡献往往不到 1%。

这打开了两种原本不可能的操作：

- **编辑**：改掉一个字段后，只要有显式思考链，改动能顺着已缓存的思考传播下去——用约 1% 的算力得到与整段重算一致的结果（前提是有 CoT；没有思考路径，孤立改字段会被忽略）。
- **组合**：把一段预计算的「技能」缓存，通过旋转位置编码（RoPE）重定位后直接拼接进另一段上下文——从 O(L²) 的重算降到 O(L) 的拼接。

论文在 vLLM 上实现后：首 token 延迟（p90）最多降低数十倍到数百倍，前缀缓存命中率约 98.5%，输出与逐字重算在决策上完全一致。对 Agent 的意义：换一批工具、更新一个记忆字段、注入一条新状态——也许不必每轮都推倒重来，「上下文可变、但缓存收益还在」。**这仍属研究阶段**，今天生产系统里，上一篇那三条铁律依然是默认原则。

## 延伸阅读：vLLM 怎么管显存（书外）

这一节是书外延伸，来自 vLLM 的论文与博客（参考见文末）。缓存省计算，vLLM 解决的是另一个问题——**KV Cache 放哪**。

vLLM（virtual LLM，名字就来自它借用的操作系统虚拟内存思想）的核心技术是 **PagedAttention**：像操作系统用分页管理内存一样，把 KV Cache 切成固定大小的 block 按需分配。传统做法要为每个请求预留一整段连续显存，碎片和预留浪费让实际利用率只有 20%–40%；分页之后浪费降到 4% 以下，同等显存能装下更多并发序列，吞吐提升 2–4 倍。

第二个优势是**连续批处理（continuous batching）**：不等整批请求全部完成才释放——每一步解码后，完成的请求立即退出、新请求立即插入，GPU 始终满载。配合针对 RoPE 的 kernel 融合（把分页导致的非连续显存读取与旋转位置编码的正余弦计算融合在一个 CUDA kernel 里，减少 HBM 与片上 SRAM 之间的搬运），把位置编码这一步从 I/O 瓶颈变成顺手的计算。

Agent 的上下文动辄几十轮、每轮都在增长——vLLM 这类推理引擎的显存管理，就是 KV Cache 的账最终落地的地方。

## 上下文组织的三个线索

缓存讲完，第 2 章剩下的问题是：往上下文里放什么、怎么组织。书里给了三条相对独立的线索，后面几节（也是我接下来要读的）就沿这三条展开：

1. **提示工程 + 提示注入 + 动态提示词**：系统提示词怎么写、怎么防外部内容劫持上下文；提示词越写越长后，用 Agent Skills 渐进式披露按需加载——这是第一章设计模式「渐进式披露」的落地。
2. **Agent 状态栏**：在上下文末尾持续注入动态元信息（任务进度、工具调用计数），让模型随时「瞥一眼」就感知运行状态——对应「只增不改」，追加在尾部不破坏缓存。
3. **上下文压缩**：上下文膨胀后怎么做减法——什么时候压缩、怎么压缩、压缩如何与 KV Cache 共存。

## 下一步

- 沿三条线索继续：提示工程与注入攻防 → Agent Skills → 状态栏 → 压缩
- `kv-cache`、`context-compression` 实验找时间跑

## 参考来源

- [《深入理解 AI Agent：设计原理与工程实践》第 2 章「上下文工程」](https://github.com/bojieli/ai-agent-book/blob/main/book/chapter2.md)，李博杰著，GitHub 开源——本篇覆盖「Chat Template」「KV Cache 的原理与约束」「KV Cache 未必是一次性的」与三条线索的总起
- [Models Take Notes at Prefill: KV Cache Can Be Editable and Composable](https://arxiv.org/abs/2606.17107), Li, Bojie, arXiv:2606.17107——「可编辑、可组合」一节的研究论文
- [vLLM: Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)，arXiv:2309.06180——PagedAttention 与连续批处理的原始论文
- [vLLM 官方博客：PagedAttention 简介](https://vllm.ai/blog/2023-06-20-vllm)——分页注意力与虚拟内存类比的入门读法
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)，arXiv:1706.03762——Transformer 与注意力机制的源头；KV、Query、Value 的原初定义
