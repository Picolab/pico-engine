import * as crypto from "crypto";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { PicoDb, PicoDbKey } from "pico-framework";
import { WebAuthnAdapter, WebAuthnCredentialKey } from "./webauthn";

const CREDENTIAL_PREFIX = "auth-credential";
const ACCOUNT_PREFIX = "auth-account";
const SESSION_PREFIX = "auth-session";
const INVITE_PREFIX = "auth-invite";

const DEFAULT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEFAULT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_RP_NAME = "Pico Engine";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export interface StoredAccount {
  accountId: string;
  rootPicoId: string;
  displayName: string;
  /** Stable WebAuthn `user.name`; legacy accounts omit this (displayName was used). */
  webauthnUserName?: string;
  createdAt: string;
}

interface StoredCredential {
  credentialID: string;
  accountId: string;
  publicKey: string; // base64url of the COSE key bytes
  counter: number;
  transports: AuthenticatorTransportFuture[];
  label: string;
  createdAt: string;
}

/** Public (safe) view of a credential — never exposes the public key bytes. */
export interface CredentialInfo {
  credentialID: string;
  label: string;
  transports: AuthenticatorTransportFuture[];
  createdAt: string;
}

export interface InviteInfo {
  token: string;
  label?: string;
  createdAt: string;
  expiresAt: number;
}

export interface InvitePeek {
  valid: boolean;
  label?: string;
  expiresAt?: number;
}

interface StoredInvite {
  token: string;
  createdByAccountId: string;
  label?: string;
  createdAt: string;
  expiresAt: number;
}

interface StoredSession {
  token: string;
  accountId: string;
  rootPicoId: string;
  credentialID: string;
  expiry: number;
}

type Ceremony =
  | {
      type: "register";
      challenge: string;
      accountId: string;
      displayName: string;
      inviteToken?: string;
      expiresAt: number;
    }
  | { type: "claim"; challenge: string; accountId: string; displayName: string; rootPicoId: string; expiresAt: number }
  | { type: "login"; challenge: string; expiresAt: number }
  | { type: "addcred"; challenge: string; accountId: string; expiresAt: number };

export interface WhoAmI {
  authenticated: boolean;
  accountId?: string;
  rootPicoId?: string;
  displayName?: string;
  uiECI?: string | null;
  credentials?: CredentialInfo[];
}

export interface AuthServiceDeps {
  db: PicoDb;
  webauthn: WebAuthnAdapter;

  /** The engine's current base url, used to derive rpID/origin. */
  getBaseUrl: () => string | undefined;
  rpID?: string;
  rpName?: string;
  origin?: string;

  /** When false, new accounts require bootstrap, legacy claim, or an invite token. */
  allowSelfSignup?: boolean;
  sessionTtlMs?: number;
  inviteTtlMs?: number;

  /** Mint a brand new root pico (installs base rulesets) for a new account. */
  provisionRoot: (opts?: {
    name?: string;
  }) => Promise<{ rootPicoId: string; uiECI: string }>;
  /** Resolve the ["engine","ui"] ECI for an existing root. */
  getUiECI: (rootPicoId: string) => Promise<string | null> | string | null;
  /** Primary root id from `["root-pico"]`, or null when none. */
  getPrimaryRootPicoId: () => string | null;
  /** Optional hook after legacy claim (e.g. set root display name in UI ruleset). */
  onAccountClaimed?: (rootPicoId: string, displayName: string) => Promise<void>;
}

export class AuthService {
  private deps: AuthServiceDeps;
  private challenges: Map<string, Ceremony> = new Map();

  constructor(deps: AuthServiceDeps) {
    this.deps = deps;
  }

  get sessionTtlMs(): number {
    return this.deps.sessionTtlMs || DEFAULT_SESSION_TTL_MS;
  }

  /** Resolve the relying-party config from explicit overrides or base_url. */
  rp(): { rpID: string; rpName: string; origin: string } {
    const base = this.deps.getBaseUrl() || "http://localhost:3000";
    let hostname = "localhost";
    let origin = base;
    try {
      const url = new URL(base);
      hostname = url.hostname;
      origin = url.origin;
    } catch (_e) {
      // fall through to defaults
    }
    return {
      rpID: this.deps.rpID || hostname,
      rpName: this.deps.rpName || DEFAULT_RP_NAME,
      origin: this.deps.origin || origin,
    };
  }

