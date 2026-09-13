// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";

const examplesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const verticals = ["entertainment", "retail", "telecom", "travel"];
const surfaces = ["merchant-web", "storefront-web"];

for (const vertical of verticals) {
  for (const surface of surfaces) {
    test(`${vertical}/${surface} generates shared Tailwind utilities`, async () => {
      const cssPath = path.join(examplesDir, vertical, surface, "app", "globals.css");
      const input = await readFile(cssPath, "utf8");
      const result = await postcss([tailwindcss()]).process(input, { from: cssPath });

      for (const utility of [".flex {", ".grid {", ".rounded-2xl {"]) {
        assert.ok(result.css.includes(utility), `${cssPath} did not generate ${utility}`);
      }

      if (vertical === "retail" && surface === "storefront-web") {
        assert.ok(
          result.css.includes(".h-\\[42px\\] {"),
          `${cssPath} did not scan the retail order image utilities`,
        );
      }
    });
  }
}
