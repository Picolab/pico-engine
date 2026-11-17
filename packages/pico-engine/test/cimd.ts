/**
 * Client ID Metadata Documents and the approval screen (1.10 §2 A4, A8).
 */

import * as crypto from "crypto";
import test from "ava";
import fetch from "cross-fetch";
import { sessionCookieHeader } from "../src/auth/cookies";
import { OAUTH_MESH_RULESET_RID } from "../src/oauth/meshOAuth";
import { renderConsentHtml, type StoredOAuthApp } from "../src/oauth/acg";
import {
  CIMD_CACHE_CEILING_MS,
  CIMD_MAX_BYTES,
  isPrivateAddress,
  loadClientMetadata,
  parseClientMetadata,
  type ClientMetadataResponse,
} from "../src/oauth/cimd";
import { OAuthError } from "../src/oauth/errors";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

const CLIENT = "https://client.example/oauth/client.json";
const REDIRECT = "https://client.example/callback";

function docBody(extra: Record<string, unknown> = {}): Buffer {
  return Buffer.from(
    JSON.stringify({
      client_id: CLIENT,
      client_name: "Example Agent",
      client_uri: "https://client.example/",
      logo_uri: "https://client.example/logo.png",
      redirect_uris: [REDIRECT],
      token_endpoint_auth_method: "none",
      ...extra,
    })
  );
}

function ok(body: Buffer, headers: Record<string, string> = {}): ClientMetadataResponse {
  return { status: 200, headers, body };
}

const publicLookup = async () => ["8.8.8.8"];

test("private and documentation addresses are refused", (t) => {
  for (const address of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
  ]) {
    t.true(isPrivateAddress(address), address);
  }
  t.false(isPrivateAddress("8.8.8.8"));
  t.false(isPrivateAddress("172.15.255.255"));
  t.false(isPrivateAddress("2001:4860:4860::8888"));
});

test("a metadata document must name its own URL and an exact redirect", (t) => {
  const doc = parseClientMetadata(CLIENT, docBody());
  t.is(doc.clientName, "Example Agent");
  t.deepEqual(doc.redirectUris, [REDIRECT]);
  t.is(doc.logoUri, "https://client.example/logo.png");

  const mismatch = t.throws(
    () => parseClientMetadata(CLIENT, docBody({ client_id: "https://other.example/client.json" })),
    { instanceOf: OAuthError }
  );
  t.is((mismatch as OAuthError).oauthError, "invalid_client");

  const logo = parseClientMetadata(
    CLIENT,
    docBody({ logo_uri: "javascript:alert(1)", client_uri: "https://127.0.0.1/home" })
  );
  t.is(logo.logoUri, undefined);
  t.is(logo.clientUri, undefined);
});

test("metadata is fetched over public https, size-capped, and cached with a ceiling", async (t) => {
  const loopback = await t.throwsAsync(
    () => loadClientMetadata("https://127.0.0.1/client.json"),
    { instanceOf: OAuthError }
  );
  t.regex((loopback as OAuthError).message, /private address/);

  const localhost = await t.throwsAsync(
    () => loadClientMetadata("https://localhost/client.json"),
    { instanceOf: OAuthError }
  );
  t.regex((localhost as OAuthError).message, /private address/);

  let calls = 0;
  const cache = new Map();
  const start = 1_000_000;
  let now = start;
  const request = async (url: string): Promise<ClientMetadataResponse> => {
    calls += 1;
    t.is(url, CLIENT);
    return ok(docBody(), { "cache-control": "max-age=100000" });
  };
  const deps = { request, lookup: publicLookup, cache, now: () => now };
  const first = await loadClientMetadata(CLIENT, deps);
  t.is(first.clientName, "Example Agent");
  now = start + CIMD_CACHE_CEILING_MS - 1;
  await loadClientMetadata(CLIENT, deps);
  t.is(calls, 1);
  now = start + CIMD_CACHE_CEILING_MS;
  await loadClientMetadata(CLIENT, deps);
  t.is(calls, 2);

  calls = 0;
  const uncached = new Map();
  await loadClientMetadata(CLIENT, {
    request: async () => {
      calls += 1;
      return ok(docBody(), { "cache-control": "no-store" });
    },
    lookup: publicLookup,
    cache: uncached,
  });
  await loadClientMetadata(CLIENT, {
    request: async () => {
      calls += 1;
      return ok(docBody(), { "cache-control": "no-store" });
    },
    lookup: publicLookup,
    cache: uncached,
  });
  t.is(calls, 2);

  const huge = await t.throwsAsync(
    () =>
      loadClientMetadata(CLIENT, {
        request: async () => ok(Buffer.alloc(CIMD_MAX_BYTES + 1, 0x61)),
        lookup: publicLookup,
        cache: new Map(),
      }),
    { instanceOf: OAuthError }
  );
  t.regex((huge as OAuthError).message, /too large/);

  let hops = 0;
  const redirected = await t.throwsAsync(
    () =>
      loadClientMetadata(CLIENT, {
        request: async () => {
          hops += 1;
          return { status: 302, headers: { location: "https://10.0.0.1/stolen" }, body: Buffer.alloc(0) };
        },
        lookup: publicLookup,
        cache: new Map(),
      }),
    { instanceOf: OAuthError }
  );
  t.regex((redirected as OAuthError).message, /private address/);
  t.is(hops, 1);
});

