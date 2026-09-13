# FDE 分享

这个仓库用于持续整理和公开分享 FDE、企业 Agent 与 AI Native 落地相关的研究、架构和可运行案例。

## 当前内容

### Anthropic 电商 Agent 中文本地化版

- [中文架构与文章要点](./anthropic-commerce-agent-architecture.md)
- [本地化项目源码](./anthropic-commerce-agents-cn/)
- [本地化说明与运行入口](./anthropic-commerce-agents-cn/README.zh-CN.md)

本地化项目基于 Anthropic 的开源项目
[`anthropics/commerce-agents`](https://github.com/anthropics/commerce-agents)，对应上游提交
`fd4d59224ab96b43c6dc6888207c67b3bd5a24cf`。

项目主要演示两种角色 Agent：

- Shopping Agent：面向客户，处理商品搜索、比较、购物车、订单与客户服务。
- Merchant Agent：面向员工，处理经营分析、商品目录、库存、定价、促销和营销活动。

中文化主要用于研究、演示和中文内容讲解。架构文档将文章观点与源码实现边界分开标注，避免把分析推断当作原文结论。

## 安全说明

- 仓库不包含真实 API Key、私钥、访问令牌、个人环境变量或本地运行记忆。
- `.env.example` 只保留变量名称和空白示例值。
- 虚拟环境、依赖目录、构建产物、缓存和编辑器配置均不会提交。
- 请勿把真实凭据写入源码；本地运行时使用被 `.gitignore` 排除的 `.env` 或操作系统密钥管理方案。

## 上游版权与许可证

`anthropic-commerce-agents-cn/` 是基于 Anthropic Commerce Agents 的派生版本，保留上游版权声明和 Apache License 2.0 许可证。原项目版权归 Anthropic PBC 所有。

本仓库中的相关代码、翻译和文档按各目录内声明的许可证使用。
