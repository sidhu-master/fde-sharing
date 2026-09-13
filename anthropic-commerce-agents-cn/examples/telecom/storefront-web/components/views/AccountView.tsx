// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { ArrivingPanel, AskButton, Fact, Facts, formatDate, KindIcon, MiniBar, Notice, type Order, ORDER_NOUNS, PageHeader, Panel, Pill, Skeleton, StorePage, useStoreFrame } from "web-shared";
import { formatPrice, usageOf } from "@/lib/format";
import type { AccountContext } from "@/lib/types";
import { ASK_PLAN_FIT, NO_LINE } from "../PlanPanel";

const NOUNS = { ...ORDER_NOUNS, cardTitle: "Orders" };

/** Dates inside account prose ("outright upgrade on 2026-09-20") in the page's date style. */
function withDates(text: string): string {
  return text.replace(/\d{4}-\d{2}-\d{2}/g, (day) => formatDate(day));
}

/** The last three billing cycles against the plan's cap, oldest first. */
function Cycles({ line }: { line: AccountContext }) {
  const cycles = line.recent_usage.cycles_gb_last_3 ?? [];
  const { cap } = usageOf(line);
  if (!cycles.length) return null;
  const scale = Math.max(cap ?? 0, ...cycles);
  return (
    <div className="mt-3.5 border-t border-(--line) px-[18px] pt-3">
      <p className="am-meta mb-2">Last {cycles.length} cycles{cap != null ? ` · ${cap} GB allowance` : ""}</p>
      <ul className="flex flex-col gap-1.5">
        {cycles.map((gb, index) => (
          <li key={index} className="flex items-center gap-3">
            <MiniBar value={gb / scale} tone={cap != null && gb > cap ? "warn" : "accent"} className="w-40" />
            <span className={`am-mono text-[12.5px] ${cap != null && gb > cap ? "font-semibold text-(--warn)" : "text-(--ink)"}`}>{gb} GB</span>
          </li>
        ))}
      </ul>
      {line.recent_usage.top_ups_last_3_months ? (
        <p className="am-mono mt-2 text-[12px] text-(--warn)">
          {line.recent_usage.top_ups_last_3_months} top-ups
          {line.recent_usage.top_up_spend_usd_last_3_months ? ` ≈ ${formatPrice(line.recent_usage.top_up_spend_usd_last_3_months)}` : ""} in 3 months
        </p>
      ) : null}
    </div>
  );
}

/**
 * The account as ACME Mobile has it: plan and usage, device and contract, orders. `account` is
 * null until the read lands; its inner `account` is null for a prospect.
 */
export default function AccountView({
  shopperName,
  account,
  failed,
  orders,
}: {
  shopperName: string;
  account: { account: AccountContext | null } | null;
  failed: boolean;
  orders: Order[] | null;
}) {
  const { ask } = useStoreFrame();
  const line = account?.account ?? null;
  return (
    <StorePage>
      <PageHeader title="Account" subtitle={line ? `${shopperName}'s line, as ACME Mobile has it. Ask which plan fits this usage, or what an upgrade would cost.` : undefined} />
      {!account ? (
        failed ? <Notice>Couldn&apos;t load the account.</Notice> : <Skeleton className="h-[320px]" />
      ) : line ? (
        <>
          <Panel title="Plan and usage" icon={<KindIcon icon="signal" tone="accent" size={30} />} action={<AskButton label="Ask if a plan fits" onClick={() => ask(ASK_PLAN_FIT)} />} bodyClassName="pb-4">
            <div className="px-[18px]">
              <Facts>
                <Fact label="Plan" value={line.current_plan.name} />
                <Fact label="Plan price" value={line.current_plan.price_per_month != null ? `${formatPrice(line.current_plan.price_per_month)}/mo` : "—"} />
                <Fact label="Monthly bill" value={`${formatPrice(line.monthly_bill_usd)}/mo`} />
                <Fact label="Avg data" value={`${usageOf(line).avg} GB`} tone={usageOf(line).over ? "warn" : undefined} />
              </Facts>
            </div>
            <Cycles line={line} />
          </Panel>
          <Panel
            title="Device and contract"
            icon={<KindIcon icon="tag" tone="muted" size={30} />}
            action={<AskButton label="Ask about an upgrade" onClick={() => ask("Am I due for a phone upgrade, and what would it cost?")} />}
            bodyClassName="px-[18px] pb-4"
          >
            <Facts>
              <Fact label="Device" value={line.device.name} />
              <Fact label="Contract" value={`Month ${line.contract.month} of ${line.contract.of_months}`} />
              <Fact
                label="Installments left"
                value={line.device.installment_usd ? `${line.device.installments_remaining} × ${formatPrice(line.device.installment_usd)}` : String(line.device.installments_remaining)}
              />
              <Fact label="Contract ends" value={formatDate(line.contract.ends)} />
            </Facts>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-(--ink-2)">
              {line.upgrade_eligibility.eligible ? <Pill tone="accent" dot>Upgrade open</Pill> : <Pill>Upgrade later</Pill>}
              <span>{withDates(line.upgrade_eligibility.reason)}</span>
            </div>
            {line.trade_in_estimate ? (
              <p className="am-mono mt-2 text-[12px] text-(--ink-soft)">
                Trade-in about {formatPrice(line.trade_in_estimate.estimated_credit_usd)} ({line.trade_in_estimate.condition_assumption}). Quote good to{" "}
                {formatDate(line.trade_in_estimate.quote_valid_through)}.
              </p>
            ) : null}
          </Panel>
        </>
      ) : (
        <Notice>{NO_LINE}</Notice>
      )}
      {orders?.length ? <ArrivingPanel orders={orders} nouns={NOUNS} thumb={() => <KindIcon icon="box" size={40} />} /> : null}
    </StorePage>
  );
}
