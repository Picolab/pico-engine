/**
 * S1: view Sky context and /sky/* bearer when mesh OAuth is enabled.
 */

import test from "ava";
import fetch from "cross-fetch";
import { OAUTH_MESH_RULESET_RID } from "../src/oauth";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { engineKrlFileUrl } from "../src/bundledKrl";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { toDemoXmluiKrlURL } from "./helpers/toDemoXmluiKrlURL";

const TEST_PKCE_VERIFIER = "test-pkce-verifier-xmlui-views";

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

function enableOAuthMesh(pe: Awaited<ReturnType<typeof startIsolatedEngine>>) {
  const root = pe.pf.rootPicos()[0];
  root.rulesets[OAUTH_MESH_RULESET_RID] = { config: {}, instance: null };
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
  const beforeIds = new Set((before.channels || []).map((c: { id: string }) => c.id));
  await pe.pf.eventQuery(
    {
      eci: rootUiEci,
      domain: "engine_ui",
      name: "new_channel",
      data: {
        attrs: {
          tags: ["xmlui-test"],
          eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
          queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
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
  if (!created) throw new Error("channel not created");
  return created.id;
}

async function meshAccessToken(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  acct: Awaited<ReturnType<typeof bootstrapAccount>>
) {
  const root = pe.pf.rootPicos()[0];
  const redirect_uri = "http://127.0.0.1:9999/callback";
  const app = await pe.oauth.registerApp(root.id, {
    name: "View test",
    redirect_uris: [redirect_uri],
    public_client: true,
  });
  const redirect = await pe.oauth.approveAuthorization(
    { accountId: acct.account.accountId, rootPicoId: root.id },
    {
      client_id: app.client_id,
      redirect_uri,
      code_challenge: TEST_PKCE_VERIFIER,
      code_challenge_method: "plain",
      approved: true,
    }
  );
  const code = new URL(redirect).searchParams.get("code");
  const token = await pe.oauth.authorizationCodeGrant({
    grant_type: "authorization_code",
    code: code!,
    redirect_uri,
    client_id: app.client_id,
    code_verifier: TEST_PKCE_VERIFIER,
  });
  return token.access_token;
}

test.serial("mesh OAuth: ui-sky-context and bearer on view queries", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const acct = await bootstrapAccount(pe);
  enableOAuthMesh(pe);
  const eci = await createOpenChannel(pe, acct.uiECI);
  const root = pe.pf.rootPicos()[0];

  const xmluiUrl = engineKrlFileUrl("io.picolabs.xmlui.krl", pe.base_url);
  const xmluiRs = await pe.rsRegistry.load(xmluiUrl);
  await root.install(xmluiRs.ruleset, { url: xmluiUrl });
  const favUrl = toDemoXmluiKrlURL("com.example.fav_color.krl");
  const favRs = await pe.rsRegistry.load(favUrl);
  await root.install(favRs.ruleset, { url: favUrl });

  const ctx = await fetch(
    `${pe.base_url}/api/ui-sky-context?eci=${encodeURIComponent(eci)}`
  );
  t.is(ctx.status, 200);
  t.true((await ctx.json()).bearerRequired);

  const queryUrl = `${pe.base_url}/sky/query/${eci}/com.example.fav_color/favColor`;
  t.is((await fetch(queryUrl)).status, 401);

  const bearer = await meshAccessToken(pe, acct);
  t.true(await pe.oauth.validateSkyBearerToken(bearer, eci));
  const authed = await fetch(queryUrl, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  t.is(authed.status, 200);

  const uiIndex = await fetch(`${pe.base_url}/ui/${eci}/com.example.fav_color/`);
  t.is(uiIndex.status, 200);
  t.true((await uiIndex.text()).includes("pico-view-boot.js"));

  await pe.pf.db.close();
});
