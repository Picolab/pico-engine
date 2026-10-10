/**
 * Identity snapshots for portable subtree export/import (Phase D).
 */

import { PicoFramework } from "pico-framework";
import type { SubtreePortableHooks } from "pico-engine-core";
import { IdentityStore } from "./store";
import type {
  DidCommRoutes,
  PeerSubscriptionRecord,
  WebvhKeys,
  WebvhLogEntry,
} from "./types";
import { IdentityError } from "./errors";
import { meshRootIdFor, webvhPathsForPico } from "./webvh";
import { warmPeerDidsForPico } from "./veramoDidComm";

export interface PortableIdentityExport {
  webvhDid: string;
  webvhLog: WebvhLogEntry[];
  webvhKeys: WebvhKeys;
  webvhWebDoc?: Record<string, unknown>;
  publicIntro: boolean;
  peerSubscriptions: PeerSubscriptionRecord[];
  routes?: DidCommRoutes;
}

function rewritePicoIdInValue<T>(value: T, oldPicoId: string, newPicoId: string): T {
  if (typeof value === "string") {
    return value
      .split(oldPicoId)
      .join(newPicoId) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      rewritePicoIdInValue(item, oldPicoId, newPicoId)
    ) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = rewritePicoIdInValue(child, oldPicoId, newPicoId);
    }
    return out as T;
  }
  return value;
}

export function rewriteWebvhLogForPicoId(
  log: WebvhLogEntry[],
  oldPicoId: string,
  newPicoId: string
): WebvhLogEntry[] {
  return rewritePicoIdInValue(log, oldPicoId, newPicoId);
}

export async function exportNodeIdentity(
  store: IdentityStore,
  picoId: string
): Promise<PortableIdentityExport | null> {
  const webvhDid = await store.getWebvhDid(picoId);
  const webvhLog = await store.getWebvhLog(picoId);
  const webvhKeys = await store.getWebvhKeys(picoId);
  if (!webvhDid || !webvhLog?.length || !webvhKeys) {
    return null;
  }

  return {
    webvhDid,
    webvhLog,
    webvhKeys,
    webvhWebDoc: (await store.getWebvhWebDoc(picoId)) || undefined,
    publicIntro: (await store.getPublicIntro(picoId)) === true,
    peerSubscriptions: await store.listPeerSubscriptions(picoId),
    routes: (await store.getRoutes(picoId)) || undefined,
  };
}

export async function importNodeIdentity(
  store: IdentityStore,
  pf: PicoFramework,
  oldPicoId: string,
  newPicoId: string,
  raw: unknown,
  eciMap: Record<string, string>,
  picoIdMap: Record<string, string>
): Promise<void> {
  if (!raw || typeof raw !== "object") {
    throw new IdentityError("Invalid portable identity export", 400);
  }
  const identity = raw as PortableIdentityExport;
  if (
    typeof identity.webvhDid !== "string" ||
    !Array.isArray(identity.webvhLog) ||
    !identity.webvhKeys
  ) {
    throw new IdentityError("Portable identity export missing webvh fields", 400);
  }

  const meshRootId = meshRootIdFor(pf, newPicoId);

  await store.putWebvhKeys(newPicoId, identity.webvhKeys);
  await store.putWebvhLog(newPicoId, identity.webvhLog);
  await store.putWebvhDid(newPicoId, identity.webvhDid);
  await store.putMeshRootId(newPicoId, meshRootId);
  await store.putPublicIntro(newPicoId, identity.publicIntro === true);
  await store.putDidcommIngressEci(newPicoId, "");
  if (identity.webvhWebDoc) {
    await store.putWebvhWebDoc(newPicoId, identity.webvhWebDoc);
  }

  if (identity.routes) {
    await store.putRoutes(newPicoId, identity.routes);
  }

  for (const sub of identity.peerSubscriptions || []) {
    const rxEci = sub.rxEci ? eciMap[sub.rxEci] || sub.rxEci : sub.rxEci;
    const remoteMeshRootId =
      sub.remoteMeshRootId && picoIdMap[sub.remoteMeshRootId]
        ? picoIdMap[sub.remoteMeshRootId]
        : sub.remoteMeshRootId;
    await store.putPeerSubscription(newPicoId, {
      ...sub,
      rxEci,
      remoteMeshRootId,
    });
  }

  await warmPeerDidsForPico(store, newPicoId);

  if (webvhPathsForPico(newPicoId)[1] !== newPicoId) {
    throw new IdentityError("Webvh path rewrite failed after import", 500);
  }
}

export function createSubtreePortableHooks(
  store: IdentityStore,
  pf: PicoFramework
): SubtreePortableHooks {
  return {
    exportNodeIdentity: (picoId) => exportNodeIdentity(store, picoId),
    importNodeIdentity: (oldPicoId, newPicoId, identity, eciMap, picoIdMap) =>
      importNodeIdentity(
        store,
        pf,
        oldPicoId,
        newPicoId,
        identity,
        eciMap,
        picoIdMap
      ),
  };
}
