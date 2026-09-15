/**
 * HTTP surface auth: passkey sessions on /c/*, bearer on oauth-webhook, mesh
 * OAuth rules.
 */

import test from "ava";
process.env.PICO_ENGINE_ALLOW_LOCALHOST_C = "0";
import fetch from "cross-fetch";
import { OAUTH_MESH_RULESET_RID } from "../src/oauth";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

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
  const beforeIds = new Set((before.channels || []).map((c: any) => c.id));
  await pe.pf.eventQuery(
    {
      eci: rootUiEci,
      domain: "engine_ui",
      name: "new_channel",
      data: {
        attrs: {
          tags: ["oauth-webhook", "test-hook"],
          eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
          queryPolicy: { allow: [{ rid: "io.picolabs.wrangler", name: "name" }], deny: [] },
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
  const created = (after.channels || []).find((c: any) => !beforeIds.has(c.id));
  if (!created?.id) {
    throw new Error("Failed to create webhook channel");
  }
  return created.id as string;
}

async function createMeshOAuthExemptChannel(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  rootUiEci: string
): Promise<string> {
  const before = await pe.pf.query({
    eci: rootUiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  });
  const beforeIds = new Set((before.channels || []).map((c: any) => c.id));
  await pe.pf.eventQuery(
    {
      eci: rootUiEci,
      domain: "engine_ui",
      name: "new_channel",
      data: {
        attrs: {
          tags: ["mesh-oauth-exempt", "test-exempt"],
          eventPolicy: { allow: [{ domain: "test", name: "ping" }], deny: [] },
          queryPolicy: { allow: [{ rid: "io.picolabs.wrangler", name: "name" }], deny: [] },
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
  const created = (after.channels || []).find((c: any) => !beforeIds.has(c.id));
  if (!created?.id) {
    throw new Error("Failed to create mesh-oauth-exempt channel");
  }
  return created.id as string;
}

async function createOpenChannel(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  rootUiEci: string
): Promise<string> {
  const before = await pe.pf.query({
    eci: rootUiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  });
  const beforeIds = new Set((before.channels || []).map((c: any) => c.id));
  await pe.pf.eventQuery(
    {
      eci: rootUiEci,
      domain: "engine_ui",
      name: "new_channel",
      data: {
        attrs: {
          tags: ["test-open"],
          eventPolicy: { allow: [{ domain: "test", name: "ping" }], deny: [] },
          queryPolicy: { allow: [{ rid: "io.picolabs.wrangler", name: "name" }], deny: [] },
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
  const created = (after.channels || []).find((c: any) => !beforeIds.has(c.id));
  if (!created?.id) {
    throw new Error("Failed to create open channel");
  }
  return created.id as string;
}

function enableOAuthMesh(pe: Awaited<ReturnType<typeof startIsolatedEngine>>) {
  const root = pe.pf.rootPicos()[0];
  root.rulesets[OAUTH_MESH_RULESET_RID] = { config: {}, instance: null };
}

test("/c/* requires passkey session for external callers", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const url = `${pe.base_url}/c/${acct.uiECI}/query/io.picolabs.pico-engine-ui/pico`;

  const unauth = await fetch(url);
  t.is(unauth.status, 401);

  const authed = await fetch(url, {
    headers: { Cookie: `pico-session=${acct.session.token}` },
  });
  t.is(authed.status, 200);
});

test("/sky/* oauth-webhook channel requires bearer not session", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);
  const skyUrl = `${pe.base_url}/sky/query/${hookEci}/io.picolabs.wrangler/name`;

  const noBearer = await fetch(skyUrl);
  t.is(noBearer.status, 401);

  const sessionOnly = await fetch(skyUrl, {
    headers: { Cookie: `pico-session=${acct.session.token}` },
  });
  t.is(sessionOnly.status, 401);

  const creds = await pe.oauth.createChannelSecret(hookEci);
  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  });
  const withBearer = await fetch(skyUrl, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  t.is(withBearer.status, 200);
});

test("/c/* without oauth-webhook tag does not accept bearer instead of session", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);
  const creds = await pe.oauth.createChannelSecret(hookEci);
  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  });
  const channelUrl = `${pe.base_url}/c/${hookEci}/query/io.picolabs.wrangler/name`;

  const withBearer = await fetch(channelUrl, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  t.is(withBearer.status, 401);
});

test("meshRequiresOAuth follows oauth ruleset on root", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  t.false(pe.oauth.meshRequiresOAuth(acct.uiECI));

  const root = pe.pf.rootPicos()[0];
  root.rulesets[OAUTH_MESH_RULESET_RID] = { config: {}, instance: null };
  t.true(pe.oauth.meshRequiresOAuth(acct.uiECI));
});

test("open /sky/* channel works without bearer when mesh oauth ruleset absent", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const openEci = await createOpenChannel(pe, acct.uiECI);
  const skyUrl = `${pe.base_url}/sky/query/${openEci}/io.picolabs.wrangler/name`;

  const resp = await fetch(skyUrl);
  t.is(resp.status, 200);
});

test("mesh oauth ruleset locks all /sky/* channels on that mesh", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const openEci = await createOpenChannel(pe, acct.uiECI);
  enableOAuthMesh(pe);
  const skyUrl = `${pe.base_url}/sky/query/${openEci}/io.picolabs.wrangler/name`;

  t.is((await fetch(skyUrl)).status, 401);
  t.true(await pe.oauth.skyRequiresBearer(openEci));
});

test("mesh-oauth-exempt tag skips mesh lock on /sky/*", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  enableOAuthMesh(pe);
  const exemptEci = await createMeshOAuthExemptChannel(pe, acct.uiECI);
  const openEci = await createOpenChannel(pe, acct.uiECI);
  const exemptUrl = `${pe.base_url}/sky/query/${exemptEci}/io.picolabs.wrangler/name`;
  const openUrl = `${pe.base_url}/sky/query/${openEci}/io.picolabs.wrangler/name`;

  t.false(await pe.oauth.skyRequiresBearer(exemptEci));
  t.is((await fetch(exemptUrl)).status, 200);
  t.is((await fetch(openUrl)).status, 401);
});

