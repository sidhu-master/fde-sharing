// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

import { formatMoney } from "web-shared";
import type { Product } from "./types";

const DESTINATION_GRADIENTS: Record<string, [string, string]> = {
  lisbon: ["#F4D9CC", "#C9D8D3"],
  kyoto: ["#E8D5D0", "#D8E0D6"],
  "mexico city": ["#F4DFC0", "#E5C8B8"],
  reykjavik: ["#CBD8DF", "#E6EAE6"],
  marrakesh: ["#EFD2B8", "#E0B9A0"],
  queenstown: ["#CFE0D8", "#DCE8E2"],
};

const GRADIENT_FALLBACKS = Object.values(DESTINATION_GRADIENTS);

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) {
    value = (value * 31 + text.charCodeAt(i)) >>> 0;
  }
  return value;
}

/** The seed keeps two items in one unmapped place from sharing a gradient. */
export function destinationGradientCss(city?: string | null, seed?: string): string {
  const key = city?.trim().toLowerCase();
  const [from, to] =
    (key && DESTINATION_GRADIENTS[key]) ||
    GRADIENT_FALLBACKS[hash(`${key ?? ""}·${seed ?? "acme-travel"}`) % GRADIENT_FALLBACKS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

export function productCity(product: Product): string | undefined {
  return product.attributes?.city ?? product.attributes?.destination_city ?? undefined;
}

/** Neighborhood before city, so cards in a one-city flow stay distinct. */
export function productPlace(product: Product): string | undefined {
  return product.attributes?.neighborhood ?? productCity(product);
}

// per_traveler folds into "/ person" so mixed data renders one unit.
const PRICE_UNIT_LABELS: Record<string, string> = {
  per_night: "/ night",
  per_person: "/ person",
  per_traveler: "/ person",
};

export function priceUnitLabel(unit?: string | null): string | null {
  if (!unit) return null;
  return PRICE_UNIT_LABELS[unit] ?? `/ ${unit.replace(/^per[_\s]+/, "").replace(/_/g, " ")}`;
}

export function productPriceUnit(product: Product): string | null {
  return priceUnitLabel(product.attributes?.price_unit);
}

export function formatPrice(value: number): string {
  return formatMoney(value, "USD", { whole: Number.isInteger(value) });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-13" → "Oct 13", from the string parts so no timezone shifts the day. */
export function shortDate(iso?: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${Number(match[3])}` : null;
}

function quantityNoun(productId: string): "nights" | "guests" | "travelers" | null {
  if (productId.startsWith("AL-STAY-")) return "nights";
  if (productId.startsWith("AL-EXP-")) return "guests";
  if (productId.startsWith("AL-FLT-")) return "travelers";
  return null;
}

export function quantityLabel(productId: string, quantity: number): string {
  const noun = quantityNoun(productId);
  if (!noun) return `× ${quantity}`;
  return `× ${quantity} ${quantity === 1 ? noun.slice(0, -1) : noun}`;
}
