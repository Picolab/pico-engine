/**
 * Wrangler picoQuery and event:send routing over layer2 subscriptions.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { establishLayer2Sub } from "./helpers/layer2Sub";
import { toTestKrlURL } from "./helpers/toTestKrlURL";
import { cleanDirectives } from "./helpers/cleanDirectives";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

test("wrangler picoQuery routes via layer2 subscription to peer DID", async (t) => {
  const { pe, root, childChann, childBus } = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );

  t.truthy(childBus.Tx_did);

  const result = await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.wrangler",
    name: "picoQuery",
    args: {
      eci: childBus.Tx_did,
      mod: "io.picolabs.wrangler",
      func: "myDid",
      params: {},
    },
  });

  t.is(result, await pe.identity.getWebvhDid(root.id));

  await pe.pf.db.close();
});

test("wrangler picoQuery routes via layer2 subscription to webvh DID", async (t) => {
  const { pe, root, child, childChann, subId } = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );
  const rootWebvh = (await pe.identity.getWebvhDid(root.id))!;

  const stored = await pe.identity.getPeerSubscription(child.id, subId);
  t.is(stored!.remoteWebvhDid, rootWebvh);

  const result = await pe.pf.query({
    eci: childChann.id,
    rid: "io.picolabs.wrangler",
    name: "picoQuery",
    args: {
      eci: rootWebvh,
      mod: "io.picolabs.wrangler",
      func: "id",
      params: {},
    },
  });

  t.is(result, root.id);

  await pe.pf.db.close();
});

test("event:send with did routes over layer2 subscription", async (t) => {
  const { pe, child, childChann, childBus } = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );

  const url = toTestKrlURL("io.picolabs.layer2_event_send_test.krl");
  const rs = await pe.rsRegistry.load(url);
  await child.install(rs.ruleset, { url });

  const resp = await pe.pf.eventWait({
    eci: childChann.id,
    domain: "layer2_event_send_test",
    name: "send",
    data: {
      attrs: {
        did: childBus.Tx_did,
        domain: "wrangler",
        type: "ping",
        attrs: { marker: "event-send-did-test" },
      },
    },
    time: 0,
  });

  const sent = cleanDirectives(resp.responses).filter((d) => d.name === "sent");
  t.is(sent.length, 1);
  t.is(sent[0].options.did, childBus.Tx_did);

  await pe.pf.db.close();
});

test("event:send with sub routes layer2 subscription without Tx ECI", async (t) => {
  const { pe, child, childChann, childBus } = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );

  t.falsy(childBus.Tx);
  t.truthy(childBus.Tx_did);

  const url = toTestKrlURL("io.picolabs.layer2_event_send_test.krl");
  const rs = await pe.rsRegistry.load(url);
  await child.install(rs.ruleset, { url });

  const resp = await pe.pf.eventWait({
    eci: childChann.id,
    domain: "layer2_event_send_test",
    name: "send_sub",
    data: {
      attrs: {
        sub: childBus,
        domain: "wrangler",
        type: "ping",
        attrs: { marker: "event-send-sub-test" },
      },
    },
    time: 0,
  });

  const sent = cleanDirectives(resp.responses).filter((d) => d.name === "sent_sub");
  t.is(sent.length, 1);
  t.is(sent[0].options.did, childBus.Tx_did);

  await pe.pf.db.close();
});

test("identity findSubscriptionIdForDid matches peer and webvh", async (t) => {
  const { pe, root, child, childBus, subId } = await establishLayer2Sub(
    await startIsolatedEngine({ autoCreateRootPico: true })
  );
  const rootWebvh = (await pe.identity.getWebvhDid(root.id))!;
  const stored = await pe.identity.getPeerSubscription(child.id, subId);
  t.truthy(stored?.remotePeerDid);

  t.is(
    await pe.identity.findSubscriptionIdForDid(child.id, stored!.remotePeerDid!),
    subId
  );
  t.is(await pe.identity.findSubscriptionIdForDid(child.id, rootWebvh), subId);
  t.is(childBus.Tx_did, stored!.remotePeerDid);

  await pe.pf.db.close();
});
