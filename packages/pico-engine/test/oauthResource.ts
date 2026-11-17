/**
 * PKCE S256 only, and RFC 8707 resource binding (1.10 §2 A5–A6).
 * A token's audience is /sky, /mcp/{eci}, or (authorization code) /mcp/mesh/{eci}. Legacy tokens have no resource
 * and stay valid on /sky/*.
 */

import * as crypto from "crypto";
import test from "ava";
import fetch from "cross-fetch";
import { OAUTH_MESH_RULESET_RID } from "../src/oauth/meshOAuth";
import {
  parseAuthorizeQuery,
  renderConsentHtml,
  type StoredOAuthApp,
} from "../src/oauth/acg";
import { classifyResource } from "../src/oauth/discovery";
import { OAuthError } from "../src/oauth/errors";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

const BASE = "http://engine.test:3000";
const VERIFIER = "test-pkce-verifier-for-resource";
const CHALLENGE = crypto.createHash("sha256").update(VERIFIER).digest("base64url");

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

test("PKCE plain and a repeated resource are rejected before a code is issued", (t) => {
  const err = t.throws(
    () =>
      parseAuthorizeQuery({
        client_id: "app_x",
        redirect_uri: "http://127.0.0.1/cb",
        response_type: "code",
        code_challenge: "abc",
        code_challenge_method: "plain",
      }),
    { instanceOf: OAuthError }
  );
  t.is((err as OAuthError).oauthError, "invalid_request");

  const many = t.throws(
    () =>
      parseAuthorizeQuery({
        client_id: "app_x",
        redirect_uri: "http://127.0.0.1/cb",
        response_type: "code",
        code_challenge: "abc",
        resource: [`${BASE}/sky`, `${BASE}/sky`],
      }),
    { instanceOf: OAuthError }
  );
  t.is((many as OAuthError).oauthError, "invalid_target");
});

test("a resource is this engine's /sky or one channel MCP URL", (t) => {
  t.deepEqual(classifyResource(BASE, `${BASE}/sky`), { kind: "sky" });
  t.deepEqual(classifyResource(BASE, `${BASE}/mcp/eci-1`), {
    kind: "mcp",
    surface: "channel",
    eci: "eci-1",
  });
  t.deepEqual(classifyResource(BASE, `${BASE}/mcp/mesh/eci-1`), {
    kind: "mcp",
    surface: "mesh",
    eci: "eci-1",
  });
  for (const resource of [
    "https://other.example/sky",
    `${BASE}/sky/`,
    `${BASE}/sky?x=1`,
    `${BASE}/mcp/eci-1#frag`,
    "not a url",
  ]) {
    const err = t.throws(() => classifyResource(BASE, resource), {
      instanceOf: OAuthError,
    });
    t.is((err as OAuthError).oauthError, "invalid_target");
  }
});

test("the consent page shows the resource the token will be bound to", (t) => {
  const app: StoredOAuthApp = {
    clientId: "app_x",
    rootPicoId: "root",
    name: "Integrator",
    redirectUris: ["http://127.0.0.1/cb"],
    publicClient: true,
    scopes: ["mesh"],
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const resource = `${BASE}/mcp/eci-1`;
  const html = renderConsentHtml(app, {
    client_id: app.clientId,
    redirect_uri: app.redirectUris[0],
    response_type: "code",
    code_challenge: CHALLENGE,
    code_challenge_method: "S256",
    resource,
  });
  t.true(html.includes(`Resource: <code>${resource}</code>`));
  t.true(html.includes(`name="resource" value="${resource}"`));
});

async function bootstrapAccount(pe: Awaited<ReturnType<typeof startIsolatedEngine>>) {
  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Owner" });
  return pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-owner" } as any,
  });
}

function enableOAuthMesh(pe: Awaited<ReturnType<typeof startIsolatedEngine>>) {
  const root = pe.pf.rootPicos()[0];
  root.rulesets[OAUTH_MESH_RULESET_RID] = { config: {}, instance: null };
}

