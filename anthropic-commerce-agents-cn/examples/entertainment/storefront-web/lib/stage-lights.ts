// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

/** Toggles `body.at-stage-lit` (globals.css); a module-level count covers several maps at once. */

import { useEffect, type RefObject } from "react";

let litCount = 0;

function setLit(on: boolean) {
  litCount = Math.max(0, litCount + (on ? 1 : -1));
  document.body.classList.toggle("at-stage-lit", litCount > 0);
}

export function useStageLights(ref: RefObject<Element | null>) {
  useEffect(() => {
    const element = ref.current;
    if (element == null || typeof IntersectionObserver === "undefined") return;
    let lit = false;
    const apply = (on: boolean) => {
      if (on === lit) return;
      lit = on;
      setLit(on);
    };
    const observer = new IntersectionObserver(
      ([entry]) => apply(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      apply(false);
    };
  }, [ref]);
}