  isSecure(): boolean {
    return this.rp().origin.startsWith("https:");
  }

  allowSelfSignup(): boolean {
    return this.deps.allowSelfSignup === true;
  }

  /** Legacy engine: primary root exists but no auth account has been claimed yet. */
  async needsAuthMigration(): Promise<boolean> {
    return (
      (await this.accountCount()) === 0 &&
      this.deps.getPrimaryRootPicoId() !== null
    );
  }

  // ---- legacy migration: claim the existing primary root ----

  async claimPrimaryRootOptions(input: {
    displayName?: string;
  }): Promise<{ options: PublicKeyCredentialCreationOptionsJSON; ceremonyId: string }> {
    const rootPicoId = this.deps.getPrimaryRootPicoId();
    if (!rootPicoId) {
      throw new AuthError("No primary root to claim", 404);
    }
    if ((await this.accountCount()) > 0) {
      throw new AuthError("This engine already has an account", 403);
    }
    const { rpID, rpName } = this.rp();
    const accountId = randomId();
    const displayName = (input.displayName || "").trim() || `pico-${accountId.slice(0, 6)}`;
    const options = await this.deps.webauthn.generateRegistrationOptions({
      rpID,
      rpName,
      userID: new TextEncoder().encode(accountId),
      userName: accountId,
      userDisplayName: displayName,
      excludeCredentials: [],
    });
    const ceremonyId = this.putCeremony({
      type: "claim",
      challenge: options.challenge,
      accountId,
      displayName,
      rootPicoId,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });
    return { options, ceremonyId };
  }

