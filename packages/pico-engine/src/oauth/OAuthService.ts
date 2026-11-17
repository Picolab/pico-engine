import * as crypto from "crypto";
import { ChannelReadOnly, PicoDb, PicoDbKey, PicoFramework } from "pico-framework";
import * as acg from "./acg";
import {
  isMeshOAuthExemptChannel,
  isOAuthEligibleChannel,
} from "./channelEligibility";
import {
  assertMcpScopes,
  canonicalResourceUrl,
  classifyResource,
  MCP_CHANNEL_SCOPE,
  mcpResourceUrl,
  skyResourceUrl,
} from "./discovery";
import { loadClientMetadata, type ClientMetadataDocument } from "./cimd";
import { OAuthError } from "./errors";
import {
  isChannelUnderRoot,
  meshRequiresOAuth as meshRequiresOAuthForEci,
  rootHasOAuthMeshRuleset,
} from "./meshOAuth";
import {
  channelHasUnrestrictedAllow,
  isDidcommIngressChannel,
  wildcardSkyRequireBearerEnabled,
} from "../channelIdentityPolicy";

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
  /** Canonical RFC 8707 resource. Absent on legacy Sky tokens. */
  resource?: string;
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
  /** Read at request time. `base_url` is assigned after the service is constructed. */
  getBaseUrl?: () => string | undefined;
  /** Override the Client ID Metadata Document fetch (tests). */
  loadClientMetadata?: (url: string) => Promise<ClientMetadataDocument>;
}

export class OAuthService {
  private deps: OAuthServiceDeps;
  loadClientMetadata: (url: string) => Promise<ClientMetadataDocument>;

  constructor(deps: OAuthServiceDeps) {
    this.deps = deps;
    this.loadClientMetadata = deps.loadClientMetadata ?? ((url) => loadClientMetadata(url));
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
    resource?: string;
    scope?: string;
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
    const resource = this.bindClientCredentialsResource(
      acg.readResource(input.resource),
      client_id
    );
    const scope = this.clientCredentialsScope(resource, input.scope);
    const tokenRecord: StoredOAuthToken = {
      token,
      grant: "client_credentials",
      channelEci: client_id,
      rootPicoId: stored.rootPicoId,
      scope,
      resource,
      expiresAt,
      createdAt: new Date().toISOString(),
    };
    await this.deps.db.put([OAUTH_TOKEN_PREFIX, token], tokenRecord);
    const response: OAuthTokenResponse = {
      access_token: token,
      token_type: "Bearer",
    };
    if (scope) {
      response.scope = scope;
    }
    if (tokenTtlMs !== null) {
      response.expires_in = Math.floor(tokenTtlMs / 1000);
    }
    return response;
  }

  async skyRequiresBearer(eci: string): Promise<boolean> {
    try {
      const channel = this.lookupChannelReadOnly(eci);
      if (isDidcommIngressChannel(channel)) {
        return false;
      }
      if (
        wildcardSkyRequireBearerEnabled() &&
        channelHasUnrestrictedAllow(channel)
      ) {
        return true;
      }
      if (isOAuthEligibleChannel(channel)) {
        return true;
      }
      if (isMeshOAuthExemptChannel(channel)) {
        return false;
      }
    } catch (_e) {
      // channel not found — fall through
    }
    return this.meshRequiresOAuth(eci);
  }

  async validateBearerToken(token: string, channelEci: string): Promise<boolean> {
    return this.validateSkyBearerToken(token, channelEci);
  }

  /** Mesh-wide OAuth token (authorization_code grant) → root pico id. */
  async resolveMeshBearerToken(
    token: string
  ): Promise<{ rootPicoId: string; scope?: string } | null> {
    const trimmed = (token || "").trim();
    if (!trimmed) {
      return null;
    }
    const record = await this.getTokenRecord(trimmed);
    if (!record) {
      return null;
    }
    if (record.expiresAt !== 0 && record.expiresAt < Date.now()) {
      await this.deps.db.del([OAUTH_TOKEN_PREFIX, trimmed]);
      return null;
    }
    if ((record.grant || "client_credentials") !== "authorization_code") {
      return null;
    }
    if (!record.rootPicoId || !this.acceptsSkyResource(record.resource)) {
      return null;
    }
    return { rootPicoId: record.rootPicoId, scope: record.scope };
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
    if (!this.acceptsSkyResource(record.resource)) {
      return false;
    }
    return this.grantAllowsChannel(record, channelEci);
  }

