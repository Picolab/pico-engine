/**
 * establishSubscription: peer DID, Rx channel, key persistence, and KRL
 * integration.
 */

import test from "ava";
import * as cuid from "cuid";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { peerKeysFromRecord } from "../src/identity/peerDid";
import {
  packDidCommMessage,
  resetVeramoAgentForTests,
  createPeerDidWithKeys,
} from "../src/identity/veramoDidComm";
import { SKY_EVENT } from "../src/identity/skyProtocol";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

test("establishSubscription creates peer DID, Rx channel, and persisted keys", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();

  const result = await pe.identityService.establishSubscription(root.id, {
    subscriptionId: subId,
    remotePeerDid: "did:peer:2.placeholder",
  });

  t.true(result.peerDid.startsWith("did:peer:"));
  t.truthy(result.rxEci);

  const stored = await pe.identity.getPeerSubscription(root.id, subId);
  t.truthy(stored);
  t.is(stored!.peerDid, result.peerDid);
  t.is(stored!.rxEci, result.rxEci);
  const keys = peerKeysFromRecord(stored!.keys);
  t.truthy(keys);
  t.is(keys!.length, 2);

  await pe.pf.db.close();
});

test("establishSubscription is idempotent", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();

  const first = await pe.identityService.establishSubscription(root.id, {
    subscriptionId: subId,
  });
  const second = await pe.identityService.establishSubscription(root.id, {
    subscriptionId: subId,
  });

  t.is(first.peerDid, second.peerDid);
  t.is(first.rxEci, second.rxEci);

  await pe.pf.db.close();
});

test("persisted peer keys survive Veramo agent reset", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();

  const local = await pe.identityService.establishSubscription(root.id, {
    subscriptionId: subId,
  });
  const remote = await createPeerDidWithKeys();

  resetVeramoAgentForTests();

  const message = pe.identityService.generateMessage({
    type: SKY_EVENT,
    from: local.peerDid,
    to: [remote.did],
    body: {
      sky_version: "1.0",
      domain: "engine",
      name: "noop",
      attrs: {},
    },
  });

  const jwe = await packDidCommMessage(
    root.id,
    message,
    local.peerDid,
    remote.did,
    pe.identity
  );
  t.true(jwe.includes("ciphertext"));

  await pe.pf.db.close();
});

test("wrangler establishSubscription via KRL query", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);
  const subId = cuid();

  const result = await pe.pf.query({
    eci: chann.id,
    rid: "io.picolabs.wrangler",
    name: "establishSubscription",
    args: {
      bus: {
        Id: subId,
        layer2: true,
        Tx_did: "did:peer:2.remote",
      },
    },
  });

  t.truthy(result);
  t.true(String((result as { peerDid: string }).peerDid).startsWith("did:peer:"));

  const stored = await pe.identity.getPeerSubscription(root.id, subId);
  t.is(stored!.remotePeerDid, "did:peer:2.remote");

  await pe.pf.db.close();
});

test("subscription_added with layer2 triggers establish via ruleset", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);
  const subId = cuid();

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "subscription_added",
    data: {
      attrs: {
        bus: {
          Id: subId,
          layer2: true,
          channel_name: "layer2-sub",
          channel_type: "Tx_Rx",
        },
      },
    },
    time: 0,
  });

  const stored = await pe.identity.getPeerSubscription(root.id, subId);
  t.truthy(stored);
  t.true(stored!.peerDid.startsWith("did:peer:"));
  t.truthy(stored!.rxEci);

  await pe.pf.db.close();
});
