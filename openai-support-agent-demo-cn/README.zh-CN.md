# OpenAI 人工协作客服 Demo · 中文版

面向人工客服的 AI 辅助工作台：客户发消息后，AI 查询资料和业务信息、生成建议回复及推荐操作；人工客服发送回复，并确认需要审核的动作。它不是无人值守客服，也不是 Klarna 源码。

## 来源与改动

- 上游：[openai/openai-support-agent-demo](https://github.com/openai/openai-support-agent-demo)，来源版本 `7ad1a7e8941caf429b3661444359e62a25a33823`。
- 保留上游 [README](README.md) 和 [许可证](LICENSE)，本目录为独立源码副本。
- 汉化界面、演示数据、11 篇客户 FAQ 和 11 篇客服知识文档，保留规则与文件名。
- 保留人工发送回复、推荐动作及审批交互；查询等部分工具可自动执行。
- 模型适配为服务端 Chat Completions，完整响应转换为界面事件，不是原生 Responses 流式输出。
- 检索使用本地 Markdown 关键词和中文同义词匹配，不是托管 File Search 或向量检索；无需初始化官方向量库。
- 包含 Next.js 异步路由参数和工具结果写入会话的兼容修复，并非仅翻译版本。

## 启动

需要 Node.js 22、npm，以及支持 Chat Completions 和 function tools 的模型服务。

1. 在本目录执行 `npm ci`。
2. 复制 `.env.example` 为 `.env.local`，本地填写 `COMPANY_AI_BASE_URL`、`COMPANY_AI_MODEL_NAME`、`COMPANY_AI_API_KEY`。Base URL 包含服务商要求的版本前缀，不包含 `/chat/completions`。
3. 执行 `npm run dev -- --hostname 127.0.0.1 --port 3200`。
4. 打开 <http://127.0.0.1:3200/>。

密钥仅在服务端使用，不提交 Git、不放入 `NEXT_PUBLIC_*`、不发到聊天里。无配置时模型调用报错，不伪造回复。协议兼容不代表行为一致，需要验证模型的工具调用与错误处理。

可选 SSH 模式：不设置 Base URL，配置 `COMPANY_AI_SSH_TARGET` 和 `COMPANY_AI_REMOTE_ENV_FILE`。使用既有 SSH 身份、远端 Node.js 和保存同名模型配置的远端环境文件；凭证不复制到本机。目标与路径仅允许可信维护者配置。

## 演示

1. 客户输入“退货政策是什么？”；客服视图查看建议回复和相关资料。
2. 客服点击发送，将建议回复发给客户；建议本身不等于已发送。
3. 查询订单，观察取消、退货或退款推荐动作，人工确认后查看模拟结果。
4. 请求创建工单，观察 `create_ticket` 的参数及结果，而不是凭 AI 的口头承诺判断是否执行。

业务接口为模拟，不影响真实订单、退款或工单。只监听本机，使用合成数据，不输入真实客户资料。分享版未在所有模型上验证，不作为生产交付包。

校验：`npx tsc --noEmit`、`node --test scripts/test-company-adapter.cjs`。

2026-10-12 安装校验时，`npm audit` 报告 37 项依赖告警（含 high/critical）。沿用上游锁文件，未执行可能破坏兼容性的强制升级；不要公开部署，使用前重新审计。
