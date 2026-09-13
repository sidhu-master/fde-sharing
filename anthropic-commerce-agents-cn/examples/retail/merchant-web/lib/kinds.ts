// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

/** How each kind of retail record shows: its label, icon, and tone. */

import type { KindStyle, Tone } from "web-shared";
import type { InventoryAlert, ListingStatus, OrderIssue } from "./types";

export const ISSUE_KINDS: Record<OrderIssue["kind"], KindStyle> = {
  delayed: { label: "配送延误", icon: "truck", tone: "warn" },
  return_spike: { label: "退货激增", icon: "return", tone: "danger" },
  buyer_message: { label: "买家留言", icon: "message", tone: "info" },
  damaged: { label: "商品损坏", icon: "alert", tone: "danger" },
};

export const INVENTORY_KINDS: Record<InventoryAlert["kind"], KindStyle> = {
  low_stock: { label: "低库存", icon: "low", tone: "warn" },
  slow_mover: { label: "滞销", icon: "clock", tone: "muted" },
};

export const LISTING_STATUS: Record<ListingStatus, { label: string; tone: Tone }> = {
  active: { label: "销售中", tone: "ok" },
  paused: { label: "已暂停", tone: "muted" },
  draft: { label: "草稿", tone: "info" },
  out_of_stock: { label: "已售罄", tone: "danger" },
};

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  processing: { label: "处理中", tone: "muted" },
  shipped: { label: "已发货", tone: "info" },
  out_for_delivery: { label: "派送中", tone: "info" },
  delivered: { label: "已送达", tone: "ok" },
  delayed: { label: "配送延误", tone: "warn" },
  cancelled: { label: "已取消", tone: "muted" },
  return_initiated: { label: "已申请退货", tone: "violet" },
  refunded: { label: "已退款", tone: "ok" },
};
