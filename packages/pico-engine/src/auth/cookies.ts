export const DEFAULT_SESSION_COOKIE = "pico-session";
export const DEFAULT_CEREMONY_COOKIE = "pico-ceremony";

export interface AuthCookieNames {
  session: string;
  ceremony: string;
}

/** Session/ceremony cookie names scoped by port on local dev hosts. */
export function authCookieNames(origin: string): AuthCookieNames {
  try {
    const url = new URL(origin);
    const local =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname.endsWith(".localhost");
    if (local && url.port) {
      return {
        session: `${DEFAULT_SESSION_COOKIE}-${url.port}`,
        ceremony: `${DEFAULT_CEREMONY_COOKIE}-${url.port}`,
      };
    }
  } catch (_e) {
    // fall through
  }
  return {
    session: DEFAULT_SESSION_COOKIE,
    ceremony: DEFAULT_CEREMONY_COOKIE,
  };
}

export function sessionCookieHeader(origin: string, token: string): string {
  return `${authCookieNames(origin).session}=${token}`;
}
