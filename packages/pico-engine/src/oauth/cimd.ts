/**
 * Client ID Metadata Documents (1.10 §2 A4).
 *
 * A client_id that is an https URL is fetched and checked. The document's
 * client_id must equal that URL, and its redirect_uris must contain the
 * request's redirect_uri exactly. Pre-registered app_ clients never come
 * through here.
 */

import * as dns from "dns";
import * as https from "https";
import * as net from "net";
import { OAuthError } from "./errors";

export const CIMD_MAX_BYTES = 5 * 1024;
export const CIMD_TIMEOUT_MS = 5000;
export const CIMD_CACHE_CEILING_MS = 60 * 60 * 1000;
const MAX_REDIRECTS = 5;

const blocked = new net.BlockList();
blocked.addSubnet("0.0.0.0", 8, "ipv4");
blocked.addSubnet("10.0.0.0", 8, "ipv4");
blocked.addSubnet("100.64.0.0", 10, "ipv4");
blocked.addSubnet("127.0.0.0", 8, "ipv4");
blocked.addSubnet("169.254.0.0", 16, "ipv4");
blocked.addSubnet("172.16.0.0", 12, "ipv4");
blocked.addSubnet("192.0.0.0", 24, "ipv4");
blocked.addSubnet("192.0.2.0", 24, "ipv4");
blocked.addSubnet("192.168.0.0", 16, "ipv4");
blocked.addSubnet("198.18.0.0", 15, "ipv4");
blocked.addSubnet("198.51.100.0", 24, "ipv4");
blocked.addSubnet("203.0.113.0", 24, "ipv4");
blocked.addSubnet("224.0.0.0", 4, "ipv4");
blocked.addSubnet("240.0.0.0", 4, "ipv4");
blocked.addSubnet("::", 128, "ipv6");
blocked.addSubnet("::1", 128, "ipv6");
blocked.addSubnet("fc00::", 7, "ipv6");
blocked.addSubnet("fe80::", 10, "ipv6");
blocked.addSubnet("ff00::", 8, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");

export interface ClientMetadataDocument {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  clientUri?: string;
  logoUri?: string;
}

export interface ClientMetadataResponse {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
}

export interface ClientMetadataDeps {
  request?: (url: string, signal: AbortSignal) => Promise<ClientMetadataResponse>;
  lookup?: (hostname: string) => Promise<string[]>;
  now?: () => number;
  cache?: Map<string, { doc: ClientMetadataDocument; expiresAt: number }>;
}

const defaultCache = new Map<string, { doc: ClientMetadataDocument; expiresAt: number }>();

export function isClientMetadataUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    url.hash === "" &&
    url.hostname.length > 0
  );
}

/** An http(s) client_id that is not a usable metadata URL. */
export function rejectsAsMetadataUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) && !isClientMetadataUrl(value);
}

export function isPrivateAddress(address: string): boolean {
  let ip = address.trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  if (ip.startsWith("::ffff:")) {
    const rest = ip.slice("::ffff:".length);
    if (net.isIP(rest) === 4) {
      return isPrivateAddress(rest);
    }
    const mapped = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(rest);
    if (mapped) {
      const hi = parseInt(mapped[1], 16);
      const lo = parseInt(mapped[2], 16);
      ip = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
    }
  }
  const kind = net.isIP(ip);
  if (kind === 4) {
    return blocked.check(ip, "ipv4");
  }
  if (kind === 6) {
    return blocked.check(ip, "ipv6");
  }
  return true;
}

/** https URL safe to put on the approval page (the browser will fetch it). */
export function safeDisplayUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    return undefined;
  }
  if (isBlockedHostname(url.hostname)) {
    return undefined;
  }
  if (net.isIP(url.hostname) && isPrivateAddress(url.hostname)) {
    return undefined;
  }
  return value.trim();
}

export function cacheTtlMs(
  headers: Record<string, string | string[] | undefined>,
  now: number
): number | null {
  const cc = headerValue(headers, "cache-control").toLowerCase();
  const expires = headerValue(headers, "expires");
  if (!cc && !expires) {
    return null;
  }
  if (/\bno-store\b/.test(cc) || /\bno-cache\b/.test(cc)) {
    return null;
  }
  const maxAge = /\bmax-age=(\d+)/.exec(cc);
  if (maxAge) {
    const ms = Number(maxAge[1]) * 1000;
    if (ms <= 0) {
      return null;
    }
    return Math.min(ms, CIMD_CACHE_CEILING_MS);
  }
  if (expires) {
    const at = Date.parse(expires);
    if (!Number.isNaN(at) && at > now) {
      return Math.min(at - now, CIMD_CACHE_CEILING_MS);
    }
  }
  return null;
}