  /** Channel MCP audience only. A Sky token, or a token for another ECI, is rejected. */
  async validateMcpBearerToken(
    token: string,
    channelEci: string
  ): Promise<boolean> {
    return (await this.resolveMcpChannelToken(token, channelEci)) !== null;
  }

  /**
   * A live token whose resource is exactly this channel's MCP URL.
   * Scope is not checked here; the route answers 403 when a call needs a scope
   * the token does not have.
   */
  async resolveMcpChannelToken(
    token: string,
    channelEci: string
  ): Promise<{ scope: string; rootPicoId: string } | null> {
    return this.resolveMcpToken(token, channelEci, "channel");
  }

  /** Authorization-code token whose resource is exactly this mesh MCP URL. */
  async resolveMcpMeshToken(
    token: string,
    channelEci: string
  ): Promise<{ scope: string; rootPicoId: string } | null> {
    return this.resolveMcpToken(token, channelEci, "mesh");
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

  async getAppForAuthorize(
    params: acg.AuthorizeParams
  ): Promise<acg.ResolvedAuthorizeClient> {
    const resolved = await acg.getAppForAuthorize(this.acgContext(), params);
    if (!resolved.cimd && params.resource !== undefined) {
      params.resource = this.bindAcgResource(params.resource, resolved.app.rootPicoId);
    }
    return resolved;
  }

  meshOAuthEnabled(rootPicoId: string): boolean {
    return rootHasOAuthMeshRuleset(this.deps.pf, rootPicoId);
  }

  /** Canonical resource for the consent form, once the mesh is known. */
  bindAuthorizeResource(resource: string | undefined, rootPicoId: string): string | undefined {
    return this.bindAcgResource(resource, rootPicoId);
  }

  approveAuthorization(
    session: { accountId: string; rootPicoId: string },
    params: acg.ApproveParams
  ): Promise<string> {
    const resource = this.bindAcgResource(params.resource, session.rootPicoId);
    return acg.approveAuthorization(this.acgContext(), session, {
      ...params,
      resource,
    });
  }

  authorizationCodeGrant(input: {
    grant_type?: string;
    code?: string;
    redirect_uri?: string;
    client_id?: string;
    client_secret?: string;
    code_verifier?: string;
    resource?: string;
  }): Promise<OAuthTokenResponse> {
    return acg.authorizationCodeGrant(this.acgContext(), {
      ...input,
      resource: this.presentedResource(input.resource),
    });
  }

  refreshTokenGrant(input: {
    grant_type?: string;
    refresh_token?: string;
    client_id?: string;
    client_secret?: string;
    resource?: string;
  }): Promise<OAuthTokenResponse> {
    return acg.refreshTokenGrant(this.acgContext(), {
      ...input,
      resource: this.presentedResource(input.resource),
    });
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
      loadClientMetadata: (url) => this.loadClientMetadata(url),
      putAccessToken: async (record) => {
        const tokenRecord: StoredOAuthToken = {
          token: record.token,
          grant: "authorization_code",
          rootPicoId: record.rootPicoId,
          appId: record.appId,
          accountId: record.accountId,
          scope: record.scope,
          resource: record.resource,
          expiresAt: record.expiresAt,
          createdAt: new Date().toISOString(),
        };
        await this.deps.db.put([OAUTH_TOKEN_PREFIX, record.token], tokenRecord);
      },
    };
  }

  private grantAllowsChannel(record: StoredOAuthToken, channelEci: string): boolean {
    const grant = record.grant || "client_credentials";
    if (grant === "authorization_code") {
      return isChannelUnderRoot(this.deps.pf, channelEci, record.rootPicoId);
    }
    return record.channelEci === channelEci;
  }

