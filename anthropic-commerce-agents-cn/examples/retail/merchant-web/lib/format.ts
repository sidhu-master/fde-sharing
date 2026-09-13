// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

/** Retail-specific labels on top of web-shared's formatters. */

import { formatDayMonth, formatMoney, plural, type RecordRowData, titleCase } from "web-shared";
import { ORDER_STATUS } from "./kinds";
import type { RecentOrder } from "./types";

const CATEGORY_LABELS: Record<string, string> = {
  "beauty-personal-care": "美妆个护",
  fitness: "健身",
  "furniture-bedroom": "家具卧室",
  grocery: "食品杂货",
  "home-kitchen": "家居厨房",
  "kids-room": "儿童房",
  "office-electronics": "办公电子",
  "outdoor-camping": "户外露营",
  "pet-supplies": "宠物用品",
  "toys-games": "玩具游戏",
  travel: "旅行",
};

export function formatCategoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? titleCase(slug.replaceAll("-", "_"));
}

export function formatZhDayMonth(value: string): string {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export function orderRows(orders: RecentOrder[]): RecordRowData[] {
  return orders.map((order) => ({
    id: order.order_id,
    detail: `${order.items} 件商品`,
    sub: `${formatZhDayMonth(order.placed_at)} · ${formatMoney(order.total)}`,
    status: ORDER_STATUS[order.status] ?? { label: order.status.replaceAll("_", " "), tone: "muted" },
  }));
}
