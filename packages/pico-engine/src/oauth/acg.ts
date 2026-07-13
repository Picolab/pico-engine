import * as crypto from "crypto";
import { PicoDb, PicoDbKey, PicoFramework } from "pico-framework";
import { OAuthError } from "./errors";
import { rootHasOAuthMeshRuleset } from "./meshOAuth";

export interface OAuthTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export const OAUTH_APP_PREFIX = "oauth-app";
export const OAUTH_AUTH_CODE_PREFIX = "oauth-auth-code";
export const OAUTH_REFRESH_PREFIX = "oauth-refresh";

export const DEFAULT_ACG_SCOPE = "mesh";
export const AUTH_CODE_TTL_MS = 10 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export interface StoredOAuthApp {
  clientId: string;
  rootPicoId: string;
  name: string;
  redirectUris: string[];
  publicClient: boolean;
  secretSalt?: string;
  secretHash?: string;
  scopes: string[];
  createdAt: string;
}

export interface OAuthAppSummary {
  client_id: string;
  name: string;
  redirect_uris: string[];
  public_client: boolean;
  scopes: string[];
  created_at: string;
}

export interface OAuthAppCredentials {
  client_id: string;
  client_secret?: string;
  name: string;
  redirect_uris: string[];
  public_client: boolean;
}

interface StoredAuthCode {
  code: string;
  clientId: string;
  rootPicoId: string;
  accountId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: number;
  createdAt: string;
}

interface StoredRefreshToken {
  refreshToken: string;
  accessToken: string;
  clientId: string;
  rootPicoId: string;
  appId: string;
  accountId: string;
  scope: string;
  expiresAt: number;
  createdAt: string;
}

export interface AuthorizeParams {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  state?: string;
  scope?: string;
  code_challenge: string;
  code_challenge_method: string;
}

export interface ApproveParams {
  client_id: string;
  redirect_uri: string;
  state?: string;
  scope?: string;
  code_challenge: string;
  code_challenge_method: string;
  approved: boolean;
}

export function parseApproveBody(body: Record<string, unknown>): ApproveParams {
  return {
    client_id: String(body.client_id || "").trim(),
    redirect_uri: String(body.redirect_uri || "").trim(),
    state: body.state !== undefined ? String(body.state) : undefined,
    scope: body.scope !== undefined ? String(body.scope) : undefined,
    code_challenge: String(body.code_challenge || "").trim(),
    code_challenge_method: String(body.code_challenge_method || "S256").trim(),
    approved:
      body.approved === true ||
      String(body.approved ?? "")
        .trim()
        .toLowerCase() === "true",
  };
}

export interface AcgContext {
  db: PicoDb;
  pf: PicoFramework;
  tokenTtlMs: number;
  putAccessToken: (record: {
    token: string;
    rootPicoId: string;
    appId: string;
    accountId: string;
    scope: string;
    expiresAt: number;
  }) => Promise<void>;
}

export function parseAuthorizeQuery(query: Record<string, unknown>): AuthorizeParams {
  const client_id = String(query.client_id || "").trim();
  const redirect_uri = String(query.redirect_uri || "").trim();
  const response_type = String(query.response_type || "").trim();
  const state = query.state !== undefined ? String(query.state) : undefined;
  const scope = normalizeScope(String(query.scope || DEFAULT_ACG_SCOPE));
  const code_challenge = String(query.code_challenge || "").trim();
  const code_challenge_method = String(
    query.code_challenge_method || "S256"
  ).trim();

  if (!client_id || !redirect_uri || !code_challenge) {
    throw new OAuthError("Invalid authorize request", "invalid_request", 400);
  }
  if (response_type !== "code") {
    throw new OAuthError("Unsupported response_type", "unsupported_response_type", 400);
  }
  if (!["S256", "plain"].includes(code_challenge_method)) {
    throw new OAuthError("Unsupported code_challenge_method", "invalid_request", 400);
  }
  return {
    client_id,
    redirect_uri,
    response_type,
    state,
    scope,
    code_challenge,
    code_challenge_method,
  };
}