export function parseClientMetadata(
  requestedUrl: string,
  body: Buffer
): ClientMetadataDocument {
  if (body.length > CIMD_MAX_BYTES) {
    throw new OAuthError("Client metadata document is too large", "invalid_client", 401);
  }
  let text = body.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new OAuthError("Client metadata document is not JSON", "invalid_client", 401);
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new OAuthError("Client metadata document is not an object", "invalid_client", 401);
  }
  const doc = json as Record<string, unknown>;
  if (doc.client_id !== requestedUrl) {
    throw new OAuthError(
      "client_id in the metadata document does not match the URL",
      "invalid_client",
      401
    );
  }
  if (
    !Array.isArray(doc.redirect_uris) ||
    doc.redirect_uris.some((uri) => typeof uri !== "string")
  ) {
    throw new OAuthError(
      "Client metadata document is missing redirect_uris",
      "invalid_client",
      401
    );
  }
  const redirectUris = (doc.redirect_uris as string[]).map((uri) => uri.trim()).filter(Boolean);
  if (
    typeof doc.token_endpoint_auth_method === "string" &&
    doc.token_endpoint_auth_method !== "none"
  ) {
    throw new OAuthError(
      "Client metadata document must use token_endpoint_auth_method none",
      "invalid_client",
      401
    );
  }
  if (
    Array.isArray(doc.grant_types) &&
    !doc.grant_types.includes("authorization_code")
  ) {
    throw new OAuthError(
      "Client metadata document does not allow authorization_code",
      "invalid_client",
      401
    );
  }
  const host = new URL(requestedUrl).host;
  return {
    clientId: requestedUrl,
    clientName: cleanName(
      typeof doc.client_name === "string" ? doc.client_name : "",
      host
    ),
    redirectUris,
    clientUri: safeDisplayUrl(doc.client_uri),
    logoUri: safeDisplayUrl(doc.logo_uri),
  };
}

export async function loadClientMetadata(
  clientIdUrl: string,
  deps: ClientMetadataDeps = {}
): Promise<ClientMetadataDocument> {
  const now = (deps.now || Date.now)();
  const cache = deps.cache || defaultCache;
  const hit = cache.get(clientIdUrl);
  if (hit && hit.expiresAt > now) {
    return hit.doc;
  }
  let response: { headers: Record<string, string | string[] | undefined>; body: Buffer };
  try {
    const signal = AbortSignal.timeout(CIMD_TIMEOUT_MS);
    response = await fetchDocument(clientIdUrl, deps, signal);
  } catch (err) {
    throw asOAuthError(err);
  }
  const doc = parseClientMetadata(clientIdUrl, response.body);
  const ttl = cacheTtlMs(response.headers, now);
  if (ttl && ttl > 0) {
    cache.set(clientIdUrl, { doc, expiresAt: now + ttl });
  } else {
    cache.delete(clientIdUrl);
  }
  return doc;
}

async function fetchDocument(
  startUrl: string,
  deps: ClientMetadataDeps,
  signal: AbortSignal
): Promise<{ headers: Record<string, string | string[] | undefined>; body: Buffer }> {
  let current = startUrl;
  const seen = new Set<string>();
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (seen.has(current)) {
      throw new OAuthError(
        "Client metadata URL redirected too many times",
        "invalid_client",
        401
      );
    }
    seen.add(current);
    await assertPublicMetadataUrl(current, deps.lookup);
    const response = await (deps.request || defaultRequest)(current, signal);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = headerValue(response.headers, "location");
      if (!location) {
        throw new OAuthError("Client metadata could not be fetched", "invalid_client", 401);
      }
      current = new URL(location, current).toString();
      continue;
    }
    if (response.status !== 200) {
      throw new OAuthError("Client metadata could not be fetched", "invalid_client", 401);
    }
    const declared = Number(headerValue(response.headers, "content-length") || "0");
    if (
      (declared > 0 && declared > CIMD_MAX_BYTES) ||
      response.body.length > CIMD_MAX_BYTES
    ) {
      throw new OAuthError(
        "Client metadata document is too large",
        "invalid_client",
        401
      );
    }
    return { headers: response.headers, body: response.body };
  }
  throw new OAuthError(
    "Client metadata URL redirected too many times",
    "invalid_client",
    401
  );
}

