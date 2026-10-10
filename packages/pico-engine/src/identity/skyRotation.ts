/**
 * DIDComm SKY rotation notices for portable did:webvh move (Phase D).
 */

import fetch from "cross-fetch";
import { Pico, PicoFramework } from "pico-framework";
import { IdentityStore } from "./store";
import type { DidCommPlainMessage, IdentityService } from "./IdentityService";
import { IdentityError } from "./errors";
import { linkRemotePeer } from "./establishSubscription";
import { extractDidcommEndpoint } from "./crossPico";
import {
  SKY_ROTATE,
  parseSkyRotateBody,
  skyRotateToWranglerAttrs,
  type SkyRotateBody,
} from "./skyProtocol";
import { packDidCommMessage } from "./veramoDidComm";
import type { RelocateWebvhResult } from "./webvhRelocation";
import type { PendingRotation } from "./types";

export interface SkyRotationDeps {
  store: IdentityStore;
  pf: PicoFramework;
  getBaseUrl: () => string;
  identity: IdentityService;
}

function findPico(pf: PicoFramework, picoId: string): Pico | undefined {
  return pf.loadedPicos().find((p) => p.id === picoId);
}

async function resolveDidcommEndpointForDid(
  identity: IdentityService,
  did: string,
  remoteDidcommEndpoint?: string
): Promise<string> {
  if (remoteDidcommEndpoint) {
    return remoteDidcommEndpoint;
  }
  const doc = await identity.resolveDid("", did);
  return extractDidcommEndpoint(doc);
}

async function postJwe(endpoint: string, jwe: string): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/didcomm-encrypted+json" },
    body: jwe,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new IdentityError(
      `DIDComm POST failed: HTTP ${res.status} ${detail}`,
      res.status
    );
  }
}

async function deliverRotateNotice(
  deps: SkyRotationDeps,
  fromPicoId: string,
  toPeerDid: string,
  remoteWebvhDid: string | undefined,
  remoteDidcommEndpoint: string | undefined,
  body: SkyRotateBody,
  fromPrior?: string
): Promise<void> {
  const fromWebvh = await deps.store.getWebvhDid(fromPicoId);
  const sub = (await deps.store.listPeerSubscriptions(fromPicoId)).find(
    (s) => s.remotePeerDid === toPeerDid || s.remoteDid === toPeerDid
  );
  const fromPeer = sub?.peerDid;
  if (!fromPeer) {
    throw new IdentityError(
      `No local peer DID for subscription to ${toPeerDid}`,
      404
    );
  }

  const message: DidCommPlainMessage = {
    id: `rotate-${Date.now()}`,
    typ: "application/didcomm-plain+json",
    type: SKY_ROTATE,
    from: fromPeer,
    to: [toPeerDid],
    body,
    created_time: Math.floor(Date.now() / 1000),
    ...(fromPrior ? { from_prior: fromPrior } : {}),
  };

  const packed = await packDidCommMessage(
    fromPicoId,
    message,
    fromPeer,
    toPeerDid,
    deps.store,
    { resolveDid: (did) => deps.identity.resolveDid("", did) }
  );

  const endpoint = await resolveDidcommEndpointForDid(
    deps.identity,
    remoteWebvhDid || toPeerDid,
    remoteDidcommEndpoint
  );
  await postJwe(endpoint, packed);
}

/** Notify established peers that this pico's did:webvh location changed. */
export async function notifyPeersOfWebvhRotation(
  deps: SkyRotationDeps,
  picoId: string,
  relocation: RelocateWebvhResult
): Promise<number> {
  const baseUrl = deps.getBaseUrl().replace(/\/$/, "");
  const body: SkyRotateBody = {
    sky_version: "1.0",
    prior_webvh_did: relocation.priorDid,
    new_webvh_did: relocation.newDid,
    new_tx_host: baseUrl,
    new_didcomm_endpoint: relocation.didcommEndpoint,
  };

  const subs = await deps.store.listPeerSubscriptions(picoId);
  let sent = 0;
  for (const sub of subs) {
    const remotePeer = sub.remotePeerDid || sub.remoteDid;
    if (!remotePeer) {
      continue;
    }
    try {
      await deliverRotateNotice(
        deps,
        picoId,
        remotePeer,
        sub.remoteWebvhDid,
        sub.remoteDidcommEndpoint,
        body,
        relocation.priorDid !== relocation.newDid ? relocation.priorDid : undefined
      );
      sent += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[portable-move] SKY rotate to ${remotePeer} failed (import continues): ${msg}`
      );
    }
  }
  return sent;
}

/** Apply a SKY rotate message on the recipient pico. */
export async function handleSkyRotateAtIngress(
  deps: SkyRotationDeps,
  recipientPicoId: string,
  message: DidCommPlainMessage
): Promise<Record<string, unknown>> {
  const senderDid = message.from;
  if (!senderDid) {
    throw new IdentityError("SKY rotate missing from", 400);
  }

  const rotate = parseSkyRotateBody(message.body);
  const sub = await deps.store.findPeerSubscriptionBySenderDid(
    recipientPicoId,
    senderDid
  );
  if (!sub) {
    throw new IdentityError("unknown_subscription", 404);
  }

  await linkRemotePeer(deps.store, recipientPicoId, sub.subscriptionId, {
    remotePeerDid: senderDid,
    remoteWebvhDid: rotate.new_webvh_did,
    remoteTxHost: rotate.new_tx_host,
    remoteDidcommEndpoint: rotate.new_didcomm_endpoint,
  });

  const pending: PendingRotation[] =
    (await deps.store.getPendingRotations(recipientPicoId)) || [];
  pending.push({
    priorDid: rotate.prior_webvh_did,
    newDid: rotate.new_webvh_did,
    peerDid: senderDid,
    subscriptionId: sub.subscriptionId,
    receivedAt: new Date().toISOString(),
  });
  await deps.store.putPendingRotations(recipientPicoId, pending);

  const pico = findPico(deps.pf, recipientPicoId);
  if (pico) {
    await pico.event({
      eci: pico.id,
      domain: "wrangler",
      name: "webvh_peer_rotated",
      data: {
        attrs: skyRotateToWranglerAttrs(rotate, {
          Id: sub.subscriptionId,
          peer_did: senderDid,
        }),
      },
      time: Date.now(),
    });
  }

  return {
    status: "ok",
    subscriptionId: sub.subscriptionId,
    new_webvh_did: rotate.new_webvh_did,
  };
}
