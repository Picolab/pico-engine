/**
 * Layer2 subscription cancellation for established and pending outbound subs.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { establishLayer2Sub } from "./helpers/layer2Sub";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

test("layer2 established subscription cancellation removes both sides", async (t) => {
  const ctx = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );
  const { pe, root, child, childChann, rootChann, subId } = ctx;

  t.truthy(await pe.identity.getPeerSubscription(child.id, subId));
  t.truthy(await pe.identity.getPeerSubscription(root.id, subId));

  await pe.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "subscription_cancellation",
    data: { attrs: { Id: subId } },
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

  t.is((childEstablished as unknown[]).length, 0);
  t.is((rootEstablished as unknown[]).length, 0);
  t.falsy(await pe.identity.getPeerSubscription(child.id, subId));
  t.falsy(await pe.identity.getPeerSubscription(root.id, subId));

  await pe.pf.db.close();
});

test("layer2 outbound pending cancellation clears local outbound", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rootChann = await root.newChannel({
    tags: ["allow-all"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });
  const rootWebvh = (await pe.identity.getWebvhDid(root.id))!;

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "cancel-outbound-child" } },
    time: 0,
  });

  const child = pe.pf.getPico(root.toReadOnly().children[0]);
  const childChann = await child.newChannel({
    tags: ["allow-all"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  await pe.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "subscription",
    data: {
      attrs: {
        layer2: true,
        target_did: rootWebvh,
        name: "cancel-pending",
        Tx_role: "member",
        Rx_role: "community",
      },
    },
    time: 0,
  });

  const outbound = (await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.subscription",
    name: "outbound",
    args: {},
  })) as Array<{ Id: string }>;
  t.is(outbound.length, 1);
  const subId = outbound[0].Id;

  await pe.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "outbound_cancellation",
    data: { attrs: { Id: subId } },
    time: 0,
  });

  const outboundAfter = await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.subscription",
    name: "outbound",
    args: {},
  });
  t.is((outboundAfter as unknown[]).length, 0);
  t.falsy(await pe.identity.getPeerSubscription(child.id, subId));

  const rootInbound = await pe.pf.query({
    eci: rootChann.id,
    rid: "io.picolabs.subscription",
    name: "inbound",
    args: {},
  });
  t.is((rootInbound as unknown[]).length, 0);

  await pe.pf.db.close();
});
