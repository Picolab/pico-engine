/**
 * Reject relationships where initiator targets itself.
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

function channelId(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { id?: string }).id === "string"
  ) {
    return (value as { id: string }).id;
  }
  throw new Error(`Expected channel ECI, got ${JSON.stringify(value)}`);
}

async function ensureWellKnownRx(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  eci: string
): Promise<string> {
  const wellKnownRx = await pe.pf.query({
    eci,
    rid: "io.picolabs.subscription",
    name: "wellKnown_Rx",
    args: {},
  });
  if (wellKnownRx != null) {
    return channelId(wellKnownRx);
  }

  await pe.pf.eventWait({
    eci,
    domain: "wrangler",
    name: "need_wellKnown_Rx",
    data: { attrs: {} },
    time: 0,
  });
  const channels = (await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "channels",
    args: { tags: ["wellKnown_Rx", "Tx_Rx"] },
  })) as Array<{ id: string }>;
  const id = channels[0]?.id;
  if (!id) {
    throw new Error("Root pico has no wellKnown_Rx channel");
  }
  return id;
}

test("layer2 relationship rejects target_did equal to myDid", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);
  const myDid = (await pe.identity.getWebvhDid(root.id))!;
  const krlMyDid = await pe.pf.query({
    eci: chann.id,
    rid: "io.picolabs.wrangler",
    name: "myDid",
    args: {},
  });
  t.is(krlMyDid, myDid);

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "relationship",
    data: {
      attrs: {
        layer2: true,
        target_did: myDid,
        name: "self-sub",
      },
    },
    time: 0,
  });

  const outbound = (await pe.pf.query({
    eci: chann.id,
    rid: "io.picolabs.subscription",
    name: "outbound",
    args: {},
  })) as unknown[];
  t.is(outbound.length, 0);

  await pe.pf.db.close();
});

test("legacy relationship rejects wellKnown_Tx equal to own wellKnown_Rx", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel(allowAll);
  const wellKnownTx = await ensureWellKnownRx(pe, chann.id);

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "relationship",
    data: {
      attrs: {
        wellKnown_Tx: wellKnownTx,
        name: "self-legacy",
      },
    },
    time: 0,
  });

  const outbound = (await pe.pf.query({
    eci: chann.id,
    rid: "io.picolabs.subscription",
    name: "outbound",
    args: {},
  })) as unknown[];
  t.is(outbound.length, 0);

  await pe.pf.db.close();
});

test("sendSkyIntro rejects target equal to sender did:webvh", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const myDid = (await pe.identity.getWebvhDid(root.id))!;

  await t.throwsAsync(
    () =>
      pe.identityService.sendSkyIntro(root.id, {
        subscriptionId: "sub-self-test",
        targetDid: myDid,
        name: "self",
        Tx_role: "a",
        Rx_role: "b",
      }),
    { message: /relationship with self/i }
  );

  await pe.pf.db.close();
});
