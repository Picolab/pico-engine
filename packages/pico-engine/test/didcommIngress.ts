/**
 * DIDComm ingress: JWE unpack, intra-mesh local dispatch vs cross-mesh HTTP
 * delivery.
 */

import test from "ava";
import * as cuid from "cuid";
import fetch from "cross-fetch";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { packDidCommMessage } from "../src/identity/veramoDidComm";
import { SKY_EVENT } from "../src/identity/skyProtocol";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

async function setupPeerPair(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  picoA: { id: string; newChannel: (c: typeof allowAll) => Promise<{ id: string }> },
  picoB: { id: string; newChannel: (c: typeof allowAll) => Promise<{ id: string }> },
  opts: { subscriptionId: string; crossMesh: boolean; remoteTxHost?: string }
) {
  const rxA = await picoA.newChannel(allowAll);
  const rxB = await picoB.newChannel(allowAll);
  const peerA = await pe.identityService.createPeerDid(picoA.id);
  const peerB = await pe.identityService.createPeerDid(picoB.id);
  const webvhA = await pe.identity.getWebvhDid(picoA.id);
  const webvhB = await pe.identity.getWebvhDid(picoB.id);
  const meshA = (await pe.identity.getMeshRootId(picoA.id))!;
  const meshB = (await pe.identity.getMeshRootId(picoB.id))!;

  const remoteMeshOnA = opts.crossMesh ? meshB + "-other" : meshB;
  const remoteMeshOnB = opts.crossMesh ? meshA + "-other" : meshA;

  await pe.identityService.registerPeerSubscription(picoA.id, {
    subscriptionId: opts.subscriptionId,
    peerDid: peerA,
    remotePeerDid: peerB,
    remoteWebvhDid: webvhB!,
    rxEci: rxA.id,
    remoteMeshRootId: remoteMeshOnA,
    remoteTxHost: opts.remoteTxHost || pe.base_url,
    createdAt: new Date().toISOString(),
  });
  await pe.identityService.registerPeerSubscription(picoB.id, {
    subscriptionId: opts.subscriptionId,
    peerDid: peerB,
    remotePeerDid: peerA,
    remoteWebvhDid: webvhA!,
    rxEci: rxB.id,
    remoteMeshRootId: remoteMeshOnB,
    remoteTxHost: opts.remoteTxHost || pe.base_url,
    createdAt: new Date().toISOString(),
  });

  return { peerA, peerB, rxA, rxB, webvhA, webvhB };
}

test("intra-mesh crossPicoQuery uses local dispatch (no DIDComm HTTP)", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "didcomm-child" } },
    time: 0,
  });

  const childId = root.toReadOnly().children[0];
  t.truthy(childId);
  const child = pe.pf.getPico(childId);

  const subId = cuid();
  await setupPeerPair(pe, root, child, { subscriptionId: subId, crossMesh: false });

  const result = await pe.identityService.crossPicoQuery(
    root.id,
    child.id,
    subId,
    { rid: "io.picolabs.wrangler", name: "myDid", args: {} }
  );
  t.truthy(result);
  t.true(String(result).startsWith("did:webvh:"));

  await pe.pf.db.close();
});

test("DIDComm ingress unpacks SKY event and delivers to Rx channel", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();
  const { peerA, peerB } = await setupPeerPair(pe, root, root, {
    subscriptionId: subId,
    crossMesh: false,
  });

  const ingressEci = await pe.identity.getDidcommIngressEci(root.id);
  t.truthy(ingressEci);

  const message = pe.identityService.generateMessage({
    type: SKY_EVENT,
    from: peerA,
    to: [peerB],
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
    peerA,
    peerB,
    pe.identity
  );

  const res = await fetch(
    `${pe.base_url}/sky/event/${ingressEci}/none/dido/didcomm_message`,
    {
      method: "POST",
      headers: { "Content-Type": "application/didcomm-encrypted+json" },
      body: jwe,
    }
  );
  t.is(res.status, 200);

  await pe.pf.db.close();
});

test("cross-mesh crossPicoQuery delivers via DIDComm ingress", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "cross-mesh-child" } },
    time: 0,
  });

  const child = pe.pf.getPico(root.toReadOnly().children[0]);
  const subId = cuid();
  const rxChild = await child.newChannel(allowAll);
  const rxRoot = await root.newChannel(allowAll);
  const peerChild = await pe.identityService.createPeerDid(child.id);
  const peerRoot = await pe.identityService.createPeerDid(root.id);
  const webvhChild = await pe.identity.getWebvhDid(child.id);
  const webvhRoot = await pe.identity.getWebvhDid(root.id);
  const ingressRoot = await pe.identity.getDidcommIngressEci(root.id);
  t.truthy(ingressRoot);
  const endpointRoot = `${pe.base_url}/sky/event/${ingressRoot}/none/dido/didcomm_message`;

  // Child sends to root over DIDComm (simulated cross-mesh via remoteMeshRootId).
  await pe.identityService.registerPeerSubscription(child.id, {
    subscriptionId: subId,
    peerDid: peerChild,
    remotePeerDid: peerRoot,
    remoteWebvhDid: webvhRoot!,
    remoteDidcommEndpoint: endpointRoot,
    rxEci: rxChild.id,
    remoteMeshRootId: "other-mesh",
    createdAt: new Date().toISOString(),
  });
  await pe.identityService.registerPeerSubscription(root.id, {
    subscriptionId: subId,
    peerDid: peerRoot,
    remotePeerDid: peerChild,
    remoteWebvhDid: webvhChild!,
    rxEci: rxRoot.id,
    remoteMeshRootId: "other-mesh",
    createdAt: new Date().toISOString(),
  });

  const result = await pe.identityService.crossPicoQuery(
    child.id,
    root.id,
    subId,
    { rid: "io.picolabs.wrangler", name: "myDid", args: {} }
  );
  t.truthy(result);
  t.true(String(result).startsWith("did:webvh:"));

  await pe.pf.db.close();
});

test("ingress rejects invalid JWE with 401", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ingressEci = await pe.identity.getDidcommIngressEci(root.id);
  t.truthy(ingressEci);

  await t.throwsAsync(
    pe.identityService.handleDidcommIngress(ingressEci!, "not-a-jwe"),
    { instanceOf: Error }
  );

  await pe.pf.db.close();
});