  async claimPrimaryRootVerify(input: {
    ceremonyId: string;
    response: RegistrationResponseJSON;
  }): Promise<{ account: StoredAccount; session: StoredSession; uiECI: string }> {
    const cer = this.takeCeremony(input.ceremonyId, "claim");
    if ((await this.accountCount()) > 0) {
      throw new AuthError("This engine already has an account", 403);
    }
    const primaryRootId = this.deps.getPrimaryRootPicoId();
    if (!primaryRootId || primaryRootId !== cer.rootPicoId) {
      throw new AuthError("Primary root is no longer available to claim", 409);
    }
    const { rpID, origin } = this.rp();
    const result = await this.deps.webauthn.verifyRegistration({
      response: input.response,
      expectedChallenge: cer.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!result.verified || !result.credential) {
      throw new AuthError("Registration could not be verified", 400);
    }

    const uiECI = await this.deps.getUiECI(cer.rootPicoId);
    if (!uiECI) {
      throw new AuthError("Primary root has no UI channel", 500);
    }

    const account: StoredAccount = {
      accountId: cer.accountId,
      rootPicoId: cer.rootPicoId,
      displayName: cer.displayName,
      webauthnUserName: cer.accountId,
      createdAt: new Date().toISOString(),
    };
    await this.deps.db.put([ACCOUNT_PREFIX, account.accountId], account);
    await this.storeCredential(account.accountId, result.credential, "passkey");

    if (this.deps.onAccountClaimed) {
      await this.deps.onAccountClaimed(cer.rootPicoId, cer.displayName);
    }

    const session = await this.createSession(
      account.accountId,
      account.rootPicoId,
      result.credential.id
    );
    return { account, session, uiECI };
  }

  // ---- registration invites ----

  async createInvite(input: {
    createdByAccountId: string;
    label?: string;
  }): Promise<InviteInfo> {
    const token = randomToken();
    const now = Date.now();
    const ttl = this.deps.inviteTtlMs ?? DEFAULT_INVITE_TTL_MS;
    const invite: StoredInvite = {
      token,
      createdByAccountId: input.createdByAccountId,
      label: (input.label || "").trim() || undefined,
      createdAt: new Date(now).toISOString(),
      expiresAt: now + ttl,
    };
    await this.deps.db.put([INVITE_PREFIX, token], invite);
    return {
      token: invite.token,
      label: invite.label,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    };
  }

  async peekInvite(token: string): Promise<InvitePeek> {
    const invite = await this.getInvite(token);
    if (!invite) {
      return { valid: false };
    }
    if (invite.expiresAt < Date.now()) {
      return { valid: false };
    }
    return {
      valid: true,
      label: invite.label,
      expiresAt: invite.expiresAt,
    };
  }

  // ---- new-account registration (unauthenticated / bootstrap / invited) ----

  async registerNewAccountOptions(input: {
    displayName?: string;
    invite?: string;
  }): Promise<{ options: PublicKeyCredentialCreationOptionsJSON; ceremonyId: string }> {
    if (await this.needsAuthMigration()) {
      throw new AuthError(
        "This engine has an existing mesh. Claim it with a passkey instead of registering a new root.",
        403
      );
    }
    const inviteToken = (input.invite || "").trim() || undefined;
    await this.assertRegistrationAllowed(inviteToken);

    const { rpID, rpName } = this.rp();
    const accountId = randomId();
    const displayName = (input.displayName || "").trim() || `pico-${accountId.slice(0, 6)}`;
    const options = await this.deps.webauthn.generateRegistrationOptions({
      rpID,
      rpName,
      userID: new TextEncoder().encode(accountId),
      userName: accountId,
      userDisplayName: displayName,
      excludeCredentials: [],
    });
    const ceremonyId = this.putCeremony({
      type: "register",
      challenge: options.challenge,
      accountId,
      displayName,
      inviteToken,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });
    return { options, ceremonyId };
  }

  async registerNewAccountVerify(input: {
    ceremonyId: string;
    response: RegistrationResponseJSON;
  }): Promise<{ account: StoredAccount; session: StoredSession; uiECI: string }> {
    if (await this.needsAuthMigration()) {
      throw new AuthError(
        "This engine has an existing mesh. Claim it with a passkey instead of registering a new root.",
        403
      );
    }
    const cer = this.takeCeremony(input.ceremonyId, "register");
    await this.assertRegistrationAllowed(cer.inviteToken);

    const { rpID, origin } = this.rp();
    const result = await this.deps.webauthn.verifyRegistration({
      response: input.response,
      expectedChallenge: cer.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!result.verified || !result.credential) {
      throw new AuthError("Registration could not be verified", 400);
    }

    // Provision the account's root only after the ceremony verifies.
    const { rootPicoId, uiECI } = await this.deps.provisionRoot({
      name: cer.displayName,
    });

    const account: StoredAccount = {
      accountId: cer.accountId,
      rootPicoId,
      displayName: cer.displayName,
      webauthnUserName: cer.accountId,
      createdAt: new Date().toISOString(),
    };
    await this.deps.db.put([ACCOUNT_PREFIX, account.accountId], account);
    await this.storeCredential(account.accountId, result.credential, "passkey");

    if (cer.inviteToken) {
      await this.consumeInvite(cer.inviteToken);
    }

    const session = await this.createSession(
      account.accountId,
      rootPicoId,
      result.credential.id
    );
    return { account, session, uiECI };
  }

  // ---- usernameless login ----

  async loginOptions(): Promise<{
    options: PublicKeyCredentialRequestOptionsJSON;
    ceremonyId: string;
  }> {
    const { rpID } = this.rp();
    const options = await this.deps.webauthn.generateAuthenticationOptions({ rpID });
    const ceremonyId = this.putCeremony({
      type: "login",
      challenge: options.challenge,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });
    return { options, ceremonyId };
  }

  async loginVerify(input: {
    ceremonyId: string;
    response: AuthenticationResponseJSON;
  }): Promise<{ account: StoredAccount; session: StoredSession }> {
    const cer = this.takeCeremony(input.ceremonyId, "login");
    const credentialID = input.response.id;
    const stored = await this.getCredential(credentialID);
    if (!stored) {
      throw new AuthError("Unknown credential", 400);
    }
    const { rpID, origin } = this.rp();
    const result = await this.deps.webauthn.verifyAuthentication({
      response: input.response,
      expectedChallenge: cer.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: storedToKey(stored),
    });
    if (!result.verified) {
      throw new AuthError("Authentication could not be verified", 400);
    }
    stored.counter = result.newCounter;
    await this.deps.db.put([CREDENTIAL_PREFIX, credentialID], stored);

    const account = await this.getAccount(stored.accountId);
    if (!account) {
      throw new AuthError("Account no longer exists", 400);
    }
    const session = await this.createSession(
      account.accountId,
      account.rootPicoId,
      credentialID
    );
    return { account, session };
  }

  // ---- add / remove passkeys on an existing account (session-gated) ----

  async addCredentialOptions(input: {
    accountId: string;
  }): Promise<{ options: PublicKeyCredentialCreationOptionsJSON; ceremonyId: string }> {
    const account = await this.getAccount(input.accountId);
    if (!account) {
      throw new AuthError("Account not found", 404);
    }
    const { rpID, rpName } = this.rp();
    const existing = await this.listStoredCredentials(input.accountId);
    const userName = account.webauthnUserName || account.displayName;
    const options = await this.deps.webauthn.generateRegistrationOptions({
      rpID,
      rpName,
      userID: new TextEncoder().encode(account.accountId),
      userName,
      userDisplayName: account.displayName,
      excludeCredentials: existing.map((c) => ({
        id: c.credentialID,
        transports: c.transports,
      })),
      additionalPasskey: true,
    });
    const ceremonyId = this.putCeremony({
      type: "addcred",
      challenge: options.challenge,
      accountId: account.accountId,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });
    return { options, ceremonyId };
  }

  async addCredentialVerify(input: {
    ceremonyId: string;
    accountId: string;
    response: RegistrationResponseJSON;
    label?: string;
  }): Promise<{ credential: CredentialInfo }> {
    const cer = this.takeCeremony(input.ceremonyId, "addcred");
    if (cer.accountId !== input.accountId) {
      throw new AuthError("Ceremony does not match this account", 403);
    }
    const { rpID, origin } = this.rp();
    const result = await this.deps.webauthn.verifyRegistration({
      response: input.response,
      expectedChallenge: cer.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!result.verified || !result.credential) {
      throw new AuthError("Registration could not be verified", 400);
    }
    const existing = await this.listStoredCredentials(input.accountId);
    if (existing.some((c) => c.credentialID === result.credential!.id)) {
      throw new AuthError(
        "This passkey is already registered for your account. To add another, enroll from a different device or security key.",
        409
      );
    }
    // Reuses the existing account/user-handle — does NOT create a new root.
    const stored = await this.storeCredential(
      input.accountId,
      result.credential,
      (input.label || "").trim() || "passkey"
    );
    return { credential: toCredentialInfo(stored) };
  }

  async deleteCredential(accountId: string, credentialID: string): Promise<void> {
    const creds = await this.listStoredCredentials(accountId);
    if (creds.length <= 1) {
      throw new AuthError("Cannot remove the last passkey for an account", 409);
    }
    const target = creds.find((c) => c.credentialID === credentialID);
    if (!target) {
      throw new AuthError("Credential not found", 404);
    }
    await this.deps.db.del([CREDENTIAL_PREFIX, credentialID]);
  }

  async listCredentials(accountId: string): Promise<CredentialInfo[]> {
    const creds = await this.listStoredCredentials(accountId);
    return creds.map(toCredentialInfo);
  }

  // ---- sessions ----

  async createSession(
    accountId: string,
    rootPicoId: string,
    credentialID: string
  ): Promise<StoredSession> {
    const session: StoredSession = {
      token: randomToken(),
      accountId,
      rootPicoId,
      credentialID,
      expiry: Date.now() + this.sessionTtlMs,
    };
    await this.deps.db.put([SESSION_PREFIX, session.token], session);
    return session;
  }

  async getSession(token: string): Promise<StoredSession | null> {
    if (!token) {
      return null;
    }
    const session = await dbGet<StoredSession>(this.deps.db, [SESSION_PREFIX, token]);
    if (!session) {
      return null;
    }
    if (session.expiry < Date.now()) {
      await this.deps.db.del([SESSION_PREFIX, token]);
      return null;
    }
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    if (token) {
      await this.deps.db.del([SESSION_PREFIX, token]);
    }
  }

  async whoami(token: string): Promise<WhoAmI> {
    const session = await this.getSession(token);
    if (!session) {
      return { authenticated: false };
    }
    const account = await this.getAccount(session.accountId);
    if (!account) {
      return { authenticated: false };
    }
    const uiECI = await this.deps.getUiECI(account.rootPicoId);
    const credentials = await this.listCredentials(account.accountId);
    return {
      authenticated: true,
      accountId: account.accountId,
      rootPicoId: account.rootPicoId,
      displayName: account.displayName,
      uiECI,
      credentials,
    };
  }

  // ---- stores ----

  private async assertRegistrationAllowed(inviteToken?: string): Promise<void> {
    const count = await this.accountCount();
    if (count === 0) {
      return;
    }
    if (this.deps.allowSelfSignup === true) {
      return;
    }
    const token = (inviteToken || "").trim();
    if (!token) {
      throw new AuthError("Self-signup is disabled on this engine", 403);
    }
    const invite = await this.getInvite(token);
    if (!invite) {
      throw new AuthError("Invalid or expired invite", 403);
    }
    if (invite.expiresAt < Date.now()) {
      throw new AuthError("Invalid or expired invite", 403);
    }
  }

  private async getInvite(token: string): Promise<StoredInvite | null> {
    const trimmed = (token || "").trim();
    if (!trimmed) {
      return null;
    }
    return dbGet<StoredInvite>(this.deps.db, [INVITE_PREFIX, trimmed]);
  }

  private async consumeInvite(token: string): Promise<void> {
    const trimmed = (token || "").trim();
    if (!trimmed) {
      return;
    }
    await this.deps.db.del([INVITE_PREFIX, trimmed]);
  }

  async getAccount(accountId: string): Promise<StoredAccount | null> {
    return dbGet<StoredAccount>(this.deps.db, [ACCOUNT_PREFIX, accountId]);
  }

  private async accountCount(): Promise<number> {
    const rows = await dbList(this.deps.db, [ACCOUNT_PREFIX]);
    return rows.length;
  }

  private async getCredential(credentialID: string): Promise<StoredCredential | null> {
    return dbGet<StoredCredential>(this.deps.db, [CREDENTIAL_PREFIX, credentialID]);
  }

  private async listStoredCredentials(accountId: string): Promise<StoredCredential[]> {
    const rows = await dbList<StoredCredential>(this.deps.db, [CREDENTIAL_PREFIX]);
    return rows
      .map((r) => r.value)
      .filter((c) => c && c.accountId === accountId);
  }

  private async storeCredential(
    accountId: string,
    key: WebAuthnCredentialKey,
    label: string
  ): Promise<StoredCredential> {
    const stored: StoredCredential = {
      credentialID: key.id,
      accountId,
      publicKey: Buffer.from(key.publicKey).toString("base64url"),
      counter: key.counter,
      transports: key.transports || [],
      label,
      createdAt: new Date().toISOString(),
    };
    await this.deps.db.put([CREDENTIAL_PREFIX, stored.credentialID], stored);
    return stored;
  }

  // ---- challenge store (in-memory, per ceremony) ----

  private putCeremony(cer: Ceremony): string {
    this.pruneCeremonies();
    const ceremonyId = randomId();
    this.challenges.set(ceremonyId, cer);
    return ceremonyId;
  }

  private takeCeremony<T extends Ceremony["type"]>(
    ceremonyId: string,
    type: T
  ): Extract<Ceremony, { type: T }> {
    const cer = ceremonyId ? this.challenges.get(ceremonyId) : undefined;
    if (!cer || cer.type !== type) {
      throw new AuthError("Missing or invalid challenge; restart the ceremony", 400);
    }
    this.challenges.delete(ceremonyId);
    if (cer.expiresAt < Date.now()) {
      throw new AuthError("Challenge expired; restart the ceremony", 400);
    }
    return cer as Extract<Ceremony, { type: T }>;
  }

  private pruneCeremonies(): void {
    const now = Date.now();
    for (const [id, cer] of this.challenges) {
      if (cer.expiresAt < now) {
        this.challenges.delete(id);
      }
    }
  }
}

function toCredentialInfo(c: StoredCredential): CredentialInfo {
  return {
    credentialID: c.credentialID,
    label: c.label,
    transports: c.transports,
    createdAt: c.createdAt,
  };
}

function storedToKey(c: StoredCredential): WebAuthnCredentialKey {
  return {
    id: c.credentialID,
    publicKey: new Uint8Array(Buffer.from(c.publicKey, "base64url")),
    counter: c.counter,
    transports: c.transports,
  };
}

function randomId(): string {
  return crypto.randomBytes(16).toString("base64url");
}

function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
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
