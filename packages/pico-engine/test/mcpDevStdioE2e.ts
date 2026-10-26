/**
 * Dev MCP stdio E2E: validate → install → raise → query (exit criterion #1).
 */

import test from "ava";
import * as fs from "fs";
import * as path from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { toTestKrlURL } from "./helpers/toTestKrlURL";
import { mcpToolJson, mcpToolText } from "./helpers/mcpToolResult";

const cliPath = path.resolve(__dirname, "../dist/cli.js");
const schemaKrlPath = path.resolve(
  __dirname,
  "../../../test-rulesets/io.picolabs.test.schema_ui.krl"
);

function devMcpTransport(baseUrl: string) {
  return new StdioClientTransport({
    command: process.execPath,
    args: [cliPath, "mcp", "--stdio"],
    env: {
      ...process.env,
      PICO_ENGINE_BASE_URL: baseUrl,
    },
    stderr: "pipe",
  });
}

test.serial(
  "dev MCP stdio: validate, install, raise, query",
  async (t) => {
    const pe = await startIsolatedEngine({ autoCreateRootPico: true });
    const transport = devMcpTransport(pe.base_url);
    const client = new Client({ name: "pico-engine-test", version: "0" });

    try {
      await client.connect(transport);

      const tools = await client.listTools();
      const names = new Set(tools.tools.map((tool) => tool.name));
      t.true(names.has("validate_krl"));
      t.true(names.has("install_ruleset"));
      t.true(names.has("raise_event"));
      t.true(names.has("query"));

      const status = await client.callTool({ name: "engine_status", arguments: {} });
      t.false(status.isError);
      const statusJson = mcpToolJson<{ uiEci?: string | null }>(status);
      t.truthy(statusJson.uiEci);
      const uiEci = statusJson.uiEci as string;

      const source = fs.readFileSync(schemaKrlPath, "utf8");
      const check = await client.callTool({
        name: "validate_krl",
        arguments: { source, filename: "io.picolabs.test.schema_ui.krl" },
      });
      t.false(check.isError);
      const checkJson = mcpToolJson<{ ok: boolean; rid?: string }>(check);
      t.true(checkJson.ok);
      t.is(checkJson.rid, "io.picolabs.test.schema_ui");

      const installUrl = toTestKrlURL("io.picolabs.test.schema_ui.krl");
      const installed = await client.callTool({
        name: "install_ruleset",
        arguments: { url: installUrl, eci: uiEci },
      });
      t.false(installed.isError, mcpToolText(installed));

      // UI channel policy allows engine_ui:*, not arbitrary app domains (see uiChannelPolicies.ts).
      const raised = await client.callTool({
        name: "raise_event",
        arguments: {
          eci: uiEci,
          domain: "engine_ui",
          name: "box",
          attrs: {},
        },
      });
      t.false(raised.isError, mcpToolText(raised));

      const schema = await client.callTool({
        name: "query",
        arguments: {
          eci: uiEci,
          rid: "io.picolabs.wrangler",
          name: "rulesetSchema",
          args: { rid: "io.picolabs.test.schema_ui" },
        },
      });
      t.false(schema.isError, mcpToolText(schema));
      const schemaJson = mcpToolJson<{ rid?: string; operations?: unknown[] }>(
        schema
      );
      t.is(schemaJson.rid, "io.picolabs.test.schema_ui");
      t.is(schemaJson.operations?.length, 1);
    } finally {
      await client.close();
      await pe.shutdown();
    }
  },
  { timeout: "2m" }
);
