/**
 * Before portable export: upgrade extant Layer 1 subscription buses to Layer 2 (DID)
 * so relationships (including community ↔ thing) survive cross-engine move + webvh rotate.
 */

import { PicoFramework } from "pico-framework";
import {
  establishSubscriptionIdentity,
  linkRemotePeer,
} from "./establishSubscription";
import type { IdentityStore } from "./store";
import type { PortableMoveDeps } from "./portableMove";

const SUBSCRIPTION_RID = "io.picolabs.subscription";

export interface PortableExportPrepareResult {
  /** Subscription buses upgraded on picos inside the export subtree. */
  upgradedOnSubtree: number;
  /** Reciprocal buses upgraded on peers outside the subtree (same engine). */
  upgradedOnPeers: number;
  /** Buses skipped (already L2, no remote Tx, or remote did not resolve). */
  skipped: number;
}

function busId(bus: Record<string, unknown>): string | undefined {
  const id = bus["Id"];
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

function collectSubtreePicoIds(pf: PicoFramework, picoRef: string): string[] {
  const pico = pf.getPico(picoRef);
  const ids = [pico.id];
  for (const childEci of pico.toReadOnly().children) {
    const child = pf.lookupChannel(childEci).pico;
    ids.push(...collectSubtreePicoIds(pf, child.id));
  }
  return ids;
}

/** Read did:webvh from the identity store — never pf.query (deadlocks during export KRL query). */
async function webvhDidForChannelEci(
  store: IdentityStore,
  pf: PicoFramework,
  remoteEci: string
): Promise<string | null> {
  try {
    const did = await store.getWebvhDid(pf.getPico(remoteEci).id);
    return typeof did === "string" && did.length > 0 ? did : null;
  } catch {
    return null;
  }
}

function mergeBusToLayer2(
  bus: Record<string, unknown>,
  remoteWebvhDid: string,
  rxPeerDid: string
): Record<string, unknown> {
  return {
    ...bus,
    layer2: true,
    Tx_did: remoteWebvhDid,
    Rx_did: rxPeerDid,
    Tx: "",
  };
}

async function upgradeEstablishedList(
  store: IdentityStore,
  pf: PicoFramework,
  picoId: string,
  list: Record<string, unknown>[]
): Promise<{
  next: Record<string, unknown>[];
  upgraded: number;
  skipped: number;
  reciprocals: Array<{ remotePicoId: string; localWebvhDid: string; subId: string }>;
}> {
  const localDid = await store.getWebvhDid(picoId);
  const reciprocals: Array<{
    remotePicoId: string;
    localWebvhDid: string;
    subId: string;
  }> = [];
  let upgraded = 0;
  let skipped = 0;
  const next: Record<string, unknown>[] = [];

  for (const raw of list) {
    if (!raw || typeof raw !== "object") {
      next.push(raw as Record<string, unknown>);
      continue;
    }
    const bus = { ...(raw as Record<string, unknown>) };
    if (bus["layer2"] === true) {
      next.push(bus);
      skipped += 1;
      continue;
    }

    const subId = busId(bus);
    const remoteEci =
      typeof bus["Tx"] === "string" && bus["Tx"].length > 0
        ? bus["Tx"]
        : undefined;

    if (!subId || !remoteEci) {
      next.push(bus);
      skipped += 1;
      continue;
    }

    const remoteWebvhDid = await webvhDidForChannelEci(store, pf, remoteEci);
    if (!remoteWebvhDid) {
      next.push(bus);
      skipped += 1;
      continue;
    }

    const established = await establishSubscriptionIdentity(store, pf, picoId, {
      subscriptionId: subId,
      remoteWebvhDid,
      remoteTxHost:
        typeof bus["Tx_host"] === "string" ? bus["Tx_host"] : undefined,
      rxEci: typeof bus["Rx"] === "string" ? bus["Rx"] : undefined,
      channelName:
        typeof bus["name"] === "string" ? bus["name"] : undefined,
      channelType:
        typeof bus["channel_type"] === "string"
          ? bus["channel_type"]
          : undefined,
    });

    next.push(mergeBusToLayer2(bus, remoteWebvhDid, established.peerDid));
    upgraded += 1;

    if (localDid) {
      try {
        const remotePico = pf.getPico(remoteEci);
        reciprocals.push({
          remotePicoId: remotePico.id,
          localWebvhDid: localDid,
          subId,
        });
      } catch {
        // remote not on this engine
      }
    }
  }

  return { next, upgraded, skipped, reciprocals };
}

async function upgradeReciprocalBuses(
  store: IdentityStore,
  pf: PicoFramework,
  remotePicoId: string,
  localPicoId: string,
  localWebvhDid: string
): Promise<number> {
  const remote = pf.loadedPicos().find((p) => p.id === remotePicoId);
  if (!remote?.rulesets[SUBSCRIPTION_RID]) {
    return 0;
  }

  const establishedRaw = await remote.getEnt(SUBSCRIPTION_RID, "established");
  if (!Array.isArray(establishedRaw) || establishedRaw.length === 0) {
    return 0;
  }

  let upgraded = 0;
  const next: Record<string, unknown>[] = [];

  for (const raw of establishedRaw) {
    if (!raw || typeof raw !== "object") {
      next.push(raw as Record<string, unknown>);
      continue;
    }
    const bus = { ...(raw as Record<string, unknown>) };
    if (bus["layer2"] === true) {
      next.push(bus);
      continue;
    }

    const subId = busId(bus);
    const tx =
      typeof bus["Tx"] === "string" && bus["Tx"].length > 0
        ? bus["Tx"]
        : undefined;

    let pointsAtLocal = bus["picoID"] === localPicoId;
    if (!pointsAtLocal && tx) {
      try {
        pointsAtLocal = pf.getPico(tx).id === localPicoId;
      } catch {
        pointsAtLocal = false;
      }
    }

    if (!subId || !pointsAtLocal) {
      next.push(bus);
      continue;
    }

    const established = await establishSubscriptionIdentity(
      store,
      pf,
      remotePicoId,
      {
        subscriptionId: subId,
        remoteWebvhDid: localWebvhDid,
        remoteTxHost:
          typeof bus["Tx_host"] === "string" ? bus["Tx_host"] : undefined,
        rxEci: typeof bus["Rx"] === "string" ? bus["Rx"] : undefined,
      }
    );

    const thingSub = await store.getPeerSubscription(localPicoId, subId);
    const remoteWebvh = await store.getWebvhDid(remotePicoId);
    const txHost =
      typeof bus["Tx_host"] === "string" ? bus["Tx_host"] : undefined;

    if (thingSub?.peerDid) {
      await linkRemotePeer(store, remotePicoId, subId, {
        remotePeerDid: thingSub.peerDid,
        remoteWebvhDid: localWebvhDid,
        remoteTxHost: txHost,
      });
      await linkRemotePeer(store, localPicoId, subId, {
        remotePeerDid: established.peerDid,
        remoteWebvhDid: remoteWebvh ?? undefined,
        remoteTxHost: txHost,
      });
    }

    next.push(mergeBusToLayer2(bus, localWebvhDid, established.peerDid));
    upgraded += 1;
  }

  if (upgraded > 0) {
    await remote.putEnt(SUBSCRIPTION_RID, "established", next);
  }
  return upgraded;
}

/** Upgrade extant L1 established buses to L2 for every pico in the export subtree. */
export async function prepareSubtreeRelationshipsForPortableExport(
  deps: Pick<PortableMoveDeps, "store" | "pf" | "identity">,
  subtreeRootRef: string
): Promise<PortableExportPrepareResult> {
  const subtreeIds = new Set(collectSubtreePicoIds(deps.pf, subtreeRootRef));
  let upgradedOnSubtree = 0;
  let upgradedOnPeers = 0;
  let skipped = 0;
  const reciprocalSeen = new Set<string>();

  for (const picoId of subtreeIds) {
    const pico = deps.pf.loadedPicos().find((p) => p.id === picoId);
    if (!pico?.rulesets[SUBSCRIPTION_RID]) {
      continue;
    }

    const establishedRaw = await pico.getEnt(SUBSCRIPTION_RID, "established");
    if (!Array.isArray(establishedRaw) || establishedRaw.length === 0) {
      continue;
    }

    const list = establishedRaw.filter(
      (b) => b && typeof b === "object"
    ) as Record<string, unknown>[];

    const {
      next,
      upgraded,
      skipped: skip,
      reciprocals,
    } = await upgradeEstablishedList(deps.store, deps.pf, picoId, list);

    skipped += skip;
    if (upgraded > 0) {
      await pico.putEnt(SUBSCRIPTION_RID, "established", next);
      upgradedOnSubtree += upgraded;
    }

    for (const r of reciprocals) {
      const key = `${r.remotePicoId}:${r.localWebvhDid}`;
      if (reciprocalSeen.has(key)) {
        continue;
      }
      reciprocalSeen.add(key);
      upgradedOnPeers += await upgradeReciprocalBuses(
        deps.store,
        deps.pf,
        r.remotePicoId,
        picoId,
        r.localWebvhDid
      );
    }
  }

  return { upgradedOnSubtree, upgradedOnPeers, skipped };
}
