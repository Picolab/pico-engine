/**
 * Channel policy on DIDComm ingress and verified local cross-pico delivery.
 */

import test from "ava";
import * as cuid from "cuid";
import fetch from "cross-fetch";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { packDidCommMessage, resetVeramoAgentForTests } from "../src/identity/veramoDidComm";
import { SKY_EVENT, SKY_QUERY } from "../src/identity/skyProtocol";
import { IdentityError } from "../src/identity/errors";

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
  opts: { subscriptionId: string }
) {
  const rxA = await picoA.newChannel(allowAll);
  const rxB = await picoB.newChannel(allowAll);
  const peerA = await pe.identityService.createPeerDid(picoA.id);
  const peerB = await pe.identityService.createPeerDid(picoB.id);
  const webvhA = await pe.identity.getWebvhDid(picoA.id);
  const webvhB = await pe.identity.getWebvhDid(picoB.id);
  const meshA = (await pe.identity.getMeshRootId(picoA.id))!;
  const meshB = (await pe.identity.getMeshRootId(picoB.id))!;

  await pe.identityService.registerPeerSubscription(picoA.id, {
    subscriptionId: opts.subscriptionId,
    peerDid: peerA,
    remotePeerDid: peerB,
    remoteWebvhDid: webvhB!,
    rxEci: rxA.id,
    remoteMeshRootId: meshB,
    createdAt: new Date().toISOString(),
  });
  await pe.identityService.registerPeerSubscription(picoB.id, {
    subscriptionId: opts.subscriptionId,
    peerDid: peerB,
    remotePeerDid: peerA,
    remoteWebvhDid: webvhA!,
    rxEci: rxB.id,
    remoteMeshRootId: meshA,
    createdAt: new Date().toISOString(),
  });

  return { peerA, peerB, rxA, rxB, webvhA, webvhB };
}

test("DIDComm ingress rejects event denied by subscription Rx policy", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();
  const { peerA, peerB, rxB } = await setupPeerPair(pe, root, root, {
    subscriptionId: subId,
  });

  await root.putChannel(rxB.id, {
    tags: ["subscription", "tx_rx"],
    eventPolicy: {
      allow: [{ domain: "*", name: "*" }],
      deny: [{ domain: "wrangler", name: "ping" }],
    },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  const ingressEci = await pe.identity.getDidcommIngressEci(root.id);
  t.truthy(ingressEci);

  const message = pe.identityService.generateMessage({
    type: SKY_EVENT,
    from: peerA,
    to: [peerB],
    body: {
      sky_version: "1.0",
      domain: "wrangler",
      name: "ping",
      attrs: { marker: "should-deny" },
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
  t.is(res.status, 403);
  const body = (await res.json()) as { error: string };
  t.is(body.error, "policy_denied");

  await pe.pf.db.close();
});

test("DIDComm ingress rejects query denied by subscription Rx policy", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();
  const { peerA, peerB, rxB } = await setupPeerPair(pe, root, root, {
    subscriptionId: subId,
  });

  await root.putChannel(rxB.id, {
    tags: ["subscription", "tx_rx"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: {
      allow: [{ rid: "*", name: "*" }],
      deny: [{ rid: "io.picolabs.wrangler", name: "myDid" }],
    },
  });

  const ingressEci = await pe.identity.getDidcommIngressEci(root.id);
  const message = pe.identityService.generateMessage({
    type: SKY_QUERY,
    from: peerA,
    to: [peerB],
    body: {
      sky_version: "1.0",
      rid: "io.picolabs.wrangler",
      name: "myDid",
      args: {},
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
  t.is(res.status, 403);
  const body = (await res.json()) as { error: string };
  t.is(body.error, "policy_denied");

  await pe.pf.db.close();
});

test("verified local crossPicoEvent respects Rx event policy", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "policy-child" } },
    time: 0,
  });

  const child = pe.pf.getPico(root.toReadOnly().children[0]);
  const subId = cuid();
  const { rxB } = await setupPeerPair(pe, root, child, {
    subscriptionId: subId,
  });

  await child.putChannel(rxB.id, {
    tags: ["subscription", "tx_rx"],
    eventPolicy: {
      allow: [{ domain: "*", name: "*" }],
      deny: [{ domain: "wrangler", name: "ping" }],
    },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  await t.throwsAsync(
    () =>
      pe.identityService.crossPicoEvent(root.id, child.id, subId, {
        domain: "wrangler",
        name: "ping",
        attrs: {},
      }),
    { message: /channel policy/ }
  );

  await pe.pf.db.close();
});

test("establishSubscription internal Rx channel is not OAuth eligible", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();

  const result = await pe.identityService.establishSubscription(root.id, {
    subscriptionId: subId,
    remotePeerDid: "did:peer:2.placeholder",
  });

  const pico = pe.pf.getPico(root.id);
  const channel = pico.channels[result.rxEci];
  t.truthy(channel);
  t.true(channel.tags.some((tag) => tag.toLowerCase() === "subscription"));
  t.true(channel.tags.some((tag) => tag.toLowerCase() === "tx_rx"));

  const status = await pe.oauth.channelStatusAsync(result.rxEci);
  t.false(status.eligible);

  await pe.pf.db.close();
});

test("handleDidcommIngress maps policy errors to IdentityError", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();
  const { peerA, peerB, rxB } = await setupPeerPair(pe, root, root, {
    subscriptionId: subId,
  });

  await root.putChannel(rxB.id, {
    tags: ["subscription", "tx_rx"],
    eventPolicy: {
      allow: [{ domain: "*", name: "*" }],
      deny: [{ domain: "engine", name: "noop" }],
    },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  const ingressEci = await pe.identity.getDidcommIngressEci(root.id);
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

  await t.throwsAsync(
    () => pe.identityService.handleDidcommIngress(ingressEci!, jwe),
    { instanceOf: IdentityError, message: "policy_denied" }
  );

  await pe.pf.db.close();
});
