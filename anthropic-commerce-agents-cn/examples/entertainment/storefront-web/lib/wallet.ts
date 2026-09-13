// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

/** The wallet as the home and the Tickets view group and word it. */

import type { WalletTicket } from "./types";

export const EMPTY_WALLET = "Nothing in the wallet yet. Held seats become tickets when you check out.";

/** "my The Headliner tickets" reads wrong; the tour suffix goes too. */
function eventName(ticket: WalletTicket): string {
  return (ticket.event ?? "upcoming").replace(/\s+[—-]\s+.*$/, "");
}

/** The wallet grouped by show, in wallet order. */
export function shows(tickets: WalletTicket[]): { ticket: WalletTicket; passes: WalletTicket[] }[] {
  const byShow = new Map<string, { ticket: WalletTicket; passes: WalletTicket[] }>();
  for (const ticket of tickets) {
    const key = `${ticket.event}|${ticket.date}`;
    const show = byShow.get(key) ?? { ticket, passes: [] };
    show.passes.push(ticket);
    byShow.set(key, show);
  }
  return [...byShow.values()];
}

export function ticketAsk(ticket: WalletTicket): string {
  return `What are my options for my ${eventName(ticket)} tickets: transfer, resale, or a refund?`;
}
