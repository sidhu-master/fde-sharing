// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useMemo, useState } from "react";
import {
  ApprovalsBanner,
  askWhy,
  AttentionList,
  AttentionRow,
  formatChangePct,
  formatComparisonLabel,
  formatDayMonth,
  formatMoney,
  formatNumber,
  formatPeriodLabel,
  formatRate,
  greeting,
  MiniBar,
  Notice,
  PageHeader,
  Panel,
  plural,
  QueueOverflow,
  ratioChangePct,
  RecentChanges,
  RecordList,
  runwayLabel,
  Segmented,
  Skeleton,
  StatStrip,
  StatTile,
  ViewLink,
} from "web-shared";
import { INVENTORY_KINDS, ISSUE_KINDS, ORDER_STATUS } from "@/lib/kinds";
import type { InventoryAlert, OrderIssue, OverviewResponse, TodaySnapshot } from "@/lib/types";
import { formatDaysToEvent } from "@/lib/format";

type Filter = "all" | "orders" | "scarce" | "pacing";
type Row = { kind: "issue"; issue: OrderIssue } | { kind: "tier"; alert: InventoryAlert };

const ROW_CAP = 6;

/** One sentence from the overview: the gross move and what needs the operator. */
function briefing(data: OverviewResponse): string {
  const { snapshot, needs_attention } = data;
  const parts: string[] = [];
  if (snapshot.sales_change_pct != null) {
    const direction = snapshot.sales_change_pct >= 0 ? "up" : "down";
    parts.push(`Gross sales are ${direction} ${formatChangePct(Math.abs(snapshot.sales_change_pct)).replace("+", "")} on the week.`);
  }
  const orders = needs_attention.order_issues.length;
  const tiers = needs_attention.inventory.length;
  const needs = [orders ? plural(orders, "order") : "", tiers ? plural(tiers, "tier") : ""].filter(Boolean);
  parts.push(needs.length ? `${needs.join(" and ")} need you today.` : "Nothing needs you today.");
  return parts.join(" ");
}

