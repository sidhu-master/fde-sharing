// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { type Order, type OrderNouns, useCatalogIndex } from "web-shared";
import { ProductImage } from "@/components/ProductTile";
import { fetchProducts } from "./api";

const STATUS_LABELS: Record<string, string> = {
  processing: "处理中",
  shipped: "已发货",
  out_for_delivery: "派送中",
  delayed: "配送延误",
  delivered: "已送达",
  cancelled: "已取消",
  return_initiated: "已申请退货",
  refunded: "已退款",
};

export const NOUNS: OrderNouns = {
  one: "个订单",
  title: "我的订单",
  cardTitle: "配送动态",
  allLabel: "查看全部订单",
  locale: "zh-CN",
  countLabel: (count) => `${count} 个订单`,
  moreLabel: (count) => `另外 ${count} 件`,
  noneOpen: "暂无配送中的订单",
  openVerb: "预计送达",
  delayedVerb: "更新后预计",
  closedWhen: (order, date) => order.status === "delivered" ? `${date} 已送达` : `${order.placed_at} 下单`,
  statusLabels: STATUS_LABELS,
  filters: [
    { id: "open", label: "配送中", match: (order) => ["processing", "shipped", "out_for_delivery", "delayed"].includes(order.status) },
    { id: "delayed", label: "已延误", match: (order) => order.status === "delayed" },
    { id: "closed", label: "历史订单", match: (order) => !["processing", "shipped", "out_for_delivery", "delayed"].includes(order.status) },
  ],
  handoff(order) {
    const ref = `订单 ${order.order_id}`;
    if (order.status === "delayed") return { label: "询问原因", prompt: `${ref} 为什么延误，预计什么时候送达？` };
    if (order.status === "delivered") return { label: "咨询退货", prompt: `${ref} 中的商品现在还能退货吗？` };
    return { label: "询问", prompt: `${ref} 目前是什么状态？` };
  },
};

/** The first line's photo, or its glyph tile when the catalog has no photo for it. */
export function OrderThumb({ order }: { order: Order }) {
  const catalog = useCatalogIndex(fetchProducts);
  const line = order.items[0];
  const product = catalog[line?.product_id ?? ""] ?? { product_id: line?.product_id ?? order.order_id, title: line?.title ?? "", price: 0 };
  return <ProductImage product={product} className="h-[42px] w-[42px] shrink-0 rounded-[9px] !text-xl" />;
}
