# Claude Commerce Agents 中文本地化说明

这是 Anthropic 开源项目
[`anthropics/commerce-agents`](https://github.com/anthropics/commerce-agents)
的中文本地化派生版本，基于上游提交：

```text
fd4d59224ab96b43c6dc6888207c67b3bd5a24cf
```

原始英文项目说明请查看 [README.md](./README.md)，架构分析请查看仓库根目录的
[Anthropic 电商 Agent 项目架构](../anthropic-commerce-agent-architecture.md)。

## 本地化范围

当前版本重点本地化了零售演示，包括：

- 客户商城与商家管理后台的主要界面文案；
- 商品、订单、活动、商家消息等零售演示数据；
- 商品卡片、商品对比、结账摘要、订单状态等生成式界面组件；
- 商家经营指标、经营摘要、库存、商品目录和订单页面；
- 与中文界面和中文演示数据对应的测试。

Agent、Skills、Tools、Runtime 等代码结构和专业名称保持英文，以便与上游源码、官方文章和开发文档对应。

## 快速运行零售演示

环境要求：Python 3.11 或更高版本、Node.js 22。

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# 在本地 .env 中填写 ANTHROPIC_API_KEY；不要提交该文件
(cd examples && npm ci)
python scripts/run_demo.py retail --all
```

默认情况下，客户商城运行在 `3000` 端口，商家管理后台运行在 `3100` 端口，接口服务运行在 `8000` 端口。

## 安全边界

- 示例不会直接扣款；结账由宿主应用接管。
- Merchant Agent 的写操作先生成 Staged Change，经过真实审批界面批准后才会应用。
- 本仓库不包含真实凭据、本地 `.env`、运行记忆、虚拟环境、依赖目录或构建缓存。

## 版权与许可证

原项目版权归 Anthropic PBC 所有，并按 [Apache License 2.0](./LICENSE) 发布。
本地化修改属于派生作品，保留原始版权和许可证声明。修改内容与原始版本的差异不代表 Anthropic 官方版本或官方翻译。
