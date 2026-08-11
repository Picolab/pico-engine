/**
 * Helper to establish a legacy (ECI / wellKnown_Tx) subscription on one engine.
 */

import { startIsolatedEngine } from "./isolatedEngine";

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

function channelId(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && typeof (value as { id?: string }).id === "string") {
    return (value as { id: string }).id;
  }
  throw new Error(`Expected channel ECI, got ${JSON.stringify(value)}`);
}

export async function establishLegacySub(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>
) {
  const root = pe.pf.rootPicos()[0];
  const rootChann = await root.newChannel(allowAll);

  let wellKnownTx: string | undefined;
  const wellKnownRx = await pe.pf.query({
    eci: rootChann.id,
    rid: "io.picolabs.subscription",
    name: "wellKnown_Rx",
    args: {},
  });
  if (wellKnownRx != null) {
    wellKnownTx = channelId(wellKnownRx);
  }

  if (!wellKnownTx) {
    await pe.pf.eventWait({
      eci: rootChann.id,
      domain: "wrangler",
      name: "need_wellKnown_Rx",
      data: { attrs: {} },
      time: 0,
    });
    const channels = (await pe.pf.query({
      eci: rootChann.id,
      rid: "io.picolabs.wrangler",
      name: "channels",
      args: { tags: ["wellKnown_Rx", "Tx_Rx"] },
    })) as Array<{ id: string }>;
    wellKnownTx = channels[0]?.id;
  }

  if (!wellKnownTx) {
    throw new Error("Root pico has no wellKnown_Rx channel");
  }

  await pe.pf.eventWait({
    eci: rootChann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "legacy-sub-child" } },
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
        wellKnown_Tx: wellKnownTx,
        name: "legacy-shared",
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
    Tx?: string;
    Tx_did?: string;
  }>;

  const rootEstablished = (await pe.pf.query({
    eci: rootChann.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  })) as Array<{
    Id: string;
    layer2?: boolean;
    Tx?: string;
    Tx_did?: string;
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
    wellKnownTx,
  };
}
