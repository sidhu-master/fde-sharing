// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useMemo, useState } from "react";
import {
  ApprovalsBanner,
  AttentionList,
  AttentionRow,
  coverLabel,
  formatChangePct,
  formatComparisonLabel,
  formatDayMonth,
  formatMoney,
  formatNumber,
  formatPeriodLabel,
  formatRate,
  greeting,
  Icon,
  KindIcon,
  Notice,
  optionValuesLabel,
  PageHeader,
  Panel,
  Pill,
  plural,
  QueueOverflow,
  ratioChangePct,
  RecentChanges,
  RecordList,
  Segmented,
  Skeleton,
  StatStrip,
  StatTile,
  ViewLink,
} from "web-shared";
import { formatZhDayMonth, orderRows } from "@/lib/format";
import { INVENTORY_KINDS, ISSUE_KINDS } from "@/lib/kinds";
import type { HomeInsight, InventoryAlert, MetricPoint, OrderIssue, OverviewResponse } from "@/lib/types";

type Filter = "all" | "orders" | "stock" | "slow";
type Row = { kind: "issue"; issue: OrderIssue } | { kind: "inventory"; alert: InventoryAlert };

const ROW_CAP = 6;

/** One sentence from the overview: the sales move and what needs the operator. */
function briefing(data: OverviewResponse): string {
  const { snapshot, needs_attention } = data;
  const parts: string[] = [];
  if (snapshot.sales_change_pct != null) {
    const direction = snapshot.sales_change_pct >= 0 ? "增长" : "下降";
    parts.push(`本周销售额${direction} ${formatChangePct(Math.abs(snapshot.sales_change_pct)).replace("+", "")}。`);
  }
  const orders = needs_attention.order_issues.length;
  const listings = needs_attention.inventory.length;
  const needs = [orders ? `${orders} 个订单` : "", listings ? `${listings} 个商品` : ""].filter(Boolean);
  parts.push(needs.length ? `今日有${needs.join("、")}需要处理。` : "今天没有待处理事项。");
  return parts.join(" ");
}

function values(points?: MetricPoint[]): number[] | undefined {
  return points?.map((point) => point.value);
}

function rows(data: OverviewResponse, filter: Filter): Row[] {
  const { inventory, order_issues } = data.needs_attention;
  const issues = order_issues.map((issue) => ({ kind: "issue" as const, issue }));
  const lowStock = inventory
    .filter((alert) => alert.kind === "low_stock")
    .sort((a, b) => (a.days_of_cover ?? Infinity) - (b.days_of_cover ?? Infinity))
    .map((alert) => ({ kind: "inventory" as const, alert }));
  const slow = inventory.filter((alert) => alert.kind === "slow_mover").map((alert) => ({ kind: "inventory" as const, alert }));
  if (filter === "orders") return issues;
  if (filter === "stock") return lowStock;
  if (filter === "slow") return slow;
  // The most urgent stock alert leads; it is the one a seller acts on first.
  return [...lowStock.slice(0, 1), ...issues, ...lowStock.slice(1), ...slow];
}

function IssueRow({ issue, onAskAssistant }: { issue: OrderIssue; onAskAssistant: (text: string) => void }) {
  const style = ISSUE_KINDS[issue.kind];
  return (
    <AttentionRow
      icon={style.icon}
      tone={style.tone}
      title={issue.summary}
      meta={[style.label, `订单 ${issue.order_id}`, issue.opened_at ? `${formatZhDayMonth(issue.opened_at)} 创建` : ""].filter(Boolean).join(" · ")}
      action={{
        label: issue.kind === "buyer_message" ? "起草回复" : "询问",
        onClick: () => onAskAssistant(`订单 ${issue.order_id} 有哪些处理方案？${issue.summary}。`),
      }}
    />
  );
}

