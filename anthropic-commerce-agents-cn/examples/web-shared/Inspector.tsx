// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { MemoryFact, TraceEntry } from "./protocol";

interface ToolRow {
  tool: string;
  input?: string;
  result?: string;
  /** The head of a long result; `result` is then the "ok" summary. */
  excerpt?: string;
  isError?: boolean;
  status?: string;
  reason?: string;
  startedAt: number;
  durationMs?: number;
}

/** Pairs a tool's k-th call with its k-th result. */
function buildToolRows(entries: TraceEntry[]): ToolRow[] {
  const rows: ToolRow[] = [];
  const open = new Map<string, ToolRow[]>();
  for (const entry of entries) {
    if (entry.kind === "tool_call") {
      const row: ToolRow = { tool: entry.label, input: entry.detail, startedAt: entry.at };
      rows.push(row);
      open.set(entry.label, [...(open.get(entry.label) ?? []), row]);
    } else if (entry.kind === "tool_result") {
      const row = open.get(entry.label)?.shift();
      if (!row) continue;
      row.result = entry.detail;
      row.excerpt = entry.excerpt;
      row.isError = entry.isError;
      row.status = entry.status;
      row.reason = entry.reason;
      row.durationMs = Math.max(0, entry.at - row.startedAt);
    }
  }
  return rows;
}

const GATE_LABELS: Record<string, string> = {
  provenance: "来源校验",
  approval: "审批确认",
  guardrail: "安全护栏",
};

type RowStatus = "running" | "blocked" | "error" | "ok";

const GLYPH: Record<RowStatus, string> = { running: "◌", blocked: "◦", error: "✕", ok: "✓" };

const TONE: Record<RowStatus, string> = {
  running: "animate-pulse text-(--ink-soft)",
  blocked: "text-(--warn)",
  error: "text-(--danger)",
  ok: "text-(--ink-soft)",
};

const RESULT_TONE: Record<RowStatus, string> = {
  running: "",
  blocked: "bg-(--warn-soft) text-(--warn)",
  error: "bg-(--danger-soft) text-(--danger)",
  ok: "bg-(--well)/70 text-(--ink)",
};

function rowStatus(row: ToolRow): RowStatus {
  if (row.result === undefined) return "running";
  if (row.status === "blocked") return "blocked";
  return row.isError ? "error" : "ok";
}

function trailing(row: ToolRow, status: RowStatus): string {
  switch (status) {
    case "running":
      return "执行中…";
    case "blocked":
      return `已拦截 · ${GATE_LABELS[row.reason ?? ""] ?? "安全拦截"}`;
    case "error":
      return "出错";
    default:
      // The in-process mock backends answer in under a millisecond.
      return row.durationMs != null && row.durationMs < 1 ? "<1 ms" : `${Math.round(row.durationMs ?? 0)} ms`;
  }
}