test("oauth-webhook still requires bearer when mesh-oauth-exempt is also set", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  enableOAuthMesh(pe);
  const before = await pe.pf.query({
    eci: acct.uiECI,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  });
  const beforeIds = new Set((before.channels || []).map((c: any) => c.id));
  await pe.pf.eventQuery(
    {
      eci: acct.uiECI,
      domain: "engine_ui",
      name: "new_channel",
      data: {
        attrs: {
          tags: ["oauth-webhook", "mesh-oauth-exempt", "test-both"],
          eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
          queryPolicy: { allow: [{ rid: "io.picolabs.wrangler", name: "name" }], deny: [] },
        },
      },
      time: 0,
    },
    {
      eci: acct.uiECI,
      rid: "io.picolabs.pico-engine-ui",
      name: "pico",
      args: {},
    }
  );
  const after = await pe.pf.query({
    eci: acct.uiECI,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  });
  const hookEci = (after.channels || []).find((c: any) => !beforeIds.has(c.id))?.id;
  if (!hookEci) {
    throw new Error("Failed to create dual-tagged channel");
  }
  const skyUrl = `${pe.base_url}/sky/query/${hookEci}/io.picolabs.wrangler/name`;

  t.true(await pe.oauth.skyRequiresBearer(hookEci));
  t.is((await fetch(skyUrl)).status, 401);
});

test("mesh oauth lock still allows webhook CC token on matching eci only", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  enableOAuthMesh(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);
  const openEci = await createOpenChannel(pe, acct.uiECI);
  const creds = await pe.oauth.createChannelSecret(hookEci);
  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  });

  const hookUrl = `${pe.base_url}/sky/query/${hookEci}/io.picolabs.wrangler/name`;
  const openUrl = `${pe.base_url}/sky/query/${openEci}/io.picolabs.wrangler/name`;
  const auth = { Authorization: `Bearer ${token.access_token}` };

  t.is((await fetch(hookUrl, { headers: auth })).status, 200);
  t.is((await fetch(openUrl, { headers: auth })).status, 401);
});
