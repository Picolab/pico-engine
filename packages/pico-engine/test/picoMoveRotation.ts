/**
 * Phase D E2E — portable move: webvh relocation + peer notification, subscription survives.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";
import { webvhScidFromStore } from "../src/identity/webvhRelocation";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

test("layer2 subscription survives did:webvh relocation and peer notification", async (t) => {
  const peA = await startIsolatedEngine({ autoCreateRootPico: true });
  const peB = await startIsolatedEngine({ autoCreateRootPico: true });

  const rootA = peA.pf.rootPicos()[0];
  const rootB = peB.pf.rootPicos()[0];
  const channA = await rootA.newChannel(allowAll);
  const channB = await rootB.newChannel(allowAll);

  const webvhB = (await peB.identity.getWebvhDid(rootB.id))!;
  const scidBefore = (await webvhScidFromStore(peB.identity, rootB.id))!;

  await peA.pf.eventWait({
    eci: channA.id,
    domain: "wrangler",
    name: "subscription",
    data: {
      attrs: {
        layer2: true,
        target_did: webvhB,
        name: "move-rotation-sub",
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
  })) as Array<{ Id: string }>;
  const subId = inboundB[0].Id;

  await peB.pf.eventWait({
    eci: channB.id,
    domain: "wrangler",
    name: "pending_subscription_approval",
    data: { attrs: { Id: subId } },
    time: 0,
  });

  const beforeQuery = await peA.identityService.crossPicoQuery(
    rootA.id,
    undefined,
    subId,
    { rid: "io.picolabs.wrangler", name: "id", args: {} }
  );
  t.is(beforeQuery, rootB.id);

  const moveResult = await peB.identityService.completePortableMove(rootB.id, {
    renewIngress: true,
  });
  t.is(moveResult.scid, scidBefore);
  t.is(moveResult.peersNotified, 1);

  const storedA = await peA.identity.getPeerSubscription(rootA.id, subId);
  t.is(storedA?.remoteWebvhDid, moveResult.newDid);
  t.is(storedA?.remoteDidcommEndpoint, moveResult.didcommEndpoint);

  const establishedA = (await peA.pf.query({
    eci: channA.id,
    rid: "io.picolabs.subscription",
    name: "established",
    args: {},
  })) as Array<{ Id: string; Tx_host?: string }>;
  t.is(establishedA[0].Tx_host, peB.base_url);

  const afterQuery = await peA.identityService.crossPicoQuery(
    rootA.id,
    undefined,
    subId,
    { rid: "io.picolabs.wrangler", name: "id", args: {} }
  );
  t.is(afterQuery, rootB.id);

  const eventResult = await peA.identityService.crossPicoEvent(
    rootA.id,
    undefined,
    subId,
    { domain: "wrangler", name: "ping", attrs: { afterMove: true } }
  );
  t.truthy(eventResult.eid);

  const pending = (await peA.identity.getPendingRotations(rootA.id))!;
  t.is(pending.length, 1);
  t.is(pending[0].priorDid, moveResult.priorDid);
  t.is(pending[0].newDid, moveResult.newDid);
  t.is(pending[0].subscriptionId, subId);

  await peA.pf.db.close();
  await peB.pf.db.close();
});