function ToolCallRow({ row }: { row: ToolRow }) {
  const [open, setOpen] = useState(false);
  const status = rowStatus(row);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-1.5 text-left"
      >
        <span className={`w-3.5 shrink-0 text-center text-[12px] leading-none ${TONE[status]}`} aria-hidden>
          {GLYPH[status]}
        </span>
        {status === "ok" ? <span className="sr-only">完成</span> : null}
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-(--ink)">{row.tool}</span>
        <span className={`ml-auto shrink-0 text-right font-mono text-[11px] tabular-nums ${TONE[status]}`}>
          {trailing(row, status)}
        </span>
      </button>
      {open ? (
        <div className="mb-2 ml-5 space-y-2">
          {row.input ? <Detail label="输入" tone="bg-(--well)/70 text-(--ink)" text={row.input} /> : null}
          {row.excerpt !== undefined ? (
            <Detail label="结果（摘录）" tone={RESULT_TONE[status]} text={row.excerpt || "（空）"} />
          ) : row.result !== undefined ? (
            <Detail label="结果" tone={RESULT_TONE[status]} text={row.result || "（空）"} />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function Detail({ label, tone, text }: { label: string; tone: string; text: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-(--ink-soft)">{label}</div>
      <pre
        className={`panel-scroll mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded p-2 font-mono text-[11px] leading-relaxed ${tone}`}
      >
        {text}
      </pre>
    </div>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h3 className="text-[13px] font-semibold text-(--ink)">{children}</h3>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[13px] text-(--ink-soft)">{children}</p>;
}

/** The Activity panel. */
export function Inspector({
  turnCount,
  streaming,
  trace,
  memory,
  newMemoryKeys,
  memoryTitle = "记忆",
  onClose,
}: {
  turnCount: number;
  streaming: boolean;
  trace: TraceEntry[];
  memory: MemoryFact[];
  newMemoryKeys: ReadonlySet<string>;
  memoryTitle?: string;
  onClose: () => void;
}) {
  // null follows the newest reply; a number pins one.
  const [pinned, setPinned] = useState<number | null>(null);
  const turn = pinned ?? turnCount;
  const entries = useMemo(() => trace.filter((entry) => entry.turn === turn), [trace, turn]);
  const rows = useMemo(() => buildToolRows(entries), [entries]);
  const done = entries.find((entry) => entry.kind === "turn_complete");
  const working = streaming && turn === turnCount;
  const newCount = memory.filter((fact) => newMemoryKeys.has(fact.key)).length;
  const stepTo = (next: number) => setPinned(next >= turnCount ? null : Math.max(1, next));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stepButton = "rounded-md px-1.5 py-0.5 text-[13px] leading-none text-(--ink-soft) hover:text-(--ink) disabled:opacity-30";

  return (
    <>
      <div onClick={onClose} aria-hidden className="fixed inset-0 z-40 bg-black/30" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(94vw,400px)] flex-col border-l border-(--line) bg-(--card) shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-(--line) px-4 py-3">
          <div className="flex min-w-0 items-start gap-2">
            {turnCount > 1 ? (
              <span className="flex shrink-0 items-center gap-0.5" role="group" aria-label="回复">
                <button type="button" onClick={() => stepTo(turn - 1)} disabled={turn <= 1} aria-label="上一条回复" className={stepButton}>
                  ‹
                </button>
                <button type="button" onClick={() => stepTo(turn + 1)} disabled={turn >= turnCount} aria-label="下一条回复" className={stepButton}>
                  ›
                </button>
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="flex flex-wrap items-baseline gap-x-1.5 text-sm text-(--ink)">
                {turnCount === 0 ? (
                  <span className="font-bold">动态</span>
                ) : (
                  <>
                    <span className="font-bold">
                      第 {turn} 条回复
                      {turnCount > 1 ? <span className="font-normal text-(--ink-soft)"> / 共 {turnCount} 条</span> : null}
                    </span>
                    <span className="font-normal text-(--ink-soft)">
                      {working ? (
                        <span className="animate-pulse">· 处理中…</span>
                      ) : (
                        <>
                          · {rows.length} 步
                          {done?.elapsedMs && done.elapsedMs >= 100 ? ` · ${(done.elapsedMs / 1000).toFixed(1)}s` : ""}
                        </>
                      )}
                    </span>
                  </>
                )}
              </h2>
              {done?.detail ? (
                <p className="mt-0.5 font-mono text-[11px] text-(--ink-soft)">tokens {done.detail}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭动态面板"
            className="rounded-md px-2 py-0.5 text-lg leading-none text-(--ink-soft) hover:text-(--ink)"
          >
            ×
          </button>
        </div>

        <div className="panel-scroll flex-1 overflow-y-auto px-4 py-3">
          <section>
            <Heading>执行步骤</Heading>
            {turnCount === 0 ? (
              <Empty>还没有回复。</Empty>
            ) : rows.length === 0 ? (
              <Empty>{working ? "处理中…" : "这条回复没有工具调用。"}</Empty>
            ) : (
              <ul className="mt-1 divide-y divide-(--line)">
                {rows.map((row, index) => (
                  <ToolCallRow key={`${row.tool}-${index}`} row={row} />
                ))}
              </ul>
            )}
          </section>

          <section className="mt-5 border-t border-(--line) pt-4">
            <Heading>
              {memoryTitle}
              {newCount ? <span className="font-normal text-(--ink-soft)"> · 本次会话新增 {newCount} 条</span> : null}
            </Heading>
            {memory.length === 0 ? (
              <Empty>还没有保存任何记忆。</Empty>
            ) : (
              <ul className="mt-1 space-y-1">
                {memory.map((fact) => (
                  <li key={fact.key} className="text-[13px] leading-snug text-(--ink)">
                    {fact.value}
                    {newMemoryKeys.has(fact.key) ? <em className="ml-1.5 text-(--ink-soft)">新增</em> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
