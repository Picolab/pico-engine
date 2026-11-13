/**
 * Dev MCP Try It! tools over stdio: list the demos, run one the way the
 * developer UI does, check on it, read its cookbook page, and remove it.
 */

import test from "ava";
import * as path from "path";
import fetch from "cross-fetch";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { mcpToolJson, mcpToolText } from "./helpers/mcpToolResult";

const cliPath = path.resolve(__dirname, "../dist/cli.js");

interface RunResult {
  demo: string;
  folder: string;
  uiEci: string;
  tryItEci: string;
  ready: boolean;
  stage: string;
  links: Array<{ label: string; url: string }>;
  whatToLookForAndTry: string | null;
  resources: { overview: string; instructions: string };
}

test.serial(
  "dev MCP Try It!: list, run, status, cookbook resource, remove",
  async (t) => {
    const pe = await startIsolatedEngine({ autoCreateRootPico: true });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cliPath, "mcp", "--stdio"],
      env: { ...process.env, PICO_ENGINE_BASE_URL: pe.base_url },
      stderr: "pipe",
    });
    const client = new Client({ name: "pico-engine-test", version: "0" });

    try {
      await client.connect(transport);
      const names = new Set((await client.listTools()).tools.map((tool) => tool.name));
      for (const name of ["list_try_it_demos", "run_try_it_demo", "try_it_status"]) {
        t.true(names.has(name), name);
      }

      const listed = await client.callTool({ name: "list_try_it_demos", arguments: {} });
      t.false(listed.isError, mcpToolText(listed));
      const list = mcpToolJson<{ show: string; demos: Array<{ folder: string; shows: string; whatToLookForAndTry: string }> }>(listed);
      t.is(list.show, "root_only");
      t.is(list.demos[0].folder, "echo", "in the tab's order");
      t.true(list.demos.every((d) => d.shows && d.whatToLookForAndTry));

      const missing = await client.callTool({ name: "run_try_it_demo", arguments: { demo: "nope" } });
      t.true(missing.isError);
      t.regex(mcpToolText(missing), /Folders: echo/);

      const ran = await client.callTool({ name: "run_try_it_demo", arguments: { demo: "echo" } });
      t.false(ran.isError, mcpToolText(ran));
      const run = mcpToolJson<RunResult>(ran);
      t.true(run.ready);
      t.is(run.folder, "echo");
      t.is(run.links.length, 1);
      t.truthy(run.whatToLookForAndTry);

      const appEci = run.links[0].url.split("/ui/")[1].split("/")[0];
      const said = (await fetch(`${pe.base_url}/sky/event/${appEci}/mcp/echo/hello`).then((r) => r.json())) as {
        directives: Array<{ options: { something: string } }>;
      };
      t.is(said.directives[0].options.something, "Hello World");

      const status = await client.callTool({ name: "try_it_status", arguments: {} });
      t.false(status.isError, mcpToolText(status));
      const running = mcpToolJson<{ running: Array<{ folder: string; ready: boolean; uiEci: string }> }>(status).running;
      t.deepEqual(
        running.map((r) => [r.folder, r.ready, r.uiEci]),
        [["echo", true, run.uiEci]]
      );

      const page = await client.readResource({ uri: run.resources.overview });
      t.regex(String((page.contents[0] as { text?: string }).text), /^# Echo/);
      const resources = (await client.listResources()).resources.map((r) => r.uri);
      t.true(resources.includes("pico://docs/patterns_and_tips/README"));
      t.true(resources.includes("pico://docs/cookbook/kblog/instructions"));
      t.true(resources.includes("pico://docs/wrangler/relationships"));

      const collection = mcpToolJson<RunResult>(
        await client.callTool({ name: "run_try_it_demo", arguments: { demo: "Collection", name: "Rooms demo" } })
      );
      t.true(collection.ready, "a demo of several picos");
      t.is(collection.links[0].label, "Rooms");
      await client.callTool({ name: "delete_pico", arguments: { eci: collection.uiEci } });

      const removed = await client.callTool({ name: "delete_pico", arguments: { eci: run.uiEci } });
      t.false(removed.isError, mcpToolText(removed));
      const after = mcpToolJson<{ running: unknown[] }>(
        await client.callTool({ name: "try_it_status", arguments: {} })
      );
      t.deepEqual(after.running, []);
    } finally {
      await client.close();
      await pe.shutdown();
    }
  },
  { timeout: "2m" }
);
