/**
 * Layer2 crossPico routing: queryOnSub, send_event_on_subs, and recipient
 * resolution.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { establishLayer2Sub } from "./helpers/layer2Sub";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

test("queryOnSub reaches remote pico over layer2 subscription", async (t) => {
  const { pe, root, childChann, subId, childBus } = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );

  t.true(childBus.layer2 === true);
  t.truthy(childBus.Tx_did);
  t.truthy(childBus.Rx_did);
  t.falsy(childBus.Tx);

  const rootDid = await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.subscription",
    name: "queryOnSub",
    args: {
      subId,
      rid: "io.picolabs.wrangler",
      name: "myDid",
      args: {},
    },
  });

  t.true(String(rootDid).startsWith("did:webvh:"));
  t.is(rootDid, await pe.identity.getWebvhDid(root.id));

  await pe.pf.db.close();
});

test("send_event_on_subs delivers over layer2 without Tx ECI", async (t) => {
  const { pe, childChann, subId, childBus } = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );

  t.true(childBus.layer2 === true);
  t.falsy(childBus.Tx);

  await pe.pf.eventWait({
    eci: childChann.id,
    domain: "wrangler",
    name: "send_event_on_subs",
    data: {
      attrs: {
        subID: subId,
        domain: "wrangler",
        type: "ping",
        attrs: { marker: "layer2-event" },
      },
    },
    time: 0,
  });

  await pe.pf.db.close();
});

test("crossPicoQuery resolves recipient from peer subscription record", async (t) => {
  const { pe, root, child, subId } = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );

  const result = await pe.identityService.crossPicoQuery(
    child.id,
    undefined,
    subId,
    { rid: "io.picolabs.wrangler", name: "id", args: {} }
  );

  t.is(result, root.id);

  await pe.pf.db.close();
});
