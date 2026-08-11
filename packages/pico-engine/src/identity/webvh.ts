import { ChannelConfig, Pico, PicoFramework } from "pico-framework";
import { IdentityStore } from "./store";
import type { WebvhLogEntry } from "./types";
import {
  createWebvhCrypto,
  generateWebvhKeyMaterial,
  loadDidWebvhTs,
  createPassthroughVerifier,
  storedKeysFromWebvhKeys,
  webvhKeysToStore,
  type StoredWebvhKeyMaterial,
} from "./webvhCrypto";

export interface EnsureWebvhDidOptions {
  isRoot?: boolean;
  meshRootId?: string;
}

export function baseUrlToDidAddress(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (url.port) {
    return `${url.hostname}:${url.port}`;
  }
  return url.hostname;
}

/** Build an HTTP(S) did.jsonl URL from a portable did:webvh identifier. */
export function portableWebvhLogHttpUrl(did: string): string | null {
  if (!did.startsWith("did:webvh:")) {
    return null;
  }
  const parts = did.split(":");
  if (parts.length < 4) {
    return null;
  }
  const domainPart = parts[3];
  const pathSegments = parts.slice(4).map((segment) => decodeURIComponent(segment));

  let host: string;
  let port: number | undefined;
  if (/%3a/i.test(domainPart)) {
    const [hostPart, portPart] = domainPart.split(/%3a/i);
    if (!hostPart || !portPart) {
      return null;
    }
    host = decodeURIComponent(hostPart);
    port = parseInt(portPart, 10);
    if (Number.isNaN(port)) {
      return null;
    }
  } else {
    host = decodeURIComponent(domainPart);
  }

  const hostPort = port ? `${host}:${port}` : host;
  const useHttp =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "host.docker.internal" ||
    host.endsWith(".localhost");
  const protocol = useHttp ? "http" : "https";
  const path =
    pathSegments.length > 0
      ? `/${pathSegments.join("/")}/did.jsonl`
      : "/.well-known/did.jsonl";
  return `${protocol}://${hostPort}${path}`;
}

async function fetchRemoteWebvhLog(
  did: string,
  fetchImpl: typeof fetch
): Promise<WebvhLogEntry[] | null> {
  const logUrl = portableWebvhLogHttpUrl(did);
  if (!logUrl) {
    return null;
  }
  try {
    const res = await fetchImpl(logUrl);
    if (!res.ok) {
      return null;
    }
    const text = (await res.text()).trim();
    if (!text) {
      return null;
    }
    return text
      .split("\n")
      .map((line) => JSON.parse(line) as WebvhLogEntry);
  } catch {
    return null;
  }
}

export function webvhPathsForPico(picoId: string): string[] {
  return ["picos", picoId];
}

/** HTTP path prefix for a pico's did.jsonl (no leading slash). */
export function webvhHttpPath(picoId: string): string {
  return `${webvhPathsForPico(picoId).join("/")}/did.jsonl`;
}

export function webvhDidJsonPath(picoId: string): string {
  return `${webvhPathsForPico(picoId).join("/")}/did.json`;
}

export function meshRootIdFor(pf: PicoFramework, picoId: string): string {
  let pico = pf.loadedPicos().find((p) => p.id === picoId);
  if (!pico) {
    return picoId;
  }
  while (pico.parent) {
    pico = pf.getPico(pico.parent);
  }
  return pico.id;
}

function findPico(pf: PicoFramework, picoId: string): Pico | undefined {
  return pf.loadedPicos().find((p) => p.id === picoId);
}

const INGRESS_CHANNEL: ChannelConfig = {
  tags: ["didcomm", "ingress"],
  eventPolicy: {
    allow: [{ domain: "dido", name: "didcomm_message" }],
    deny: [],
  },
  queryPolicy: {
    allow: [],
    deny: [{ rid: "*", name: "*" }],
  },
};

async function ensureDidcommIngress(
  pf: PicoFramework,
  store: IdentityStore,
  picoId: string,
  baseUrl: string
): Promise<string> {
  const existing = await store.getDidcommIngressEci(picoId);
  if (existing) {
    return existing;
  }
  const pico = findPico(pf, picoId);
  if (!pico) {
    throw new Error(`Pico ${picoId} not loaded — cannot create DIDComm ingress`);
  }
  const chann = await pico.newChannel(INGRESS_CHANNEL);
  const eci = chann.toReadOnly().id;
  await store.putDidcommIngressEci(picoId, eci);
  return eci;
}

