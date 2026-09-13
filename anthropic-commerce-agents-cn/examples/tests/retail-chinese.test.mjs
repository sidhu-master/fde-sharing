// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the retail storefront is presented in Simplified Chinese", async () => {
  const [layout, page, home, cart, orders] = await Promise.all([
    read("../retail/storefront-web/app/layout.tsx"),
    read("../retail/storefront-web/app/page.tsx"),
    read("../retail/storefront-web/components/views/HomeView.tsx"),
    read("../retail/storefront-web/components/CartPanel.tsx"),
    read("../retail/storefront-web/lib/orders.tsx"),
  ]);

  assert.match(layout, /<html\s+lang="zh-CN"/);
  for (const label of ["智能导购", "我的订单", "购物车"]) assert.ok(page.includes(label), label);
  for (const label of ["今日热门", "家庭露营"]) assert.ok(home.includes(label), label);
  assert.ok(orders.includes("查看全部订单"), "查看全部订单");
  for (const label of ["免运费", "小计", "去结算"]) assert.ok(cart.includes(label), label);
});

test("the retail merchant workspace is presented in Simplified Chinese", async () => {
  const [layout, page, home, catalog, orders, inventory] = await Promise.all([
    read("../retail/merchant-web/app/layout.tsx"),
    read("../retail/merchant-web/app/page.tsx"),
    read("../retail/merchant-web/components/views/HomeView.tsx"),
    read("../retail/merchant-web/components/views/CatalogView.tsx"),
    read("../retail/merchant-web/components/views/OrdersView.tsx"),
    read("../retail/merchant-web/components/views/InventoryView.tsx"),
  ]);

  assert.match(layout, /<html\s+lang="zh-CN"/);
  for (const label of ["商家工作台", "首页", "商品", "订单", "库存", "智能助手", "店铺经理", "业务记忆"]) {
    assert.ok(page.includes(label), label);
  }
  for (const label of ["今日待处理", "近期订单"]) assert.ok(home.includes(label), label);
  for (const label of ["咨询商品目录", "需要关注", "待优化内容"]) assert.ok(catalog.includes(label), label);
  for (const label of ["待处理问题", "起草回复"]) assert.ok(orders.includes(label), label);
  for (const label of ["低库存", "滞销商品", "补货方案"]) assert.ok(inventory.includes(label), label);
});

test("both retail agents are instructed to answer in Simplified Chinese", async () => {
  const config = await read("../retail/api/agent_config.py");
  assert.ok(config.includes("始终使用简体中文回答"));
  assert.ok(config.includes('assistant_name="ACME 智能导购"'));
});
