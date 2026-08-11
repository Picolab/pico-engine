/**
 * IdentityStore unit tests: webvh, peer subscriptions, DID doc cache, and CRUD.
 */

import test from "ava";
import { ClassicLevel } from "classic-level";
import * as path from "path";
import { IdentityStore, migrateFromDidO } from "../src/identity/store";
import type { PeerSubscriptionRecord } from "../src/identity/types";
import { tmpHome } from "./helpers/tmpHome";
const charwise = require("charwise");
const safeJsonCodec = require("level-json-coerce-null");

async function openStore(
  home: string
): Promise<{ store: IdentityStore; db: ClassicLevel }> {
  const db = new ClassicLevel(path.resolve(home, "db"), {
    keyEncoding: charwise,
    valueEncoding: safeJsonCodec,
  });
  return { store: new IdentityStore({ db }), db };
}

test("IdentityStore read/write scalar fields per pico", async (t) => {
  const home = tmpHome();
  const { store, db } = await openStore(home);
  const picoId = "pico-scalar";

  t.false(await store.hasIdentity(picoId));

  await store.putWebvhDid(picoId, "did:webvh:example:alice");
  await store.putMeshRootId(picoId, picoId);
  await store.putPublicIntro(picoId, true);

  t.true(await store.hasIdentity(picoId));
  t.is(await store.getWebvhDid(picoId), "did:webvh:example:alice");
  t.is(await store.getMeshRootId(picoId), picoId);
  t.is(await store.getPublicIntro(picoId), true);
  t.is(await store.getWebvhDid("other-pico"), null);

  await db.close();
});

test("IdentityStore webvh log, keys, and pending rotations", async (t) => {
  const home = tmpHome();
  const { store, db } = await openStore(home);
  const picoId = "pico-webvh";

  const log = [{ versionId: "v1", portable: true }];
  const keys = {
    signing: { kty: "OKP", crv: "Ed25519", d: "secret-signing" },
    agreement: { kty: "OKP", crv: "X25519", d: "secret-agreement" },
  };
  const rotations = [{ phase: "pending", fromPrior: "did:webvh:old" }];

  await store.putWebvhLog(picoId, log);
  await store.putWebvhKeys(picoId, keys);
  await store.putPendingRotations(picoId, rotations);

  t.deepEqual(await store.getWebvhLog(picoId), log);
  t.deepEqual(await store.getWebvhKeys(picoId), keys);
  t.deepEqual(await store.getPendingRotations(picoId), rotations);

  await db.close();
});

test("IdentityStore peer subscription CRUD", async (t) => {
  const home = tmpHome();
  const { store, db } = await openStore(home);
  const picoId = "pico-peer";

  const subA: PeerSubscriptionRecord = {
    subscriptionId: "sub-a",
    peerDid: "did:peer:4:alice",
    remoteDid: "did:webvh:example:bob",
    keys: { enc: { d: "peer-secret-a" } },
    createdAt: "2026-08-01T00:00:00.000Z",
  };
  const subB: PeerSubscriptionRecord = {
    ...subA,
    subscriptionId: "sub-b",
    peerDid: "did:peer:4:carol",
    createdAt: "2026-08-01T01:00:00.000Z",
  };

  await store.putPeerSubscription(picoId, subA);
  await store.putPeerSubscription(picoId, subB);

  t.deepEqual(await store.getPeerSubscription(picoId, "sub-a"), subA);
  t.is((await store.listPeerSubscriptions(picoId)).length, 2);

  await store.deletePeerSubscription(picoId, "sub-a");
  t.is(await store.getPeerSubscription(picoId, "sub-a"), null);
  t.is((await store.listPeerSubscriptions(picoId)).length, 1);

  await db.close();
});

test("IdentityStore DID document cache", async (t) => {
  const home = tmpHome();
  const { store, db } = await openStore(home);
  const picoId = "pico-cache";

  const cached = {
    did: "did:peer:4:remote",
    doc: { id: "did:peer:4:remote", verificationMethod: [] },
    cachedAt: "2026-08-01T00:00:00.000Z",
  };

  await store.putDidDoc(picoId, cached);
  t.deepEqual(await store.getDidDoc(picoId, cached.did), cached);
  t.is((await store.listDidDocs(picoId)).length, 1);

  await store.deleteDidDoc(picoId, cached.did);
  t.is(await store.getDidDoc(picoId, cached.did), null);
  t.is((await store.listDidDocs(picoId)).length, 0);

  await db.close();
});

test("IdentityStore deleteAll removes every subkey for a pico", async (t) => {
  const home = tmpHome();
  const { store, db } = await openStore(home);
  const picoId = "pico-delete";

  await store.putWebvhDid(picoId, "did:webvh:example:gone");
  await store.putPeerSubscription(picoId, {
    subscriptionId: "sub-x",
    peerDid: "did:peer:4:x",
    createdAt: "2026-08-01T00:00:00.000Z",
  });

  t.true(await store.hasIdentity(picoId));
  await store.deleteAll(picoId);
  t.false(await store.hasIdentity(picoId));
  t.is(await store.getWebvhDid(picoId), null);
  t.is((await store.listPeerSubscriptions(picoId)).length, 0);

  await db.close();
});

test("IdentityStore persists across db reopen (same home)", async (t) => {
  const home = tmpHome();
  const { store: store1, db: db1 } = await openStore(home);
  const picoId = "pico-persist";

  await store1.putWebvhDid(picoId, "did:webvh:example:persist");
  await store1.putMeshRootId(picoId, picoId);
  await store1.putPublicIntro(picoId, false);
  await db1.close();

  const { store: store2, db: db2 } = await openStore(home);
  t.is(await store2.getWebvhDid(picoId), "did:webvh:example:persist");
  t.is(await store2.getMeshRootId(picoId), picoId);
  t.is(await store2.getPublicIntro(picoId), false);
  await db2.close();
});

test("migrateFromDidO is a no-op in 1.6", async (t) => {
  const home = tmpHome();
  const { store, db } = await openStore(home);

  await t.notThrowsAsync(() => migrateFromDidO("any-pico"));
  t.false(await store.hasIdentity("any-pico"));

  await db.close();
});
