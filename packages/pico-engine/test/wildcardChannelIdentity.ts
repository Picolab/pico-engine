/**
 * Wildcard channel policies require validated identity on /sky/* (1.8 §2).
 */

import test from "ava";
process.env.PICO_ENGINE_ALLOW_LOCALHOST_C = "0";
process.env.PICO_ENGINE_WILDCARD_SKY_REQUIRE_BEARER = "1";
import fetch from "cross-fetch";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { sessionCookieHeader } from "../src/auth/cookies";
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
    async verifyRegistration() {
      return {
        verified: true,
        credential: {
          id: "cred-owner",
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

async function createChannel(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  rootUiEci: string,
  attrs: Record<string, unknown>
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
      data: { attrs },
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
    throw new Error("Failed to create channel");
  }
  return created.id as string;
}

test("wildcard /sky/query requires bearer even without mesh oauth ruleset", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const wildEci = await createChannel(pe, acct.uiECI, {
    tags: ["test-wildcard"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });
  const skyUrl = `${pe.base_url}/sky/query/${wildEci}/io.picolabs.wrangler/name`;

  t.true(await pe.oauth.skyRequiresBearer(wildEci));
  t.is((await fetch(skyUrl)).status, 401);
  await pe.pf.db.close();
});

test("wildcard /sky/query accepts oauth-webhook client credentials", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const wildEci = await createChannel(pe, acct.uiECI, {
    tags: ["oauth-webhook", "test-wild-hook"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });
  const creds = await pe.oauth.createChannelSecret(wildEci);
  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  });
  const skyUrl = `${pe.base_url}/sky/query/${wildEci}/io.picolabs.wrangler/name`;
  const resp = await fetch(skyUrl, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  t.is(resp.status, 200);
  await pe.pf.db.close();
});

test("wildcard /c/* requires passkey session when localhost bypass disabled", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const wildEci = await createChannel(pe, acct.uiECI, {
    tags: ["test-wild-c"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });
  const url = `${pe.base_url}/c/${wildEci}/query/io.picolabs.wrangler/name`;

  t.is((await fetch(url)).status, 401);

  const authed = await fetch(url, {
    headers: {
      Cookie: sessionCookieHeader(pe.base_url, acct.session.token),
    },
  });
  t.is(authed.status, 200);
  await pe.pf.db.close();
});

test("mesh-oauth-exempt does not bypass wildcard sky lock", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const wildEci = await createChannel(pe, acct.uiECI, {
    tags: ["mesh-oauth-exempt", "test-wild-exempt"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "io.picolabs.wrangler", name: "name" }], deny: [] },
  });
  const skyUrl = `${pe.base_url}/sky/query/${wildEci}/io.picolabs.wrangler/name`;

  t.true(await pe.oauth.skyRequiresBearer(wildEci));
  t.is((await fetch(skyUrl)).status, 401);
  await pe.pf.db.close();
});

test("wildcard sky lock is off by default for backward compatibility", async (t) => {
  delete process.env.PICO_ENGINE_WILDCARD_SKY_REQUIRE_BEARER;
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const wildEci = await createChannel(pe, acct.uiECI, {
    tags: ["test-wild-legacy"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });
  const skyUrl = `${pe.base_url}/sky/query/${wildEci}/io.picolabs.wrangler/name`;

  t.false(await pe.oauth.skyRequiresBearer(wildEci));
  t.is((await fetch(skyUrl)).status, 200);
  process.env.PICO_ENGINE_WILDCARD_SKY_REQUIRE_BEARER = "1";
  await pe.pf.db.close();
});

test("event-only wildcard requires bearer for sky query on narrow query policy", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  const eci = await createChannel(pe, acct.uiECI, {
    tags: ["event-wild-only"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: {
      allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
      deny: [],
    },
  });
  t.true(await pe.oauth.skyRequiresBearer(eci));
  await pe.pf.db.close();
});
