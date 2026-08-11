/**
 * Helper to establish a layer2 subscription between root and child in one
 * engine.
 */

import { startIsolatedEngine } from "./isolatedEngine";

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

export async function establishLayer2Sub(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>
) {
  const root = pe.pf.rootPicos()[0];
  const rootChann = await root.newChannel(allowAll);
  const rootWebvh = (await pe.identity.getWebvhDid(root.id))!;

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "layer2-shared-child" } },
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
        name: "layer2-shared",
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
  const subId = inbound[0].Id;

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "pending_subscription_approval",
    data: { attrs: { Id: subId } },
    time: 0,
  });

  const childEstablished = (await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  })) as Array<{
    Id: string;
    layer2?: boolean;
    Tx_did?: string;
    Rx_did?: string;
    Tx?: string;
  }>;

  const rootEstablished = (await pe.pf.query({
    eci: rootChann.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  })) as Array<{
    Id: string;
    layer2?: boolean;
    Tx_did?: string;
    Rx_did?: string;
  }>;

  return {
    pe,
    root,
    child,
    rootChann,
    childChann,
    subId,
    childBus: childEstablished[0],
    rootBus: rootEstablished[0],
  };
}
