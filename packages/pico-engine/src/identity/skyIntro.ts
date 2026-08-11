import * as cuid from "cuid";
import fetch from "cross-fetch";
import { Pico, PicoFramework } from "pico-framework";
import { IdentityStore } from "./store";
import type { IdentityService, DidCommPlainMessage } from "./IdentityService";
import { IdentityError } from "./errors";
import {
  SKY_INTRO,
  SKY_INTRO_RESPONSE,
  parseSkyIntroBody,
  parseSkyIntroResponseBody,
  skyIntroToWranglerAttrs,
  skyIntroResponseToWranglerAttrs,
  type SkyIntroBody,
  type SkyIntroResponseBody,
} from "./skyProtocol";
import { extractDidcommEndpoint } from "./crossPico";
import { packDidCommMessage } from "./veramoDidComm";
import {
  establishSubscriptionIdentity,
  linkRemotePeer,
} from "./establishSubscription";

export interface SkyIntroSendInput {
  subscriptionId: string;
  targetDid: string;
  name: string;
  Tx_role: string;
  Rx_role: string;
  channel_type?: string;
  Tx_host?: string;
}

export interface SkyIntroDeps {
  store: IdentityStore;
  pf: PicoFramework;
  getBaseUrl: () => string;
  identity: IdentityService;
}

function findPico(pf: PicoFramework, picoId: string): Pico | undefined {
  return pf.loadedPicos().find((p) => p.id === picoId);
}

