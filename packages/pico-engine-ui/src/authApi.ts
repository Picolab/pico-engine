export interface CredentialInfo {
  credentialID: string;
  label: string;
  transports: string[];
  createdAt: string;
}

export interface UiSession {
  authenticated: boolean;
  accountId?: string;
  rootPicoId?: string;
  displayName?: string;
  uiECI?: string | null;
  credentials?: CredentialInfo[];
}

export interface UiContext {
  version: string;
  hasRoots: boolean;
  needsAuthMigration?: boolean;
  allowSelfSignup: boolean;
  eci?: string;
  session?: UiSession;
}

export interface InvitePeek {
  valid: boolean;
  label?: string;
  expiresAt?: number;
}

export interface InviteInfo {
  token: string;
  label?: string;
  createdAt: string;
  expiresAt: number;
}

async function parseJson(resp: Response) {
  const text = await resp.text();
  if (text === "") {
    return null;
  }
  return JSON.parse(text);
}

export async function fetchUiContext(): Promise<UiContext> {
  const resp = await fetch("/api/ui-context", { credentials: "include" });
  return parseJson(resp);
}

export async function authPost(path: string, body: unknown = {}) {
  const resp = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && data.error) || resp.statusText);
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function fetchSession(): Promise<UiSession> {
  const resp = await fetch("/auth/session", { credentials: "include" });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && data.error) || resp.statusText);
  }
  return data;
}

export async function authDelete(path: string) {
  const resp = await fetch(path, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && data.error) || resp.statusText);
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function authLogout() {
  return authPost("/auth/logout", {});
}

export async function fetchInvite(token: string): Promise<InvitePeek> {
  const resp = await fetch(`/auth/invites/${encodeURIComponent(token)}`, {
    credentials: "include",
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && data.error) || resp.statusText);
  }
  return data;
}

export async function createInvite(label?: string): Promise<InviteInfo> {
  return authPost("/auth/invites", { label: label || undefined });
}

export function inviteRegisterUrl(token: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("invite", token);
  url.hash = "";
  return url.toString();
}
