import { IdentityStore } from "./store";
import type { DidCommPlainMessage } from "./IdentityService";
import { IdentityError } from "./errors";
import {
  peerKeysFromRecord,
  type StoredPeerDidBundle,
  type StoredVeramoKey,
} from "./peerDid";
import {
  storedKeysFromWebvhKeys,
  webvhAgreementKeysForVeramo,
} from "./webvhCrypto";
import { resolveLocalWebvhLog } from "./webvh";

type VeramoAgent = {
  didManagerGet: (args: { did: string }) => Promise<unknown>;
  didManagerCreate: (args: {
    provider: string;
    options?: { num_algo?: number };
  }) => Promise<{ did: string; keys: Array<{ kid: string; publicKeyHex: string; meta?: Record<string, unknown> }> }>;
  didManagerImport: (args: {
    did: string;
    provider: string;
    keys: StoredVeramoKey[];
    services: unknown[];
  }) => Promise<boolean>;
  packDIDCommMessage: (args: {
    message: DidCommPlainMessage;
    from: string;
    to: string[];
    packing: "authcrypt";
  }) => Promise<{ message: string }>;
  unpackDIDCommMessage: (args: {
    message: string;
  }) => Promise<{ message: DidCommPlainMessage; metaData?: Record<string, unknown> }>;
  resolveDid: (args: { didUrl: string }) => Promise<{ didDocument?: Record<string, unknown> }>;
};

type PrivateKeyStore = {
  getKey: (args: { alias: string }) => Promise<{
    type: string;
    alias: string;
    privateKeyHex: string;
  }>;
};

type AgentBundle = {
  agent: VeramoAgent;
  privateKeyStore: PrivateKeyStore;
};

let agentBundle: AgentBundle | undefined;

/** Per-pack cache so Veramo can resolve did:webvh without a global IdentityService. */
const webvhDidCache = new Map<string, Record<string, unknown>>();

function webvhResolverMethods(): Record<
  string,
  (did: string) => Promise<{
    didDocument: Record<string, unknown> | null;
    didDocumentMetadata: Record<string, unknown>;
    didResolutionMetadata: Record<string, unknown>;
  }>
> {
  return {
    webvh: async (did: string) => {
      const cached = webvhDidCache.get(did);
      if (cached) {
        return {
          didDocument: cached,
          didDocumentMetadata: {},
          didResolutionMetadata: { contentType: "application/did+ld+json" },
        };
      }
      return {
        didDocument: null,
        didDocumentMetadata: {},
        didResolutionMetadata: {
          error: "notFound",
          message: `did:webvh not available: ${did}`,
        },
      };
    },
  };
}

async function getAgentBundle(): Promise<AgentBundle> {
  if (!agentBundle) {
    agentBundle = await createAgentBundle();
  }
  return agentBundle;
}

async function createAgentBundle(): Promise<AgentBundle> {
  const { createAgent } = require("@veramo/core");
  const { DIDManager, MemoryDIDStore } = require("@veramo/did-manager");
  const {
    KeyManager,
    MemoryKeyStore,
    MemoryPrivateKeyStore,
  } = require("@veramo/key-manager");
  const { KeyManagementSystem } = require("@veramo/kms-local");
  const { DIDComm } = require("@veramo/did-comm");
  const { DIDResolverPlugin } = require("@veramo/did-resolver");
  const { PeerDIDProvider, getResolver: getPeerResolver } = require("@veramo/did-provider-peer");
  const { Resolver } = require("did-resolver");

  const privateKeyStore = new MemoryPrivateKeyStore();
  const agent = createAgent({
    plugins: [
      new KeyManager({
        store: new MemoryKeyStore(),
        kms: { local: new KeyManagementSystem(privateKeyStore) },
      }),
      new DIDManager({
        store: new MemoryDIDStore(),
        defaultProvider: "did:peer",
        providers: {
          "did:peer": new PeerDIDProvider({ defaultKms: "local" }),
        },
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({ ...getPeerResolver(), ...webvhResolverMethods() }),
      }),
      new DIDComm(),
    ],
  }) as VeramoAgent;

  return { agent, privateKeyStore };
}

export async function exportVeramoKeysForDid(
  identity: { keys: Array<{ kid: string; publicKeyHex: string; meta?: Record<string, unknown> }> },
  privateKeyStore: PrivateKeyStore
): Promise<StoredVeramoKey[]> {
  const keys: StoredVeramoKey[] = [];
  for (const k of identity.keys) {
    const pk = await privateKeyStore.getKey({ alias: k.kid });
    keys.push({
      type: pk.type,
      kid: pk.alias,
      privateKeyHex: pk.privateKeyHex,
      publicKeyHex: k.publicKeyHex,
      meta: k.meta,
      kms: "local",
    });
  }
  return keys;
}

/** Create a did:peer (num_algo 2) and export key material for persistence. */
export async function createPeerDidWithKeys(): Promise<{
  did: string;
  keys: StoredPeerDidBundle;
}> {
  const { agent, privateKeyStore } = await getAgentBundle();
  const identity = await agent.didManagerCreate({
    provider: "did:peer",
    options: { num_algo: 2 },
  });
  const veramoKeys = await exportVeramoKeysForDid(identity, privateKeyStore);
  return {
    did: identity.did,
    keys: { veramoKeys },
  };
}

