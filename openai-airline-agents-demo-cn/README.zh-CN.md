# OpenAI 航空客服 Demo · 中文版

旅客直接与 AI 对话，按需求转接至航班信息、预订取消、座位、补偿或 FAQ 能力。左侧是运行观测面板，不是人工客服审批工作台。

## 来源与改动

- 上游：[openai/openai-cs-agents-demo](https://github.com/openai/openai-cs-agents-demo)，来源版本 `bd7bfca0f5abf50529370814c3e7c88542011925`。
- 保留上游 [README](README.md) 和 [许可证](LICENSE)，本目录为独立源码副本，不是 Klarna 源码。
- 汉化界面、进度与拒绝提示，保留 Agent 身份、工具名称、参数和模拟规则。
- 保留 Python Agents SDK 循环、handoff 和 guardrails；业务与安全分类调用均使用配置的兼容模型。
- 增加窄屏布局与新版 SDK handoff 回调兼容处理。
- SSH 模式将完整结果包装为 SDK 流式事件，不是真正逐 token 流式；直接模式采用 SDK 的 Chat Completions 调用，需要模型支持相应协议。

## 启动

需要 Python 3.13、Node.js 22、npm，以及支持 Chat Completions、工具调用和 SDK 结构化输出的模型服务。

在 `python-backend`：

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

复制该目录 `.env.example` 为 `.env`，本地填写模型配置。Base URL 不包含 `/chat/completions`。启动：

```bash
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --env-file .env
```

另一终端在 `ui`：

```bash
npm ci
npm run dev:next -- --hostname 127.0.0.1 --port 3300
```

打开 <http://127.0.0.1:3300/>。界面依赖 OpenAI ChatKit CDN，需网络可达。密钥仅留在后端环境，不提交 Git 或传给浏览器。中文提问可引导中文回复，工具原始结果仍可能为英文。

可选 SSH 模式：不设置 Base URL，配置 `COMPANY_AI_SSH_TARGET`、`COMPANY_AI_REMOTE_ENV_FILE`，使用既有 SSH 身份及远端 Node.js。同名模型配置保存在远端环境文件，目标和路径仅允许可信维护者配置。

## 测试流程

不同场景建议新建对话，避免旧行程干扰。

| 流程 | 示例输入 |
| --- | --- |
| 航班查询 | 请查询航班 FLT-123 的状态，用中文回复。 |
| 修改座位 | 请把我的座位改成 14C。 |
| 延误改签 | 我从 Paris 经 New York 去 Austin，PA441 延误导致错过 NY802，请查询并寻找替代航班。 |
| 预订替代航班 | 接上一步：我选择 NY950，请帮我改签。 |
| 补偿 | 预订号 IR-D204，延误导致错过转机，请帮我申请住宿、餐饮和补偿。 |
| 取消 | 请确认取消预订 LL0EZ6 对应的 FLT-123 航班。 |
| FAQ | 飞机上有 Wi-Fi 吗？ |

## 限制与架构借鉴

- 仅固定模拟行程，无真实用户订单或实时航空系统；日期为历史测试数据。未知航班可能返回默认准点信息。
- 行程初始化与部分 FAQ 仍匹配英文关键词；延误测试保留英文城市名，不能声称业务工具已全面支持中文。
- `display_seat_map` 仅返回字符串标记，前端未接通座位图组件。AI 说已展示不代表实际展示；可以直接指定座位测试修改。
- 会话状态在内存中，重启丢失；未加入生产鉴权、持久化、可靠队列或真实业务审批。
- 换模型后工具、分流、护栏行为需要重新评估。只监听本机、使用合成资料，不能用于真实预订。

值得借鉴的是显式业务上下文、交接沿用状态、类型化工具和运行轨迹；生产化还需授权、持久任务、幂等对账、受控交接、审计及可验证完成，不能机械复制其角色划分。

校验：前端 `npx tsc --noEmit`；后端 `python3 -m compileall -q airline company_model.py server.py`。依赖沿用上游范围配置，生产化另行锁定版本并测试模型兼容性。

2026-10-12 安装校验时，前端 `npm audit` 报告 22 项依赖告警（含 high/critical）。未执行强制升级；不要公开部署，使用前重新审计。
