/**
 * did:peer:4 spike — encode/decode parity with DIF reference + DIDComm roundtrip.
 */

import test from "ava";
import * as cuid from "cuid";
import {
  decodePeerDid4,
  encodePeerDid4,
  longToShortPeerDid4,
  peerDid4Matches,
  resolvePeerDid4,
} from "../src/identity/peerDid4";
import {
  createPeerDid2WithKeys,
  createPeerDidWithKeys,
  packDidCommMessage,
  resetVeramoAgentForTests,
  unpackDidCommMessage,
} from "../src/identity/veramoDidComm";
import { SKY_EVENT } from "../src/identity/skyProtocol";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

const PYTHON_VECTOR = {
  doc: { hello: "world" },
  did: "did:peer:4zQmb7xLdVY9TXx8oov5XgpGUmGELgqiAV2699s43i6Qdm3M:zQSJgiFTYiCHjQ9MktwNThRXM7a",
  short: "did:peer:4zQmb7xLdVY9TXx8oov5XgpGUmGELgqiAV2699s43i6Qdm3M",
};

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

test("encode/decode matches DIF did-peer-4 Python vector", (t) => {
  const did = encodePeerDid4(PYTHON_VECTOR.doc);
  t.is(did, PYTHON_VECTOR.did);
  t.deepEqual(decodePeerDid4(did), PYTHON_VECTOR.doc);
  t.is(longToShortPeerDid4(did), PYTHON_VECTOR.short);
});

test("resolvePeerDid4 contextualizes id and alsoKnownAs", (t) => {
  const doc = resolvePeerDid4(PYTHON_VECTOR.did);
  t.is(doc.id, PYTHON_VECTOR.did);
  t.true(Array.isArray(doc.alsoKnownAs));
  t.true((doc.alsoKnownAs as string[]).includes(PYTHON_VECTOR.short));
});

test("peerDid4Matches short and long forms", (t) => {
  t.true(peerDid4Matches(PYTHON_VECTOR.did, PYTHON_VECTOR.short));
  t.true(peerDid4Matches(PYTHON_VECTOR.short, PYTHON_VECTOR.did));
});

test("createPeerDidWithKeys uses did:peer:4", async (t) => {
  const { did } = await createPeerDidWithKeys();
  t.true(did.startsWith("did:peer:4"));
  t.regex(did, /^did:peer:4zQm[A-HJ-NP-Za-km-z1-9]{44}:z[A-HJ-NP-Za-km-z1-9]+$/);
});

test("createPeerDid2WithKeys still uses num_algo 2", async (t) => {
  const { did } = await createPeerDid2WithKeys();
  t.true(did.startsWith("did:peer:2."));
});

test("did:peer:4 DIDComm authcrypt pack and unpack roundtrip", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rx = await root.newChannel(allowAll);
  const local = await createPeerDidWithKeys();
  const remote = await createPeerDidWithKeys();
  const now = new Date().toISOString();

  await pe.identityService.registerPeerSubscription(root.id, {
    subscriptionId: cuid(),
    peerDid: local.did,
    rxEci: rx.id,
    keys: local.keys as unknown as Record<string, unknown>,
    createdAt: now,
  });
  await pe.identityService.registerPeerSubscription(root.id, {
    subscriptionId: cuid(),
    peerDid: remote.did,
    rxEci: rx.id,
    keys: remote.keys as unknown as Record<string, unknown>,
    createdAt: now,
  });

  const message = pe.identityService.generateMessage({
    type: SKY_EVENT,
    from: local.did,
    to: [remote.did],
    body: {
      sky_version: "1.0",
      domain: "engine",
      name: "peer4-roundtrip",
      attrs: { marker: true },
    },
  });

  const jwe = await packDidCommMessage(
    root.id,
    message,
    local.did,
    remote.did,
    pe.identity,
    { resolveDid: (did) => pe.identityService.resolveDid("", did) }
  );
  const { message: unpacked } = await unpackDidCommMessage(
    root.id,
    jwe,
    pe.identity
  );

  t.is(unpacked.id, message.id);
  t.is((unpacked.body as { name?: string }).name, "peer4-roundtrip");

  await pe.pf.db.close();
});
