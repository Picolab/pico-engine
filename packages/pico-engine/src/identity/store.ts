import { PicoDb, PicoDbKey } from "pico-framework";
import { dbDel, dbGet, dbList, dbPut } from "./dbHelpers";
import {
  CachedDidDoc,
  DidCommRoutes,
  PeerSubscriptionRecord,
  PendingRotation,
  WebvhKeys,
  WebvhLogEntry,
} from "./types";

export const IDENTITY_PREFIX = "pico-identity";

const FIELD = {
  webvhDid: "webvhDid",
  webvhLog: "webvhLog",
  webvhKeys: "webvhKeys",
  meshRootId: "meshRootId",
  publicIntro: "publicIntro",
  pendingRotations: "pendingRotations",
  peerSub: "peerSub",
  didDoc: "didDoc",
  routes: "routes",
  didcommIngressEci: "didcommIngressEci",
  webvhWebDoc: "webvhWebDoc",
} as const;

export interface IdentityStoreDeps {
  db: PicoDb;
}

function identityKey(picoId: string, ...rest: string[]): PicoDbKey {
  return [IDENTITY_PREFIX, picoId, ...rest];
}

function picoPrefix(picoId: string): PicoDbKey {
  return [IDENTITY_PREFIX, picoId];
}

/**
 * Engine-owned per-pico DID/DIDComm state. Not exposed to KRL.
 *
 * 1.6 stores private keys as plaintext JSON — see IDENTITY_STORAGE_KNOWN_GAP.
 */
export class IdentityStore {
  private db: PicoDb;

  constructor(deps: IdentityStoreDeps) {
    this.db = deps.db;
  }

  // ---- scalar metadata ----

  async getWebvhDid(picoId: string): Promise<string | null> {
    return dbGet<string>(this.db, identityKey(picoId, FIELD.webvhDid));
  }

  async putWebvhDid(picoId: string, did: string): Promise<void> {
    await dbPut(this.db, identityKey(picoId, FIELD.webvhDid), did);
  }

  async getMeshRootId(picoId: string): Promise<string | null> {
    return dbGet<string>(this.db, identityKey(picoId, FIELD.meshRootId));
  }

  async putMeshRootId(picoId: string, meshRootId: string): Promise<void> {
    await dbPut(this.db, identityKey(picoId, FIELD.meshRootId), meshRootId);
  }

  async getPublicIntro(picoId: string): Promise<boolean | null> {
    return dbGet<boolean>(this.db, identityKey(picoId, FIELD.publicIntro));
  }

  async putPublicIntro(picoId: string, publicIntro: boolean): Promise<void> {
    await dbPut(this.db, identityKey(picoId, FIELD.publicIntro), publicIntro);
  }

  // ---- webvh log + keys ----

  async getWebvhLog(picoId: string): Promise<WebvhLogEntry[] | null> {
    return dbGet<WebvhLogEntry[]>(this.db, identityKey(picoId, FIELD.webvhLog));
  }

  async putWebvhLog(picoId: string, log: WebvhLogEntry[]): Promise<void> {
    await dbPut(this.db, identityKey(picoId, FIELD.webvhLog), log);
  }

  async getWebvhKeys(picoId: string): Promise<WebvhKeys | null> {
    return dbGet<WebvhKeys>(this.db, identityKey(picoId, FIELD.webvhKeys));
  }

  async putWebvhKeys(picoId: string, keys: WebvhKeys): Promise<void> {
    await dbPut(this.db, identityKey(picoId, FIELD.webvhKeys), keys);
  }

  async getDidcommIngressEci(picoId: string): Promise<string | null> {
    return dbGet<string>(
      this.db,
      identityKey(picoId, FIELD.didcommIngressEci)
    );
  }

  async putDidcommIngressEci(picoId: string, eci: string): Promise<void> {
    await dbPut(this.db, identityKey(picoId, FIELD.didcommIngressEci), eci);
  }

  /** Reverse lookup: ingress channel ECI → pico id. */
  async findPicoIdByIngressEci(eci: string): Promise<string | null> {
    const rows = await dbList<string>(this.db, [IDENTITY_PREFIX]);
    for (const { key, value } of rows) {
      if (
        key.length === 3 &&
        key[2] === FIELD.didcommIngressEci &&
        typeof value === "string" &&
        value === eci
      ) {
        return String(key[1]);
      }
    }
    return null;
  }

  /** Find subscription by inbound sender peer DID (short or long form). */
  async findPeerSubscriptionBySenderDid(
    picoId: string,
    senderDid: string
  ): Promise<PeerSubscriptionRecord | null> {
    const normalized = senderDid.trim();
    for (const sub of await this.listPeerSubscriptions(picoId)) {
      const remote = sub.remotePeerDid || sub.remoteDid;
      if (!remote) {
        continue;
      }
      if (remote === normalized || peerDidMatches(remote, normalized)) {
        return sub;
      }
    }
    return null;
  }

  async getWebvhWebDoc(picoId: string): Promise<Record<string, unknown> | null> {
    return dbGet<Record<string, unknown>>(
      this.db,
      identityKey(picoId, FIELD.webvhWebDoc)
    );
  }

  async putWebvhWebDoc(
    picoId: string,
    doc: Record<string, unknown>
  ): Promise<void> {
    await dbPut(this.db, identityKey(picoId, FIELD.webvhWebDoc), doc);
  }

