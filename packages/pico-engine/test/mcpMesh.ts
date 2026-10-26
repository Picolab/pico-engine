/**
 * Mesh MCP: tool catalog matches channelSchema; HTTP auth surface.
 */

import test from "ava";
import fetch from "cross-fetch";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { mcpToolJson } from "./helpers/mcpToolResult";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { meshToolCatalog, getChannelSchema, queryToolName } = require("../mcp/meshTools.js") as {
  meshToolCatalog: (schema: {
    events?: { domain: string; name: string }[];
    queries?: { rid: string; name: string }[];
  }) => Array<{ name: string; kind: string }>;
  getChannelSchema: (core: { picoFramework: unknown; rsRegistry: unknown }, eci: string) => {
    events: { domain: string; name: string }[];
    queries: { rid: string; name: string }[];
  };
  queryToolName: (rid: string, fn: string) => string;
};

function fakeAuthenticator(): WebAuthnAdapter {
  let n = 0;
  return {
    async generateRegistrationOptions(req) {
      n += 1;
      return {
        challenge: `reg-${n}`,
        user: { id: req.userID, name: req.userName, displayName: req.userDisplayName },
      } as any;
    },
    async verifyRegistration({ response }) {
      return {
        verified: true,
        credential: {
          id: (response as any).id,
          publicKey: new Uint8Array([1]),
          counter: 0,
          transports: ["internal"],
        },
      };
    },
    async generateAuthenticationOptions() {
      n += 1;
      return { challenge: `auth-${n}` } as any;
    },
    async verifyAuthentication() {
      return { verified: true, newCounter: 1 };
    },
  };
}

async function bootstrapAccount(pe: Awaited<ReturnType<typeof startIsolatedEngine>>) {
  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Owner" });
  return pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-owner" } as any,
  });
}

async function createWebhookChannel(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  rootUiEci: string
): Promise<string> {
  const before = await pe.pf.query({
    eci: rootUiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  });
  const beforeIds = new Set((before.channels || []).map((c: { id: string }) => c.id));
  await pe.pf.eventQuery(
    {
      eci: rootUiEci,
      domain: "engine_ui",
      name: "new_channel",
      data: {
        attrs: {
          tags: ["oauth-webhook", "mcp-test"],
          eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
          queryPolicy: {
            allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
            deny: [],
          },
        },
      },
      time: 0,
    },
    {
      eci: rootUiEci,
      rid: "io.picolabs.pico-engine-ui",
      name: "pico",
      args: {},
    }
  );
  const after = await pe.pf.query({
    eci: rootUiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  });
  const created = (after.channels || []).find(
    (c: { id: string }) => !beforeIds.has(c.id)
  );
  if (!created?.id) {
    throw new Error("Failed to create webhook channel");
  }
  return created.id as string;
}

test("mesh tool catalog matches channelSchema for a narrow OAuth channel", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);

  const fromCore = getChannelSchema(pe.core, hookEci);
  const catalog = meshToolCatalog(fromCore);

  t.is(catalog.filter((x) => x.kind === "event").length, fromCore.events.length);
  t.is(catalog.filter((x) => x.kind === "query").length, fromCore.queries.length);

  for (const ev of fromCore.events) {
    t.true(
      catalog.some(
        (tool) =>
          tool.kind === "event" &&
          (tool as { domain: string }).domain === ev.domain &&
          (tool as { eventName: string }).eventName === ev.name
      )
    );
  }
  for (const q of fromCore.queries) {
    t.true(
      catalog.some(
        (tool) =>
          tool.kind === "query" &&
          (tool as { rid: string }).rid === q.rid &&
          (tool as { queryName: string }).queryName === q.name
      )
    );
  }

  await pe.shutdown();
});

test.serial(
  "mesh MCP Streamable HTTP: listTools and callTool match channelSchema",
  async (t) => {
    const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
    const acct = await bootstrapAccount(pe);
    const hookEci = await createWebhookChannel(pe, acct.uiECI);
    const creds = await pe.oauth.createChannelSecret(hookEci);
    const token = await pe.oauth.clientCredentialsGrant({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
    });

    const expected = meshToolCatalog(getChannelSchema(pe.core, hookEci));
    const expectedNames = new Set(expected.map((row) => row.name));

    const transport = new StreamableHTTPClientTransport(
      new URL(`${pe.base_url}/mcp/${encodeURIComponent(hookEci)}`),
      {
        requestInit: {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        },
      }
    );
    const client = new Client({ name: "pico-engine-mesh-test", version: "0" });

    try {
      await client.connect(transport);

      const listed = await client.listTools();
      const listedNames = new Set(listed.tools.map((tool) => tool.name));
      t.deepEqual(listedNames, expectedNames);

      const nameTool = queryToolName("io.picolabs.wrangler", "name");
      t.true(listedNames.has(nameTool));

      const called = await client.callTool({
        name: nameTool,
        arguments: {},
      });
      t.false(called.isError);
      const value = mcpToolJson<string | { error?: string }>(called);
      t.is(typeof value, "string");
      t.truthy(value);
    } finally {
      await client.close();
      await pe.shutdown();
    }
  },
  { timeout: "2m" }
);

test("mesh MCP HTTP requires bearer token", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);

  const res = await fetch(`${pe.base_url}/mcp/${encodeURIComponent(hookEci)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "test", version: "0" },
      },
    }),
  });
  t.is(res.status, 401);

  await pe.shutdown();
});

test("mesh MCP tool call outside channel policy returns policy error", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);
  const creds = await pe.oauth.createChannelSecret(hookEci);
  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  });

  const denied = await fetch(
    `${pe.base_url}/sky/query/${encodeURIComponent(hookEci)}/io.picolabs.wrangler/sky`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );
  const body = await denied.json();
  t.not(denied.status, 500);
  t.truthy(body.error);

  await pe.shutdown();
});
