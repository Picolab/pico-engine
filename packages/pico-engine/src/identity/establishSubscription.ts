import { ChannelConfig, Pico, PicoFramework } from "pico-framework";
import { IdentityStore } from "./store";
import type { PeerSubscriptionRecord } from "./types";
import { IdentityError } from "./errors";
import { createPeerDidWithKeys } from "./veramoDidComm";

export interface EstablishSubscriptionInput {
  subscriptionId: string;
  /** Remote party's peer DID (may be linked later via linkRemotePeer). */
  remotePeerDid?: string;
  remoteWebvhDid?: string;
  remoteMeshRootId?: string;
  remoteTxHost?: string;
  remoteDidcommEndpoint?: string;
  /** Use an existing internal Rx channel; created if omitted. */
  rxEci?: string;
  channelName?: string;
  channelType?: string;
}

export interface EstablishSubscriptionResult {
  subscriptionId: string;
  peerDid: string;
  rxEci: string;
}

const DEFAULT_RX_CHANNEL: ChannelConfig = {
  tags: ["subscription", "tx_rx"],
  eventPolicy: {
    allow: [{ domain: "*", name: "*" }],
    deny: [],
  },
  queryPolicy: {
    allow: [{ rid: "*", name: "*" }],
    deny: [],
  },
};

function findPico(pf: PicoFramework, picoId: string): Pico | undefined {
  return pf.loadedPicos().find((p) => p.id === picoId);
}

export async function establishSubscriptionIdentity(
  store: IdentityStore,
  pf: PicoFramework,
  picoId: string,
  input: EstablishSubscriptionInput
): Promise<EstablishSubscriptionResult> {
  if (!input.subscriptionId) {
    throw new IdentityError("subscriptionId is required", 400);
  }

  const existing = await store.getPeerSubscription(picoId, input.subscriptionId);
  if (existing?.peerDid && existing.rxEci) {
    return {
      subscriptionId: input.subscriptionId,
      peerDid: existing.peerDid,
      rxEci: existing.rxEci,
    };
  }

  const pico = findPico(pf, picoId);
  if (!pico) {
    throw new IdentityError(`Pico ${picoId} not loaded`, 404);
  }

  let rxEci = input.rxEci || existing?.rxEci;
  if (!rxEci) {
    const tags = [
      input.channelName || "sub-rx",
      input.channelType || "Tx_Rx",
      "subscription",
    ];
    const channel = await pico.newChannel({
      ...DEFAULT_RX_CHANNEL,
      tags,
    });
    rxEci = channel.toReadOnly().id;
  }

  const { did, keys } = await createPeerDidWithKeys();

  const record: PeerSubscriptionRecord = {
    subscriptionId: input.subscriptionId,
    peerDid: did,
    remotePeerDid: input.remotePeerDid || existing?.remotePeerDid,
    remoteWebvhDid: input.remoteWebvhDid || existing?.remoteWebvhDid,
    rxEci,
    remoteMeshRootId: input.remoteMeshRootId || existing?.remoteMeshRootId,
    remoteTxHost: input.remoteTxHost || existing?.remoteTxHost,
    remoteDidcommEndpoint:
      input.remoteDidcommEndpoint || existing?.remoteDidcommEndpoint,
    keys: keys as unknown as Record<string, unknown>,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  await store.putPeerSubscription(picoId, record);

  return {
    subscriptionId: input.subscriptionId,
    peerDid: did,
    rxEci,
  };
}

export interface LinkRemotePeerInput {
  remotePeerDid: string;
  remoteWebvhDid?: string;
  remoteMeshRootId?: string;
  remoteTxHost?: string;
  remoteDidcommEndpoint?: string;
}

export async function linkRemotePeer(
  store: IdentityStore,
  picoId: string,
  subscriptionId: string,
  input: LinkRemotePeerInput
): Promise<PeerSubscriptionRecord> {
  const sub = await store.getPeerSubscription(picoId, subscriptionId);
  if (!sub) {
    throw new IdentityError(`Unknown subscription ${subscriptionId}`, 404);
  }
  const updated: PeerSubscriptionRecord = {
    ...sub,
    remotePeerDid: input.remotePeerDid,
    remoteWebvhDid: input.remoteWebvhDid ?? sub.remoteWebvhDid,
    remoteMeshRootId: input.remoteMeshRootId ?? sub.remoteMeshRootId,
    remoteTxHost: input.remoteTxHost ?? sub.remoteTxHost,
    remoteDidcommEndpoint:
      input.remoteDidcommEndpoint ?? sub.remoteDidcommEndpoint,
  };
  await store.putPeerSubscription(picoId, updated);
  return updated;
}

/** Parse wrangler/subscription bus map into establish input. */
export function establishInputFromBus(
  bus: Record<string, unknown>
): EstablishSubscriptionInput {
  const subscriptionId = String(bus.Id || bus.subscriptionId || "");
  return {
    subscriptionId,
    remotePeerDid:
      optionalString(bus.Tx_did) ||
      optionalString(bus.remotePeerDid) ||
      optionalString(bus.remoteDid),
    remoteWebvhDid: optionalString(bus.remoteWebvhDid),
    remoteMeshRootId: optionalString(bus.remoteMeshRootId),
    remoteTxHost: optionalString(bus.Tx_host),
    remoteDidcommEndpoint: optionalString(bus.remoteDidcommEndpoint),
    rxEci: optionalString(bus.Rx),
    channelName: optionalString(bus.channel_name),
    channelType: optionalString(bus.channel_type),
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
