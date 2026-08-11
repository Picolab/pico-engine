import * as cuid from "cuid";
import fetch from "cross-fetch";
import { PicoFramework } from "pico-framework";
import { IdentityStore } from "./store";
import type { PeerSubscriptionRecord } from "./types";
import type { DidCommPlainMessage, IdentityService } from "./IdentityService";
import {
  SKY_EVENT,
  SKY_QUERY,
  SKY_QUERY_RESPONSE,
  parseSkyEventBody,
  parseSkyQueryBody,
} from "./skyProtocol";
import { packDidCommMessage } from "./veramoDidComm";
import { IdentityError } from "./errors";

export interface CrossPicoEventInput {
  domain: string;
  name: string;
  attrs?: Record<string, unknown>;
  eid?: string;
}

export interface CrossPicoQueryInput {
  rid: string;
  name: string;
  args?: Record<string, unknown>;
}

export interface CrossPicoDeps {
  store: IdentityStore;
  pf: PicoFramework;
  getBaseUrl: () => string;
  identity: IdentityService;
}

function remotePeerDid(sub: PeerSubscriptionRecord): string {
  const did = sub.remotePeerDid || sub.remoteDid;
  if (!did) {
    throw new IdentityError("Subscription missing remote peer DID", 400);
  }
  return did;
}

function remoteTxHost(sub: PeerSubscriptionRecord, fallback: string): string {
  const host = sub.remoteTxHost || fallback;
  return host.replace(/\/$/, "");
}

export async function usesLocalDispatch(
  store: IdentityStore,
  pf: PicoFramework,
  fromPicoId: string,
  toPicoId: string,
  sub: PeerSubscriptionRecord
): Promise<boolean> {
  const fromMesh = await store.getMeshRootId(fromPicoId);
  const toMesh = await store.getMeshRootId(toPicoId);
  if (!fromMesh || !toMesh || fromMesh !== toMesh) {
    return false;
  }
  if (sub.remoteMeshRootId && sub.remoteMeshRootId !== fromMesh) {
    return false;
  }
  return pf.loadedPicos().some((p) => p.id === toPicoId);
}

export async function resolveRecipientPicoId(
  store: IdentityStore,
  pf: PicoFramework,
  fromPicoId: string,
  subscriptionId: string
): Promise<string | undefined> {
  const sub = await store.getPeerSubscription(fromPicoId, subscriptionId);
  if (!sub) {
    return undefined;
  }
  const remotePeer = sub.remotePeerDid || sub.remoteDid;
  if (remotePeer) {
    const byPeer = await store.findPicoIdByLocalPeerDid(remotePeer);
    if (byPeer && pf.loadedPicos().some((p) => p.id === byPeer)) {
      return byPeer;
    }
  }
  if (sub.remoteWebvhDid) {
    const byWebvh = await store.findPicoIdByWebvhDid(sub.remoteWebvhDid);
    if (byWebvh && pf.loadedPicos().some((p) => p.id === byWebvh)) {
      return byWebvh;
    }
  }
  return undefined;
}

export async function crossPicoEvent(
  deps: CrossPicoDeps,
  fromPicoId: string,
  toPicoId: string | undefined,
  subscriptionId: string,
  event: CrossPicoEventInput
): Promise<{ eid: string; responses: unknown[] }> {
  const sub = await deps.store.getPeerSubscription(fromPicoId, subscriptionId);
  if (!sub || !sub.rxEci) {
    throw new IdentityError(`Unknown subscription ${subscriptionId}`, 404);
  }

  const callerDid = await deps.store.getWebvhDid(fromPicoId);
  const attrs = { ...(event.attrs || {}), callerDid: callerDid || undefined };

  const to =
    toPicoId ||
    (await resolveRecipientPicoId(deps.store, deps.pf, fromPicoId, subscriptionId));

  if (
    to &&
    (await usesLocalDispatch(deps.store, deps.pf, fromPicoId, to, sub))
  ) {
    const recipientSub = await findRecipientSub(deps.store, to, subscriptionId);
    return deps.pf.eventWait(
      {
        eci: recipientSub.rxEci!,
        domain: event.domain,
        name: event.name,
        data: { attrs },
        time: 0,
      },
      fromPicoId
    );
  }

  return sendSkyEvent(deps, fromPicoId, sub, event, attrs);
}

export async function crossPicoQuery(
  deps: CrossPicoDeps,
  fromPicoId: string,
  toPicoId: string | undefined,
  subscriptionId: string,
  query: CrossPicoQueryInput
): Promise<unknown> {
  const sub = await deps.store.getPeerSubscription(fromPicoId, subscriptionId);
  if (!sub || !sub.rxEci) {
    throw new IdentityError(`Unknown subscription ${subscriptionId}`, 404);
  }

  const to =
    toPicoId ||
    (await resolveRecipientPicoId(deps.store, deps.pf, fromPicoId, subscriptionId));

  if (
    to &&
    (await usesLocalDispatch(deps.store, deps.pf, fromPicoId, to, sub))
  ) {
    const recipientSub = await findRecipientSub(deps.store, to, subscriptionId);
    return deps.pf.query(
      {
        eci: recipientSub.rxEci!,
        rid: query.rid,
        name: query.name,
        args: query.args || {},
      },
      fromPicoId
    );
  }

  return sendSkyQuery(deps, fromPicoId, sub, query);
}

