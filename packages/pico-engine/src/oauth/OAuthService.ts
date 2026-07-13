import * as crypto from "crypto";
import { ChannelReadOnly, PicoDb, PicoDbKey, PicoFramework } from "pico-framework";
import * as acg from "./acg";
import { isOAuthEligibleChannel } from "./channelEligibility";
import { OAuthError } from "./errors";
import { isChannelUnderRoot, meshRequiresOAuth as meshRequiresOAuthForEci } from "./meshOAuth";

const OAUTH_CHANNEL_PREFIX = "oauth-channel";
const OAUTH_TOKEN_PREFIX = "oauth-token";

const DEFAULT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MIN_TOKEN_TTL_SEC = 5 * 60; // 5 minutes
export const MAX_TOKEN_TTL_SEC = 90 * 24 * 60 * 60; // 90 days

export { OAuthError } from "./errors";

interface StoredChannelOAuth {
  channelEci: string;
  rootPicoId: string;
  secretSalt: string;
  secretHash: string;
  createdAt: string;
}

interface StoredOAuthToken {
  token: string;
  grant?: OAuthGrantType;
  channelEci?: string;
  rootPicoId: string;
  appId?: string;
  accountId?: string;
  scope?: string;
  expiresAt: number;
  createdAt: string;
}

export type OAuthGrantType = "client_credentials" | "authorization_code";

export type {
  AuthorizeParams,
  OAuthAppCredentials,
  OAuthAppSummary,
} from "./acg";
export { DEFAULT_ACG_SCOPE, parseAuthorizeQuery, parseApproveBody, renderConsentHtml } from "./acg";

export interface OAuthChannelStatus {
  eligible: boolean;
  enabled: boolean;
  clientId?: string;
  hasSecret: boolean;
  createdAt?: string;
  reason?: string;
}

export interface OAuthChannelCredentials {
  client_id: string;
  client_secret: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface OAuthServiceDeps {
  db: PicoDb;
  pf: PicoFramework;
  tokenTtlMs?: number;
}

export class OAuthService {
  private deps: OAuthServiceDeps;

  constructor(deps: OAuthServiceDeps) {
    this.deps = deps;
  }

  get tokenTtlMs(): number {
    return this.deps.tokenTtlMs ?? DEFAULT_TOKEN_TTL_MS;
  }

  lookupChannelReadOnly(eci: string): ChannelReadOnly {
    return this.deps.pf.lookupChannel(eci).toReadOnly();
  }

  channelStatus(eci: string): OAuthChannelStatus {
    let channel: ChannelReadOnly;
    try {
      channel = this.lookupChannelReadOnly(eci);
    } catch (_e) {
      return { eligible: false, enabled: false, hasSecret: false, reason: "Channel not found" };
    }
    if (!isOAuthEligibleChannel(channel)) {
      return {
        eligible: false,
        enabled: false,
        hasSecret: false,
        reason: "Channel is not eligible for OAuth webhooks",
      };
    }
    return {
      eligible: true,
      enabled: true,
      clientId: eci,
      hasSecret: false,
    };
  }

  async channelRequiresBearer(eci: string): Promise<boolean> {
    try {
      return isOAuthEligibleChannel(this.lookupChannelReadOnly(eci));
    } catch (_e) {
      return false;
    }
  }

  meshRequiresOAuth(eci: string): boolean {
    return meshRequiresOAuthForEci(this.deps.pf, eci);
  }

  /** @deprecated use channelRequiresBearer */
  async channelOAuthEnabled(eci: string): Promise<boolean> {
    return this.channelRequiresBearer(eci);
  }

  async channelStatusAsync(eci: string): Promise<OAuthChannelStatus> {
    let channel: ChannelReadOnly;
    try {
      channel = this.lookupChannelReadOnly(eci);
    } catch (_e) {
      return { eligible: false, enabled: false, hasSecret: false, reason: "Channel not found" };
    }
    if (!isOAuthEligibleChannel(channel)) {
      return {
        eligible: false,
        enabled: false,
        hasSecret: false,
        reason: "Channel is not eligible for OAuth webhooks",
      };
    }
    const stored = await this.getChannelOAuth(eci);
    const hasSecret = !!stored;
    return {
      eligible: true,
      enabled: true,
      clientId: eci,
      hasSecret,
      createdAt: stored?.createdAt,
    };
  }