/** @deprecated Prefer createPeerDidWithKeys — returns DID only. */
export async function createPeerDid(): Promise<string> {
  const { did } = await createPeerDidWithKeys();
  return did;
}

async function importPeerDidOnAgent(
  did: string,
  keys: StoredVeramoKey[]
): Promise<void> {
  const { agent } = await getAgentBundle();
  try {
    await agent.didManagerGet({ did });
    return;
  } catch {
    // import below
  }
  await agent.didManagerImport({
    did,
    provider: "did:peer",
    keys,
    services: [],
  });
}

async function ensureLocalPeerDid(
  did: string,
  store: IdentityStore,
  picoId: string
): Promise<void> {
  const { agent } = await getAgentBundle();
  try {
    await agent.didManagerGet({ did });
    return;
  } catch {
    // load from store
  }
  const subs = await store.listPeerSubscriptions(picoId);
  const sub = subs.find((s) => s.peerDid === did);
  const veramoKeys = peerKeysFromRecord(sub?.keys);
  if (!veramoKeys) {
    throw new IdentityError(`No local identity for DID ${did}`, 404);
  }
  await importPeerDidOnAgent(did, veramoKeys);
}

async function ensureWebvhDidOnAgent(
  store: IdentityStore,
  picoId: string
): Promise<void> {
  const did = await store.getWebvhDid(picoId);
  if (!did) {
    return;
  }
  const { agent } = await getAgentBundle();
  try {
    await agent.didManagerGet({ did });
    return;
  } catch {
    // import below
  }
  const rawKeys = await store.getWebvhKeys(picoId);
  const keyMaterial = storedKeysFromWebvhKeys(rawKeys || {});
  if (!keyMaterial) {
    return;
  }
  const log = await store.getWebvhLog(picoId);
  if (!log?.length) {
    return;
  }
  const resolved = await resolveLocalWebvhLog(log);
  webvhDidCache.set(did, resolved.doc);
  const veramoKeys = await webvhAgreementKeysForVeramo(
    did,
    resolved.doc,
    keyMaterial
  );
  await agent.didManagerImport({
    did,
    provider: "did:webvh",
    keys: veramoKeys,
    services: Array.isArray(resolved.doc.service)
      ? resolved.doc.service
      : [],
  });
}

/** Load all persisted peer DIDs for a pico onto the Veramo agent. */
export async function warmPeerDidsForPico(
  store: IdentityStore,
  picoId: string
): Promise<void> {
  for (const sub of await store.listPeerSubscriptions(picoId)) {
    const veramoKeys = peerKeysFromRecord(sub.keys);
    if (veramoKeys) {
      await importPeerDidOnAgent(sub.peerDid, veramoKeys);
    }
  }
}

export async function resolvePeerDidDocument(
  did: string
): Promise<Record<string, unknown>> {
  const { agent } = await getAgentBundle();
  const resolved = await agent.resolveDid({ didUrl: did });
  if (!resolved?.didDocument) {
    throw new IdentityError(`DID not found: ${did}`, 404);
  }
  return resolved.didDocument;
}

export async function packDidCommMessage(
  picoId: string,
  message: DidCommPlainMessage,
  from: string,
  to: string,
  store: IdentityStore,
  options: {
    resolveDid?: (did: string) => Promise<Record<string, unknown>>;
  } = {}
): Promise<string> {
  const { agent } = await getAgentBundle();
  if (from.startsWith("did:peer:")) {
    await ensureLocalPeerDid(from, store, picoId);
  }

  let cachedWebvh = false;
  if (to.startsWith("did:webvh:") && options.resolveDid) {
    webvhDidCache.set(to, await options.resolveDid(to));
    cachedWebvh = true;
  }

  try {
    const packed = await agent.packDIDCommMessage({
      message,
      from,
      to: [to],
      packing: "authcrypt",
    });
    return packed.message;
  } finally {
    if (cachedWebvh) {
      webvhDidCache.delete(to);
    }
  }
}

export async function unpackDidCommMessage(
  picoId: string,
  jwe: string,
  store: IdentityStore
): Promise<{ message: DidCommPlainMessage; metadata: Record<string, unknown> }> {
  const { agent } = await getAgentBundle();
  await ensureWebvhDidOnAgent(store, picoId);
  const subs = await store.listPeerSubscriptions(picoId);
  for (const sub of subs) {
    const veramoKeys = peerKeysFromRecord(sub.keys);
    if (veramoKeys) {
      await importPeerDidOnAgent(sub.peerDid, veramoKeys);
    }
  }

  let result: { message: DidCommPlainMessage; metaData?: Record<string, unknown> };
  try {
    result = await agent.unpackDIDCommMessage({ message: jwe });
  } catch (err) {
    throw new IdentityError(
      `DIDComm unpack failed: ${(err as Error).message}`,
      401
    );
  }
  const from = result.message.from;
  if (from && from.startsWith("did:peer:")) {
    try {
      const resolved = await agent.resolveDid({ didUrl: from });
      if (resolved?.didDocument) {
        await store.putDidDoc(picoId, {
          did: from,
          doc: resolved.didDocument,
          cachedAt: new Date().toISOString(),
        });
      }
    } catch {
      // best effort cache
    }
  }
  return {
    message: result.message,
    metadata: (result.metaData || {}) as Record<string, unknown>,
  };
}

export function resetVeramoAgentForTests(): void {
  agentBundle = undefined;
  webvhDidCache.clear();
}
