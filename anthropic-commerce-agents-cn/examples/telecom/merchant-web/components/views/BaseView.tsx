// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useMemo } from "react";
import { AskButton, formatDayMonth, formatMoney, formatNumber, formatRate, KindIcon, MiniBar, Notice, PageHeader, Panel, Pill, Skeleton, Sparkline, useResource } from "web-shared";
import { fetchBase } from "@/lib/api";
import type { BaseOverviewResponse, Cohort, PlanMixRow, PlanWeek } from "@/lib/types";

function series(weeks: PlanWeek[] | undefined, key: "subscribers" | "churn_rate_pct"): number[] {
  return (weeks ?? []).map((week) => week[key]).filter((value): value is number => value != null);
}

function PlanMixTable({ data, onAskAssistant }: { data: BaseOverviewResponse; onAskAssistant: (text: string) => void }) {
  // Staged promotion windows keyed by plan, so a row can flag a pending promo.
  const stagedByPlan = useMemo(() => {
    const map = new Map<string, { name?: string | null; starts?: string | null; ends?: string | null }>();
    for (const window of data.staged_windows ?? []) {
      for (const listingId of window.listing_ids) {
        if (!map.has(listingId)) map.set(listingId, window);
      }
    }
    return map;
  }, [data.staged_windows]);

  return (
    <div className="panel-scroll @container overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-[12px] font-semibold text-(--ink-soft)">
            <th className="py-2.5 pl-[18px] pr-3 font-semibold">Plan</th>
            <th className="px-3 py-2.5 text-right font-semibold">Lines</th>
            <th className="hidden px-3 py-2.5 font-semibold @4xl:table-cell">Share of base</th>
            <th className="px-3 py-2.5 text-right font-semibold">Churn</th>
            <th className="hidden px-3 py-2.5 text-right font-semibold @3xl:table-cell">ARPU</th>
            <th className="px-3 py-2.5 text-right font-semibold">Margin / line</th>
            <th className="hidden px-3 py-2.5 font-semibold @2xl:table-cell">13-week lines</th>
            <th className="py-2.5 pl-3 pr-[18px]" aria-label="Row actions" />
          </tr>
        </thead>
        <tbody>
          {data.plans.map((plan: PlanMixRow) => {
            const staged = plan.plan_id ? stagedByPlan.get(plan.plan_id) : undefined;
            const subs = series(plan.weeks, "subscribers");
            const churn = series(plan.weeks, "churn_rate_pct");
            const churnRising = churn.length > 1 && churn[churn.length - 1] > churn[0];
            const label = plan.title ?? plan.plan_id ?? "Plan";
            return (
              <tr key={plan.plan_id ?? plan.title} className="border-t border-(--line)">
                <td className="py-2.5 pl-[18px] pr-3">
                  <div className="flex items-center gap-3">
                    <KindIcon icon={plan.kind === "home-internet" ? "home" : "signal"} tone="muted" />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium leading-snug text-(--ink)">{plan.title}</div>
                      <div className="am-mono text-[11.5px] text-(--ink-soft)">
                        {[plan.plan_id, plan.price != null ? `${formatMoney(plan.price)}/mo` : null].filter(Boolean).join(" · ")}
                      </div>
                      {staged ? (
                        <div className="mt-1">
                          <Pill tone="violet" dot>
                            Staged promo window{staged.starts && staged.ends ? ` · ${formatDayMonth(staged.starts)} – ${formatDayMonth(staged.ends)}` : ""}
                          </Pill>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="am-mono px-3 py-2.5 text-right text-[13px] text-(--ink)">{plan.subscribers != null ? formatNumber(plan.subscribers) : "—"}</td>
                <td className="hidden px-3 py-2.5 @4xl:table-cell">
                  {plan.share_pct != null ? (
                    <div className="flex items-center gap-2">
                      <MiniBar value={plan.share_pct / 100} className="w-16" />
                      <span className="am-mono text-[12px] text-(--ink-soft)">{formatRate(plan.share_pct)}</span>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`am-mono px-3 py-2.5 text-right text-[13px] ${churnRising ? "font-semibold text-(--danger)" : "text-(--ink)"}`}>
                  {plan.churn_rate_pct != null ? formatRate(plan.churn_rate_pct) : "—"}
                </td>
                <td className="am-mono hidden px-3 py-2.5 text-right text-[13px] text-(--ink) @3xl:table-cell">{plan.arpu != null ? formatMoney(plan.arpu) : "—"}</td>
                <td className="am-mono px-3 py-2.5 text-right text-[13px] text-(--ink)">{plan.margin_per_line_usd != null ? formatMoney(plan.margin_per_line_usd) : "—"}</td>
                <td className="hidden w-28 px-3 py-2.5 @2xl:table-cell">
                  {subs.length > 1 ? <Sparkline points={subs} height={30} label={`${label}, weekly subscribers`} /> : "—"}
                </td>
                <td className="py-2.5 pl-3 pr-[18px] text-right">
                  <AskButton
                    label="Ask"
                    onClick={() => onAskAssistant(`Where is the churn on ${plan.title} (${plan.plan_id}) coming from, and what move would you propose?`)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CohortsPanel({ cohorts, onAskAssistant }: { cohorts: Cohort[]; onAskAssistant: (text: string) => void }) {
  return (
    <Panel title="Cohorts" subtitle="line groups that retention offers and campaigns target">
      {cohorts.length === 0 ? (
        <p className="px-[18px] pb-4 text-[13.5px] text-(--ink-soft)">No cohorts defined.</p>
      ) : (
        <ul className="divide-y divide-(--line)">
          {cohorts.map((cohort) => (
            <li key={cohort.cohort_id} className="flex items-center gap-3 px-[18px] py-3">
              <KindIcon icon="user" tone="muted" />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium leading-snug text-(--ink)">{cohort.label}</div>
                {cohort.definition ? <div className="mt-0.5 text-[12px] leading-snug text-(--ink-soft)">{cohort.definition}</div> : null}
                <div className="am-mono mt-1 text-[11.5px] text-(--ink-soft)">{cohort.plan_ids.join(" · ")}</div>
              </div>
              <div className="am-mono w-20 shrink-0 text-right">
                <div className="text-[15px] font-semibold text-(--ink)">{formatNumber(cohort.size)}</div>
                <div className="text-[11.5px] text-(--ink-soft)">lines</div>
              </div>
              <AskButton label="Ask" onClick={() => onAskAssistant(`What would you propose for the "${cohort.label}" cohort (${formatNumber(cohort.size)} lines)?`)} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default function BaseView({ refreshKey, onAskAssistant }: { refreshKey: number; onAskAssistant: (text: string) => void }) {
  const { data, failed } = useResource(fetchBase, [refreshKey]);

  const rising = (data?.plans ?? []).filter((plan) => {
    const churn = series(plan.weeks, "churn_rate_pct");
    return churn.length > 1 && churn[churn.length - 1] > churn[0];
  }).length;

  return (
    <div className="ac-reveal @container flex flex-col gap-4">
      <PageHeader
        title="Base"
        subtitle={data ? `${formatNumber(data.total_subscribers)} active lines across ${data.plans.length} plans${rising ? ` · churn rising on ${rising}` : ""}` : undefined}
      />
      {failed && !data ? (
        <Notice>The telecom API isn&apos;t reachable, so the subscriber base can&apos;t load.</Notice>
      ) : !data ? (
        <>
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </>
      ) : (
        <>
          <Panel title="Plan mix" subtitle="churn in red where it rose over the last 13 weeks">
            <PlanMixTable data={data} onAskAssistant={onAskAssistant} />
          </Panel>
          <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_320px]">
            <CohortsPanel cohorts={data.cohorts} onAskAssistant={onAskAssistant} />
            {data.wholesale ? (
              <Panel title="Wholesale rate card">
                <div className="grid grid-cols-2 border-t border-(--line) [&>*+*]:border-l [&>*]:border-(--line)">
                  {data.wholesale.mobile_per_gb_usd != null ? (
                    <div className="px-[18px] py-3">
                      <div className="text-[12px] font-medium text-(--ink-soft)">Mobile data</div>
                      <div className="am-mono mt-1 text-[18px] font-semibold text-(--ink)">{formatMoney(data.wholesale.mobile_per_gb_usd)}<span className="text-[12px] font-medium text-(--ink-soft)">/GB</span></div>
                    </div>
                  ) : null}
                  {data.wholesale.mobile_core_per_line_usd != null ? (
                    <div className="px-[18px] py-3">
                      <div className="text-[12px] font-medium text-(--ink-soft)">Core, per line</div>
                      <div className="am-mono mt-1 text-[18px] font-semibold text-(--ink)">{formatMoney(data.wholesale.mobile_core_per_line_usd)}<span className="text-[12px] font-medium text-(--ink-soft)">/mo</span></div>
                    </div>
                  ) : null}
                </div>
                {data.wholesale.note ? <p className="border-t border-(--line) px-[18px] py-3 text-[12.5px] leading-snug text-(--ink-soft)">{data.wholesale.note}</p> : null}
              </Panel>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