function deliveryEci(pf: PicoFramework, picoId: string, preferred?: string): string {
  if (preferred) {
    return preferred;
  }
  const pico = findPico(pf, picoId);
  if (!pico) {
    throw new IdentityError(`Pico ${picoId} not loaded`, 404);
  }
  for (const ch of Object.values(pico.channels)) {
    const ro = ch.toReadOnly();
    if (ro.tags.includes("wellKnown_Rx")) {
      return ro.id;
    }
  }
  for (const ch of Object.values(pico.channels)) {
    const ro = ch.toReadOnly();
    if (ro.tags.includes("allow-all")) {
      return ro.id;
    }
  }
  const first = Object.keys(pico.channels)[0];
  if (!first) {
    throw new IdentityError("Pico has no channel for SKY intro delivery", 404);
  }
  return first;
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

export async function sendSkyIntro(
  deps: SkyIntroDeps,
  picoId: string,
  input: SkyIntroSendInput
): Promise<{ messageId: string; peerDid: string }> {
  const established = await establishSubscriptionIdentity(
    deps.store,
    deps.pf,
    picoId,
    {
      subscriptionId: input.subscriptionId,
      channelName: input.name,
      channelType: input.channel_type || "Tx_Rx",
      remoteWebvhDid: input.targetDid.startsWith("did:webvh:")
        ? input.targetDid
        : undefined,
    }
  );

  const body: SkyIntroBody = {
    sky_version: "1.0",
    name: input.name,
    channel_type: input.channel_type || "Tx_Rx",
    Tx_role: input.Tx_role,
    Rx_role: input.Rx_role,
    peer_did_long: established.peerDid,
    Tx_host: input.Tx_host || deps.getBaseUrl(),
    subscription_id: input.subscriptionId,
  };

  const senderWebvh = await deps.store.getWebvhDid(picoId);
  if (senderWebvh) {
    body.sender_webvh = senderWebvh;
    try {
      const senderDoc = await deps.identity.resolveDid(picoId, senderWebvh);
      body.didcomm_endpoint = extractDidcommEndpoint(senderDoc);
    } catch {
      // optional on intro body
    }
  }

  const message = deps.identity.generateMessage({
    type: SKY_INTRO,
    from: established.peerDid,
    to: [input.targetDid],
    body,
  });

  const targetPicoId = await deps.store.findPicoIdByWebvhDid(input.targetDid);
  if (targetPicoId && findPico(deps.pf, targetPicoId)) {
    await handleSkyIntroAtIngress(deps, targetPicoId, message);
    return { messageId: message.id, peerDid: established.peerDid };
  }

  const endpoint = await resolveDidcommEndpointForDid(
    deps.identity,
    input.targetDid
  );
  const jwe = await packDidCommMessage(
    picoId,
    message,
    established.peerDid,
    input.targetDid,
    deps.store,
    { resolveDid: (did) => deps.identity.resolveDid("", did) }
  );
  await postJwe(endpoint, jwe);

  return { messageId: message.id, peerDid: established.peerDid };
}

export async function sendSkyIntroResponse(
  deps: SkyIntroDeps,
  picoId: string,
  subscriptionId: string,
  toPeerDid: string,
  response: Omit<SkyIntroResponseBody, "sky_version">,
  options: { thid?: string; remoteDidcommEndpoint?: string } = {}
): Promise<string> {
  const sub = await deps.store.getPeerSubscription(picoId, subscriptionId);
  if (!sub?.peerDid) {
    throw new IdentityError(`Unknown subscription ${subscriptionId}`, 404);
  }

  const body: SkyIntroResponseBody = {
    sky_version: "1.0",
    ...response,
    subscription_id: response.subscription_id || subscriptionId,
    peer_did_long: response.peer_did_long || sub.peerDid,
    Tx_host: response.Tx_host ?? deps.getBaseUrl(),
  };

  const message = deps.identity.generateMessage({
    type: SKY_INTRO_RESPONSE,
    from: sub.peerDid,
    to: [toPeerDid],
    thid: options.thid,
    body,
  });

  const targetPicoId = await deps.store.findPicoIdByLocalPeerDid(toPeerDid);
  if (targetPicoId && findPico(deps.pf, targetPicoId)) {
    await handleSkyIntroResponseAtIngress(deps, targetPicoId, message);
    return message.id;
  }

  const endpoint = await resolveDidcommEndpointForDid(
    deps.identity,
    toPeerDid,
    options.remoteDidcommEndpoint || sub.remoteDidcommEndpoint
  );
  const jwe = await packDidCommMessage(
    picoId,
    message,
    sub.peerDid,
    toPeerDid,
    deps.store,
    { resolveDid: (did) => deps.identity.resolveDid("", did) }
  );
  await postJwe(endpoint, jwe);
  return message.id;
}

export async function handleSkyIntroAtIngress(
  deps: SkyIntroDeps,
  picoId: string,
  plainMessage: DidCommPlainMessage
): Promise<Record<string, unknown>> {
  const allowed = await deps.identity.acceptsPublicIntro(picoId);
  if (!allowed) {
    throw new IdentityError("public_intro_disabled", 403);
  }

  const intro = parseSkyIntroBody(plainMessage.body);
  const subscriptionId = intro.subscription_id || cuid();
  const remotePicoId = await deps.store.findPicoIdByLocalPeerDid(
    intro.peer_did_long
  );
  const remoteWebvh =
    (remotePicoId && (await deps.store.getWebvhDid(remotePicoId))) ||
    intro.sender_webvh ||
    undefined;

  const established = await establishSubscriptionIdentity(
    deps.store,
    deps.pf,
    picoId,
    {
      subscriptionId,
      remotePeerDid: intro.peer_did_long,
      remoteWebvhDid: remoteWebvh,
      remoteTxHost: intro.Tx_host || undefined,
      remoteDidcommEndpoint: intro.didcomm_endpoint || undefined,
      channelName: intro.name,
      channelType: intro.channel_type,
    }
  );

  const attrs = skyIntroToWranglerAttrs(intro, {
    Id: subscriptionId,
    Rx: established.rxEci,
    channel_name: intro.name,
  });

  const eci = deliveryEci(deps.pf, picoId, established.rxEci);
  await deps.pf.eventWait(
    {
      eci,
      domain: "wrangler",
      name: "sky_intro",
      data: { attrs },
      time: 0,
    },
    undefined
  );

  return { status: "intro_delivered", subscriptionId };
}

export async function handleSkyIntroResponseAtIngress(
  deps: SkyIntroDeps,
  picoId: string,
  plainMessage: DidCommPlainMessage
): Promise<Record<string, unknown>> {
  const response = parseSkyIntroResponseBody(plainMessage.body);
  const subscriptionId = response.subscription_id;
  if (!subscriptionId) {
    throw new IdentityError("intro-response missing subscription_id", 400);
  }

  const sub = await deps.store.getPeerSubscription(picoId, subscriptionId);
  const eci = deliveryEci(deps.pf, picoId, sub?.rxEci);

  if (response.status === "accepted" && response.peer_did_long) {
    const remotePicoId = await deps.store.findPicoIdByLocalPeerDid(
      response.peer_did_long
    );
    const remoteWebvh =
      remotePicoId && (await deps.store.getWebvhDid(remotePicoId));
    await linkRemotePeer(deps.store, picoId, subscriptionId, {
      remotePeerDid: response.peer_did_long,
      remoteWebvhDid: remoteWebvh || undefined,
      remoteTxHost: response.Tx_host || undefined,
    });
  }

  const attrs = skyIntroResponseToWranglerAttrs(response, {
    Id: subscriptionId,
  });

  await deps.pf.eventWait(
    {
      eci,
      domain: "wrangler",
      name: "sky_intro_response",
      data: { attrs },
      time: 0,
    },
    undefined
  );

  return { status: "intro_response_delivered", subscriptionId };
}