async function findRecipientSub(
  store: IdentityStore,
  toPicoId: string,
  subscriptionId: string
): Promise<PeerSubscriptionRecord> {
  const recipientSub = await store.getPeerSubscription(toPicoId, subscriptionId);
  if (!recipientSub?.rxEci) {
    throw new IdentityError(
      `Recipient subscription ${subscriptionId} missing rxEci`,
      404
    );
  }
  return recipientSub;
}

async function sendSkyEvent(
  deps: CrossPicoDeps,
  fromPicoId: string,
  sub: PeerSubscriptionRecord,
  event: CrossPicoEventInput,
  attrs: Record<string, unknown>
): Promise<{ eid: string; responses: unknown[] }> {
  const message = deps.identity.generateMessage({
    type: SKY_EVENT,
    from: sub.peerDid,
    to: [remotePeerDid(sub)],
    body: {
      sky_version: "1.0",
      eid: event.eid || "none",
      domain: event.domain,
      name: event.name,
      attrs,
    },
  });
  const jwe = await packDidCommMessage(
    fromPicoId,
    message,
    sub.peerDid,
    remotePeerDid(sub),
    deps.store,
    { resolveDid: (did) => deps.identity.resolveDid("", did) }
  );
  const endpoint = await resolveRemoteDidcommEndpoint(deps, sub);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/didcomm-encrypted+json",
    },
    body: jwe,
  });
  if (!res.ok) {
    throw new IdentityError(
      `DIDComm event delivery failed: HTTP ${res.status}`,
      res.status
    );
  }
  const data = await res.json();
  return {
    eid: data.eid || "none",
    responses: data.responses || data.directives || [],
  };
}

async function sendSkyQuery(
  deps: CrossPicoDeps,
  fromPicoId: string,
  sub: PeerSubscriptionRecord,
  query: CrossPicoQueryInput
): Promise<unknown> {
  const queryId = cuid();
  const message = deps.identity.generateMessage({
    type: SKY_QUERY,
    from: sub.peerDid,
    to: [remotePeerDid(sub)],
    body: {
      sky_version: "1.0",
      rid: query.rid,
      name: query.name,
      args: query.args || {},
    },
  });
  message.id = queryId;
  const jwe = await packDidCommMessage(
    fromPicoId,
    message,
    sub.peerDid,
    remotePeerDid(sub),
    deps.store,
    { resolveDid: (did) => deps.identity.resolveDid("", did) }
  );
  const endpoint = await resolveRemoteDidcommEndpoint(deps, sub);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/didcomm-encrypted+json",
    },
    body: jwe,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new IdentityError(
      `DIDComm query delivery failed: HTTP ${res.status} ${detail}`,
      res.status
    );
  }
  const data = await res.json();
  if (data.result !== undefined) {
    return data.result;
  }
  if (data.status === "error") {
    throw new IdentityError(data.error?.message || "Remote query failed", 502);
  }
  return data;
}

async function resolveRemoteDidcommEndpoint(
  deps: CrossPicoDeps,
  sub: PeerSubscriptionRecord
): Promise<string> {
  if (sub.remoteDidcommEndpoint) {
    return sub.remoteDidcommEndpoint;
  }
  if (sub.remoteWebvhDid) {
    try {
      const doc = await deps.identity.resolveDid("", sub.remoteWebvhDid);
      return extractDidcommEndpoint(doc);
    } catch {
      // fall through
    }
  }
  const remoteDid = remotePeerDid(sub);
  const doc = await deps.identity.resolveDid("", remoteDid);
  return extractDidcommEndpoint(doc);
}

export function extractDidcommEndpoint(doc: Record<string, unknown>): string {
  const services = doc.service as Array<Record<string, unknown>> | undefined;
  if (!services || services.length === 0) {
    throw new IdentityError("DID document has no service endpoints", 404);
  }
  const svc = services.find(
    (s) =>
      s.type === "DIDCommMessaging" ||
      s.type === "Messaging" ||
      s.type === "did-communication"
  );
  const endpoint = svc?.serviceEndpoint;
  if (typeof endpoint === "string") {
    return endpoint;
  }
  if (
    endpoint &&
    typeof endpoint === "object" &&
    typeof (endpoint as { uri?: string }).uri === "string"
  ) {
    return (endpoint as { uri: string }).uri;
  }
  const fallback = services[0].serviceEndpoint;
  if (typeof fallback === "string") {
    return fallback;
  }
  throw new IdentityError("Could not extract DIDComm service endpoint", 404);
}

export function buildQueryResponseMessage(
  identity: IdentityService,
  fromPeerDid: string,
  toPeerDid: string,
  thid: string,
  result: unknown
): DidCommPlainMessage {
  return identity.generateMessage({
    type: SKY_QUERY_RESPONSE,
    from: fromPeerDid,
    to: [toPeerDid],
    thid,
    body: {
      sky_version: "1.0",
      status: "ok",
      result,
    },
  });
}

export function buildQueryErrorResponseMessage(
  identity: IdentityService,
  fromPeerDid: string,
  toPeerDid: string,
  thid: string,
  message: string,
  code = "query_failed"
): DidCommPlainMessage {
  return identity.generateMessage({
    type: SKY_QUERY_RESPONSE,
    from: fromPeerDid,
    to: [toPeerDid],
    thid,
    body: {
      sky_version: "1.0",
      status: "error",
      error: { code, message },
    },
  });
}
