/** SKY protocol on DIDComm v2 — type URIs and payloads (1.0). */

export const SKY_NS = "https://picolabs.org/sky/1.0";

export const SKY_INTRO = `${SKY_NS}/intro`;
export const SKY_INTRO_RESPONSE = `${SKY_NS}/intro-response`;
export const SKY_EVENT = `${SKY_NS}/event`;
export const SKY_QUERY = `${SKY_NS}/query`;
export const SKY_QUERY_RESPONSE = `${SKY_NS}/query-response`;

export interface SkyEventBody {
  sky_version: string;
  eid?: string;
  domain: string;
  name: string;
  attrs: Record<string, unknown>;
}

export interface SkyQueryBody {
  sky_version: string;
  rid: string;
  name: string;
  args: Record<string, unknown>;
}

export interface SkyQueryResponseBody {
  sky_version: string;
  status: "ok" | "error";
  result?: unknown;
  error?: { code?: string; message?: string };
}

export interface SkyIntroBody {
  sky_version: string;
  name: string;
  channel_type?: string;
  Tx_role: string;
  Rx_role: string;
  peer_did_long: string;
  Tx_host?: string | null;
  /** Sender DIDComm ingress URL (for intro-response on cross-engine paths). */
  didcomm_endpoint?: string;
  /** Sender's did:webvh (for cross-engine peer linking on the recipient). */
  sender_webvh?: string;
  subscription_id?: string;
}

export interface SkyIntroResponseBody {
  sky_version: string;
  status: "accepted" | "rejected";
  subscription_id?: string;
  peer_did_long?: string;
  Tx_host?: string | null;
  reason?: string;
  detail?: string;
}

export function parseSkyIntroBody(body: unknown): SkyIntroBody {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid SKY intro body");
  }
  const b = body as Record<string, unknown>;
  if (
    typeof b.name !== "string" ||
    typeof b.Tx_role !== "string" ||
    typeof b.Rx_role !== "string" ||
    typeof b.peer_did_long !== "string"
  ) {
    throw new Error("SKY intro body missing required fields");
  }
  return {
    sky_version: String(b.sky_version || "1.0"),
    name: b.name,
    channel_type:
      typeof b.channel_type === "string" ? b.channel_type : "Tx_Rx",
    Tx_role: b.Tx_role,
    Rx_role: b.Rx_role,
    peer_did_long: b.peer_did_long,
    Tx_host:
      b.Tx_host === null || typeof b.Tx_host === "string"
        ? (b.Tx_host as string | null)
        : undefined,
    didcomm_endpoint:
      typeof b.didcomm_endpoint === "string" ? b.didcomm_endpoint : undefined,
    sender_webvh:
      typeof b.sender_webvh === "string" ? b.sender_webvh : undefined,
    subscription_id:
      typeof b.subscription_id === "string" ? b.subscription_id : undefined,
  };
}

export function parseSkyIntroResponseBody(body: unknown): SkyIntroResponseBody {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid SKY intro-response body");
  }
  const b = body as Record<string, unknown>;
  if (b.status !== "accepted" && b.status !== "rejected") {
    throw new Error("SKY intro-response missing status");
  }
  return {
    sky_version: String(b.sky_version || "1.0"),
    status: b.status,
    subscription_id:
      typeof b.subscription_id === "string" ? b.subscription_id : undefined,
    peer_did_long:
      typeof b.peer_did_long === "string" ? b.peer_did_long : undefined,
    Tx_host:
      b.Tx_host === null || typeof b.Tx_host === "string"
        ? (b.Tx_host as string | null)
        : undefined,
    reason: typeof b.reason === "string" ? b.reason : undefined,
    detail: typeof b.detail === "string" ? b.detail : undefined,
  };
}

/** Map SKY intro to wrangler subscription attrs (layer 2). */
export function skyIntroToWranglerAttrs(
  intro: SkyIntroBody,
  extras: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    layer2: true,
    name: intro.name,
    channel_type: intro.channel_type || "Tx_Rx",
    Tx_role: intro.Tx_role,
    Rx_role: intro.Rx_role,
    peer_did_long: intro.peer_did_long,
    Tx_did: intro.peer_did_long,
    Tx_host: intro.Tx_host || null,
    Id: intro.subscription_id,
    ...extras,
  };
}

export function skyIntroResponseToWranglerAttrs(
  response: SkyIntroResponseBody,
  extras: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    layer2: true,
    status: response.status,
    subscription_id: response.subscription_id,
    peer_did_long: response.peer_did_long,
    Tx_did: response.peer_did_long,
    Tx_host: response.Tx_host || null,
    reason: response.reason,
    detail: response.detail,
    ...extras,
  };
}

export function parseSkyEventBody(body: unknown): SkyEventBody {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid SKY event body");
  }
  const b = body as Record<string, unknown>;
  if (typeof b.domain !== "string" || typeof b.name !== "string") {
    throw new Error("SKY event body missing domain or name");
  }
  return {
    sky_version: String(b.sky_version || "1.0"),
    eid: typeof b.eid === "string" ? b.eid : "none",
    domain: b.domain,
    name: b.name,
    attrs:
      b.attrs && typeof b.attrs === "object"
        ? (b.attrs as Record<string, unknown>)
        : {},
  };
}

export function parseSkyQueryBody(body: unknown): SkyQueryBody {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid SKY query body");
  }
  const b = body as Record<string, unknown>;
  if (
    typeof b.rid !== "string" ||
    typeof b.name !== "string"
  ) {
    throw new Error("SKY query body missing rid or name");
  }
  return {
    sky_version: String(b.sky_version || "1.0"),
    rid: b.rid,
    name: b.name,
    args:
      b.args && typeof b.args === "object"
        ? (b.args as Record<string, unknown>)
        : {},
  };
}
