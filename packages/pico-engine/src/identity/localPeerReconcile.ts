/**
 * After a portable import, update relationship buses on other picos on this engine
 * (e.g. ride coordinator) so they still point at the moved root by DID / remapped ECI.
 */

import { PicoFramework } from "pico-framework";
import type { SubtreeImportResult } from "pico-engine-core";
import type { RelocateWebvhResult } from "./webvhRelocation";

const SUBSCRIPTION_RID = "io.picolabs.subscription";

export interface PatchMovedRootResult {
  next: Record<string, unknown>[];
  changed: boolean;
}

/** Pure patch logic for unit tests. */
export function patchEstablishedBusesForMovedRoot(
  established: unknown[],
  result: SubtreeImportResult,
  relocation: Pick<RelocateWebvhResult, "priorDid" | "newDid">,
  baseUrl: string
): PatchMovedRootResult {
  const host = baseUrl.replace(/\/$/, "");
  const oldRoot = result.oldRootPicoId;
  const newRoot = result.newRootPicoId;
  let changed = false;

  const next = established.map((raw) => {
    if (!raw || typeof raw !== "object") {
      return raw;
    }
    const bus = { ...(raw as Record<string, unknown>) };
    const tx = bus["Tx"];
    const txRemapped =
      typeof tx === "string" && result.eciMap[tx] ? result.eciMap[tx] : undefined;
    const matches =
      bus["picoID"] === oldRoot ||
      bus["Tx_did"] === relocation.priorDid ||
      txRemapped !== undefined ||
      (typeof tx === "string" && result.eciMap[tx] !== undefined);

    if (!matches) {
      return raw;
    }

    changed = true;
    if (bus["picoID"] === oldRoot) {
      bus["picoID"] = newRoot;
    }
    if (bus["Tx_did"] === relocation.priorDid) {
      bus["Tx_did"] = relocation.newDid;
    }
    if (txRemapped) {
      bus["Tx"] = txRemapped;
    }
    if (bus["layer2"] === true) {
      bus["Tx_host"] = host;
    }
    return bus;
  }) as Record<string, unknown>[];

  return { next, changed };
}

/** Refresh ent:established on every loaded pico that references the moved root. */
export async function refreshLocalPeersOfMovedRoot(
  pf: PicoFramework,
  result: SubtreeImportResult,
  relocation: RelocateWebvhResult,
  baseUrl: string
): Promise<number> {
  let picosUpdated = 0;

  for (const pico of pf.loadedPicos()) {
    if (!pico.rulesets[SUBSCRIPTION_RID]) {
      continue;
    }
    const establishedRaw = await pico.getEnt(SUBSCRIPTION_RID, "established");
    if (!Array.isArray(establishedRaw) || establishedRaw.length === 0) {
      continue;
    }

    const { next, changed } = patchEstablishedBusesForMovedRoot(
      establishedRaw,
      result,
      relocation,
      baseUrl
    );
    if (changed) {
      await pico.putEnt(SUBSCRIPTION_RID, "established", next);
      picosUpdated += 1;
    }
  }

  return picosUpdated;
}
