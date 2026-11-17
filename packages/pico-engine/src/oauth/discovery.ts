import { OAuthError } from "./errors";

/**
 * MCP authorization discovery (1.10 §2).
 *
 * RFC 9728 protected-resource metadata, RFC 8414 authorization-server
 * metadata, and the RFC 6750 challenge on `/mcp/:eci`. Scope names are the
 * ones enforced on `/mcp/{eci}` and `/mcp/mesh/{eci}`.
 */

export const MCP_SCOPES = ["mesh:read", "mesh:act", "mesh:admin"] as const;

/** Scopes a channel MCP client holds when it does not ask for a narrower set. */
export const MCP_CHANNEL_SCOPE = "mesh:read mesh:act";

export function parseScopeList(scope: string | undefined): string[] {
  return [...new Set(String(scope || "").split(/\s+/).filter(Boolean))];
}

/** Every name must be an advertised MCP scope. */
export function assertMcpScopes(scope: string): string {
  const names = parseScopeList(scope);
  if (names.length === 0) {
    throw new OAuthError("Missing scope", "invalid_scope", 400);
  }
  for (const name of names) {
    if (!(MCP_SCOPES as readonly string[]).includes(name)) {
      throw new OAuthError(`Unknown scope: ${name}`, "invalid_scope", 400);
    }
  }
  return names.join(" ");
}

export function scopeIncludes(scope: string | undefined, required: string): boolean {
  return parseScopeList(scope).includes(required);
}

export const GRANT_TYPES_SUPPORTED = [
  "authorization_code",
  "refresh_token",
  "client_credentials",
] as const;

export interface AuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  response_types_supported: ["code"];
  grant_types_supported: string[];
  code_challenge_methods_supported: ["S256"];
  scopes_supported: string[];
  /**
   * Public clients (CIMD, PKCE, no secret) use "none". A confidential app
   * sends its secret in the token request body. RFC 8414 treats an omitted
   * list as client_secret_basic, which makes Claude skip CIMD.
   */
  token_endpoint_auth_methods_supported: ["none", "client_secret_post"];
  /** A client_id that is an https URL is fetched as a Client ID Metadata Document. */
  client_id_metadata_document_supported: true;
}

export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported: string[];
  bearer_methods_supported: ["header"];
}

export type McpResourceSurface = "channel" | "mesh";

/** Configured public origin, else the request's own origin. No trailing slash. */
export function canonicalBaseUrl(
  configured: string | undefined,
  req?: { protocol?: string; get?(name: string): string | undefined }
): string {
  const fromConfig = configured && configured.trim();
  const raw =
    fromConfig ||
    (req && req.protocol
      ? `${req.protocol}://${(req.get && req.get("host")) || "localhost"}`
      : "");
  return raw.replace(/\/$/, "");
}

export function authorizationServerMetadata(
  baseUrl: string,
  issuerUrl?: string
): AuthorizationServerMetadata {
  const origin = canonicalBaseUrl(baseUrl);
  const issuer = canonicalBaseUrl(issuerUrl || origin);
  return {
    issuer,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: [...GRANT_TYPES_SUPPORTED],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [...MCP_SCOPES],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    client_id_metadata_document_supported: true,
  };
}

function eciPath(eci: string): string {
  return encodeURIComponent(eci);
}

/** Audience for Sky routes. A token for an MCP URL is not a Sky token. */
export function skyResourceUrl(baseUrl: string): string {
  return `${canonicalBaseUrl(baseUrl)}/sky`;
}

/** The MCP URL recorded on a token issued for that endpoint. */
export function mcpResourceUrl(
  baseUrl: string,
  eci: string,
  surface: McpResourceSurface
): string {
  const origin = canonicalBaseUrl(baseUrl);
  const id = eciPath(eci);
  return surface === "mesh" ? `${origin}/mcp/mesh/${id}` : `${origin}/mcp/${id}`;
}

/** RFC 9728: insert `/.well-known/oauth-protected-resource` before the resource path. */
export function protectedResourceMetadataUrl(
  baseUrl: string,
  eci: string,
  surface: McpResourceSurface
): string {
  const origin = canonicalBaseUrl(baseUrl);
  const id = eciPath(eci);
  return surface === "mesh"
    ? `${origin}/.well-known/oauth-protected-resource/mcp/mesh/${id}`
    : `${origin}/.well-known/oauth-protected-resource/mcp/${id}`;
}

export function protectedResourceMetadata(
  baseUrl: string,
  eci: string,
  surface: McpResourceSurface
): ProtectedResourceMetadata {
  return {
    resource: mcpResourceUrl(baseUrl, eci, surface),
    authorization_servers: [canonicalBaseUrl(baseUrl)],
    scopes_supported: [...MCP_SCOPES],
    bearer_methods_supported: ["header"],
  };
}

function quoteAuthParam(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * `WWW-Authenticate` for a missing or rejected bearer token.
 * `error` is set only when a token was presented and refused (RFC 6750).
 */
export function bearerChallengeHeader(
  resourceMetadataUrl: string,
  scope: string,
  error?: "invalid_token" | "insufficient_scope"
): string {
  const parts = [
    `resource_metadata=${quoteAuthParam(resourceMetadataUrl)}`,
    `scope=${quoteAuthParam(scope)}`,
  ];
  if (error) {
    parts.push(`error=${quoteAuthParam(error)}`);
  }
  return `Bearer ${parts.join(", ")}`;
}

export type ResourceTarget =
  | { kind: "sky" }
  | { kind: "mcp"; surface: McpResourceSurface; eci: string };

/**
 * RFC 8707 resource indicator. The absolute URI must be this engine's Sky
 * audience or one of its MCP URLs, with no query, fragment, or userinfo.
 */
export function classifyResource(baseUrl: string, resource: string): ResourceTarget {
  const origin = canonicalBaseUrl(baseUrl);
  if (!origin) {
    throw new OAuthError("Engine base URL is not configured", "invalid_target", 400);
  }
  let url: URL;
  try {
    url = new URL(resource);
  } catch {
    throw new OAuthError("Invalid resource", "invalid_target", 400);
  }
  if (
    url.origin !== origin ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new OAuthError("Invalid resource", "invalid_target", 400);
  }
  if (url.pathname === "/sky") {
    return { kind: "sky" };
  }
  const mesh = /^\/mcp\/mesh\/([^/]+)$/.exec(url.pathname);
  if (mesh) {
    return { kind: "mcp", surface: "mesh", eci: decodeResourceEci(mesh[1]) };
  }
  const channel = /^\/mcp\/([^/]+)$/.exec(url.pathname);
  if (channel) {
    return { kind: "mcp", surface: "channel", eci: decodeResourceEci(channel[1]) };
  }
  throw new OAuthError("Invalid resource", "invalid_target", 400);
}

export function canonicalResourceUrl(baseUrl: string, target: ResourceTarget): string {
  if (target.kind === "sky") {
    return skyResourceUrl(baseUrl);
  }
  return mcpResourceUrl(baseUrl, target.eci, target.surface);
}

function decodeResourceEci(segment: string): string {
  let eci: string;
  try {
    eci = decodeURIComponent(segment);
  } catch {
    throw new OAuthError("Invalid resource", "invalid_target", 400);
  }
  if (!eci) {
    throw new OAuthError("Invalid resource", "invalid_target", 400);
  }
  return eci;
}
