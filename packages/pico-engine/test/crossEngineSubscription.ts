/**
 * Layer2 subscription across two isolated engines: intro, approval, query, and
 * event.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

test("layer2 subscription forms across two engines and query works", async (t) => {
  const peA = await startIsolatedEngine({ autoCreateRootPico: true });
  const peB = await startIsolatedEngine({ autoCreateRootPico: true });

  const rootA = peA.pf.rootPicos()[0];
  const rootB = peB.pf.rootPicos()[0];
  const channA = await rootA.newChannel(allowAll);
  const channB = await rootB.newChannel(allowAll);

  const webvhA = (await peA.identity.getWebvhDid(rootA.id))!;
  const webvhB = (await peB.identity.getWebvhDid(rootB.id))!;
  t.truthy(webvhA);
  t.truthy(webvhB);

  t.true(await peB.identity.getPublicIntro(rootB.id));

  await peA.pf.eventWait({
    eci: channA.id,
    domain: "wrangler",
    name: "subscription",
    data: {
      attrs: {
        layer2: true,
        target_did: webvhB,
        name: "cross-engine-sub",
        Tx_role: "member",
        Rx_role: "community",
        channel_type: "Tx_Rx",
      },
    },
    time: 0,
  });

  const inboundB = (await peB.pf.query({
    eci: channB.id,
    rid: "io.picolabs.subscription",
    name: "inbound",
    args: {},
  })) as Array<{ Id: string; layer2?: boolean; Tx_did?: string }>;

  t.is(inboundB.length, 1);
  t.true(inboundB[0].layer2 === true);
  t.truthy(inboundB[0].Tx_did);
  const subId = inboundB[0].Id;

  await peB.pf.eventWait({
    eci: channB.id,
    domain: "wrangler",
    name: "pending_subscription_approval",
    data: { attrs: { Id: subId } },
    time: 0,
  });

  const establishedA = (await peA.pf.query({
    eci: channA.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  })) as Array<{
    Id: string;
    layer2?: boolean;
    Tx_did?: string;
    Rx_did?: string;
    Tx_host?: string;
    Tx?: string;
  }>;

  const establishedB = (await peB.pf.query({
    eci: channB.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  })) as Array<{
    Id: string;
    layer2?: boolean;
    Tx_did?: string;
    Rx_did?: string;
  }>;

  t.is(establishedA.length, 1);
  t.is(establishedB.length, 1);
  t.is(establishedA[0].Id, subId);
  t.true(establishedA[0].layer2 === true);
  t.falsy(establishedA[0].Tx);
  t.truthy(establishedA[0].Tx_did);
  t.truthy(establishedA[0].Rx_did);
  t.is(establishedA[0].Tx_host, peB.base_url);

  const storedA = await peA.identity.getPeerSubscription(rootA.id, subId);
  t.truthy(storedA?.remoteWebvhDid);
  t.is(storedA!.remoteWebvhDid, webvhB);

  const meshA = (await peA.identity.getMeshRootId(rootA.id))!;
  const meshB = (await peB.identity.getMeshRootId(rootB.id))!;
  t.not(meshA, meshB);

  const result = await peA.identityService.crossPicoQuery(
    rootA.id,
    undefined,
    subId,
    { rid: "io.picolabs.wrangler", name: "id", args: {} }
  );
  t.is(result, rootB.id);

  const eventResult = await peA.identityService.crossPicoEvent(
    rootA.id,
    undefined,
    subId,
    { domain: "wrangler", name: "ping", attrs: { crossEngine: true } }
  );
  t.truthy(eventResult.eid);

  await peA.pf.db.close();
  await peB.pf.db.close();
});

test("layer2 subscription from child on engine A to root on engine B", async (t) => {
  const peA = await startIsolatedEngine({ autoCreateRootPico: true });
  const peB = await startIsolatedEngine({ autoCreateRootPico: true });

  const rootA = peA.pf.rootPicos()[0];
  const rootB = peB.pf.rootPicos()[0];
  const rootAChann = await rootA.newChannel(allowAll);

  await peA.pf.eventWait({
    eci: rootAChann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "cross-engine-child" } },
    time: 0,
  });

  const childId = rootA.toReadOnly().children[0];
  const childA = peA.pf.getPico(childId);
  const childChann = await childA.newChannel(allowAll);
  const rootBChann = await rootB.newChannel(allowAll);

  const webvhB = (await peB.identity.getWebvhDid(rootB.id))!;
  t.truthy(webvhB);
  t.true(await peB.identity.getPublicIntro(rootB.id));

  await peA.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "subscription",
    data: {
      attrs: {
        layer2: true,
        target_did: webvhB,
        name: "child-to-root-cross-engine",
        Tx_role: "member",
        Rx_role: "community",
        channel_type: "Tx_Rx",
      },
    },
    time: 0,
  });

  const inboundB = (await peB.pf.query({
    eci: rootBChann.id,
    rid: "io.picolabs.subscription",
    name: "inbound",
    args: {},
  })) as Array<{ Id: string; layer2?: boolean; Tx_did?: string }>;

  t.is(inboundB.length, 1, "target root should show inbound pending");
  t.true(inboundB[0].layer2 === true);
  t.truthy(inboundB[0].Tx_did);

  await peA.pf.db.close();
  await peB.pf.db.close();
});
