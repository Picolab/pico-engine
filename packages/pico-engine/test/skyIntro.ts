/**
 * SKY intro protocol: body parsing, ingress handling, and same-engine handshake.
 */

import test from "ava";
import * as cuid from "cuid";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";
import {
  parseSkyIntroBody,
  parseSkyIntroResponseBody,
  SKY_INTRO,
} from "../src/identity/skyProtocol";
import {
  handleSkyIntroAtIngress,
  sendSkyIntro,
} from "../src/identity/skyIntro";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

test("parseSkyIntroBody validates required fields", (t) => {
  const intro = parseSkyIntroBody({
    sky_version: "1.0",
    name: "test-sub",
    Tx_role: "member",
    Rx_role: "community",
    peer_did_long: "did:peer:2.Ez6LSbysY2xFMRpGMHoCpTfGeZKZc5vdaJYQmMRLs75P5W7",
  });
  t.is(intro.name, "test-sub");
  t.is(intro.Tx_role, "member");
});

test("parseSkyIntroBody rejects invalid body", (t) => {
  t.throws(() => parseSkyIntroBody({ name: "x" }));
});

test("parseSkyIntroResponseBody accepts and rejects", (t) => {
  const accepted = parseSkyIntroResponseBody({
    sky_version: "1.0",
    status: "accepted",
    peer_did_long: "did:peer:2.example",
  });
  t.is(accepted.status, "accepted");

  const rejected = parseSkyIntroResponseBody({
    sky_version: "1.0",
    status: "rejected",
    reason: "auto_accept_denied",
  });
  t.is(rejected.reason, "auto_accept_denied");
});

test("handleSkyIntroAtIngress raises sky_intro when publicIntro enabled", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();
  const senderPeer = await pe.identityService.createPeerDid(root.id);

  const deps = {
    store: pe.identity,
    pf: pe.pf,
    getBaseUrl: () => pe.base_url,
    identity: pe.identityService,
  };

  const result = await handleSkyIntroAtIngress(deps, root.id, {
    id: cuid(),
    typ: "application/didcomm-plain+json",
    type: SKY_INTRO,
    from: senderPeer,
    to: [await pe.identity.getWebvhDid(root.id)!],
    body: {
      sky_version: "1.0",
      name: "intro-test",
      Tx_role: "member",
      Rx_role: "community",
      peer_did_long: senderPeer,
      subscription_id: subId,
    },
    created_time: Math.floor(Date.now() / 1000),
  });

  t.is(result.status, "intro_delivered");
  t.is(result.subscriptionId, subId);

  const stored = await pe.identity.getPeerSubscription(root.id, subId);
  t.truthy(stored);
  t.is(stored!.remotePeerDid, senderPeer);

  await pe.pf.db.close();
});

test("handleSkyIntroAtIngress rejects when publicIntro disabled", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "intro-child" } },
    time: 0,
  });

  const child = pe.pf.getPico(root.toReadOnly().children[0]);
  t.false(await pe.identity.getPublicIntro(child.id));

  const deps = {
    store: pe.identity,
    pf: pe.pf,
    getBaseUrl: () => pe.base_url,
    identity: pe.identityService,
  };

  await t.throwsAsync(
    handleSkyIntroAtIngress(deps, child.id, {
      id: cuid(),
      typ: "application/didcomm-plain+json",
      type: SKY_INTRO,
      from: "did:peer:2.sender",
      body: {
        sky_version: "1.0",
        name: "x",
        Tx_role: "a",
        Rx_role: "b",
        peer_did_long: "did:peer:2.sender",
      },
      created_time: Math.floor(Date.now() / 1000),
    }),
    { message: /public_intro_disabled/ }
  );

  await pe.pf.db.close();
});

test("layer2 intro handshake establishes subscription between two picos", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rootChann = await root.newChannel(allowAll);
  const rootWebvh = (await pe.identity.getWebvhDid(root.id))!;

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "layer2-peer" } },
    time: 0,
  });

  const childId = root.toReadOnly().children[0];
  const child = pe.pf.getPico(childId);
  const childChann = await child.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "subscription",
    data: {
      attrs: {
        layer2: true,
        target_did: rootWebvh,
        name: "layer2-handshake",
        Tx_role: "member",
        Rx_role: "community",
        channel_type: "Tx_Rx",
      },
    },
    time: 0,
  });

  const rootInbound = await pe.pf.query({
    eci: rootChann.id,
    rid: "io.picolabs.subscription",
    name: "inbound",
    args: {},
  });
  t.true(Array.isArray(rootInbound));
  t.is((rootInbound as unknown[]).length, 1);

  const inboundId = (rootInbound as Array<{ Id: string }>)[0].Id;

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "pending_subscription_approval",
    data: { attrs: { Id: inboundId } },
    time: 0,
  });

  const childEstablished = await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  });
  const rootEstablished = await pe.pf.query({
    eci: rootChann.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  });

  t.is((childEstablished as unknown[]).length, 1);
  t.is((rootEstablished as unknown[]).length, 1);

  const childBus = (childEstablished as Array<{ Id: string; Tx_did?: string }>)[0];
  const rootBus = (rootEstablished as Array<{ Id: string; Tx_did?: string }>)[0];

  t.truthy(childBus.Tx_did);
  t.truthy(rootBus.Tx_did);
  t.is(childBus.Id, rootBus.Id);

  const childSub = await pe.identity.getPeerSubscription(child.id, childBus.Id);
  const rootSub = await pe.identity.getPeerSubscription(root.id, rootBus.Id);
  t.truthy(childSub?.remotePeerDid);
  t.truthy(rootSub?.remotePeerDid);
  t.is(childSub!.remotePeerDid, rootSub!.peerDid);
  t.is(rootSub!.remotePeerDid, childSub!.peerDid);

  await pe.pf.db.close();
});

test("sendSkyIntro uses local dispatch for same-engine target", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);
  const subId = cuid();
  const rootWebvh = (await pe.identity.getWebvhDid(root.id))!;

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "intro-sender" } },
    time: 0,
  });

  const child = pe.pf.getPico(root.toReadOnly().children[0]);

  const deps = {
    store: pe.identity,
    pf: pe.pf,
    getBaseUrl: () => pe.base_url,
    identity: pe.identityService,
  };

  const { peerDid } = await sendSkyIntro(deps, child.id, {
    subscriptionId: subId,
    targetDid: rootWebvh,
    name: "local-intro",
    Tx_role: "member",
    Rx_role: "community",
  });

  t.true(peerDid.startsWith("did:peer:"));

  const inbound = await pe.pf.query({
    eci: chann.id,
    rid: "io.picolabs.subscription",
    name: "inbound",
    args: {},
  });
  t.is((inbound as unknown[]).length, 1);

  await pe.pf.db.close();
});
