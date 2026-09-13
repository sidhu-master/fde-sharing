// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { AskButton, coverLabel, formatNumber, KindIcon, MiniBar, Notice, optionValuesLabel, PageHeader, Panel, Pill, plural, Skeleton, useResource } from "web-shared";
import { fetchAlerts } from "@/lib/api";
import { INVENTORY_KINDS } from "@/lib/kinds";
import type { InventoryAlert } from "@/lib/types";

function AlertRow({ alert, onAskAssistant }: { alert: InventoryAlert; onAskAssistant: (text: string) => void }) {
  const style = INVENTORY_KINDS[alert.kind];
  const soldOut = alert.stock === 0;
  const low = alert.kind === "low_stock";
  const chosen = optionValuesLabel(alert);
  const name = chosen ? `${alert.title}（${chosen}）` : alert.title;
  const prompt = low ? `为 ${name}（${alert.listing_id}）起草补货方案。` : `为 ${name}（${alert.listing_id}）制定降价方案。`;
  return (
    <li className="flex items-center gap-3 px-[18px] py-3">
      <KindIcon icon={style.icon} tone={soldOut ? "danger" : style.tone} />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium leading-snug text-(--ink)">
          {alert.title}
          {chosen ? <span className="font-normal text-(--ink-soft)"> · {chosen}</span> : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] tabular-nums text-(--ink-soft)">
          <span>{alert.listing_id}</span>
          {alert.sales_last_30d != null ? <span>· 近 30 天售出 {formatNumber(alert.sales_last_30d)} 件</span> : null}
          {low && alert.threshold != null ? <span>· 补货点 {formatNumber(alert.threshold)} 件</span> : null}
          {low && alert.stock > 0 && alert.storefront_visible ? (
            <Pill tone="warn" dot>
              商城显示“仅剩 {formatNumber(alert.stock)} 件”
            </Pill>
          ) : null}
          {soldOut && alert.storefront_visible === false ? <span>· 已从商城隐藏</span> : null}
        </div>
      </div>
      <div className="w-32 shrink-0 whitespace-nowrap text-right tabular-nums">
        <div className={`text-[15px] font-semibold ${soldOut ? "text-(--danger)" : low ? "text-(--warn)" : "text-(--ink)"}`}>
          {soldOut ? "0" : formatNumber(alert.stock)}
          <span className="ml-1 text-[11.5px] font-medium text-(--ink-soft)">件库存</span>
        </div>
        <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11.5px] text-(--ink-soft)">
          {/* Stock against the reorder threshold: empty at zero, full at twice the threshold. */}
          {low && alert.threshold ? <MiniBar value={alert.stock / (alert.threshold * 2)} tone={soldOut ? "danger" : "warn"} /> : null}
          {alert.days_of_cover != null && !soldOut ? <span>约可售 {Math.round(alert.days_of_cover)} 天</span> : soldOut ? <span>已售罄</span> : null}
        </div>
      </div>
      <AskButton label={low ? "补货方案" : "降价方案"} onClick={() => onAskAssistant(prompt)} />
    </li>
  );
}

export default function InventoryView({ refreshKey, onAskAssistant }: { refreshKey: number; onAskAssistant: (text: string) => void }) {
  const { data, failed } = useResource(fetchAlerts, [refreshKey]);

  const lowStock = (data?.inventory ?? [])
    .filter((alert) => alert.kind === "low_stock")
    .sort((a, b) => (a.days_of_cover ?? Infinity) - (b.days_of_cover ?? Infinity));
  const slowMovers = (data?.inventory ?? []).filter((alert) => alert.kind === "slow_mover");
  const tiedUp = slowMovers.reduce((sum, alert) => sum + alert.stock, 0);

  return (
    <div className="ac-reveal @container flex flex-col gap-4">
      <PageHeader
        title="库存"
        subtitle={data ? `${lowStock.length} 个低库存或售罄商品 · ${slowMovers.length} 个滞销商品${tiedUp ? `，占用 ${formatNumber(tiedUp)} 件库存` : ""}` : undefined}
      />
      {failed && !data ? (
        <Notice>无法连接商家 API，库存提醒加载失败。</Notice>
      ) : !data ? (
        <div className="grid gap-4 @4xl:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="grid items-start gap-4 @4xl:grid-cols-2">
          <Panel title="低库存" subtitle="按预计售罄时间排序">
            {lowStock.length === 0 ? (
              <p className="px-[18px] pb-4 text-[13.5px] text-(--ink-soft)">没有低库存商品。</p>
            ) : (
              <ul className="divide-y divide-(--line)">
                {lowStock.map((alert) => (
                  <AlertRow key={alert.listing_id} alert={alert} onAskAssistant={onAskAssistant} />
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="滞销商品" subtitle="库存明显高于近 30 天销量">
            {slowMovers.length === 0 ? (
              <p className="px-[18px] pb-4 text-[13.5px] text-(--ink-soft)">没有滞销商品。</p>
            ) : (
              <ul className="divide-y divide-(--line)">
                {slowMovers.map((alert) => (
                  <AlertRow key={alert.listing_id} alert={alert} onAskAssistant={onAskAssistant} />
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