function didcommServiceEndpoint(baseUrl: string, ingressEci: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/sky/event/${ingressEci}/none/dido/didcomm_message`;
}

export async function ensureWebvhDid(
  store: IdentityStore,
  pf: PicoFramework,
  getBaseUrl: () => string,
  picoId: string,
  options: EnsureWebvhDidOptions = {}
): Promise<string> {
  const existing = await store.getWebvhDid(picoId);
  if (existing) {
    return existing;
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error("Engine base_url is required before provisioning did:webvh");
  }

  const webvh = await loadDidWebvhTs();
  const keyMaterial = await generateWebvhKeyMaterial();
  const crypto = await createWebvhCrypto(keyMaterial);
  const ingressEci = await ensureDidcommIngress(pf, store, picoId, baseUrl);

  const result = await webvh.createDID({
    address: baseUrlToDidAddress(baseUrl),
    paths: webvhPathsForPico(picoId),
    portable: true,
    alsoKnownAsWeb: true,
    signer: crypto,
    verifier: crypto,
    updateKeys: [keyMaterial.updateKeyMultibase],
    verificationMethods: [
      keyMaterial.verificationMethod,
      {
        type: "Multikey",
        publicKeyMultibase: keyMaterial.verificationMethod.publicKeyMultibase,
        secretKeyMultibase: keyMaterial.verificationMethod.secretKeyMultibase,
        purpose: "keyAgreement",
      },
    ],
    services: [
      {
        id: "#didcomm",
        type: "DIDCommMessaging",
        serviceEndpoint: didcommServiceEndpoint(baseUrl, ingressEci),
        accept: ["didcomm/v2"],
      },
    ],
  });

  const meshRootId =
    options.meshRootId || meshRootIdFor(pf, picoId);
  const publicIntro =
    options.isRoot === true ||
    (await store.getPublicIntro(picoId)) === true;

  await store.putWebvhDid(picoId, result.did);
  await store.putWebvhLog(picoId, result.log as unknown as WebvhLogEntry[]);
  await store.putWebvhKeys(picoId, webvhKeysToStore(keyMaterial));
  await store.putMeshRootId(picoId, meshRootId);
  await store.putPublicIntro(picoId, publicIntro);
  if (result.webDoc) {
    await store.putWebvhWebDoc(picoId, result.webDoc as Record<string, unknown>);
  }
  await store.putDidDoc(picoId, {
    did: result.did,
    doc: result.doc as Record<string, unknown>,
    cachedAt: new Date().toISOString(),
  });

  return result.did;
}

export async function ensureWebvhForLoadedPicos(
  store: IdentityStore,
  pf: PicoFramework,
  getBaseUrl: () => string
): Promise<void> {
  const rootIds = new Set(pf.rootPicos().map((r) => r.id));
  for (const pico of pf.loadedPicos()) {
    await ensureWebvhDid(store, pf, getBaseUrl, pico.id, {
      isRoot: rootIds.has(pico.id),
    });
  }
}

export function formatDidLogAsJsonl(log: WebvhLogEntry[]): string {
  return log.map((entry) => JSON.stringify(entry)).join("\n") + "\n";
}

export async function resolveLocalWebvhLog(
  log: WebvhLogEntry[]
): Promise<{ did: string; doc: Record<string, unknown> }> {
  const webvh = await loadDidWebvhTs();
  const verifier = await createPassthroughVerifier();
  const resolved = await webvh.resolveDIDFromLog(log as any, { verifier });
  return {
    did: resolved.did,
    doc: resolved.doc as Record<string, unknown>,
  };
}

export async function resolveWebvhDid(
  store: IdentityStore,
  did: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ did: string; doc: Record<string, unknown> }> {
  const webvh = await loadDidWebvhTs();
  const localPicoId = await store.findPicoIdByWebvhDid(did);
  if (localPicoId) {
    const log = await store.getWebvhLog(localPicoId);
    if (log && log.length > 0) {
      return resolveLocalWebvhLog(log);
    }
  }
  const remoteLog = await fetchRemoteWebvhLog(did, fetchImpl);
  if (remoteLog && remoteLog.length > 0) {
    return resolveLocalWebvhLog(remoteLog);
  }

  const result = await webvh.resolveDID(did, {
    verifier: await createPassthroughVerifier(),
  } as any);
  if ("error" in result.meta && result.meta.error) {
    throw new Error(`DID resolution failed: ${result.meta.error}`);
  }
  return {
    did: result.did,
    doc: result.doc as Record<string, unknown>,
  };
}

export function picoIdFromWebvhHttpPath(pathname: string): string | null {
  const match = pathname.match(/^\/picos\/([^/]+)\/did\.jsonl$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function picoIdFromWebDidJsonPath(pathname: string): string | null {
  const match = pathname.match(/^\/picos\/([^/]+)\/did\.json$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function parallelWebDocForPico(
  store: IdentityStore,
  picoId: string
): Promise<Record<string, unknown> | null> {
  const cached = await store.getWebvhWebDoc(picoId);
  if (cached) {
    return cached;
  }
  const did = await store.getWebvhDid(picoId);
  const log = await store.getWebvhLog(picoId);
  if (!did || !log || log.length === 0) {
    return null;
  }
  const webvh = await loadDidWebvhTs();
  const { doc } = await resolveLocalWebvhLog(log);
  return webvh.generateParallelDidWeb(did, doc as any) as Record<string, unknown>;
}

export function keysFromStore(
  raw: Record<string, unknown> | null
): StoredWebvhKeyMaterial | null {
  if (!raw) {
    return null;
  }
  return storedKeysFromWebvhKeys(raw);
}