  async findPicoIdByLocalPeerDid(peerDid: string): Promise<string | null> {
    const rows = await dbList(this.db, [IDENTITY_PREFIX]);
    const picoIds = new Set<string>();
    for (const { key } of rows) {
      if (key.length >= 2 && typeof key[1] === "string") {
        picoIds.add(key[1]);
      }
    }
    for (const picoId of picoIds) {
      for (const sub of await this.listPeerSubscriptions(picoId)) {
        if (peerDidMatches(sub.peerDid, peerDid)) {
          return picoId;
        }
      }
    }
    return null;
  }

  /** Find established subscription id routed to the given DID (peer or webvh). */
  async findSubscriptionIdForDid(
    picoId: string,
    did: string
  ): Promise<string | null> {
    const normalized = did.trim();
    for (const sub of await this.listPeerSubscriptions(picoId)) {
      if (sub.remoteWebvhDid === normalized) {
        return sub.subscriptionId;
      }
      const remote = sub.remotePeerDid || sub.remoteDid;
      if (remote && peerDidMatches(remote, normalized)) {
        return sub.subscriptionId;
      }
    }
    return null;
  }

  /** Reverse lookup for locally hosted did:webvh identifiers. */
  async findPicoIdByWebvhDid(did: string): Promise<string | null> {
    const rows = await dbList<string>(this.db, [IDENTITY_PREFIX]);
    for (const { key, value } of rows) {
      if (
        key.length === 3 &&
        key[2] === FIELD.webvhDid &&
        typeof value === "string" &&
        value === did
      ) {
        return String(key[1]);
      }
    }
    return null;
  }

  // ---- pending rotations ----

  async getPendingRotations(picoId: string): Promise<PendingRotation[] | null> {
    return dbGet<PendingRotation[]>(
      this.db,
      identityKey(picoId, FIELD.pendingRotations)
    );
  }

  async putPendingRotations(
    picoId: string,
    rotations: PendingRotation[]
  ): Promise<void> {
    await dbPut(this.db, identityKey(picoId, FIELD.pendingRotations), rotations);
  }

  // ---- peer subscriptions (pairwise did:peer) ----

  async getPeerSubscription(
    picoId: string,
    subscriptionId: string
  ): Promise<PeerSubscriptionRecord | null> {
    return dbGet<PeerSubscriptionRecord>(
      this.db,
      identityKey(picoId, FIELD.peerSub, subscriptionId)
    );
  }

  async putPeerSubscription(
    picoId: string,
    record: PeerSubscriptionRecord
  ): Promise<void> {
    await dbPut(
      this.db,
      identityKey(picoId, FIELD.peerSub, record.subscriptionId),
      record
    );
  }

  async deletePeerSubscription(
    picoId: string,
    subscriptionId: string
  ): Promise<void> {
    await dbDel(this.db, identityKey(picoId, FIELD.peerSub, subscriptionId));
  }

  async listPeerSubscriptions(
    picoId: string
  ): Promise<PeerSubscriptionRecord[]> {
    const rows = await dbList<PeerSubscriptionRecord>(
      this.db,
      identityKey(picoId, FIELD.peerSub)
    );
    return rows.map((r) => r.value);
  }

  // ---- DID document cache ----

  async getDidDoc(picoId: string, did: string): Promise<CachedDidDoc | null> {
    return dbGet<CachedDidDoc>(this.db, identityKey(picoId, FIELD.didDoc, did));
  }

  async putDidDoc(picoId: string, cached: CachedDidDoc): Promise<void> {
    await dbPut(
      this.db,
      identityKey(picoId, FIELD.didDoc, cached.did),
      cached
    );
  }

  async deleteDidDoc(picoId: string, did: string): Promise<void> {
    await dbDel(this.db, identityKey(picoId, FIELD.didDoc, did));
  }

  async listDidDocs(picoId: string): Promise<CachedDidDoc[]> {
    const rows = await dbList<CachedDidDoc>(
      this.db,
      identityKey(picoId, FIELD.didDoc)
    );
    return rows.map((r) => r.value);
  }

  async getRoutes(picoId: string): Promise<DidCommRoutes | null> {
    return dbGet(this.db, identityKey(picoId, FIELD.routes));
  }

  async putRoutes(picoId: string, routes: DidCommRoutes): Promise<void> {
    await dbPut(this.db, identityKey(picoId, FIELD.routes), routes);
  }

  // ---- lifecycle ----

  /** True when any identity subkey exists for this pico. */
  async hasIdentity(picoId: string): Promise<boolean> {
    const rows = await dbList(this.db, picoPrefix(picoId));
    return rows.length > 0;
  }

  /** Remove all identity state for a pico (e.g. on delete — Epic 4+). */
  async deleteAll(picoId: string): Promise<void> {
    const rows = await dbList(this.db, picoPrefix(picoId));
    if (rows.length === 0) {
      return;
    }
    const batch = this.db.batch();
    for (const { key } of rows) {
      batch.del(key);
    }
    await batch.write();
  }
}

/** No-op for 1.6 — legacy did-o ent: migration deferred. */
export async function migrateFromDidO(_picoId: string): Promise<void> {
  return;
}

/** Match did:peer short/long forms (numalgo 0/2). */
function peerDidMatches(stored: string, incoming: string): boolean {
  if (stored === incoming) {
    return true;
  }
  const storedShort = peerDidShortForm(stored);
  const incomingShort = peerDidShortForm(incoming);
  return storedShort.length > 0 && storedShort === incomingShort;
}

function peerDidShortForm(did: string): string {
  if (!did.startsWith("did:peer:")) {
    return did;
  }
  const parts = did.split(".");
  if (parts.length >= 3) {
    return `${parts[0]}.${parts[parts.length - 1]}`;
  }
  return did;
}
