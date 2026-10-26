/**
 * Dev MCP HTTP client against a running isolated engine.
 */

import test from "ava";
import fetch from "cross-fetch";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { EngineClient } = require("../mcp/engineClient.js") as {
  EngineClient: new (opts?: {
    baseUrl?: string;
    uiEci?: string;
  }) => {
    channelQuery: (
      eci: string,
      rid: string,
      name: string,
      args?: Record<string, unknown>
    ) => Promise<unknown>;
    evalKrl: (eci: string, rid: string, expr: string) => Promise<unknown>;
  };
};
import { startIsolatedEngine } from "./helpers/isolatedEngine";

test("GET /api/dev/local exposes root UI ECI on localhost", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const res = await fetch(`${pe.base_url}/api/dev/local`);
  t.is(res.status, 200);
  const body = (await res.json()) as {
    rootUiEci?: string;
    hasRoots?: boolean;
  };
  t.true(body.hasRoots);
  t.truthy(body.rootUiEci);

  const client = new EngineClient({
    baseUrl: pe.base_url,
    uiEci: body.rootUiEci,
  });
  const name = await client.channelQuery(
    body.rootUiEci!,
    "io.picolabs.pico-engine-ui",
    "name",
    {}
  );
  t.is(typeof name, "string");

  await pe.pf.db.close();
});

test("EngineClient eval_krl reads ruleset globals", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const dev = await fetch(`${pe.base_url}/api/dev/local`).then((r) => r.json());
  const uiEci = (dev as { rootUiEci: string }).rootUiEci;
  const client = new EngineClient({ baseUrl: pe.base_url, uiEci });
  const value = await client.evalKrl(
    uiEci,
    "io.picolabs.wrangler",
    "installedRIDs()"
  );
  t.true(Array.isArray(value));
  t.true((value as unknown[]).length > 0);

  await pe.pf.db.close();
});
