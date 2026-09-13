// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useId } from "react";
import { formatMoney, useCatalogIndex, safeHandoffs } from "web-shared";
import { fetchProducts } from "@/lib/api";
import type { CheckoutPayload, Product } from "@/lib/types";
import { STORE_POLICY } from "@/lib/storePolicy";
import { DeliveryPromise, ProductImage } from "../ProductTile";

export default function CheckoutSummary({ payload }: { payload: CheckoutPayload }) {
  const cart = payload.cart;
  const handoffs = safeHandoffs(payload.handoffs);
  // Several summaries can coexist across turns, so the describedby id is per card.
  const handoffNoteId = useId();
  // Summary lines carry only title, price, and quantity; the catalog supplies delivery
  // dates and thumbnails.
  const catalog = useCatalogIndex(fetchProducts);
  // The policy says "over" the threshold, so a cart at exactly the threshold is not free.
  const freeShipping = cart.subtotal > STORE_POLICY.freeShippingThreshold;
  return (
    <section data-checkout-card className="rounded-2xl border-2 border-(--accent) bg-(--card) p-4 shadow-(--shadow-sm)">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-(--ink)">订单待结算</h3>
        <div className="flex items-center gap-1.5">
          <span className="whitespace-nowrap rounded-full border border-(--line) bg-(--well)/60 px-2.5 py-0.5 text-[11px] font-semibold text-(--ink-soft)">
            尚未扣款
          </span>
          {payload.fulfillment_method ? (
            <span className="rounded-full bg-(--accent-soft) px-2.5 py-0.5 text-[13px] font-semibold capitalize text-(--ink)">
              {payload.fulfillment_method}
            </span>
          ) : null}
        </div>
      </div>
      {payload.note ? <p className="mt-1 text-[13px] text-(--ink-soft)">{payload.note}</p> : null}
      <div className="mt-3 space-y-2 rounded-lg bg-(--well)/60 p-3 text-sm">
        {cart.items.map((item) => {
          const product: Product =
            catalog[item.product_id] ?? {
              product_id: item.product_id,
              title: item.title,
              price: item.price,
            };
          return (
            <div key={item.product_id} className="flex items-center gap-2.5">
              <ProductImage
                product={product}
                className="h-10 w-10 shrink-0 rounded-lg !text-xl"
              />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="line-clamp-1 text-(--ink)" title={item.title}>
                    {item.title} × {item.quantity}
                  </span>
                  <span className="shrink-0 text-(--ink)">{formatMoney(item.line_total)}</span>
                </div>
                <DeliveryPromise product={product} />
              </div>
            </div>
          );
        })}
        <div className="flex justify-between border-t border-(--line) pt-1.5 text-(--ink)">
          <span>小计</span>
          <span>{formatMoney(cart.subtotal, cart.currency)}</span>
        </div>
        <div className="flex justify-between gap-2 text-(--ink)">
          <span>
            配送{" "}
            <span className="text-[13px] text-(--ink-soft)">
              标准配送 · {STORE_POLICY.standardShippingEta}
            </span>
          </span>
          <span className={freeShipping ? "font-medium text-(--ok)" : "text-(--ink)"}>
            {freeShipping ? "免费" : "结算时计算"}
          </span>
        </div>
        {!freeShipping && STORE_POLICY.freeShippingThreshold - cart.subtotal > 0 ? (
          <div className="flex justify-between text-[13px] text-(--ink-soft)">
            <span>
              再买 {formatMoney(STORE_POLICY.freeShippingThreshold - cart.subtotal)} 即可免运费
            </span>
          </div>
        ) : null}
        <div className="flex justify-between text-(--ink)">
          <span>税费</span>
          <span>结算时计算</span>
        </div>
        <div className="flex justify-between border-t border-(--line) pt-1.5 text-base font-bold text-(--ink)">
          <span>预计总计</span>
          <span>{formatMoney(cart.subtotal, cart.currency)}</span>
        </div>
        <p className="text-[11px] leading-snug text-(--ink-soft)">
          {freeShipping ? "未含税费" : "未含运费与税费"}；最终金额将在结算页显示。
        </p>
      </div>
      <p className="mt-2 text-[11px] text-(--ink-soft)">{STORE_POLICY.returnsLine}</p>
      {handoffs.length ? (
        // The backend named where payment happens (a hosted checkout URL, or one per seller).
        <div className="mt-3 flex flex-col gap-2">
          {handoffs.map((h) => (
            <a
              key={h.url}
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby={handoffNoteId}
              className="w-full rounded-xl bg-(--accent) py-2.5 text-center text-sm font-bold text-(--ink)"
            >
              {h.label ?? (h.seller ? `前往 ${h.seller} 结算` : "继续结算")}
            </a>
          ))}
        </div>
      ) : (
        // Disabled so assistive tech is not offered a focusable no-op.
        <button
          disabled
          aria-disabled
          aria-describedby={handoffNoteId}
          className="mt-3 w-full cursor-not-allowed rounded-xl bg-(--accent) py-2.5 text-sm font-bold text-(--ink) opacity-90"
          title="此处不会扣款，付款将在结算页完成。"
        >
          继续结算
        </button>
      )}
      <p id={handoffNoteId} className="mt-2 text-center text-[11px] text-(--ink-soft)/80">
        此处不会扣款，付款将在结算页完成。
      </p>
    </section>
  );
}
