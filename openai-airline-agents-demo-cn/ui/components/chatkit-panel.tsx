"use client";

import { ChatKit, useChatKit } from "@openai/chatkit-react";
import React from "react";

type ChatKitPanelProps = {
  initialThreadId?: string | null;
  onThreadChange?: (threadId: string | null) => void;
  onResponseEnd?: () => void;
  onRunnerUpdate?: () => void;
  onRunnerEventDelta?: (events: any[]) => void;
  onRunnerBindThread?: (threadId: string) => void;
};

const CHATKIT_DOMAIN_KEY =
  process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY ?? "domain_pk_localhost_dev";

export function ChatKitPanel({
  initialThreadId,
  onThreadChange,
  onResponseEnd,
  onRunnerUpdate,
  onRunnerEventDelta,
  onRunnerBindThread,
}: ChatKitPanelProps) {
  const chatkit = useChatKit({
    locale: "zh-CN",
    api: {
      url: "/chatkit",
      domainKey: CHATKIT_DOMAIN_KEY,
    },
    composer: {
      placeholder: "请输入您的问题…",
    },
    history: {
      enabled: false,
    },
    theme: {
      colorScheme: "light",
      radius: "round",
      density: "normal",
      color: {
        accent: {
          primary: "#2563eb",
          level: 1,
        },
      },
    },
    initialThread: initialThreadId ?? null,
    startScreen: {
      greeting: "您好，我是航空客服助手。有什么可以帮您？",
      prompts: [
        { label: "修改座位", prompt: "请帮我把座位改成 14C。" },
        {
          label: "航班状态",
          prompt: "请查询航班 FLT-123 的状态。",
        },
        {
          label: "错过转机",
          prompt:
            "我从巴黎飞往纽约的航班延误，错过了去奥斯汀的转机。托运行李也找不到了，我需要在纽约过夜，可以帮我吗？",
        },
      ],
    },
    threadItemActions: {
      feedback: false,
    },
    onThreadChange: ({ threadId }) => onThreadChange?.(threadId ?? null),
    onResponseEnd: () => onResponseEnd?.(),
    onError: ({ error }) => {
      console.error("ChatKit error", error);
    },
    onEffect: async ({ name }) => {
      if (name === "runner_state_update") {
        onRunnerUpdate?.();
      }
      if (name === "runner_event_delta") {
        onRunnerEventDelta?.((arguments as any)?.[0]?.data?.events ?? []);
      }
      if (name === "runner_bind_thread") {
        const tid = (arguments as any)?.[0]?.data?.thread_id;
        if (tid) {
          onRunnerBindThread?.(tid);
        }
      }
    },
  });

  return (
    <div className="flex flex-col h-[650px] md:h-full md:flex-1 bg-white shadow-sm border border-gray-200 border-t-0 rounded-xl">
      <div className="bg-blue-600 text-white h-12 px-4 flex items-center rounded-t-xl">
        <h2 className="font-semibold text-sm sm:text-base lg:text-lg">
          客户对话
        </h2>
      </div>
      <div className="flex-1 overflow-hidden pb-1.5">
        <ChatKit
          control={chatkit.control}
          className="block h-full w-full"
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