export async function assertPublicMetadataUrl(
  raw: string,
  lookup: ClientMetadataDeps["lookup"] = defaultLookup
): Promise<void> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new OAuthError("Invalid client metadata URL", "invalid_client", 401);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.hash) {
    throw new OAuthError(
      "client_id must be an https URL without a fragment or userinfo",
      "invalid_client",
      401
    );
  }
  const hostname = url.hostname.replace(/\.$/, "");
  if (isBlockedHostname(hostname)) {
    throw new OAuthError(
      "Client metadata URL resolves to a private address",
      "invalid_client",
      401
    );
  }
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new OAuthError(
        "Client metadata URL resolves to a private address",
        "invalid_client",
        401
      );
    }
    return;
  }
  let addresses: string[];
  try {
    addresses = await lookup(hostname);
  } catch {
    throw new OAuthError(
      "Client metadata URL could not be resolved",
      "invalid_client",
      401
    );
  }
  if (!addresses.length || addresses.some((address) => isPrivateAddress(address))) {
    throw new OAuthError(
      "Client metadata URL resolves to a private address",
      "invalid_client",
      401
    );
  }
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }
  if (!host.includes(".")) {
    return true;
  }
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) {
    return true;
  }
  return false;
}

async function defaultLookup(hostname: string): Promise<string[]> {
  const records = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

function defaultRequest(url: string, signal: AbortSignal): Promise<ClientMetadataResponse> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(Object.assign(new Error("timeout"), { name: "TimeoutError" }));
      return;
    }
    const req = https.request(
      url,
      {
        method: "GET",
        headers: { Accept: "application/json", "User-Agent": "pico-engine" },
        lookup: publicLookup as unknown as https.RequestOptions["lookup"],
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > CIMD_MAX_BYTES) {
            res.destroy();
            reject(
              new OAuthError(
                "Client metadata document is too large",
                "invalid_client",
                401
              )
            );
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers as ClientMetadataResponse["headers"],
            body: Buffer.concat(chunks),
          });
        });
        res.on("error", reject);
      }
    );
    const abort = () => {
      req.destroy(Object.assign(new Error("timeout"), { name: "TimeoutError" }));
    };
    signal.addEventListener("abort", abort, { once: true });
    req.setTimeout(CIMD_TIMEOUT_MS, abort);
    req.on("error", reject);
    req.end();
  });
}

function publicLookup(hostname: string, options: unknown, callback?: unknown): void {
  let opts = options as { all?: boolean };
  let cb = callback as (
    err: Error | null,
    address: string | dns.LookupAddress[],
    family?: number
  ) => void;
  if (typeof options === "function") {
    cb = options as typeof cb;
    opts = {};
  }
  dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
    if (err || !addresses.length || addresses.some((item) => isPrivateAddress(item.address))) {
      const error =
        err ||
        Object.assign(new Error("Client metadata URL resolves to a private address"), {
          code: "EPERM",
        });
      cb(error, opts.all ? [] : "", 0);
      return;
    }
    if (opts.all) {
      cb(
        null,
        addresses.map((item) => ({ address: item.address, family: item.family }))
      );
      return;
    }
    cb(null, addresses[0].address, addresses[0].family);
  });
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string {
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== wanted || value === undefined) {
      continue;
    }
    return Array.isArray(value) ? value.join(", ") : value;
  }
  return "";
}

function cleanName(name: string, fallback: string): string {
  const cleaned = name.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200);
  return cleaned || fallback;
}

function asOAuthError(err: unknown): OAuthError {
  if (err instanceof OAuthError) {
    return err;
  }
  const name = err instanceof Error ? err.name : "";
  const message = err instanceof Error ? err.message : "";
  if (message.includes("private address")) {
    return new OAuthError(
      "Client metadata URL resolves to a private address",
      "invalid_client",
      401
    );
  }
  if (name === "AbortError" || name === "TimeoutError" || message === "timeout") {
    return new OAuthError("Client metadata request timed out", "invalid_client", 401);
  }
  return new OAuthError("Client metadata could not be fetched", "invalid_client", 401);
}