async function createWebhookChannel(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  rootUiEci: string,
  tag: string
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
          tags: ["oauth-webhook", tag],
          eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
          queryPolicy: {
            allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
            deny: [],
          },
          mcpPolicy: { allow: [{ surface: "channel" }], deny: [] },
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

function mcpUrl(pe: { base_url: string }, eci: string): string {
  return `${pe.base_url}/mcp/${encodeURIComponent(eci)}`;
}

async function skyName(
  pe: { base_url: string },
  eci: string,
  token: string
): Promise<number> {
  const res = await fetch(
    `${pe.base_url}/sky/query/${encodeURIComponent(eci)}/io.picolabs.wrangler/name`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.status;
}

async function mcpInitialize(
  pe: { base_url: string },
  eci: string,
  token: string
): Promise<number> {
  const res = await fetch(mcpUrl(pe, eci), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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
  return res.status;
}

test.serial("client-credentials tokens are bound to the resource they name", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI, "mcp-a");
  const otherEci = await createWebhookChannel(pe, acct.uiECI, "mcp-b");
  const creds = await pe.oauth.createChannelSecret(hookEci);
  const sky = `${pe.base_url}/sky`;

  const unbound = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  });
  t.false("resource" in unbound);
  t.true(await pe.oauth.validateSkyBearerToken(unbound.access_token, hookEci));
  t.false(await pe.oauth.validateMcpBearerToken(unbound.access_token, hookEci));
  t.is(await skyName(pe, hookEci, unbound.access_token), 200);
  t.is(await mcpInitialize(pe, hookEci, unbound.access_token), 401);

  const mcp = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    resource: mcpUrl(pe, hookEci),
  });
  t.true(await pe.oauth.validateMcpBearerToken(mcp.access_token, hookEci));
  t.false(await pe.oauth.validateMcpBearerToken(mcp.access_token, otherEci));
  t.false(await pe.oauth.validateSkyBearerToken(mcp.access_token, hookEci));
  t.is(await skyName(pe, hookEci, mcp.access_token), 401);
  t.is(await mcpInitialize(pe, otherEci, mcp.access_token), 401);
  t.is(await mcpInitialize(pe, hookEci, mcp.access_token), 200);

  const skyToken = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    resource: sky,
  });
  t.true(await pe.oauth.validateSkyBearerToken(skyToken.access_token, hookEci));
  t.false(await pe.oauth.validateMcpBearerToken(skyToken.access_token, hookEci));
  t.is(await mcpInitialize(pe, hookEci, skyToken.access_token), 401);

  const meshAudience = await t.throwsAsync(
    () =>
      pe.oauth.clientCredentialsGrant({
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        resource: `${pe.base_url}/mcp/mesh/${encodeURIComponent(hookEci)}`,
      }),
    { instanceOf: OAuthError }
  );
  t.is((meshAudience as OAuthError).oauthError, "invalid_target");

  const wrongChannel = await t.throwsAsync(
    () =>
      pe.oauth.clientCredentialsGrant({
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        resource: mcpUrl(pe, otherEci),
      }),
    { instanceOf: OAuthError }
  );
  t.is((wrongChannel as OAuthError).oauthError, "invalid_target");

  await pe.shutdown();
});

test.serial(
  "an authorization-code token keeps its resource through refresh",
  async (t) => {
    const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
    const acct = await bootstrapAccount(pe);
    enableOAuthMesh(pe);
    const root = pe.pf.rootPicos()[0];
    const hookEci = await createWebhookChannel(pe, acct.uiECI, "acg-mcp");
    const otherEci = await createWebhookChannel(pe, acct.uiECI, "acg-other");
    const redirect_uri = "http://127.0.0.1:9999/callback";
    const app = await pe.oauth.registerApp(root.id, {
      name: "Integrator",
      redirect_uris: [redirect_uri],
      public_client: true,
    });
    const resource = mcpUrl(pe, hookEci);
    const session = { accountId: acct.account.accountId, rootPicoId: root.id };

    const plain = await t.throwsAsync(
      () =>
        pe.oauth.approveAuthorization(session, {
          client_id: app.client_id,
          redirect_uri,
          code_challenge: VERIFIER,
          code_challenge_method: "plain",
          approved: true,
        }),
      { instanceOf: OAuthError }
    );
    t.is((plain as OAuthError).oauthError, "invalid_request");

    const redirect = await pe.oauth.approveAuthorization(session, {
      client_id: app.client_id,
      redirect_uri,
      code_challenge: CHALLENGE,
      code_challenge_method: "S256",
      resource,
      approved: true,
    });
    const code = new URL(redirect).searchParams.get("code")!;

    const omitted = await t.throwsAsync(
      () =>
        pe.oauth.authorizationCodeGrant({
          grant_type: "authorization_code",
          code,
          redirect_uri,
          client_id: app.client_id,
          code_verifier: VERIFIER,
        }),
      { instanceOf: OAuthError }
    );
    t.is((omitted as OAuthError).oauthError, "invalid_target");

    const mismatched = await t.throwsAsync(
      () =>
        pe.oauth.authorizationCodeGrant({
          grant_type: "authorization_code",
          code,
          redirect_uri,
          client_id: app.client_id,
          code_verifier: VERIFIER,
          resource: `${pe.base_url}/sky`,
        }),
      { instanceOf: OAuthError }
    );
    t.is((mismatched as OAuthError).oauthError, "invalid_target");

    const token = await pe.oauth.authorizationCodeGrant({
      grant_type: "authorization_code",
      code,
      redirect_uri,
      client_id: app.client_id,
      code_verifier: VERIFIER,
      resource,
    });
    t.false("resource" in token);
    t.true(await pe.oauth.validateMcpBearerToken(token.access_token, hookEci));
    t.false(await pe.oauth.validateSkyBearerToken(token.access_token, hookEci));
    t.is(await skyName(pe, hookEci, token.access_token), 401);
    t.is(await mcpInitialize(pe, otherEci, token.access_token), 401);

    const refreshMissing = await t.throwsAsync(
      () =>
        pe.oauth.refreshTokenGrant({
          grant_type: "refresh_token",
          refresh_token: token.refresh_token!,
          client_id: app.client_id,
        }),
      { instanceOf: OAuthError }
    );
    t.is((refreshMissing as OAuthError).oauthError, "invalid_target");

    const refreshed = await pe.oauth.refreshTokenGrant({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token!,
      client_id: app.client_id,
      resource,
    });
    t.false(await pe.oauth.validateMcpBearerToken(token.access_token, hookEci));
    t.true(await pe.oauth.validateMcpBearerToken(refreshed.access_token, hookEci));
    t.false(await pe.oauth.validateSkyBearerToken(refreshed.access_token, hookEci));

    await pe.shutdown();
  }
);