export async function listApps(
  ctx: AcgContext,
  rootPicoId: string
): Promise<OAuthAppSummary[]> {
  assertMeshOAuthRoot(ctx, rootPicoId);
  const rows = await dbList<StoredOAuthApp>(ctx.db, [OAUTH_APP_PREFIX]);
  return rows
    .filter((row) => row.value.rootPicoId === rootPicoId)
    .map((row) => summarizeApp(row.value))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function registerApp(
  ctx: AcgContext,
  rootPicoId: string,
  input: {
    name?: string;
    redirect_uris?: string[];
    public_client?: boolean;
  }
): Promise<OAuthAppCredentials> {
  assertMeshOAuthRoot(ctx, rootPicoId);
  const name = (input.name || "").trim();
  const redirectUris = normalizeRedirectUris(input.redirect_uris || []);
  if (!name) {
    throw new OAuthError("App name is required", "invalid_request", 400);
  }
  if (redirectUris.length === 0) {
    throw new OAuthError("At least one redirect_uri is required", "invalid_request", 400);
  }
  const publicClient = input.public_client !== false;
  const clientId = mintAppId();
  let client_secret: string | undefined;
  const record: StoredOAuthApp = {
    clientId,
    rootPicoId,
    name,
    redirectUris,
    publicClient,
    scopes: [DEFAULT_ACG_SCOPE],
    createdAt: new Date().toISOString(),
  };
  if (!publicClient) {
    client_secret = randomSecret();
    const secretSalt = randomSalt();
    record.secretSalt = secretSalt;
    record.secretHash = hashSecret(client_secret, secretSalt);
  }
  await ctx.db.put([OAUTH_APP_PREFIX, clientId], record);
  return {
    client_id: clientId,
    client_secret,
    name,
    redirect_uris: redirectUris,
    public_client: publicClient,
  };
}

export async function revokeApp(
  ctx: AcgContext,
  rootPicoId: string,
  clientId: string
): Promise<void> {
  assertMeshOAuthRoot(ctx, rootPicoId);
  const app = await getApp(ctx, clientId);
  if (!app || app.rootPicoId !== rootPicoId) {
    throw new OAuthError("Unknown app", "invalid_client", 404);
  }
  await ctx.db.del([OAUTH_APP_PREFIX, clientId]);
  await revokeAppTokens(ctx, clientId);
}

export async function getAppForAuthorize(
  ctx: AcgContext,
  params: AuthorizeParams
): Promise<StoredOAuthApp> {
  const app = await getApp(ctx, params.client_id);
  if (!app) {
    throw new OAuthError("Unknown client", "invalid_client", 401);
  }
  if (!rootHasOAuthMeshRuleset(ctx.pf, app.rootPicoId)) {
    throw new OAuthError("OAuth mesh is not enabled", "invalid_client", 401);
  }
  assertRedirectUri(app, params.redirect_uri);
  if (app.publicClient && !params.code_challenge) {
    throw new OAuthError("PKCE code_challenge is required", "invalid_request", 400);
  }
  return app;
}

export function renderConsentHtml(app: StoredOAuthApp, params: AuthorizeParams): string {
  const esc = escapeHtml;
  const fields = [
    ["client_id", params.client_id],
    ["redirect_uri", params.redirect_uri],
    ["scope", params.scope || DEFAULT_ACG_SCOPE],
    ["code_challenge", params.code_challenge],
    ["code_challenge_method", params.code_challenge_method],
    ...(params.state !== undefined ? [["state", params.state] as [string, string]] : []),
  ];
  const hidden = fields
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${esc(name)}" value="${esc(value)}"/>`
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Authorize ${esc(app.name)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 36rem; margin: 3rem auto; padding: 0 1rem; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 1.25rem; }
    .muted { color: #666; font-size: 0.9rem; }
    .actions { margin-top: 1.25rem; display: flex; gap: 0.75rem; }
    button { font: inherit; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #ccc; cursor: pointer; }
    button.primary { background: #007bff; color: #fff; border-color: #007bff; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorize application</h1>
    <p><strong>${esc(app.name)}</strong> is requesting access to this pico mesh.</p>
    <p class="muted">Scope: <code>${esc(params.scope || DEFAULT_ACG_SCOPE)}</code> (read and control this mesh via /sky/*)</p>
    <p class="muted">Redirect: <code>${esc(params.redirect_uri)}</code></p>
    <form method="POST" action="/oauth/approve">
      ${hidden}
      <input type="hidden" name="approved" value="true"/>
      <div class="actions">
        <button class="primary" type="submit">Allow</button>
      </div>
    </form>
    <form method="POST" action="/oauth/approve" style="margin-top:0.75rem">
      ${hidden}
      <input type="hidden" name="approved" value="false"/>
      <button type="submit">Deny</button>
    </form>
  </div>
</body>
</html>`;
}

export async function approveAuthorization(
  ctx: AcgContext,
  session: { accountId: string; rootPicoId: string },
  params: ApproveParams
): Promise<string> {
  const app = await getAppForAuthorize(ctx, {
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    response_type: "code",
    state: params.state,
    scope: params.scope,
    code_challenge: params.code_challenge,
    code_challenge_method: params.code_challenge_method,
  });
  if (app.rootPicoId !== session.rootPicoId) {
    throw new OAuthError("Not authorized for this mesh", "access_denied", 403);
  }
  if (!params.approved) {
    return redirectWithError(params.redirect_uri, "access_denied", params.state);
  }
  const code = mintAuthCode();
  const record: StoredAuthCode = {
    code,
    clientId: app.clientId,
    rootPicoId: app.rootPicoId,
    accountId: session.accountId,
    redirectUri: params.redirect_uri,
    scope: normalizeScope(params.scope || DEFAULT_ACG_SCOPE),
    codeChallenge: params.code_challenge,
    codeChallengeMethod: params.code_challenge_method,
    expiresAt: Date.now() + AUTH_CODE_TTL_MS,
    createdAt: new Date().toISOString(),
  };
  await ctx.db.put([OAUTH_AUTH_CODE_PREFIX, code], record);
  return redirectWithCode(params.redirect_uri, code, params.state);
}

export async function authorizationCodeGrant(
  ctx: AcgContext,
  input: {
    grant_type?: string;
    code?: string;
    redirect_uri?: string;
    client_id?: string;
    client_secret?: string;
    code_verifier?: string;
  }
): Promise<OAuthTokenResponse & { refresh_token?: string; scope?: string }> {
  const code = (input.code || "").trim();
  const redirect_uri = (input.redirect_uri || "").trim();
  const client_id = (input.client_id || "").trim();
  const client_secret = (input.client_secret || "").trim();
  const code_verifier = (input.code_verifier || "").trim();
  if (!code || !redirect_uri || !client_id || !code_verifier) {
    throw new OAuthError("Invalid token request", "invalid_request", 400);
  }
  const stored = await dbGet<StoredAuthCode>(ctx.db, [OAUTH_AUTH_CODE_PREFIX, code]);
  if (!stored) {
    throw new OAuthError("Invalid authorization code", "invalid_grant", 400);
  }
  if (stored.expiresAt < Date.now()) {
    await ctx.db.del([OAUTH_AUTH_CODE_PREFIX, code]);
    throw new OAuthError("Authorization code expired", "invalid_grant", 400);
  }
  if (
    stored.clientId !== client_id ||
    stored.redirectUri !== redirect_uri
  ) {
    throw new OAuthError("Authorization code mismatch", "invalid_grant", 400);
  }
  const app = await getApp(ctx, client_id);
  if (!app) {
    throw new OAuthError("Invalid client", "invalid_client", 401);
  }
  await assertClientAuth(app, client_secret);
  if (!verifyPkce(code_verifier, stored.codeChallenge, stored.codeChallengeMethod)) {
    throw new OAuthError("Invalid PKCE verifier", "invalid_grant", 400);
  }
  await ctx.db.del([OAUTH_AUTH_CODE_PREFIX, code]);
  return mintAcgTokens(ctx, {
    app,
    accountId: stored.accountId,
    scope: stored.scope,
  });
}

export async function refreshTokenGrant(
  ctx: AcgContext,
  input: {
    grant_type?: string;
    refresh_token?: string;
    client_id?: string;
    client_secret?: string;
  }
): Promise<OAuthTokenResponse & { refresh_token?: string; scope?: string }> {
  const refresh_token = (input.refresh_token || "").trim();
  const client_id = (input.client_id || "").trim();
  const client_secret = (input.client_secret || "").trim();
  if (!refresh_token || !client_id) {
    throw new OAuthError("Invalid refresh request", "invalid_request", 400);
  }
  const stored = await dbGet<StoredRefreshToken>(ctx.db, [
    OAUTH_REFRESH_PREFIX,
    refresh_token,
  ]);
  if (!stored || stored.clientId !== client_id) {
    throw new OAuthError("Invalid refresh token", "invalid_grant", 400);
  }
  if (stored.expiresAt < Date.now()) {
    await ctx.db.del([OAUTH_REFRESH_PREFIX, refresh_token]);
    throw new OAuthError("Refresh token expired", "invalid_grant", 400);
  }
  const app = await getApp(ctx, client_id);
  if (!app) {
    throw new OAuthError("Invalid client", "invalid_client", 401);
  }
  await assertClientAuth(app, client_secret);
  await ctx.db.del([OAUTH_REFRESH_PREFIX, refresh_token]);
  await ctx.db.del(["oauth-token", stored.accessToken] as PicoDbKey);
  return mintAcgTokens(ctx, {
    app,
    accountId: stored.accountId,
    scope: stored.scope,
  });
}

async function mintAcgTokens(
  ctx: AcgContext,
  input: { app: StoredOAuthApp; accountId: string; scope: string }
): Promise<OAuthTokenResponse & { refresh_token?: string; scope?: string }> {
  const access_token = mintAccessToken();
  const refresh_token = mintRefreshToken();
  const expiresAt = Date.now() + ctx.tokenTtlMs;
  await ctx.putAccessToken({
    token: access_token,
    rootPicoId: input.app.rootPicoId,
    appId: input.app.clientId,
    accountId: input.accountId,
    scope: input.scope,
    expiresAt,
  });
  const refreshRecord: StoredRefreshToken = {
    refreshToken: refresh_token,
    accessToken: access_token,
    clientId: input.app.clientId,
    rootPicoId: input.app.rootPicoId,
    appId: input.app.clientId,
    accountId: input.accountId,
    scope: input.scope,
    expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS,
    createdAt: new Date().toISOString(),
  };
  await ctx.db.put([OAUTH_REFRESH_PREFIX, refresh_token], refreshRecord);
  return {
    access_token,
    token_type: "Bearer",
    expires_in: Math.floor(ctx.tokenTtlMs / 1000),
    refresh_token,
    scope: input.scope,
  };
}

function assertMeshOAuthRoot(ctx: AcgContext, rootPicoId: string): void {
  if (!rootHasOAuthMeshRuleset(ctx.pf, rootPicoId)) {
    throw new OAuthError(
      "Install io.picolabs.oauth on the root pico first",
      "invalid_request",
      400
    );
  }
}

async function getApp(
  ctx: AcgContext,
  clientId: string
): Promise<StoredOAuthApp | null> {
  return dbGet<StoredOAuthApp>(ctx.db, [OAUTH_APP_PREFIX, clientId]);
}

function summarizeApp(app: StoredOAuthApp): OAuthAppSummary {
  return {
    client_id: app.clientId,
    name: app.name,
    redirect_uris: app.redirectUris.slice(),
    public_client: app.publicClient,
    scopes: app.scopes.slice(),
    created_at: app.createdAt,
  };
}

function assertRedirectUri(app: StoredOAuthApp, redirectUri: string): void {
  if (!app.redirectUris.includes(redirectUri)) {
    throw new OAuthError("Invalid redirect_uri", "invalid_request", 400);
  }
}

async function assertClientAuth(
  app: StoredOAuthApp,
  clientSecret: string
): Promise<void> {
  if (app.publicClient) {
    return;
  }
  if (!clientSecret || !app.secretSalt || !app.secretHash) {
    throw new OAuthError("Client authentication required", "invalid_client", 401);
  }
  if (!verifySecret(clientSecret, app.secretSalt, app.secretHash)) {
    throw new OAuthError("Invalid client", "invalid_client", 401);
  }
}

async function revokeAppTokens(ctx: AcgContext, clientId: string): Promise<void> {
  const tokens = await dbList<{ grant?: string; appId?: string; channelEci?: string }>(
    ctx.db,
    ["oauth-token"]
  );
  for (const row of tokens) {
    if (row.value.appId === clientId) {
      await ctx.db.del(row.key);
    }
  }
  const refreshes = await dbList<StoredRefreshToken>(ctx.db, [OAUTH_REFRESH_PREFIX]);
  for (const row of refreshes) {
    if (row.value.clientId === clientId) {
      await ctx.db.del(row.key);
    }
  }
}

function verifyPkce(
  verifier: string,
  challenge: string,
  method: string
): boolean {
  if (method === "plain") {
    return verifier === challenge;
  }
  if (method === "S256") {
    const digest = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");
    return digest === challenge;
  }
  return false;
}

function redirectWithCode(redirectUri: string, code: string, state?: string): string {
  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state !== undefined) {
    url.searchParams.set("state", state);
  }
  return url.toString();
}

function redirectWithError(
  redirectUri: string,
  error: string,
  state?: string
): string {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  if (state !== undefined) {
    url.searchParams.set("state", state);
  }
  return url.toString();
}

function normalizeScope(scope: string): string {
  const trimmed = (scope || DEFAULT_ACG_SCOPE).trim();
  return trimmed || DEFAULT_ACG_SCOPE;
}

function normalizeRedirectUris(uris: string[]): string[] {
  const out: string[] = [];
  for (const raw of uris) {
    const uri = (raw || "").trim();
    if (!uri) {
      continue;
    }
    let parsed: URL;
    try {
      parsed = new URL(uri);
    } catch {
      throw new OAuthError(`Invalid redirect_uri: ${uri}`, "invalid_request", 400);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new OAuthError(`Invalid redirect_uri: ${uri}`, "invalid_request", 400);
    }
    if (!out.includes(uri)) {
      out.push(uri);
    }
  }
  return out;
}

function mintAppId(): string {
  return "app_" + crypto.randomBytes(16).toString("base64url");
}

function mintAuthCode(): string {
  return "oac_" + crypto.randomBytes(32).toString("base64url");
}

export function mintAccessToken(): string {
  return "oat_" + crypto.randomBytes(32).toString("base64url");
}

function mintRefreshToken(): string {
  return "ort_" + crypto.randomBytes(32).toString("base64url");
}

function randomSecret(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function randomSalt(): string {
  return crypto.randomBytes(16).toString("base64url");
}

function hashSecret(secret: string, salt: string): string {
  return crypto.createHash("sha256").update(salt + secret).digest("base64url");
}

function verifySecret(secret: string, salt: string, expected: string): boolean {
  const actual = hashSecret(secret, salt);
  if (actual.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function dbGet<T>(db: PicoDb, key: PicoDbKey): Promise<T | null> {
  try {
    const value = await db.get(key);
    return value === undefined ? null : (value as T);
  } catch (err: any) {
    if (err && (err.notFound || err.code === "LEVEL_NOT_FOUND")) {
      return null;
    }
    throw err;
  }
}

async function dbList<T = any>(
  db: PicoDb,
  prefix: PicoDbKey
): Promise<{ key: PicoDbKey; value: T }[]> {
  const out: { key: PicoDbKey; value: T }[] = [];
  const iter = db.iterator({
    gte: prefix,
    lte: prefix.concat([undefined] as any),
  });
  for await (const [key, value] of iter) {
    out.push({ key, value });
  }
  return out;
}