  /** No resource is a legacy Sky token. A recorded resource must be this engine's /sky. */
  private acceptsSkyResource(resource: string | undefined): boolean {
    if (!resource) {
      return true;
    }
    const base = this.baseUrl();
    return !!base && resource === skyResourceUrl(base);
  }

  private baseUrl(): string | undefined {
    const raw = this.deps.getBaseUrl?.();
    const base = raw && raw.trim();
    return base || undefined;
  }

  private requireBaseUrl(): string {
    const base = this.baseUrl();
    if (!base) {
      throw new OAuthError("Engine base URL is not configured", "invalid_target", 400);
    }
    return base;
  }

  /** Canonical form of a presented resource, or undefined when the client omitted it. */
  private presentedResource(resource: string | undefined): string | undefined {
    const value = acg.readResource(resource);
    if (!value) {
      return undefined;
    }
    return this.canonicalResource(value);
  }

  private canonicalResource(resource: string): string {
    const base = this.requireBaseUrl();
    return canonicalResourceUrl(base, classifyResource(base, resource));
  }

  /**
   * A channel MCP client that omits scope receives query and event access.
   * A named scope must be one of the advertised MCP scopes. Sky tokens do
   * not gain MCP scopes.
   */
  private clientCredentialsScope(
    resource: string | undefined,
    requested: string | undefined
  ): string | undefined {
    const base = this.baseUrl();
    let mcp = false;
    let channel = false;
    if (resource && base) {
      const target = classifyResource(base, resource);
      if (target.kind === "mcp") {
        mcp = true;
        channel = target.surface === "channel";
      }
    }
    const asked = requested !== undefined ? String(requested).trim() : "";
    if (asked) {
      return mcp ? assertMcpScopes(asked) : asked.split(/\s+/).filter(Boolean).join(" ") || undefined;
    }
    if (channel) {
      return MCP_CHANNEL_SCOPE;
    }
    return undefined;
  }

  private bindClientCredentialsResource(
    resource: string | undefined,
    clientId: string
  ): string | undefined {
    if (!resource) {
      return undefined;
    }
    const base = this.requireBaseUrl();
    const target = classifyResource(base, resource);
    if (target.kind === "mcp") {
      if (target.surface !== "channel" || target.eci !== clientId) {
        throw new OAuthError("Invalid resource", "invalid_target", 400);
      }
    }
    return canonicalResourceUrl(base, target);
  }

  private bindAcgResource(
    resource: string | undefined,
    rootPicoId: string
  ): string | undefined {
    if (!resource) {
      return undefined;
    }
    const base = this.requireBaseUrl();
    const target = classifyResource(base, resource);
    if (target.kind === "mcp") {
      try {
        this.lookupChannelReadOnly(target.eci);
      } catch (_e) {
        throw new OAuthError("Invalid resource", "invalid_target", 400);
      }
      if (!isChannelUnderRoot(this.deps.pf, target.eci, rootPicoId)) {
        throw new OAuthError("Invalid resource", "invalid_target", 400);
      }
    }
    return canonicalResourceUrl(base, target);
  }

  private async resolveMcpToken(
    token: string,
    channelEci: string,
    surface: "channel" | "mesh"
  ): Promise<{ scope: string; rootPicoId: string } | null> {
    const trimmed = (token || "").trim();
    if (!trimmed || !channelEci) {
      return null;
    }
    const record = await this.getTokenRecord(trimmed);
    if (!record || !record.resource || !record.rootPicoId) {
      return null;
    }
    if (surface === "mesh" && (record.grant || "client_credentials") !== "authorization_code") {
      return null;
    }
    if (record.expiresAt !== 0 && record.expiresAt < Date.now()) {
      await this.deps.db.del([OAUTH_TOKEN_PREFIX, trimmed]);
      return null;
    }
    const base = this.baseUrl();
    if (!base || record.resource !== mcpResourceUrl(base, channelEci, surface)) {
      return null;
    }
    if (!this.grantAllowsChannel(record, channelEci)) {
      return null;
    }
    return { scope: record.scope || "", rootPicoId: record.rootPicoId };
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
