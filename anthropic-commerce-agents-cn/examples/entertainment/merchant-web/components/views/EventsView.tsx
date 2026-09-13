// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useState } from "react";
import { AskButton, formatDate, formatDayMonth, formatMoney, formatNumber, formatRate, Icon, Notice, PageHeader, Panel, Pill, plural, Skeleton, titleCase, useResource } from "web-shared";
import { PaceChip, PacingCurve, SellThroughBar, UNDER_PACE_ALERT_PTS, WeeklySparkline, holdsSummary } from "@/components/PacingParts";
import { fetchListingDetail, fetchPacing } from "@/lib/api";
import type { PacingEvent, PacingTier } from "@/lib/types";
import { formatDaysToEvent } from "@/lib/format";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[12.5px]">
      <span className="text-(--ink-soft)">{label}</span>
      <span className="at-mono text-right text-(--ink)">{value}</span>
    </div>
  );
}

function TierDetail({ tier }: { tier: PacingTier }) {
  const { data: detail, failed } = useResource(() => fetchListingDetail(tier.product_id), [tier.product_id]);

  const pricing = detail?.pricing;
  const history = tier.weekly_sold_cum ?? [];
  const curveReady = history.length >= 2 && tier.capacity != null && tier.capacity > 0;
  // Same rule PacingCurve applies before it draws the baseline, so the heading matches.
  const baselineUsable = curveReady && (tier.weekly_baseline_pct ?? []).filter((v) => Number.isFinite(v)).length >= 2;
  const underPacing = tier.pace_vs_baseline_pts != null && tier.pace_vs_baseline_pts <= UNDER_PACE_ALERT_PTS;
  const facePrice = pricing?.current_price != null && pricing.fees_usd != null ? pricing.current_price - pricing.fees_usd : null;

  return (
    <div className="ac-reveal mt-2 grid gap-4 rounded-[10px] bg-(--ground) p-3.5 @2xl:grid-cols-2">
      <div>
        <div className="text-[12.5px] font-semibold text-(--ink)">
          {baselineUsable ? "Sell-through vs comparable baseline" : curveReady ? "Sell-through, cumulative" : "Weekly sales, cumulative"}
        </div>
        {history.length >= 2 ? (
          <>
            <div className="mt-2">
              {curveReady ? (
                <PacingCurve points={history} weeklyBaselinePct={tier.weekly_baseline_pct} capacity={tier.capacity} underPacing={underPacing} />
              ) : (
                <WeeklySparkline points={history} />
              )}
            </div>
            <div className="at-mono mt-1 flex justify-between text-[11.5px] text-(--ink-soft)">
              <span>{formatDayMonth(history[0].week_start)}</span>
              <span>
                {formatDayMonth(history[history.length - 1].week_start)} · {formatNumber(history[history.length - 1].sold_cum)} sold
              </span>
            </div>
            {tier.recent_weekly_sales != null ? (
              <div className="at-mono mt-1 text-[11.5px] text-(--ink-soft)">{formatNumber(tier.recent_weekly_sales)} tickets/week over the last four weeks</div>
            ) : null}
          </>
        ) : (
          <p className="mt-1.5 text-[12.5px] text-(--ink-soft)">No weekly history yet.</p>
        )}
      </div>

      <div>
        <div className="text-[12.5px] font-semibold text-(--ink)">Tier pricing</div>
        {failed ? (
          <p className="mt-1.5 text-[12.5px] text-(--ink-soft)">Couldn&apos;t load this tier&apos;s pricing detail.</p>
        ) : !detail ? (
          <Skeleton className="mt-2 h-24" />
        ) : (
          <div className="mt-1 divide-y divide-(--line)">
            <DetailRow label="All-in price" value={pricing ? formatMoney(pricing.current_price) : null} />
            <DetailRow label="Itemized fees (fixed)" value={pricing?.fees_usd != null ? formatMoney(pricing.fees_usd) : null} />
            <DetailRow label="Face value" value={facePrice != null ? formatMoney(facePrice) : null} />
            <DetailRow label="Margin" value={pricing?.margin_pct != null ? formatRate(pricing.margin_pct) : null} />
            <DetailRow
              label="Price band"
              value={pricing?.min_price != null && pricing?.max_price != null ? `${formatMoney(pricing.min_price)} – ${formatMoney(pricing.max_price)}` : null}
            />
            <DetailRow label="Demand" value={pricing?.demand_signal ? titleCase(pricing.demand_signal) : null} />
            <DetailRow label="Last price change" value={pricing?.last_changed ? formatDate(pricing.last_changed) : null} />
            <DetailRow label="Active promotions" value={pricing?.active_promotions?.length ? formatNumber(pricing.active_promotions.length) : null} />
          </div>
        )}
      </div>
    </div>
  );
}

