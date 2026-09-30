/**
 * did:webvh log update for portable move (Phase D, pico-move).
 */

import { PicoFramework } from "pico-framework";
import { IdentityStore } from "./store";
import type { WebvhLogEntry } from "./types";
import { IdentityError } from "./errors";
import {
  baseUrlToDidAddress,
  didcommServiceEndpoint,
  ensureDidcommIngress,
  keysFromStore,
  resolveLocalWebvhLog,
  webvhPathsForPico,
} from "./webvh";
import {
  createPassthroughVerifier,
  createWebvhCrypto,
  loadDidWebvhTs,
} from "./webvhCrypto";

export interface RelocateWebvhOptions {
  /** Override engine base URL (default: running engine base_url). */
  baseUrl?: string;
  /** Override log path segments (default: picos/{picoId}). */
  paths?: string[];
  /** Mint a fresh DIDComm ingress channel (simulates post-import ECIs). */
  renewIngress?: boolean;
}

export interface RelocateWebvhResult {
  priorDid: string;
  newDid: string;
  scid: string;
  didcommEndpoint: string;
}

function scidFromLog(log: WebvhLogEntry[]): string {
  const params = log[0]?.parameters as { scid?: string } | undefined;
  const scid = params?.scid;
  if (typeof scid !== "string" || scid.length === 0) {
    throw new IdentityError("webvh log missing SCID", 500);
  }
  return scid;
}

/** Append a portable log entry for a new host/path or DIDComm endpoint. */
export async function relocateWebvhDid(
  store: IdentityStore,
  pf: PicoFramework,
  getBaseUrl: () => string,
  picoId: string,
  options: RelocateWebvhOptions = {}
): Promise<RelocateWebvhResult> {
  const priorDid = await store.getWebvhDid(picoId);
  const log = await store.getWebvhLog(picoId);
  const rawKeys = await store.getWebvhKeys(picoId);
  if (!priorDid || !log?.length || !rawKeys) {
    throw new IdentityError(`Pico ${picoId} has no did:webvh to relocate`, 404);
  }

  const keyMaterial = keysFromStore(rawKeys);
  if (!keyMaterial) {
    throw new IdentityError(`Pico ${picoId} webvh keys are invalid`, 500);
  }

  const baseUrl = options.baseUrl || getBaseUrl();
  if (!baseUrl) {
    throw new IdentityError("Engine base_url is required to relocate did:webvh", 500);
  }

  const priorScid = scidFromLog(log);
  const crypto = await createWebvhCrypto(keyMaterial);
  const verifier = await createPassthroughVerifier();

  let ingressEci = await store.getDidcommIngressEci(picoId);
  if (options.renewIngress || !ingressEci) {
    if (options.renewIngress && ingressEci) {
      await store.putDidcommIngressEci(picoId, "");
    }
    ingressEci = await ensureDidcommIngress(store, pf, picoId, baseUrl);
  }

  const webvh = await loadDidWebvhTs();
  const updated = await webvh.updateDID({
    log: log as any,
    signer: crypto,
    verifier,
    updateKeys: [keyMaterial.updateKeyMultibase],
    verificationMethods: [keyMaterial.verificationMethod],
    address: baseUrlToDidAddress(baseUrl),
    paths: options.paths || webvhPathsForPico(picoId),
    services: [
      {
        id: "#didcomm",
        type: "DIDCommMessaging",
        serviceEndpoint: didcommServiceEndpoint(baseUrl, ingressEci),
        accept: ["didcomm/v2"],
      },
    ],
  });

  const newDid = updated.did;
  const newScid = updated.meta.scid;
  if (newScid !== priorScid) {
    throw new IdentityError(
      `webvh SCID changed during relocation (${priorScid} → ${newScid})`,
      500
    );
  }

  await store.putWebvhDid(picoId, newDid);
  await store.putWebvhLog(picoId, updated.log as unknown as WebvhLogEntry[]);
  if (updated.webDoc) {
    await store.putWebvhWebDoc(picoId, updated.webDoc as Record<string, unknown>);
  }
  await store.putDidDoc(picoId, {
    did: newDid,
    doc: updated.doc as Record<string, unknown>,
    cachedAt: new Date().toISOString(),
  });

  const endpoint = didcommServiceEndpoint(baseUrl, ingressEci);
  return {
    priorDid,
    newDid,
    scid: newScid,
    didcommEndpoint: endpoint,
  };
}

/** Resolve SCID from a stored log (for tests and verification). */
export async function webvhScidFromStore(
  store: IdentityStore,
  picoId: string
): Promise<string | null> {
  const log = await store.getWebvhLog(picoId);
  if (!log?.length) {
    return null;
  }
  try {
    return scidFromLog(log);
  } catch {
    return null;
  }
}

/** Verify local log resolves and SCID matches expectation. */
export async function assertWebvhScidUnchanged(
  store: IdentityStore,
  picoId: string,
  expectedScid: string
): Promise<void> {
  const log = await store.getWebvhLog(picoId);
  if (!log?.length) {
    throw new IdentityError("Missing webvh log", 404);
  }
  const resolved = await resolveLocalWebvhLog(log);
  const scid = scidFromLog(log);
  if (scid !== expectedScid) {
    throw new IdentityError(`SCID mismatch: ${scid} !== ${expectedScid}`, 500);
  }
  if (resolved.did !== (await store.getWebvhDid(picoId))) {
    throw new IdentityError("Resolved DID does not match stored DID", 500);
  }
}
