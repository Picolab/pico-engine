/**
 * End-to-end portable move: export subtree + identity, import, relocate, notify peers.
 */

import { Pico, PicoFramework } from "pico-framework";
import {
  exportSubtree,
  importIntoExistingChild,
  subtreeRootBootstrapName,
  type SubtreeImportOptions,
  type SubtreeImportResult,
} from "pico-engine-core";
import { createImportChildViaWrangler } from "../subtreeWrangler";
import { wranglerSubtreeImportServices } from "../subtreeWrangler";
import type { RulesetRegistry } from "pico-engine-core";
import { IdentityStore } from "./store";
import type { IdentityService } from "./IdentityService";
import type {
  RelocateWebvhOptions,
  RelocateWebvhResult,
} from "./webvhRelocation";
import { refreshLocalPeersOfMovedRoot } from "./localPeerReconcile";
import { prepareSubtreeRelationshipsForPortableExport } from "./portableExportPrepare";
import { syncLayer2EstablishedFromIdentity } from "./subscriptionEntSync";

export interface PortableMoveDeps {
  store: IdentityStore;
  pf: PicoFramework;
  rsRegistry: RulesetRegistry;
  identity: IdentityService;
  getBaseUrl: () => string;
  resolveBundledRulesetUrl?: (url: string) => string;
  reloadImportedSchedules?(picoIds: string[]): Promise<void>;
  firePicoImported?(result: SubtreeImportResult): Promise<void>;
}

export interface PortableMoveExportResult {
  blob: string;
}

export type PortableImportRelocation =
  | (RelocateWebvhResult & { peersNotified: number })
  | { skipped: true; peersNotified: 0 };

export interface PortableMoveImportResult extends SubtreeImportResult {
  relocation: PortableImportRelocation;
}

function resolveImportBootstrapName(
  blob: string,
  secret: string,
  displayNameOverride?: string
): string {
  const override = displayNameOverride?.trim();
  if (override) {
    return override;
  }
  try {
    const fromBlob = subtreeRootBootstrapName(blob, secret);
    if (fromBlob !== "imported") {
      return fromBlob;
    }
  } catch {
    // invalid blob handled later in importIntoExistingChild
  }
  return "imported";
}

function subtreeServices(deps: PortableMoveDeps) {
  return {
    db: deps.pf.db,
    rsRegistry: deps.rsRegistry,
    portableHooks: deps.identity.subtreePortableHooks(),
    resolveBundledRulesetUrl: deps.resolveBundledRulesetUrl,
    ...wranglerSubtreeImportServices(deps.rsRegistry),
  };
}

/** Export a subtree including identity snapshots for each pico. */
export async function exportPortableSubtree(
  deps: PortableMoveDeps,
  picoId: string,
  secret: string,
  options?: { recurse?: boolean; skipRelationshipUpgrade?: boolean }
): Promise<string> {
  if (options?.skipRelationshipUpgrade !== true) {
    await prepareSubtreeRelationshipsForPortableExport(deps, picoId);
  }
  return exportSubtree(
    subtreeServices(deps),
    deps.pf,
    picoId,
    secret,
    options
  );
}

/** Relocate webvh + ingress for every imported pico; notify peers from the moved root. */
export async function finalizePortableImport(
  deps: PortableMoveDeps,
  importResult: SubtreeImportResult,
  relocateOptions: RelocateWebvhOptions = { renewIngress: true }
): Promise<PortableMoveImportResult["relocation"]> {
  const importedPicoIds = Object.values(importResult.picoIdMap);
  for (const picoId of importedPicoIds) {
    if (picoId === importResult.newRootPicoId) {
      continue;
    }
    if (await deps.store.getWebvhDid(picoId)) {
      await deps.identity.relocateWebvhAfterMove(picoId, relocateOptions);
    }
  }
  const rootDid = await deps.store.getWebvhDid(importResult.newRootPicoId);
  if (!rootDid) {
    return { skipped: true, peersNotified: 0 };
  }
  const relocation = await deps.identity.completePortableMove(
    importResult.newRootPicoId,
    relocateOptions
  );
  await refreshLocalPeersOfMovedRoot(
    deps.pf,
    importResult,
    relocation,
    deps.getBaseUrl()
  );
  return relocation;
}

async function afterPortableHydrate(
  deps: PortableMoveDeps,
  result: SubtreeImportResult
): Promise<void> {
  if (deps.reloadImportedSchedules) {
    await deps.reloadImportedSchedules(Object.values(result.picoIdMap));
  }
  for (const picoId of Object.values(result.picoIdMap)) {
    await syncLayer2EstablishedFromIdentity(deps.store, deps.pf, picoId);
  }
  if (deps.firePicoImported) {
    await deps.firePicoImported(result);
  }
}

/** Import a portable subtree under parent and finalize relocation + peer notification. */
export async function importPortableSubtree(
  deps: PortableMoveDeps,
  parent: Pico,
  blob: string,
  secret: string,
  relocateOptions?: RelocateWebvhOptions,
  importOptions?: SubtreeImportOptions
): Promise<PortableMoveImportResult> {
  const services = subtreeServices(deps);
  const createOpts = importOptions?.parentChannelEci
    ? { channelEci: importOptions.parentChannelEci }
    : undefined;
  const bootstrapName = resolveImportBootstrapName(
    blob,
    secret,
    importOptions?.bootstrapDisplayName
  );
  const { familyEci } = await createImportChildViaWrangler(
    deps.pf,
    parent,
    bootstrapName,
    deps.rsRegistry,
    createOpts
  );
  const importResult = await importIntoExistingChild(
    services,
    deps.pf,
    parent,
    familyEci,
    blob,
    secret,
    {
      ...importOptions,
      async afterImport(result, payload) {
        if (importOptions?.afterImport) {
          await importOptions.afterImport(result, payload);
        }
        await afterPortableHydrate(deps, result);
      },
    }
  );
  const relocation = await finalizePortableImport(
    deps,
    importResult,
    relocateOptions
  );
  return { ...importResult, relocation };
}
