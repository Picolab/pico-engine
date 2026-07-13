import test from "ava";
import { OAUTH_MESH_RULESET_RID } from "../src/oauth/meshOAuth";
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

function enableOAuthMesh(pe: Awaited<ReturnType<typeof startIsolatedEngine>>) {
  const root = pe.pf.rootPicos()[0];
  root.rulesets[OAUTH_MESH_RULESET_RID] = { config: {}, instance: null };
}

const TEST_PKCE_VERIFIER = "test-pkce-verifier-for-acg-tests";

test("authorization code grant with PKCE validates subtree ecis", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  enableOAuthMesh(pe);
  const root = pe.pf.rootPicos()[0];
  const redirect_uri = "http://127.0.0.1:9999/callback";
  const app = await pe.oauth.registerApp(root.id, {
    name: "Integrator",
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
  t.truthy(code);

  const token = await pe.oauth.authorizationCodeGrant({
    grant_type: "authorization_code",
    code: code!,
    redirect_uri,
    client_id: app.client_id,
    code_verifier: TEST_PKCE_VERIFIER,
  });
  t.true(token.access_token.startsWith("oat_"));
  t.true(token.refresh_token?.startsWith("ort_"));
  t.true(await pe.oauth.validateSkyBearerToken(token.access_token, acct.uiECI));
});

test("refresh token grant rotates access token", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  const acct = await bootstrapAccount(pe);
  enableOAuthMesh(pe);
  const root = pe.pf.rootPicos()[0];
  const redirect_uri = "http://127.0.0.1/callback";
  const app = await pe.oauth.registerApp(root.id, {
    name: "Integrator",
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
  const first = await pe.oauth.authorizationCodeGrant({
    grant_type: "authorization_code",
    code: code!,
    redirect_uri,
    client_id: app.client_id,
    code_verifier: TEST_PKCE_VERIFIER,
  });
  const refreshed = await pe.oauth.refreshTokenGrant({
    grant_type: "refresh_token",
    refresh_token: first.refresh_token!,
    client_id: app.client_id,
  });
  t.not(refreshed.access_token, first.access_token);
  t.false(await pe.oauth.validateSkyBearerToken(first.access_token, acct.uiECI));
  t.true(await pe.oauth.validateSkyBearerToken(refreshed.access_token, acct.uiECI));
});
