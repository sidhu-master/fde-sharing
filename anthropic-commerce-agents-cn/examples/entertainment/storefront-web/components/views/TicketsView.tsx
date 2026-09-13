// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { AskButton, formatDate, Notice, PageHeader, Panel, plural, StorePage, useCatalogIndex, useStoreFrame } from "web-shared";
import { fetchProducts } from "@/lib/api";
import { useLive } from "@/lib/live";
import type { Product, WaitlistEntry } from "@/lib/types";
import { EMPTY_WALLET, shows, ticketAsk } from "@/lib/wallet";
import WalletPass from "../WalletPass";

/** One waitlist entry with its position ring. */
function WaitlistRow({ entry, product }: { entry: WaitlistEntry; product?: Product }) {
  const attrs = product?.attributes ?? {};
  const progress = 1 / Math.max(1, entry.position);
  return (
    <div className="flex items-center gap-3 rounded-(--radius) border border-(--line) bg-(--well)/60 p-3">
      <svg viewBox="0 0 36 36" className="h-9 w-9 shrink-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(6, progress * 94.2)} 94.2`}
        />
      </svg>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-(--ink)">
          You&apos;re <span className="at-mono text-(--accent)">#{entry.position}</span> in line
          <span className="at-mono ml-1.5 text-[11px] font-normal text-(--ink-soft)">× {entry.quantity}</span>
        </p>
        <p className="truncate text-[11.5px] text-(--ink-soft)">
          {attrs.event_name ?? entry.product_id}
          {attrs.tier ? ` · ${attrs.tier}` : ""}
        </p>
        <p className="text-[11px] text-(--ink-soft)/80">Moves up on its own. When seats come back to you, a claim window opens at the top of the page.</p>
      </div>
    </div>
  );
}

export default function TicketsView() {
  const { ask } = useStoreFrame();
  const { tickets, waitlist, refreshTickets } = useLive();
  const catalog = useCatalogIndex(fetchProducts);
  const pending = tickets.filter((ticket) => ticket.status === "transfer_pending").length;
  const events = new Set(tickets.map((ticket) => ticket.event)).size;
  const subtitle = tickets.length
    ? `${plural(tickets.length, "ticket")} across ${plural(events, "show")}${pending ? `, ${plural(pending, "transfer")} pending` : ""}. Ask ACME Assistant about a transfer, resale, or refund.`
    : EMPTY_WALLET;
  return (
    <StorePage>
      <PageHeader title="Tickets" subtitle={subtitle} />
      {waitlist.length ? (
        <Panel title="Waitlist" subtitle={plural(waitlist.length, "show")}>
          <div className="space-y-2 px-[18px] pb-4">
            {waitlist.map((entry) => (
              <WaitlistRow key={`${entry.product_id}-${entry.position}`} entry={entry} product={catalog[entry.product_id]} />
            ))}
          </div>
        </Panel>
      ) : null}
      {tickets.length ? (
        shows(tickets).map(({ ticket: first, passes }) => (
          <Panel
            key={`${first.event}-${first.date}`}
            title={<span className="at-display text-[18px] uppercase">{first.event ?? "Event"}</span>}
            subtitle={[first.date ? formatDate(first.date) : null, first.venue, plural(passes.length, "ticket")].filter(Boolean).join(" · ")}
            action={<AskButton label="Ask about these tickets" onClick={() => ask(ticketAsk(first))} />}
          >
            <div className="grid gap-3 px-[18px] pb-[18px] md:grid-cols-2">
              {passes.map((ticket) => (
                <WalletPass key={ticket.ticket_id} ticket={ticket} onRefresh={refreshTickets} />
              ))}
            </div>
          </Panel>
        ))
      ) : (
        <Notice>{EMPTY_WALLET}</Notice>
      )}
    </StorePage>
  );
}
