// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

import { plural } from "web-shared";

/** Signed percentage points against baseline. */
export function formatPacePts(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
}

export function formatDaysToEvent(days: number | null | undefined): string {
  if (days == null) return "";
  if (days < 0) return "past";
  if (days === 0) return "tonight";
  return `in ${plural(days, "day")}`;
}