test("the approval screen names the client, its host, the mesh, and the scopes", (t) => {
  const app: StoredOAuthApp = {
    clientId: CLIENT,
    rootPicoId: "",
    name: "Example Agent",
    redirectUris: [REDIRECT],
    publicClient: true,
    scopes: ["mesh"],
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const html = renderConsentHtml(
    app,
    {
      client_id: CLIENT,
      redirect_uri: REDIRECT,
      response_type: "code",
      scope: "mesh:read mesh:act",
      code_challenge: "abc",
      code_challenge_method: "S256",
    },
    {
      name: "Example Agent",
      clientIdHost: "client.example",
      logoUri: "https://client.example/logo.png",
      clientUri: "https://client.example/",
      meshName: "Owner",
    }
  );
  t.true(html.includes("Example Agent"));
  t.true(html.includes("client.example"));
  t.true(html.includes("Owner"));
  t.true(html.includes("<code>mesh:read</code>"));
  t.true(html.includes("<code>mesh:act</code>"));
  t.true(html.includes('src="https://client.example/logo.png"'));
  t.true(html.includes('href="https://client.example/"'));

  const stripped = renderConsentHtml(app, {
    client_id: CLIENT,
    redirect_uri: REDIRECT,
    response_type: "code",
    code_challenge: "abc",
    code_challenge_method: "S256",
  }, {
    name: "Example Agent",
    logoUri: "javascript:alert(1)",
    clientUri: "https://192.168.0.1/home",
  });
  t.false(stripped.includes("javascript:"));
  t.false(stripped.includes("192.168.0.1"));
});

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

const VERIFIER = "cimd-pkce-verifier-value";
const CHALLENGE = crypto.createHash("sha256").update(VERIFIER).digest("base64url");

test.serial("a URL client_id is approved for the signed-in mesh and re-checked at the token", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Owner" });
  const acct = await pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-owner" } as any,
  });
  const root = pe.pf.rootPicos()[0];
  root.rulesets[OAUTH_MESH_RULESET_RID] = { config: {}, instance: null };

  let fetches = 0;
  let redirectUris = [REDIRECT];
  pe.oauth.loadClientMetadata = async (url) => {
    fetches += 1;
    t.is(url, CLIENT);
    return {
      clientId: CLIENT,
      clientName: "Example Agent",
      redirectUris,
      clientUri: "https://client.example/",
      logoUri: "https://client.example/logo.png",
    };
  };

  const session = { accountId: acct.account.accountId, rootPicoId: root.id };
  const authorize = new URL(`${pe.base_url}/oauth/authorize`);
  authorize.searchParams.set("client_id", CLIENT);
  authorize.searchParams.set("redirect_uri", REDIRECT);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("code_challenge", CHALLENGE);
  authorize.searchParams.set("code_challenge_method", "S256");
  authorize.searchParams.set("scope", "mesh:read mesh:act");
  const anon = await fetch(authorize.toString(), { redirect: "manual" });
  t.is(anon.status, 302);
  const page = await fetch(authorize.toString(), {
    headers: { Cookie: sessionCookieHeader(pe.base_url, acct.session.token) },
  });
  t.is(page.status, 200);
  const html = await page.text();
  t.true(html.includes("Example Agent"));
  t.true(html.includes(">Owner<"));
  t.true(html.includes("client.example"));
  t.true(html.includes("<code>mesh:read</code>"));
  t.true(html.includes('src="https://client.example/logo.png"'));
  t.is(fetches, 1);

  const redirect = await pe.oauth.approveAuthorization(session, {
    client_id: CLIENT,
    redirect_uri: REDIRECT,
    scope: "mesh:read mesh:act",
    code_challenge: CHALLENGE,
    code_challenge_method: "S256",
    approved: true,
  });
  const code = new URL(redirect).searchParams.get("code")!;
  t.is(fetches, 2);

  const token = await pe.oauth.authorizationCodeGrant({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT,
    client_id: CLIENT,
    code_verifier: VERIFIER,
  });
  t.true(token.access_token.startsWith("oat_"));
  t.is(token.scope, "mesh:read mesh:act");
  t.true(await pe.oauth.validateSkyBearerToken(token.access_token, acct.uiECI));
  t.is(fetches, 3);

  const refreshed = await pe.oauth.refreshTokenGrant({
    grant_type: "refresh_token",
    refresh_token: token.refresh_token!,
    client_id: CLIENT,
  });
  t.true(await pe.oauth.validateSkyBearerToken(refreshed.access_token, acct.uiECI));
  t.is(fetches, 4);

  const apps = await pe.oauth.listApps(root.id);
  t.false(apps.some((app) => app.client_id === CLIENT));

  redirectUris = ["https://client.example/other"];
  const missing = await t.throwsAsync(
    () =>
      pe.oauth.approveAuthorization(session, {
        client_id: CLIENT,
        redirect_uri: REDIRECT,
        code_challenge: CHALLENGE,
        code_challenge_method: "S256",
        approved: true,
      }),
    { instanceOf: OAuthError }
  );
  t.is((missing as OAuthError).oauthError, "invalid_request");

  const httpClient = await t.throwsAsync(
    () =>
      pe.oauth.approveAuthorization(session, {
        client_id: "http://client.example/oauth/client.json",
        redirect_uri: REDIRECT,
        code_challenge: CHALLENGE,
        code_challenge_method: "S256",
        approved: true,
      }),
    { instanceOf: OAuthError }
  );
  t.is((httpClient as OAuthError).oauthError, "invalid_client");

  await pe.shutdown();
});
