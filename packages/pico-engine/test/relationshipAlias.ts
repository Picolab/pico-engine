/**
 * wrangler:relationship event aliases (same behavior as wrangler:subscription).
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

test("wrangler:relationship with layer2 establishes like subscription", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rootChann = await root.newChannel(allowAll);
  const rootWebvh = (await pe.identity.getWebvhDid(root.id))!;

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "relationship-alias-child" } },
    time: 0,
  });

  const childId = root.toReadOnly().children[0];
  const child = pe.pf.getPico(childId);
  const childChann = await child.newChannel(allowAll);

  await pe.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "relationship",
    data: {
      attrs: {
        layer2: true,
        target_did: rootWebvh,
        name: "relationship-alias",
        Tx_role: "member",
        Rx_role: "community",
        channel_type: "Tx_Rx",
      },
    },
    time: 0,
  });

  const inbound = (await pe.pf.query({
    eci: rootChann.id,
    rid: "io.picolabs.subscription",
    name: "inbound",
    args: {},
  })) as Array<{ Id: string }>;
  t.is(inbound.length, 1);

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "pending_relationship_approval",
    data: { attrs: { Id: inbound[0].Id } },
    time: 0,
  });

  const childEstablished = (await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  })) as Array<{ layer2?: boolean; Tx_did?: string }>;

  t.is(childEstablished.length, 1);
  t.true(childEstablished[0].layer2 === true);
  t.truthy(childEstablished[0].Tx_did);
});
