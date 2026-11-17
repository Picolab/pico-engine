/**
 * Application cookies for the HTTP request that produced an event or query.
 * The jar is an enumerable symbol on that object so it survives cleanEvent /
 * cleanQuery and the compiler's Object.assign, and is not part of the
 * attributes KRL can store or forward. The engine's session and ceremony
 * cookies are never stored.
 */

export const REQUEST_COOKIE_JAR = Symbol("pico.requestCookies");

/** `pico-session`, `pico-ceremony`, and the port-scoped forms (`pico-session-3000`). */
const ENGINE_COOKIE = /^(?:pico-session|pico-ceremony)(?:-\d+)?$/;

export function isEngineCredentialCookie(name: string): boolean {
  return ENGINE_COOKIE.test(name);
}

/** Parse a Cookie header into application cookies. Credential cookies are dropped. */
export function parseApplicationCookies(
  header: string | string[] | undefined
): Record<string, string> {
  const raw = Array.isArray(header) ? header.join("; ") : header || "";
  const out: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const piece = part.trim();
    if (!piece) {
      continue;
    }
    const eq = piece.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const name = piece.slice(0, eq).trim();
    const value = piece.slice(eq + 1).trim();
    if (!name || isEngineCredentialCookie(name)) {
      continue;
    }
    out[name] = value;
  }
  return out;
}

export function attachRequestCookies(
  target: object,
  header: string | string[] | undefined
): void {
  Object.defineProperty(target, REQUEST_COOKIE_JAR, {
    value: parseApplicationCookies(header),
    enumerable: true,
    configurable: true,
  });
}

type CookieHost = {
  getEvent?: () => any;
  getQuery?: () => any;
};

function jarFrom(host: CookieHost | null | undefined): Record<string, string> | null {
  if (!host) {
    return null;
  }
  const event = host.getEvent ? host.getEvent() : null;
  const query = host.getQuery ? host.getQuery() : null;
  const jar = (event && event[REQUEST_COOKIE_JAR]) || (query && query[REQUEST_COOKIE_JAR]);
  return jar && typeof jar === "object" ? jar : null;
}

/** One application cookie for this event or query, or null. Engine cookies are never returned. */
export function requestCookie(host: CookieHost | null | undefined, name: string): string | null {
  if (!name || isEngineCredentialCookie(name)) {
    return null;
  }
  const jar = jarFrom(host);
  if (!jar || !Object.prototype.hasOwnProperty.call(jar, name)) {
    return null;
  }
  return jar[name];
}