function InventoryRow({ alert, onAskAssistant }: { alert: InventoryAlert; onAskAssistant: (text: string) => void }) {
  const style = INVENTORY_KINDS[alert.kind];
  const soldOut = alert.kind === "low_stock" && alert.stock === 0;
  const low = alert.kind === "low_stock";
  const chosen = optionValuesLabel(alert);
  const name = chosen ? `${alert.title} · ${chosen}` : alert.title;
  const ref = `${name} (${alert.listing_id})`;
  return (
    <AttentionRow
      icon={style.icon}
      tone={soldOut ? "danger" : style.tone}
      title={name}
      meta={
        <>
          <span className={soldOut ? "font-semibold text-(--danger)" : low ? "font-semibold text-(--warn)" : ""}>
            {soldOut ? "已售罄" : `库存 ${formatNumber(alert.stock)} 件`}
          </span>
          {[
            "",
            alert.days_of_cover != null && !soldOut ? coverLabel(alert.days_of_cover) : "",
            alert.sales_last_30d != null ? `近 30 天售出 ${formatNumber(alert.sales_last_30d)} 件` : "",
            alert.listing_id,
            soldOut && alert.storefront_visible === false ? "已从商城隐藏" : "",
          ]
            .filter((part, index) => index === 0 || part)
            .join(" · ")}
        </>
      }
      note={
        // A paused listing still alerts here but shows no chip to shoppers.
        low && alert.stock > 0 && alert.storefront_visible ? (
          <Pill tone="warn" dot>
            商城显示“仅剩 {formatNumber(alert.stock)} 件”
          </Pill>
        ) : null
      }
      action={{
        label: low ? "补货方案" : "降价方案",
        onClick: () => onAskAssistant(low ? `为 ${ref} 起草补货方案。` : `为 ${ref} 制定降价方案。`),
      }}
    />
  );
}

