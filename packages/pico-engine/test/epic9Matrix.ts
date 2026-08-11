/**
 * Epic 9 — Layer 2 (1.6) release regression matrix.
 *
 * Fills gaps beyond sibling suites (webvh.ts, didcommIngress.ts,
 * crossEngineSubscription.ts, layer2Routing.ts, skyIntro.ts,
 * establishSubscription.ts, oauth.ts, auth.ts).
 */

import test from "ava";
import * as cuid from "cuid";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { establishLayer2Sub } from "./helpers/layer2Sub";
import { establishLegacySub } from "./helpers/legacySub";
import {
  createPeerDidWithKeys,
  packDidCommMessage,
  resetVeramoAgentForTests,
  unpackDidCommMessage,
} from "../src/identity/veramoDidComm";
import { SKY_EVENT } from "../src/identity/skyProtocol";
import { resolveLocalWebvhLog } from "../src/identity/webvh";
import { handleSkyIntroAtIngress } from "../src/identity/skyIntro";
import { SKY_INTRO } from "../src/identity/skyProtocol";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

test("legacy ECI subscription forms and queryOnSub uses Tx channel", async (t) => {
  const { pe, root, childChann, subId, childBus } = await establishLegacySub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );

  t.not(childBus.layer2, true);
  t.truthy(childBus.Tx);
  t.falsy(childBus.Tx_did);

  const rootId = await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.subscription",
    name: "queryOnSub",
    args: {
      subId,
      rid: "io.picolabs.wrangler",
      name: "id",
      args: {},
    },
  });

  t.is(rootId, root.id);

  await pe.pf.db.close();
});

test("parent picoQuery to child via family channel is unchanged", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "family-regression-child" } },
    time: 0,
  });

  const childFamilyEci = root.toReadOnly().children[0];
  const child = pe.pf.getPico(childFamilyEci);

  const result = await pe.pf.query(
    {
      eci: chann.id,
      rid: "io.picolabs.wrangler",
      name: "picoQuery",
      args: {
        eci: childFamilyEci,
        mod: "io.picolabs.wrangler",
        func: "id",
        params: {},
      },
    },
    root.id
  );

  t.is(result, child.id);

  await pe.pf.db.close();
});

test("public intro on enabled non-root pico accepts SKY intro", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rootChann = await root.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "intro-enabled-child" } },
    time: 0,
  });

  const child = pe.pf.getPico(root.toReadOnly().children[0]);
  const childChann = await child.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "set_public_intro",
    data: { attrs: { enabled: true } },
    time: 0,
  });
  t.true(await pe.identity.getPublicIntro(child.id));

  const senderPeer = await pe.identityService.createPeerDid(root.id);
  const childWebvh = (await pe.identity.getWebvhDid(child.id))!;
  const subId = cuid();

  const deps = {
    store: pe.identity,
    pf: pe.pf,
    getBaseUrl: () => pe.base_url,
    identity: pe.identityService,
  };

  await handleSkyIntroAtIngress(deps, child.id, {
    id: cuid(),
    typ: "application/didcomm-plain+json",
    type: SKY_INTRO,
    from: senderPeer,
    to: [childWebvh],
    body: {
      sky_version: "1.0",
      name: "tag-registry-intro",
      Tx_role: "member",
      Rx_role: "community",
      peer_did_long: senderPeer,
      subscription_id: subId,
    },
    created_time: Math.floor(Date.now() / 1000),
  });

  const inbound = (await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.subscription",
    name: "inbound",
    args: {},
  })) as Array<{ Id: string }>;

  t.true(inbound.some((row) => row.Id === subId));

  await pe.pf.db.close();
});

test("tampered did:webvh log fails SCID verification", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const log = [...(await pe.identity.getWebvhLog(root.id))!];
  const entry = log[0] as Record<string, unknown>;
  const state = { ...(entry.state as Record<string, unknown>) };
  state.id = "did:webvh:tampered-scid:example.com";
  const tampered = [{ ...entry, state }];

  await t.throwsAsync(resolveLocalWebvhLog(tampered as any));

  await pe.pf.db.close();
});

test("DIDComm authcrypt pack and unpack roundtrip", async (t) => {
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
      name: "epic9-roundtrip",
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
  t.is((unpacked.body as { name?: string }).name, "epic9-roundtrip");

  await pe.pf.db.close();
});

test("did:peer uses num_algo 2 (did:peer:4 deferred)", async (t) => {
  const { did } = await createPeerDidWithKeys();
  t.true(did.startsWith("did:peer:2."));
  t.false(did.startsWith("did:peer:4"));
});

test("layer2 subscription E2E: formation, query, and event", async (t) => {
  const ctx = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );

  t.true(ctx.childBus.layer2 === true);

  const rootDid = await ctx.pe.pf.query({
    eci: ctx.childChann.id,
    rid: "io.picolabs.subscription",
    name: "queryOnSub",
    args: {
      subId: ctx.subId,
      rid: "io.picolabs.wrangler",
      name: "myDid",
      args: {},
    },
  });
  t.is(rootDid, await ctx.pe.identity.getWebvhDid(ctx.root.id));

  await ctx.pe.pf.eventWait({
    eci: ctx.childChann.id,
    domain: "wrangler",
    name: "send_event_on_subs",
    data: {
      attrs: {
        subID: ctx.subId,
        domain: "wrangler",
        type: "ping",
        attrs: { epic9: true },
      },
    },
    time: 0,
  });

  await ctx.pe.pf.db.close();
});

test("subscription and family channels are not OAuth eligible", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "oauth-regression-child" } },
    time: 0,
  });

  const child = pe.pf.getPico(root.toReadOnly().children[0]);
  const family = Object.values(child.channels).find(
    (c) => c.toReadOnly().familyChannelPicoID
  );
  t.truthy(family);
  t.false((await pe.oauth.channelStatusAsync(family!.id)).eligible);

  await pe.pf.db.close();
});
