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
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
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

async function parseJson(resp: Response) {
  const text = await resp.text();
  if (text === "") {
    return null;
  }
  return JSON.parse(text);
}

export async function fetchMeshOAuthEnabled(): Promise<boolean> {
  const resp = await fetch("/api/oauth/mesh-enabled", { credentials: "include" });
  if (!resp.ok) {
    return false;
  }
  const data = await parseJson(resp);
  return !!(data && data.meshOAuthEnabled);
}

export async function fetchOAuthChannelStatus(
  eci: string
): Promise<OAuthChannelStatus> {
  const resp = await fetch(`/oauth/channels/${encodeURIComponent(eci)}/status`, {
    credentials: "include",
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && data.error) || resp.statusText);
  }
  return data;
}

export async function createOAuthChannelCredentials(
  eci: string
): Promise<OAuthChannelCredentials> {
  const resp = await fetch(`/oauth/channels/${encodeURIComponent(eci)}/credentials`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && (data.error_description || data.error)) || resp.statusText);
  }
  return data;
}

export async function revokeOAuthChannelCredentials(eci: string): Promise<void> {
  const resp = await fetch(`/oauth/channels/${encodeURIComponent(eci)}/credentials`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && (data.error_description || data.error)) || resp.statusText);
  }
}

export async function revokeOAuthChannelTokens(eci: string): Promise<void> {
  const resp = await fetch(`/oauth/channels/${encodeURIComponent(eci)}/tokens`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && (data.error_description || data.error)) || resp.statusText);
  }
}

export async function exchangeOAuthToken(
  client_id: string,
  client_secret: string,
  expires_in?: number
): Promise<OAuthTokenResponse> {
  const body: Record<string, string | number> = {
    grant_type: "client_credentials",
    client_id,
    client_secret,
  };
  if (expires_in !== undefined) {
    body.expires_in = expires_in;
  }
  const resp = await fetch("/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error(
      (data && (data.error_description || data.error)) || resp.statusText
    );
  }
  return data;
}

export async function fetchOAuthApps(): Promise<OAuthAppSummary[]> {
  const resp = await fetch("/oauth/apps", { credentials: "include" });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && (data.error_description || data.error)) || resp.statusText);
  }
  return (data && data.apps) || [];
}

export async function registerOAuthApp(input: {
  name: string;
  redirect_uris: string[];
  public_client?: boolean;
}): Promise<OAuthAppCredentials> {
  const resp = await fetch("/oauth/apps", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && (data.error_description || data.error)) || resp.statusText);
  }
  return data;
}

export async function revokeOAuthApp(clientId: string): Promise<void> {
  const resp = await fetch(`/oauth/apps/${encodeURIComponent(clientId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    throw new Error((data && (data.error_description || data.error)) || resp.statusText);
  }
}
