import test from "ava";
import { OAuthError } from "../src/oauth/errors";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

function fakeAuthenticator(): WebAuthnAdapter {
  let n = 0;
  return {
    async generateRegistrationOptions(req) {
      n += 1;
      return { challenge: `reg-${n}`, user: { id: req.userID, name: req.userName, displayName: req.userDisplayName } } as any;
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

test("webhook channel client credentials mint opaque bearer token", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);

  const status = await pe.oauth.channelStatusAsync(hookEci);
  t.true(status.eligible);
  t.true(status.enabled);
  t.false(status.hasSecret);

  const creds = await pe.oauth.createChannelSecret(hookEci);
  t.is(creds.client_id, hookEci);
  t.truthy(creds.client_secret);

  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  });
  t.true(token.access_token.startsWith("oat_"));
  t.is(token.token_type, "Bearer");
  t.true(token.expires_in > 0);

  t.true(await pe.oauth.validateBearerToken(token.access_token, hookEci));
  t.false(await pe.oauth.validateBearerToken(token.access_token, "wrong-eci"));
});

test("oauth-webhook channel requires bearer even before credentials exist", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);

  t.true(await pe.oauth.channelRequiresBearer(hookEci));
  t.false((await pe.oauth.channelStatusAsync(hookEci)).hasSecret);
});

test("family and subscription channels are not oauth eligible", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const root = pe.pf.getPico(acct.uiECI);
  const family = Object.values(root.channels).find((c) => c.familyChannelPicoID);
  t.truthy(family);
  const status = await pe.oauth.channelStatusAsync(family!.id);
  t.false(status.eligible);

  await t.throwsAsync(() => pe.oauth.createChannelSecret(family!.id), {
    instanceOf: OAuthError,
  });
});

test("invalid client secret rejected", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);
  const creds = await pe.oauth.createChannelSecret(hookEci);

  await t.throwsAsync(
    () =>
      pe.oauth.clientCredentialsGrant({
        client_id: creds.client_id,
        client_secret: "wrong-secret",
      }),
    { instanceOf: OAuthError }
  );
});

test("client credentials grant accepts custom expires_in", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);
  const creds = await pe.oauth.createChannelSecret(hookEci);

  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    expires_in: 3600,
  });
  t.is(token.expires_in, 3600);
});

test("client credentials grant rejects out-of-range expires_in", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);
  const creds = await pe.oauth.createChannelSecret(hookEci);

  await t.throwsAsync(
    () =>
      pe.oauth.clientCredentialsGrant({
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        expires_in: 30,
      }),
    { instanceOf: OAuthError }
  );
});

test("client credentials grant accepts expires_in 0 for non-expiring token", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  const hookEci = await createWebhookChannel(pe, acct.uiECI);
  const creds = await pe.oauth.createChannelSecret(hookEci);

  const token = await pe.oauth.clientCredentialsGrant({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    expires_in: 0,
  });
  t.is(token.expires_in, undefined);
  t.true(await pe.oauth.validateBearerToken(token.access_token, hookEci));
});