function TierRow({
  event,
  tier,
  open,
  onToggle,
  onAskAssistant,
}: {
  event: PacingEvent;
  tier: PacingTier;
  open: boolean;
  onToggle: () => void;
  onAskAssistant: (text: string) => void;
}) {
  const underPacing = tier.pace_vs_baseline_pts != null && tier.pace_vs_baseline_pts <= UNDER_PACE_ALERT_PTS;
  return (
    <li className="px-[18px] py-3">
      <div className="flex items-start gap-3">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={onToggle}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === "Enter" || keyEvent.key === " ") {
              keyEvent.preventDefault();
              onToggle();
            }
          }}
          className="-mx-1.5 min-w-0 flex-1 cursor-pointer rounded-lg px-1.5 py-0.5 transition-colors hover:bg-(--well)/50"
          aria-label={`${tier.tier ?? tier.product_id}, open pricing and weekly detail`}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Icon name="chevron-right" size={14} className={`text-(--ink-faint) transition-transform ${open ? "rotate-90" : ""}`} />
            <span className="min-w-28 text-[13.5px] font-semibold text-(--ink)">{tier.tier ?? tier.product_id}</span>
            {tier.price != null ? <span className="at-mono text-[12px] text-(--ink-soft)">{formatMoney(tier.price)} all-in</span> : null}
            <span className="ml-auto flex items-center gap-2">
              {tier.waitlist_depth != null && tier.waitlist_depth > 0 ? <Pill tone="warn">waitlist {formatNumber(tier.waitlist_depth)}</Pill> : null}
              <PaceChip pts={tier.pace_vs_baseline_pts} />
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 pl-[26px]">
            <div className="min-w-0 flex-1">
              <SellThroughBar sellThroughPct={tier.sell_through_pct} baselinePct={tier.baseline_pct} />
            </div>
            <span className="at-mono shrink-0 text-[11.5px] text-(--ink-soft)">
              {tier.sold != null && tier.capacity != null ? `${formatNumber(tier.sold)}/${formatNumber(tier.capacity)} sold` : ""}
              {tier.remaining != null ? ` · ${formatNumber(tier.remaining)} open` : ""}
            </span>
          </div>
          {tier.holds ? <div className="at-mono mt-1 pl-[26px] text-[11.5px] text-(--ink-soft)">{holdsSummary(tier.holds)}</div> : null}
        </div>
        {underPacing ? (
          <AskButton
            label="Ask"
            onClick={() =>
              onAskAssistant(
                `${event.event_name ?? event.event_id} ${tier.tier ?? tier.product_id} (${tier.product_id}) is ${Math.abs(
                  tier.pace_vs_baseline_pts ?? 0,
                ).toFixed(1)} pts behind its comparable-events pace. What would you propose?`,
              )
            }
          />
        ) : null}
      </div>
      {open ? <TierDetail tier={tier} /> : null}
    </li>
  );
}

function EventCard({ event, onAskAssistant }: { event: PacingEvent; onAskAssistant: (text: string) => void }) {
  const [openTier, setOpenTier] = useState<string | null>(null);
  const behind = event.tiers.filter((tier) => tier.pace_vs_baseline_pts != null && tier.pace_vs_baseline_pts <= UNDER_PACE_ALERT_PTS).length;
  return (
    <Panel
      title={<span className="at-display text-[19px]">{event.event_name ?? event.event_id}</span>}
      subtitle={[[event.venue, event.city].filter(Boolean).join(", "), formatDate(event.event_date), formatDaysToEvent(event.days_to_event)].filter(Boolean).join(" · ")}
      action={
        <>
          {behind ? (
            <Pill tone="danger" dot>
              {plural(behind, "tier")} behind pace
            </Pill>
          ) : null}
          {event.on_sale_date ? <span className="at-mono text-[11.5px] text-(--ink-soft)">on sale {formatDayMonth(event.on_sale_date)}</span> : null}
        </>
      }
    >
      <ul className="divide-y divide-(--line) pb-1">
        {event.tiers.map((tier) => (
          <TierRow
            key={tier.product_id}
            event={event}
            tier={tier}
            open={openTier === tier.product_id}
            onToggle={() => setOpenTier((current) => (current === tier.product_id ? null : tier.product_id))}
            onAskAssistant={onAskAssistant}
          />
        ))}
      </ul>
    </Panel>
  );
}

export default function EventsView({ refreshKey, onAskAssistant }: { refreshKey: number; onAskAssistant: (text: string) => void }) {
  const { data, failed } = useResource(fetchPacing, [refreshKey]);

  return (
    <div className="ac-reveal @container flex flex-col gap-4">
      <PageHeader title="Events" subtitle={data ? `${plural(data.events.length, "event")} on sale · Tick marks the comparable-events baseline` : undefined} />
      {failed && !data ? (
        <Notice>The entertainment API isn&apos;t reachable, so event pacing can&apos;t load.</Notice>
      ) : !data ? (
        <Skeleton className="h-96" />
      ) : data.events.length === 0 ? (
        <Notice>No events in the pacing book.</Notice>
      ) : (
        data.events.map((event) => <EventCard key={event.event_id} event={event} onAskAssistant={onAskAssistant} />)
      )}
    </div>
  );
}
