/**
 * Mesh MCP: tool catalog matches channelSchema; HTTP auth surface.
 */

import * as crypto from "crypto";
import test from "ava";
import fetch from "cross-fetch";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { OAUTH_MESH_RULESET_RID } from "../src/oauth/meshOAuth";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { mcpToolJson } from "./helpers/mcpToolResult";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { meshToolCatalog, getChannelSchema, queryToolName, eventToolName } = require("../mcp/meshTools.js") as {
  meshToolCatalog: (schema: {
    events?: { domain: string; name: string }[];
    queries?: { rid: string; name: string }[];
  }) => Array<{ name: string; kind: string }>;
  getChannelSchema: (core: { picoFramework: unknown; rsRegistry: unknown }, eci: string) => {
    events: { domain: string; name: string }[];
    queries: { rid: string; name: string }[];
  };
  queryToolName: (rid: string, fn: string) => string;
  eventToolName: (domain: string, name: string) => string;
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
  rootUiEci: string,
  exposeMcp: boolean | "channel" | "mesh" | "both" = false,
  eventAllow: { domain: string; name: string } = { domain: "hook", name: "ping" }
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
          eventPolicy: { allow: [eventAllow], deny: [] },
          queryPolicy: {
            allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
            deny: [],
          },
          ...(exposeMcp
            ? {
                mcpPolicy: {
                  allow: (exposeMcp === true || exposeMcp === "channel"
                    ? ["channel"]
                    : exposeMcp === "mesh"
                      ? ["mesh"]
                      : ["channel", "mesh"]
                  ).map((surface) => ({ surface })),
                  deny: [],
                },
              }
            : {}),
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
    const hookEci = await createWebhookChannel(pe, acct.uiECI, true);
    const creds = await pe.oauth.createChannelSecret(hookEci);
    const token = await pe.oauth.clientCredentialsGrant({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      resource: `${pe.base_url}/mcp/${encodeURIComponent(hookEci)}`,
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

test("mesh MCP rejects a channel that is not exposed", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);
  const creds = await pe.oauth.createChannelSecret(hookEci);
  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    resource: `${pe.base_url}/mcp/${encodeURIComponent(hookEci)}`,
  });
  const channel = pe.pf.lookupChannel(hookEci).toReadOnly();
  t.deepEqual(channel.mcpPolicy, { allow: [], deny: [] });

  const res = await fetch(`${pe.base_url}/mcp/${encodeURIComponent(hookEci)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
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
  t.is(res.status, 403);

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

const SUBTREE_VERIFIER = "subtree-pkce-verifier-value";
const SUBTREE_CHALLENGE = crypto.createHash("sha256").update(SUBTREE_VERIFIER).digest("base64url");

function initializeBody() {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "test", version: "0" },
    },
  };
}

test("channel MCP refuses an event when the token has only mesh:read", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(
    pe,
    acct.uiECI,
    true,
    { domain: "wrangler", name: "new_channel_request" }
  );
  const creds = await pe.oauth.createChannelSecret(hookEci);
  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    resource: `${pe.base_url}/mcp/${encodeURIComponent(hookEci)}`,
    scope: "mesh:read",
  });
  t.is(token.scope, "mesh:read");
  const eventName = eventToolName("wrangler", "new_channel_request");
  t.true(
    meshToolCatalog(getChannelSchema(pe.core, hookEci)).some(
      (tool) => tool.kind === "event" && tool.name === eventName
    )
  );

  const init = await fetch(`${pe.base_url}/mcp/${encodeURIComponent(hookEci)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(initializeBody()),
  });
  t.is(init.status, 200);

  const eventCall = await fetch(`${pe.base_url}/mcp/${encodeURIComponent(hookEci)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "Mcp-Session-Id": init.headers.get("mcp-session-id") || "",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: eventName, arguments: {} },
    }),
  });
  t.is(eventCall.status, 403);
  t.true((eventCall.headers.get("www-authenticate") || "").includes('error="insufficient_scope"'));
  t.true((eventCall.headers.get("www-authenticate") || "").includes("mesh:act"));
  const body = await eventCall.json();
  t.is(body.error, "insufficient_scope");

  await pe.shutdown();
});

test.serial("whole-mesh MCP lists the subtree and only mesh-exposed channels", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  pe.pf.rootPicos()[0].rulesets[OAUTH_MESH_RULESET_RID] = { config: {}, instance: null };
  const root = pe.pf.rootPicos()[0];
  const meshEci = await createWebhookChannel(pe, acct.uiECI, "mesh");
  const closedEci = await createWebhookChannel(pe, acct.uiECI, "channel");
  const redirect_uri = "http://127.0.0.1:9999/callback";
  const app = await pe.oauth.registerApp(root.id, {
    name: "Mesh agent",
    redirect_uris: [redirect_uri],
    public_client: true,
  });
  const resource = `${pe.base_url}/mcp/mesh/${encodeURIComponent(acct.uiECI)}`;
  const redirect = await pe.oauth.approveAuthorization(
    { accountId: acct.account.accountId, rootPicoId: root.id },
    {
      client_id: app.client_id,
      redirect_uri,
      code_challenge: SUBTREE_CHALLENGE,
      code_challenge_method: "S256",
      scope: "mesh:read",
      resource,
      approved: true,
    }
  );
  const code = new URL(redirect).searchParams.get("code");
  const token = await pe.oauth.authorizationCodeGrant({
    grant_type: "authorization_code",
    code: code!,
    redirect_uri,
    client_id: app.client_id,
    code_verifier: SUBTREE_VERIFIER,
    resource,
  });

  const channelUrl = `${pe.base_url}/mcp/${encodeURIComponent(acct.uiECI)}`;
  const onChannel = await fetch(channelUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(initializeBody()),
  });
  t.is(onChannel.status, 401);

  const transport = new StreamableHTTPClientTransport(new URL(resource), {
    requestInit: { headers: { Authorization: `Bearer ${token.access_token}` } },
  });
  const client = new Client({ name: "subtree-test", version: "0" });
  try {
    await client.connect(transport);
    const tree = mcpToolJson<{
      id: string;
      rulesets: string[];
      children: unknown[];
    }>(await client.callTool({ name: "pico_tree", arguments: {} }));
    t.is(tree.id, root.id);
    t.true(tree.rulesets.includes("io.picolabs.wrangler"));

    const channels = mcpToolJson<Array<{ id: string }>>(
      await client.callTool({ name: "pico_channels", arguments: { pico: root.id } })
    );
    const ids = channels.map((channel) => channel.id);
    t.true(ids.includes(meshEci));
    t.false(ids.includes(closedEci));

    const name = mcpToolJson<string>(
      await client.callTool({
        name: "query",
        arguments: { eci: meshEci, rid: "io.picolabs.wrangler", name: "name", args: {} },
      })
    );
    t.is(typeof name, "string");

    const hidden = mcpToolJson<{ error: string }>(
      await client.callTool({
        name: "query",
        arguments: { eci: closedEci, rid: "io.picolabs.wrangler", name: "name", args: {} },
      })
    );
    t.true(hidden.error.includes("not exposed"));
  } finally {
    await client.close();
  }

  const raised = await fetch(resource, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "raise_event",
        arguments: { eci: meshEci, domain: "hook", type: "ping", attrs: {} },
      },
    }),
  });
  t.is(raised.status, 403);
  t.true((raised.headers.get("www-authenticate") || "").includes('error="insufficient_scope"'));
  t.true((raised.headers.get("www-authenticate") || "").includes("mesh:act"));

  await pe.shutdown();
});
