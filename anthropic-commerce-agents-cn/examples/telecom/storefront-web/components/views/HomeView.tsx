// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { Greeting, type Starter, Starters } from "web-shared";
import { formatPrice, usageOf } from "@/lib/format";
import type { AccountContext } from "@/lib/types";
import PlanPanel, { ASK_PLAN_FIT, NO_LINE } from "../PlanPanel";

const STARTERS: Starter[] = [
  { icon: "signal", prompt: ASK_PLAN_FIT },
  { icon: "tag", prompt: "Am I due for a phone upgrade?" },
  { icon: "home", prompt: "Would bundling home internet save me money?" },
  { icon: "search", prompt: "What's the early termination fee?" },
];

/** One sentence on where the line stands: over its allowance and what that costs, or on track. */
function Brief({ account }: { account: AccountContext }) {
  const usage = usageOf(account);
  const topUps = account.recent_usage.top_up_spend_usd_last_3_months;
  if (usage.over) {
    return (
      <>
        <span className="font-semibold text-(--warn)">
          You average {usage.avg} GB on a {usage.cap} GB plan{topUps ? `; top-ups came to ${formatPrice(topUps)} over three months` : ""}.
        </span>{" "}
        Ask which plan fits, and ACME Assistant compares them against your usage with the terms as written.
      </>
    );
  }
  return <>Your line is on track this cycle. Ask about plans, phones, or home fiber, and ACME Assistant quotes the terms as written.</>;
}

export default function HomeView({ shopperName, account }: { shopperName: string; account: { account: AccountContext | null } | null }) {
  const line = account?.account ?? null;
  return (
    <div className="flex flex-col gap-4">
      <Greeting
        eyebrow={
          account ? (
            <span className="am-fig">
              <b>●</b> {line ? `${line.current_plan.name} · line active` : "No line yet"}
            </span>
          ) : null
        }
        title={
          <h1 className="am-hero">
            Let&apos;s read the <strong>fine print</strong> together, {shopperName}.
          </h1>
        }
      >
        {account ? line ? <Brief account={line} /> : NO_LINE : null}
      </Greeting>
      <Starters items={STARTERS} />
      <PlanPanel account={account} />
    </div>
  );
}
