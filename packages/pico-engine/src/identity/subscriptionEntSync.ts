/**
 * Keep wrangler subscription ent buses aligned with engine identity store after import.
 */

import { Pico, PicoFramework } from "pico-framework";
import { IdentityStore } from "./store";
import type { PeerSubscriptionRecord } from "./types";

const SUBSCRIPTION_RID = "io.picolabs.subscription";

function busId(bus: Record<string, unknown>): string | undefined {
  const id = bus["Id"];
  return typeof id === "string" ? id : undefined;
}

function mergeIdentityIntoBus(
  bus: Record<string, unknown>,
  rec: PeerSubscriptionRecord
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...bus, layer2: true };
  if (rec.rxEci) {
    out["Rx"] = rec.rxEci;
  }
  if (rec.peerDid) {
    out["Rx_did"] = rec.peerDid;
  }
  if (rec.remotePeerDid || rec.remoteDid) {
    out["Tx_did"] =
      out["Tx_did"] || rec.remoteWebvhDid || rec.remotePeerDid || rec.remoteDid;
  }
  if (rec.remoteWebvhDid) {
    out["Tx_did"] = rec.remoteWebvhDid;
  }
  if (rec.remoteTxHost) {
    out["Tx_host"] = rec.remoteTxHost;
  }
  return out;
}

function findBusInPools(
  id: string,
  pools: Record<string, unknown>[]
): Record<string, unknown> | undefined {
  return pools.find((b) => busId(b) === id);
}

/** Merge identity peer subscriptions into ent:established (Layer 2 DID relationships). */
export async function syncLayer2EstablishedFromIdentity(
  store: IdentityStore,
  pf: PicoFramework,
  picoId: string
): Promise<void> {
  const pico = pf.getPico(picoId);
  if (!pico?.rulesets[SUBSCRIPTION_RID]) {
    return;
  }

  const peerSubs = await store.listPeerSubscriptions(picoId);
  if (peerSubs.length === 0) {
    return;
  }

  const establishedRaw = await pico.getEnt(SUBSCRIPTION_RID, "established");
  let list: Record<string, unknown>[] = Array.isArray(establishedRaw)
    ? establishedRaw.map((b) =>
        b && typeof b === "object" ? { ...(b as Record<string, unknown>) } : {}
      )
    : [];

  const inbound = await pico.getEnt(SUBSCRIPTION_RID, "inbound");
  const outbound = await pico.getEnt(SUBSCRIPTION_RID, "outbound");
  const pools: Record<string, unknown>[] = [
    ...(Array.isArray(inbound)
      ? inbound.filter((b) => b && typeof b === "object") as Record<string, unknown>[]
      : []),
    ...(Array.isArray(outbound)
      ? outbound.filter((b) => b && typeof b === "object") as Record<string, unknown>[]
      : []),
  ];

  for (const rec of peerSubs) {
    const id = rec.subscriptionId;
    let idx = list.findIndex((b) => busId(b) === id);
    if (idx >= 0) {
      list[idx] = mergeIdentityIntoBus(list[idx], rec);
      continue;
    }
    const fromPool = findBusInPools(id, pools);
    if (fromPool || rec.remotePeerDid || rec.remoteWebvhDid) {
      list.push(
        mergeIdentityIntoBus(fromPool || { Id: id }, rec)
      );
    }
  }

  await pico.putEnt(SUBSCRIPTION_RID, "established", list);
}