function rowsFor(data: OverviewResponse, filter: Filter): Row[] {
  const { inventory, order_issues } = data.needs_attention;
  const issues = order_issues.map((issue) => ({ kind: "issue" as const, issue }));
  const scarce = inventory
    .filter((alert) => alert.kind === "low_stock")
    .sort((a, b) => a.stock - b.stock)
    .map((alert) => ({ kind: "tier" as const, alert }));
  const pacing = inventory.filter((alert) => alert.kind === "slow_mover").map((alert) => ({ kind: "tier" as const, alert }));
  if (filter === "orders") return issues;
  if (filter === "scarce") return scarce;
  if (filter === "pacing") return pacing;
  // The tier furthest behind pace leads; it is what the box office acts on first.
  return [...pacing.slice(0, 1), ...issues, ...scarce, ...pacing.slice(1)];
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

function TierRow({ alert, onAskAssistant }: { alert: InventoryAlert; onAskAssistant: (text: string) => void }) {
  const style = INVENTORY_KINDS[alert.kind];
  const scarce = alert.kind === "low_stock";
  const ref = `${alert.title} (${alert.listing_id})`;
  return (
    <AttentionRow
      icon={style.icon}
      tone={style.tone}
      title={alert.title}
      meta={
        <>
          <span className={`font-semibold ${scarce ? "text-(--warn)" : "text-(--danger)"}`}>{scarce ? `${formatNumber(alert.stock)} open seats` : style.label}</span>
          {[
            "",
            scarce ? "" : `${formatNumber(alert.stock)} open`,
            alert.days_of_cover != null ? runwayLabel(alert.days_of_cover) : "",
            alert.sales_last_30d != null ? `${formatNumber(alert.sales_last_30d)} sold in 30 days` : "",
            alert.listing_id,
          ]
            .filter((part, index) => index === 0 || part)
            .join(" · ")}
        </>
      }
      action={
        scarce
          ? { label: "Release holds", onClick: () => onAskAssistant(`${ref} is nearly sold out. Should we release any held seats?`) }
          : { label: "Ask", onClick: () => onAskAssistant(`${ref} is behind its comparable-events pace. What would you propose?`) }
      }
    />
  );
}

function NextUp({ today, onNavigate }: { today: TodaySnapshot; onNavigate: () => void }) {
  if (!today.upcoming.length) return null;
  return (
    <Panel title="Next up" action={<ViewLink label="All events" onClick={onNavigate} />}>
      <div className="grid gap-2.5 px-[18px] pb-4 pt-1 @2xl:grid-cols-3">
        {today.upcoming.map((show) => (
          <button
            key={show.event_id}
            type="button"
            onClick={onNavigate}
            className="rounded-[10px] border border-(--line) bg-(--well)/60 px-3 py-2.5 text-left transition-colors hover:border-(--accent)"
            aria-label={`${show.event_name}, ${formatDayMonth(show.event_date)}, ${formatNumber(show.sold)} of ${formatNumber(show.capacity)} sold. Open the Events view.`}
          >
            <div className="at-display truncate text-[16px] text-(--ink)" title={show.event_name}>
              {show.event_name}
            </div>
            <div className="mt-0.5 truncate text-[11.5px] text-(--ink-soft)">
              {[show.venue, formatDayMonth(show.event_date), formatDaysToEvent(show.days_to_event)].filter(Boolean).join(" · ")}
            </div>
            <MiniBar value={show.capacity > 0 ? show.sold / show.capacity : 0} tone="accent" className="mt-2 w-full" />
            <div className="at-mono mt-1 text-[11.5px] text-(--ink-soft)">
              {formatNumber(show.sold)}/{formatNumber(show.capacity)} sold · {formatNumber(show.remaining)} open
              {show.waitlist_depth > 0 ? ` · waitlist ${formatNumber(show.waitlist_depth)}` : ""}
            </div>
          </button>
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
  onNavigate: (view: "events" | "holds") => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const pending = useMemo(() => (data?.needs_attention.pending_changes ?? []).filter((change) => change.status === "staged"), [data]);
  const rows = useMemo(() => (data ? rowsFor(data, filter) : []), [data, filter]);
  const now = useMemo(() => new Date(), []);
  const title = `${greeting(now)}${operator ? `, ${operator}` : ""}`;
  const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (failed && !data) {
    return (
      <>
        <PageHeader title={title} subtitle={today} />
        <Notice>
          The entertainment API on port 8003 isn&apos;t reachable. Start it with{" "}
          <code className="at-mono rounded bg-(--well) px-1 text-[13px]">uvicorn entertainment.api.main:app --app-dir examples --port 8003</code> and reload.
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
    scarce: data.needs_attention.inventory.filter((alert) => alert.kind === "low_stock").length,
    pacing: data.needs_attention.inventory.filter((alert) => alert.kind === "slow_mover").length,
  };
  const currency = snapshot.currency ?? "USD";
  const aovChangePct = ratioChangePct(snapshot.sales_change_pct, snapshot.orders_change_pct);
  const comparison = formatComparisonLabel(snapshot.period, snapshot.compare_to);

  return (
    <div className="ac-reveal @container flex flex-col gap-5">
      <PageHeader title={title} subtitle={`${today} · ${briefing(data)}`} />

      <ApprovalsBanner changes={pending} onReview={() => onAskAssistant("Walk me through the changes awaiting my approval and what each one would do.")} />

      <Panel title="This week" subtitle={`${formatPeriodLabel(snapshot.period)}${comparison ? ` · against the ${comparison}` : ""}`} bodyClassName="pb-1">
        <StatStrip>
          <StatTile
            label="Gross sales"
            value={formatMoney(snapshot.sales, currency, { whole: snapshot.sales >= 1000 })}
            changePct={snapshot.sales_change_pct}
            onClick={() => onAskAssistant(askWhy("Gross sales", snapshot.sales_change_pct, comparison))}
            ariaLabel="Gross sales: ask the assistant why"
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

      {data.today ? <NextUp today={data.today} onNavigate={() => onNavigate("events")} /> : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel
          title="Needs you today"
          action={
            <Segmented<Filter>
              label="Filter attention items"
              value={filter}
              onChange={setFilter}
              options={[
                { id: "all", label: "All", count: counts.orders + counts.scarce + counts.pacing },
                { id: "orders", label: "Orders", count: counts.orders },
                { id: "scarce", label: "Scarce", count: counts.scarce },
                { id: "pacing", label: "Pacing", count: counts.pacing },
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
                    <TierRow key={`${row.alert.kind}-${row.alert.listing_id}`} alert={row.alert} onAskAssistant={onAskAssistant} />
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
                  detail: plural(order.items, "ticket"),
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
