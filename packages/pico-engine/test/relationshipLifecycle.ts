/**
 * Lifecycle API events: relationship_* aliases fire alongside subscription_*.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { toTestKrlURL } from "./helpers/toTestKrlURL";

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

const probeRid = "io.picolabs.relationship_lifecycle_test";

test("relationship lifecycle API events alias subscription lifecycle", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rootChann = await root.newChannel(allowAll);
  const rootWebvh = (await pe.identity.getWebvhDid(root.id))!;

  const probeUrl = toTestKrlURL("io.picolabs.relationship_lifecycle_test.krl");
  const probeRs = await pe.rsRegistry.load(probeUrl);

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "lifecycle-probe-child" } },
    time: 0,
  });

  const childId = root.toReadOnly().children[0];
  const child = pe.pf.getPico(childId);
  const childChann = await child.newChannel(allowAll);

  await root.install(probeRs.ruleset, { url: probeUrl });
  await child.install(probeRs.ruleset, { url: probeUrl });

  await pe.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "relationship",
    data: {
      attrs: {
        layer2: true,
        target_did: rootWebvh,
        name: "lifecycle-alias",
        Tx_role: "member",
        Rx_role: "community",
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

  let seen = (await pe.pf.query({
    eci: rootChann.id,
    rid: probeRid,
    name: "lifecycleSeen",
    args: {},
  })) as Record<string, boolean>;
  t.true(seen.inbound_pending_subscription_added);
  t.true(seen.inbound_pending_relationship_added);

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "pending_relationship_approval",
    data: { attrs: { Id: inbound[0].Id } },
    time: 0,
  });

  seen = (await pe.pf.query({
    eci: rootChann.id,
    rid: probeRid,
    name: "lifecycleSeen",
    args: {},
  })) as Record<string, boolean>;
  t.true(seen.subscription_added);
  t.true(seen.relationship_added);

  const established = (await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  })) as unknown[];
  t.is(established.length, 1);

  await pe.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "relationship_cancellation",
    data: { attrs: { Id: (established[0] as { Id: string }).Id } },
    time: 0,
  });

  seen = (await pe.pf.query({
    eci: childChann.id,
    rid: probeRid,
    name: "lifecycleSeen",
    args: {},
  })) as Record<string, boolean>;
  t.true(seen.relationship_removed);

  await pe.pf.db.close();
});