  async createChannelSecret(eci: string): Promise<OAuthChannelCredentials> {
    const channel = this.assertEligibleChannel(eci);
    const rootPicoId = this.rootPicoIdForChannel(channel);
    const client_secret = randomSecret();
    const secretSalt = randomSalt();
    const record: StoredChannelOAuth = {
      channelEci: eci,
      rootPicoId,
      secretSalt,
      secretHash: hashSecret(client_secret, secretSalt),
      createdAt: new Date().toISOString(),
    };
    await this.deps.db.put([OAUTH_CHANNEL_PREFIX, eci], record);
    await this.revokeTokens(eci);
    return { client_id: eci, client_secret };
  }

  async revokeChannelSecret(eci: string): Promise<void> {
    this.assertEligibleChannel(eci);
    await this.deps.db.del([OAUTH_CHANNEL_PREFIX, eci]);
    await this.revokeTokens(eci);
  }

  async revokeTokens(eci: string): Promise<void> {
    const rows = await dbList<StoredOAuthToken>(this.deps.db, [OAUTH_TOKEN_PREFIX]);
    for (const row of rows) {
      if (row.value.channelEci === eci) {
        await this.deps.db.del(row.key);
      }
    }
  }

  async clientCredentialsGrant(input: {
    client_id?: string;
    client_secret?: string;
    expires_in?: number | string;
  }): Promise<OAuthTokenResponse> {
    const client_id = (input.client_id || "").trim();
    const client_secret = (input.client_secret || "").trim();
    if (client_id.startsWith("app_")) {
      throw new OAuthError(
        "OAuth apps require grant_type=authorization_code or refresh_token, not client_credentials",
        "invalid_client",
        401
      );
    }
    if (!client_id || !client_secret) {
      throw new OAuthError("Missing client credentials", "invalid_client", 401);
    }
    const channel = this.assertEligibleChannel(client_id);
    const stored = await this.getChannelOAuth(client_id);
    if (!stored) {
      throw new OAuthError("Invalid client", "invalid_client", 401);
    }
    if (!verifySecret(client_secret, stored.secretSalt, stored.secretHash)) {
      throw new OAuthError("Invalid client", "invalid_client", 401);
    }
    const tokenTtlMs = resolveTokenTtlMs(input.expires_in, this.tokenTtlMs);
    const token = acg.mintAccessToken();
    const expiresAt = tokenTtlMs === null ? 0 : Date.now() + tokenTtlMs;
    const tokenRecord: StoredOAuthToken = {
      token,
      grant: "client_credentials",
      channelEci: client_id,
      rootPicoId: stored.rootPicoId,
      expiresAt,
      createdAt: new Date().toISOString(),
    };
    await this.deps.db.put([OAUTH_TOKEN_PREFIX, token], tokenRecord);
    const response: OAuthTokenResponse = {
      access_token: token,
      token_type: "Bearer",
    };
    if (tokenTtlMs !== null) {
      response.expires_in = Math.floor(tokenTtlMs / 1000);
    }
    return response;
  }

  async skyRequiresBearer(eci: string): Promise<boolean> {
    if (await this.channelRequiresBearer(eci)) {
      return true;
    }
    return this.meshRequiresOAuth(eci);
  }

  async validateBearerToken(token: string, channelEci: string): Promise<boolean> {
    return this.validateSkyBearerToken(token, channelEci);
  }

  async validateSkyBearerToken(
    token: string,
    channelEci: string
  ): Promise<boolean> {
    const trimmed = (token || "").trim();
    if (!trimmed || !channelEci) {
      return false;
    }
    const record = await this.getTokenRecord(trimmed);
    if (!record) {
      return false;
    }
    if (record.expiresAt !== 0 && record.expiresAt < Date.now()) {
      await this.deps.db.del([OAUTH_TOKEN_PREFIX, trimmed]);
      return false;
    }
    const grant = record.grant || "client_credentials";
    if (grant === "authorization_code") {
      return isChannelUnderRoot(this.deps.pf, channelEci, record.rootPicoId);
    }
    return record.channelEci === channelEci;
  }

  listApps(rootPicoId: string): Promise<acg.OAuthAppSummary[]> {
    return acg.listApps(this.acgContext(), rootPicoId);
  }

  registerApp(
    rootPicoId: string,
    input: {
      name?: string;
      redirect_uris?: string[];
      public_client?: boolean;
    }
  ): Promise<acg.OAuthAppCredentials> {
    return acg.registerApp(this.acgContext(), rootPicoId, input);
  }

  revokeApp(rootPicoId: string, clientId: string): Promise<void> {
    return acg.revokeApp(this.acgContext(), rootPicoId, clientId);
  }

  getAppForAuthorize(params: acg.AuthorizeParams): Promise<acg.StoredOAuthApp> {
    return acg.getAppForAuthorize(this.acgContext(), params);
  }