function Insights({ insights, onAskAssistant }: { insights: HomeInsight[]; onAskAssistant: (text: string) => void }) {
  if (insights.length === 0) return null;
  return (
    <Panel title="智能助手建议" icon={<KindIcon icon="spark" tone="accent" size={24} />}>
      <ul className="divide-y divide-(--line)">
        {insights.map((insight) => (
          <li key={insight.insight_id} className="px-[18px] py-2.5">
            <div className="text-[13px] font-medium leading-snug text-(--ink)">{insight.headline}</div>
            {insight.detail ? <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-(--ink-soft)">{insight.detail}</div> : null}
            <button
              type="button"
              onClick={() => onAskAssistant(insight.prompt)}
              className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-(--accent-ink) hover:underline"
            >
              询问 <Icon name="arrow-right" size={13} />
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function HomeView({
  data,
  failed,
  operator,
  onAskAssistant,
  onNavigate,
}: {
  data: OverviewResponse | null;
  failed: boolean;
  operator?: string;
  /** Prefills the composer; nothing is sent. */
  onAskAssistant: (text: string) => void;
  onNavigate: (view: "orders" | "inventory") => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const pending = useMemo(() => (data?.needs_attention.pending_changes ?? []).filter((change) => change.status === "staged"), [data]);
  const queue = useMemo(() => (data ? rows(data, filter) : []), [data, filter]);
  const now = useMemo(() => new Date(), []);
  const hour = now.getHours();
  const title = `${hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好"}${operator ? `，${operator}` : ""}`;
  const today = now.toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" });

  if (failed && !data) {
    return (
      <>
        <PageHeader title={title} subtitle={today} />
        <Notice>
          无法连接 8000 端口的商家 API。请运行{" "}
          <code className="rounded bg-(--well) px-1 font-mono text-[13px]">uvicorn retail.api.main:app --app-dir examples --port 8000</code> 后刷新页面。
        </Notice>
      </>
    );
  }
  if (!data) {
    return (
      <>
        <PageHeader title={title} subtitle={today} />
        <Skeleton className="h-36" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-72" />
        </div>
      </>
    );
  }

  const { snapshot } = data;
  const counts = {
    orders: data.needs_attention.order_issues.length,
    stock: data.needs_attention.inventory.filter((alert) => alert.kind === "low_stock").length,
    slow: data.needs_attention.inventory.filter((alert) => alert.kind === "slow_mover").length,
  };
  const comparison = formatComparisonLabel(snapshot.period, snapshot.compare_to);
  const localizedComparison = comparison === "prior week" ? "上周" : comparison === "prior period" ? "上一周期" : comparison;
  const [periodStart, periodEnd] = snapshot.period.split("/");
  const localizedPeriod = periodEnd ? `${formatZhDayMonth(periodStart)}–${formatZhDayMonth(periodEnd)}` : snapshot.period;
  // The snapshot carries no average-order delta, so derive it from the sales and orders deltas.
  const aovChangePct = ratioChangePct(snapshot.sales_change_pct, snapshot.orders_change_pct);
  const currency = snapshot.currency ?? "USD";

  return (
    <div className="ac-reveal flex flex-col gap-5">
      <PageHeader title={title} subtitle={`${today} · ${briefing(data)}`} />

      <ApprovalsBanner changes={pending} onReview={() => onAskAssistant("逐项说明等待我批准的变更，以及每项变更会产生什么影响。")}/>

      <Panel title="本周经营概览" subtitle={`${localizedPeriod}${localizedComparison ? ` · 对比${localizedComparison}` : ""}`} bodyClassName="pb-1">
        <StatStrip>
          <StatTile
            label="销售额"
            value={formatMoney(snapshot.sales, currency, { whole: snapshot.sales >= 1000 })}
            changePct={snapshot.sales_change_pct}
            points={values(data.trends?.sales)}
            prior={values(data.trends_prior?.sales)}
            onClick={() => onAskAssistant(snapshot.sales_change_pct == null ? "分析销售额近期趋势及背后的原因。" : `分析销售额相较${localizedComparison || "上一周期"}变化 ${formatRate(snapshot.sales_change_pct)} 的原因。`)}
            ariaLabel="询问助手销售额变化原因"
            actionLabel="询问原因"
          />
          <StatTile
            label="订单数"
            value={formatNumber(snapshot.orders)}
            changePct={snapshot.orders_change_pct}
            points={values(data.trends?.orders)}
            prior={values(data.trends_prior?.orders)}
            onClick={() => onAskAssistant(snapshot.orders_change_pct == null ? "分析订单数近期趋势及背后的原因。" : `分析订单数相较${localizedComparison || "上一周期"}变化 ${formatRate(snapshot.orders_change_pct)} 的原因。`)}
            ariaLabel="询问助手订单数变化原因"
            actionLabel="询问原因"
          />
          <StatTile
            label="转化率"
            value={snapshot.conversion_rate != null ? formatRate(snapshot.conversion_rate) : "—"}
            changePct={snapshot.conversion_change_pct}
            points={values(data.trends?.conversion)}
            prior={values(data.trends_prior?.conversion)}
            onClick={() => onAskAssistant(snapshot.conversion_change_pct == null ? "分析转化率近期趋势及背后的原因。" : `分析转化率相较${localizedComparison || "上一周期"}变化 ${formatRate(snapshot.conversion_change_pct)} 的原因。`)}
            ariaLabel="询问助手转化率变化原因"
            actionLabel="询问原因"
          />
          <StatTile
            label="平均客单价"
            value={snapshot.average_order_value != null ? formatMoney(snapshot.average_order_value, currency) : "—"}
            changePct={aovChangePct}
            points={values(data.trends?.average_order_value)}
            prior={values(data.trends_prior?.average_order_value)}
            onClick={() => onAskAssistant(aovChangePct == null ? "分析平均客单价近期趋势及背后的原因。" : `分析平均客单价相较${localizedComparison || "上一周期"}变化 ${formatRate(aovChangePct)} 的原因。`)}
            ariaLabel="询问助手平均客单价变化原因"
            actionLabel="询问原因"
          />
        </StatStrip>
      </Panel>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel
          title="今日待处理"
          action={
            <Segmented<Filter>
              label="筛选待处理事项"
              value={filter}
              onChange={setFilter}
              options={[
                { id: "all", label: "全部", count: counts.orders + counts.stock + counts.slow },
                { id: "orders", label: "订单", count: counts.orders },
                { id: "stock", label: "低库存", count: counts.stock },
                { id: "slow", label: "滞销", count: counts.slow },
              ]}
            />
          }
        >
          {queue.length === 0 ? (
            <p className="px-[18px] pb-4 pt-1 text-[13.5px] text-(--ink-soft)">今天没有待处理事项。</p>
          ) : (
            <>
              <AttentionList>
                {queue.slice(0, ROW_CAP).map((row) =>
                  row.kind === "issue" ? (
                    <IssueRow key={row.issue.issue_id} issue={row.issue} onAskAssistant={onAskAssistant} />
                  ) : (
                    <InventoryRow key={`${row.alert.kind}-${row.alert.listing_id}`} alert={row.alert} onAskAssistant={onAskAssistant} />
                  ),
                )}
              </AttentionList>
              <QueueOverflow
                hidden={queue.length - ROW_CAP}
                label={`队列中还有 ${Math.max(0, queue.length - ROW_CAP)} 项`}
                link={{
                  label: "查看全部",
                  // The hidden rows are order issues first, so open Orders when any of them is one.
                  onClick: () => onNavigate(queue.slice(ROW_CAP).some((row) => row.kind === "issue") ? "orders" : "inventory"),
                }}
              />
            </>
          )}
        </Panel>

        <div className="flex flex-col gap-4">
          <Insights insights={data.insights ?? []} onAskAssistant={onAskAssistant} />
          <Panel title="近期订单" action={<ViewLink label="全部订单" onClick={() => onNavigate("orders")} />}>
            {data.recent_orders.length === 0 ? (
              <p className="px-[18px] pb-4 text-[13px] text-(--ink-soft)">暂无订单。</p>
            ) : (
              <RecordList rows={orderRows(data.recent_orders.slice(0, 4))} />
            )}
          </Panel>
          <RecentChanges changes={data.recent_changes} />
        </div>
      </div>
    </div>
  );
}
