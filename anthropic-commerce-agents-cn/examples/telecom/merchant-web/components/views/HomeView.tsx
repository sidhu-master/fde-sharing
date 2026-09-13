// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useMemo, useState } from "react";
import {
  ApprovalsBanner,
  askWhy,
  AttentionList,
  AttentionRow,
  coverLabel,
  formatChangePct,
  formatComparisonLabel,
  formatDate,
  formatDayMonth,
  formatMoney,
  formatNumber,
  formatPeriodLabel,
  formatRate,
  greeting,
  Notice,
  PageHeader,
  Panel,
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
import { INVENTORY_KINDS, ISSUE_KINDS, ORDER_STATUS } from "@/lib/kinds";
import type { InventoryAlert, OrderIssue, OverviewResponse, TodaySnapshot } from "@/lib/types";

type Filter = "all" | "orders" | "stock" | "slow";
type Row = { kind: "issue"; issue: OrderIssue } | { kind: "inventory"; alert: InventoryAlert };

const ROW_CAP = 6;

/** One sentence from the overview: the revenue move and what needs the operator. */
function briefing(data: OverviewResponse): string {
  const { snapshot, needs_attention } = data;
  const parts: string[] = [];
  if (snapshot.sales_change_pct != null) {
    const direction = snapshot.sales_change_pct >= 0 ? "up" : "down";
    parts.push(`Revenue is ${direction} ${formatChangePct(Math.abs(snapshot.sales_change_pct)).replace("+", "")} on the week.`);
  }
  const orders = needs_attention.order_issues.length;
  const products = needs_attention.inventory.length;
  const needs = [orders ? plural(orders, "order") : "", products ? plural(products, "product") : ""].filter(Boolean);
  parts.push(needs.length ? `${needs.join(" and ")} need you today.` : "Nothing needs you today.");
  return parts.join(" ");
}

function attentionRows(data: OverviewResponse, filter: Filter): Row[] {
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
  // The most urgent stock alert leads, ahead of the order queue.
  return [...lowStock.slice(0, 1), ...issues, ...lowStock.slice(1), ...slow];
}

function IssueRow({ issue, onAskAssistant }: { issue: OrderIssue; onAskAssistant: (text: string) => void }) {
  const style = ISSUE_KINDS[issue.kind];
  return (
    <AttentionRow
      icon={style.icon}
      tone={style.tone}
      title={issue.summary}
      meta={[style.label, `Order ${issue.order_id}`, issue.opened_at ? `opened ${formatDayMonth(issue.opened_at)}` : ""].filter(Boolean).join(" · ")}
      action={{
        label: issue.kind === "buyer_message" ? "Draft reply" : "Ask",
        onClick: () => onAskAssistant(`What are my options for order ${issue.order_id}? ${issue.summary}.`),
      }}
    />
  );
}

function InventoryRow({ alert, onAskAssistant }: { alert: InventoryAlert; onAskAssistant: (text: string) => void }) {
  const style = INVENTORY_KINDS[alert.kind];
  const low = alert.kind === "low_stock";
  const ref = `${alert.title} (${alert.listing_id})`;
  return (
    <AttentionRow
      icon={style.icon}
      tone={alert.stock === 0 ? "danger" : style.tone}
      title={alert.title}
      meta={
        <>
          <span className={low ? "font-semibold text-(--warn)" : ""}>{formatNumber(alert.stock)} left</span>
          {[
            "",
            alert.days_of_cover != null ? coverLabel(alert.days_of_cover) : "",
            alert.sales_last_30d != null ? `${formatNumber(alert.sales_last_30d)} sold in 30 days` : "",
            alert.listing_id,
          ]
            .filter((part, index) => index === 0 || part)
            .join(" · ")}
        </>
      }
      action={
        low
          ? { label: "Draft restock", onClick: () => onAskAssistant(`Draft a restock plan for ${ref}.`) }
          : { label: "Ask", onClick: () => onAskAssistant(`${ref} is moving slowly. What would you propose?`) }
      }
    />
  );
}

/** Yesterday's line movement; the link opens the Base view. */
function LineMovement({ today, onNavigate }: { today: TodaySnapshot; onNavigate: () => void }) {
  const tiles: { label: string; value: number; signed?: boolean }[] = [
    { label: "Gross adds", value: today.gross_adds },
    { label: "Deactivations", value: today.deacts },
    { label: "Net adds", value: today.net_adds, signed: true },
    { label: "Port-ins", value: today.port_ins },
  ];
  return (
    <Panel title="Yesterday's line movement" subtitle={formatDate(today.date)} action={<ViewLink label="Open base" onClick={onNavigate} />}>
      <div className="grid grid-cols-2 border-t border-(--line) sm:grid-cols-4 [&>*]:border-(--line) max-sm:[&>*:nth-child(even)]:border-l max-sm:[&>*:nth-child(n+3)]:border-t sm:[&>*+*]:border-l">
        {tiles.map((tile) => (
          <div key={tile.label} className="px-[18px] py-3">
            <div className="text-[12.5px] font-medium text-(--ink-soft)">{tile.label}</div>
            <div className={`am-mono mt-1 text-[22px] font-semibold leading-none ${tile.signed && tile.value < 0 ? "text-(--danger)" : "text-(--ink)"}`}>
              {tile.signed && tile.value > 0 ? "+" : ""}
              {formatNumber(tile.value)}
            </div>
          </div>
        ))}
      </div>
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
  onNavigate: (view: "plans" | "base") => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const pending = useMemo(
    () => (data?.needs_attention.pending_changes ?? []).filter((change) => change.status === "staged"),
    [data],
  );
  const rows = useMemo(() => (data ? attentionRows(data, filter) : []), [data, filter]);
  const now = useMemo(() => new Date(), []);
  const title = `${greeting(now)}${operator ? `, ${operator}` : ""}`;
  const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (failed && !data) {
    return (
      <>
        <PageHeader title={title} subtitle={today} />
        <Notice>
          The telecom API on port 8002 isn&apos;t reachable. Start it with{" "}
          <code className="am-mono rounded bg-(--well) px-1 text-[13px]">uvicorn telecom.api.main:app --app-dir examples --port 8002</code> and reload.
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
  // The snapshot carries no AOV delta, so derive it from the revenue and orders deltas.
  const aovChangePct = ratioChangePct(snapshot.sales_change_pct, snapshot.orders_change_pct);
  const comparison = formatComparisonLabel(snapshot.period, snapshot.compare_to);
  const currency = snapshot.currency ?? "USD";

  return (
    <div className="ac-reveal flex flex-col gap-5">
      <PageHeader title={title} subtitle={`${today} · ${briefing(data)}`} />

      <ApprovalsBanner changes={pending} onReview={() => onAskAssistant("Walk me through the changes awaiting my approval and what each one would do.")} />

      <Panel title="This week" subtitle={`${formatPeriodLabel(snapshot.period)}${comparison ? ` · against the ${comparison}` : ""}`} bodyClassName="pb-1">
        <StatStrip>
          <StatTile
            label="Revenue"
            value={formatMoney(snapshot.sales, currency, { whole: snapshot.sales >= 1000 })}
            changePct={snapshot.sales_change_pct}
            onClick={() => onAskAssistant(askWhy("Revenue", snapshot.sales_change_pct, comparison))}
            ariaLabel="Revenue: ask the assistant why"
          />
          <StatTile
            label="Orders"
            value={formatNumber(snapshot.orders)}
            changePct={snapshot.orders_change_pct}
            onClick={() => onAskAssistant(askWhy("Orders", snapshot.orders_change_pct, comparison))}
            ariaLabel="Orders: ask the assistant why"
          />
          <StatTile
            label="Conversion"
            value={snapshot.conversion_rate != null ? formatRate(snapshot.conversion_rate) : "—"}
            changePct={snapshot.conversion_change_pct}
            onClick={() => onAskAssistant(askWhy("Conversion", snapshot.conversion_change_pct, comparison))}
            ariaLabel="Conversion: ask the assistant why"
          />
          <StatTile
            label="Average order"
            value={snapshot.average_order_value != null ? formatMoney(snapshot.average_order_value, currency) : "—"}
            changePct={aovChangePct}
            onClick={() => onAskAssistant(askWhy("Average order value", aovChangePct, comparison))}
            ariaLabel="Average order value: ask the assistant why"
          />
        </StatStrip>
      </Panel>

      {data.today ? <LineMovement today={data.today} onNavigate={() => onNavigate("base")} /> : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel
          title="Needs you today"
          action={
            <Segmented<Filter>
              label="Filter attention items"
              value={filter}
              onChange={setFilter}
              options={[
                { id: "all", label: "All", count: counts.orders + counts.stock + counts.slow },
                { id: "orders", label: "Orders", count: counts.orders },
                { id: "stock", label: "Low stock", count: counts.stock },
                { id: "slow", label: "Slow", count: counts.slow },
              ]}
            />
          }
        >
          {rows.length === 0 ? (
            <p className="px-[18px] pb-4 pt-1 text-[13.5px] text-(--ink-soft)">Nothing is waiting on you.</p>
          ) : (
            <>
              <AttentionList>
                {rows.slice(0, ROW_CAP).map((row) =>
                  row.kind === "issue" ? (
                    <IssueRow key={row.issue.issue_id} issue={row.issue} onAskAssistant={onAskAssistant} />
                  ) : (
                    <InventoryRow key={`${row.alert.kind}-${row.alert.listing_id}`} alert={row.alert} onAskAssistant={onAskAssistant} />
                  ),
                )}
              </AttentionList>
              <QueueOverflow hidden={rows.length - ROW_CAP} />
            </>
          )}
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Recent orders">
            {data.recent_orders.length === 0 ? (
              <p className="px-[18px] pb-4 text-[13px] text-(--ink-soft)">No orders yet.</p>
            ) : (
              <RecordList
                mono
                rows={data.recent_orders.slice(0, 5).map((order) => ({
                  id: order.order_id,
                  detail: plural(order.items, "item"),
                  sub: `${formatDayMonth(order.placed_at)} · ${formatMoney(order.total)}`,
                  status: ORDER_STATUS[order.status] ?? { label: order.status.replaceAll("_", " "), tone: "muted" },
                }))}
              />
            )}
          </Panel>
          <RecentChanges changes={data.recent_changes} />
        </div>
      </div>
    </div>
  );
}