  approveAuthorization(
    session: { accountId: string; rootPicoId: string },
    params: acg.ApproveParams
  ): Promise<string> {
    return acg.approveAuthorization(this.acgContext(), session, params);
  }

  authorizationCodeGrant(input: {
    grant_type?: string;
    code?: string;
    redirect_uri?: string;
    client_id?: string;
    client_secret?: string;
    code_verifier?: string;
  }): Promise<OAuthTokenResponse> {
    return acg.authorizationCodeGrant(this.acgContext(), input);
  }

  refreshTokenGrant(input: {
    grant_type?: string;
    refresh_token?: string;
    client_id?: string;
    client_secret?: string;
  }): Promise<OAuthTokenResponse> {
    return acg.refreshTokenGrant(this.acgContext(), input);
  }

  tokenGrant(body: Record<string, unknown>): Promise<OAuthTokenResponse> {
    const grant_type = String(body.grant_type || "client_credentials").trim();
    if (grant_type === "authorization_code") {
      return this.authorizationCodeGrant(body as any);
    }
    if (grant_type === "refresh_token") {
      return this.refreshTokenGrant(body as any);
    }
    return this.clientCredentialsGrant(body as any);
  }

  private acgContext(): acg.AcgContext {
    return {
      db: this.deps.db,
      pf: this.deps.pf,
      tokenTtlMs: this.tokenTtlMs,
      putAccessToken: async (record) => {
        const tokenRecord: StoredOAuthToken = {
          token: record.token,
          grant: "authorization_code",
          rootPicoId: record.rootPicoId,
          appId: record.appId,
          accountId: record.accountId,
          scope: record.scope,
          expiresAt: record.expiresAt,
          createdAt: new Date().toISOString(),
        };
        await this.deps.db.put([OAUTH_TOKEN_PREFIX, record.token], tokenRecord);
      },
    };
  }

  private async getTokenRecord(token: string): Promise<StoredOAuthToken | null> {
    return dbGet<StoredOAuthToken>(this.deps.db, [OAUTH_TOKEN_PREFIX, token]);
  }

  /** Channel owner or an ancestor pico in the admin tree may manage webhook OAuth. */
  assertChannelManagedBy(eci: string, callerPicoId: string): ChannelReadOnly {
    const channel = this.lookupChannelReadOnly(eci);
    let pico = this.deps.pf.lookupChannel(eci).pico;
    while (true) {
      if (pico.id === callerPicoId) {
        return channel;
      }
      if (!pico.parent) {
        break;
      }
      pico = this.deps.pf.getPico(pico.parent);
    }
    throw new OAuthError(
      "Channel is not in this pico's subtree",
      "invalid_request",
      403
    );
  }

  private assertEligibleChannel(eci: string): ChannelReadOnly {
    const channel = this.lookupChannelReadOnly(eci);
    if (!isOAuthEligibleChannel(channel)) {
      throw new OAuthError(
        "Channel is not eligible for OAuth webhooks",
        "invalid_client",
        403
      );
    }
    return channel;
  }

  private rootPicoIdForChannel(channel: ChannelReadOnly): string {
    const owner = this.deps.pf.lookupChannel(channel.id).pico;
    let pico = owner;
    while (pico.parent) {
      pico = this.deps.pf.getPico(pico.parent);
    }
    return pico.id;
  }

  private async getChannelOAuth(eci: string): Promise<StoredChannelOAuth | null> {
    return dbGet<StoredChannelOAuth>(this.deps.db, [OAUTH_CHANNEL_PREFIX, eci]);
  }
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

function resolveTokenTtlMs(
  expires_in: number | string | undefined,
  defaultMs: number
): number | null {
  if (expires_in === undefined || expires_in === null || expires_in === "") {
    return defaultMs;
  }
  if (typeof expires_in === "string" && expires_in.trim().toLowerCase() === "never") {
    return null;
  }
  const seconds =
    typeof expires_in === "string" ? Number.parseInt(expires_in, 10) : expires_in;
  if (seconds === 0) {
    return null;
  }
  if (
    !Number.isFinite(seconds) ||
    seconds < MIN_TOKEN_TTL_SEC ||
    seconds > MAX_TOKEN_TTL_SEC
  ) {
    throw new OAuthError(
      `expires_in must be 0 (never), or between ${MIN_TOKEN_TTL_SEC} and ${MAX_TOKEN_TTL_SEC} seconds`,
      "invalid_request",
      400
    );
  }
  return seconds * 1000;
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
