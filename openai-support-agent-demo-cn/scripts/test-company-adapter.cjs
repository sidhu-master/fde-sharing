const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const compile = (filename) => {
  const module = new Module(filename);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(path.dirname(filename));
  const baseRequire = module.require.bind(module);
  module.require = (name) => name === "@/config/tools-list" ? compile(path.join(root, "config/tools-list.ts")) : baseRequire(name);
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
  return module.exports;
};
const adapter = compile(path.join(root, "lib/company-adapter.ts"));
test("Responses history is converted without losing tool IDs or results", () => {
  const result = adapter.convertMessages([
    { role: "developer", content: "system" }, { role: "user", content: [{ text: "cancel" }] },
    { type: "file_search_call", id: "local" },
    { type: "function_call", name: "get_order", call_id: "call-1", arguments: '{"order_id":"ORD1001"}' },
    { type: "function_call_output", call_id: "call-1", output: '{"status":"pending"}' },
  ]);
  assert.equal(result.length, 4);
  assert.equal(result[0].role, "system");
  assert.equal(result[2].tool_calls[0].id, "call-1");
  assert.equal(result[3].tool_call_id, "call-1");
});
test("Chinese policy query retrieves actual local Markdown with source links", async () => {
  const found = await adapter.searchLocalKnowledge("退货政策是什么？");
  assert.ok(found.length > 0 && found.length <= 5);
  assert.ok(found.some((item) => /returns/.test(item.link)));
  assert.ok(found.every((item) => item.content && item.link.startsWith("/")));
});
test("invalid or ungrounded inputs do not invent knowledge", async () => {
  assert.throws(() => adapter.convertMessages([]), /USER_MESSAGE_REQUIRED/);
  assert.throws(() => adapter.convertMessages(Array(101).fill({})), /INPUT_INVALID/);
  assert.deepEqual(await adapter.searchLocalKnowledge("zzzzunknown"), []);
});
