// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { AssistantPanel as PanelShell, type MerchantChat, type Prefill } from "web-shared";
import type { StagedChange } from "@/lib/types";
import GenerativeBlock from "./generative";

const COPY = {
  title: "商家智能助手",
  intro: "可以询问经营表现、库存、定价或营销活动。",
  starters: [
    "今天有哪些事项需要我处理？",
    "本周销售表现与上周相比怎么样？",
    "哪些商品的库存快不足了？",
    "哪些滞销商品适合降价？",
  ],
  label: "给商家智能助手发消息",
  placeholder: "询问销售、库存、定价…",
  approvalNote: "所有变更都由你批准",
  activityLabel: "活动记录",
  fullScreenLabel: "全屏",
  exitFullScreenLabel: "退出全屏",
  hideLabel: "隐藏智能助手",
};

export default function AssistantPanel({
  chat,
  prefill,
  onPrefill,
  ...shell
}: {
  chat: MerchantChat<StagedChange>;
  prefill: Prefill | null;
  onPrefill: (text: string) => void;
  newMemoryCount: number;
  onOpenActivity: () => void;
  onClose: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <PanelShell
      chat={chat}
      copy={COPY}
      prefill={prefill}
      renderBlock={(segment) => (
        <GenerativeBlock
          block={segment.block}
          status={segment.status}
          onChangeAction={chat.actOnChange}
          onPrefill={onPrefill}
        />
      )}
      {...shell}
    />
  );
}
