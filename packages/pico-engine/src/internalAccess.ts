import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

/** File name under `PICO_ENGINE_HOME`. The dev MCP client reads the same file. */
export const INTERNAL_TOKEN_FILENAME = "internal-token";

/** HTTP header the dev MCP sends. Express stores it lower-case. */
export const INTERNAL_TOKEN_HEADER = "x-pico-internal";

/**
 * Request headers that must not reach KRL. `x-pico-internal` is the engine's
 * own dev credential; the others are caller credentials (1.10 §5 H1).
 */
const CREDENTIAL_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "x-pico-internal",
]);

const PROXY_CLIENT_HEADERS = ["x-forwarded-for", "x-real-ip", "forwarded"];

export interface ClientAddressRequest {
  ip?: string;
  socket?: { remoteAddress?: string | null };
  headers: NodeJS.Dict<string | string[] | undefined>;
}

export function internalTokenPath(home: string): string {
  return path.join(home, INTERNAL_TOKEN_FILENAME);
}

/** New secret on every startup. Mode 0600 even when umask would loosen the write. */
export function writeInternalToken(home: string): string {
  const token = crypto.randomBytes(32).toString("base64url");
  const file = internalTokenPath(home);
  fs.writeFileSync(file, `${token}\n`, { encoding: "utf8", mode: 0o600 });
  fs.chmodSync(file, 0o600);
  return token;
}

export function readInternalToken(home: string): string | null {
  try {
    const token = fs.readFileSync(internalTokenPath(home), "utf8").trim();
    return token.length > 0 ? token : null;
  } catch (_err) {
    return null;
  }
}

export function timingSafeEqualString(actual: string, expected: string): boolean {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function internalTokenAccepted(
  presented: string | string[] | undefined,
  expected: string
): boolean {
  if (!expected || typeof presented !== "string") {
    return false;
  }
  const token = presented.trim();
  if (!token) {
    return false;
  }
  return timingSafeEqualString(token, expected);
}

function headerIsPresent(
  headers: ClientAddressRequest["headers"],
  name: string
): boolean {
  const value = headers[name];
  if (typeof value === "string") {
    return true;
  }
  return Array.isArray(value) && value.length > 0;
}

/** A proxy sat in front of this request. Its socket address is the proxy, not the client. */
export function requestCarriesProxyClientHeaders(
  headers: ClientAddressRequest["headers"]
): boolean {
  return PROXY_CLIENT_HEADERS.some((name) => headerIsPresent(headers, name));
}

function isLoopbackAddress(addr: string | undefined | null): boolean {
  if (!addr) {
    return false;
  }
  const normalized = addr.replace(/^::ffff:/, "");
  return normalized === "127.0.0.1" || normalized === "::1";
}

/**
 * Direct TCP from this machine. The `Host` header is not consulted: clients set it.
 * `X-Forwarded-For`, `X-Real-IP`, and `Forwarded` mean the peer is a proxy.
 */
export function isDirectLoopbackRequest(req: ClientAddressRequest): boolean {
  if (requestCarriesProxyClientHeaders(req.headers)) {
    return false;
  }
  if (isLoopbackAddress(req.ip)) {
    return true;
  }
  return isLoopbackAddress(req.socket?.remoteAddress);
}

/** Copy of the request headers with credential headers removed. */
export function headersForKrl(
  headers: NodeJS.Dict<string | string[] | undefined>
): { [name: string]: string | string[] } {
  const out: { [name: string]: string | string[] } = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || CREDENTIAL_HEADERS.has(key.toLowerCase())) {
      continue;
    }
    out[key] = value;
  }
  return out;
}
