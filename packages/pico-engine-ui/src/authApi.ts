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
  bootstrapUrl?: string;
  bootstrapRid?: string;
  expiresAt?: number;
}

export interface InviteInfo {
  token: string;
  label?: string;
  bootstrapUrl?: string;
  bootstrapRid?: string;
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

export async function createInvite(
  label?: string,
  bootstrapUrl?: string
): Promise<InviteInfo> {
  return authPost("/auth/invites", {
    label: label || undefined,
    bootstrapUrl: bootstrapUrl?.trim() || undefined,
  });
}

/** Query params stripped after sign-in / registration (search bar and hash routes). */
const AUTH_URL_PARAMS = ["invite", "oauth_return"];

function readAuthParamFromUrl(name: string): string | null {
  try {
    const url = new URL(window.location.href);
    const fromSearch = url.searchParams.get(name);
    if (fromSearch && fromSearch.trim()) {
      return fromSearch.trim();
    }
    const hash = url.hash;
    const q = hash.indexOf("?");
    if (q < 0) {
      return null;
    }
    const fromHash = new URLSearchParams(hash.slice(q + 1)).get(name);
    return fromHash && fromHash.trim() ? fromHash.trim() : null;
  } catch {
    return null;
  }
}

export function readInviteFromUrl(): string | null {
  return readAuthParamFromUrl("invite");
}

export function readOAuthReturnFromUrl(): string | null {
  return readAuthParamFromUrl("oauth_return");
}

/** Remove auth-related query params from the location bar and hash route. */
export function clearAuthParamsFromUrl(): boolean {
  try {
    const url = new URL(window.location.href);
    let changed = false;

    for (const name of AUTH_URL_PARAMS) {
      if (url.searchParams.has(name)) {
        url.searchParams.delete(name);
        changed = true;
      }
    }

    const hash = url.hash;
    const q = hash.indexOf("?");
    if (q >= 0) {
      const hashPath = hash.slice(0, q);
      const hashParams = new URLSearchParams(hash.slice(q + 1));
      for (const name of AUTH_URL_PARAMS) {
        if (hashParams.has(name)) {
          hashParams.delete(name);
          changed = true;
        }
      }
      const rest = hashParams.toString();
      url.hash = rest ? `${hashPath}?${rest}` : hashPath;
    }

    if (!changed) {
      return false;
    }

    const search = url.searchParams.toString();
    window.history.replaceState(
      {},
      "",
      url.pathname + (search ? `?${search}` : "") + url.hash
    );
    return true;
  } catch {
    return false;
  }
}

/** @deprecated use clearAuthParamsFromUrl */
export function clearInviteFromUrl() {
  clearAuthParamsFromUrl();
}

export function inviteRegisterUrl(token: string): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("invite", token);
  return url.toString();
}
