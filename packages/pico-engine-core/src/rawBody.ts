/**
 * The raw HTTP body for an event on a channel that opted in (`rawBody: true`).
 * It is an enumerable symbol on the event, like the cookie jar: cleanEvent and
 * a raise in the same transaction keep it, and it is not an attribute. A
 * channel that did not opt in never receives it.
 */

export const RAW_REQUEST_BODY = Symbol("pico.rawBody");

export function attachRawBody(target: object, body: string): void {
  Object.defineProperty(target, RAW_REQUEST_BODY, {
    value: body,
    enumerable: true,
    configurable: true,
  });
}

type BodyHost = {
  getEvent?: () => any;
};

/** The raw body of the HTTP event now running, or null. */
export function rawRequestBody(host: BodyHost | null | undefined): string | null {
  if (!host || !host.getEvent) {
    return null;
  }
  const event = host.getEvent();
  const body = event && event[RAW_REQUEST_BODY];
  return typeof body === "string" ? body : null;
}
