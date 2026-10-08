/**
 * Pre-export Layer 2 upgrade for portable move.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { allowAll } from "./helpers/portableMoveDemo";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";
import { prepareSubtreeRelationshipsForPortableExport } from "../src/identity/portableExportPrepare";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

test("prepareSubtreeRelationshipsForPortableExport upgrades L1 community-style bus", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];

  const thingEci = await root.newPico();
  const thing = pe.pf.getPico(thingEci);
  const thingCh = await thing.newChannel(allowAll);
  const commEci = await root.newPico();
  const comm = pe.pf.getPico(commEci);
  const commCh = await comm.newChannel(allowAll);

  await pe.identityService.ensureWebvhDid(thing.id);
  await pe.identityService.ensureWebvhDid(comm.id);

  const wrUrl = pe.base_url + "/krl/io.picolabs.wrangler.krl";
  const wr = await pe.rsRegistry.flush(wrUrl);
  await thing.install(wr.ruleset, { url: wr.url, config: {} });
  await comm.install(wr.ruleset, { url: wr.url, config: {} });

  const subRs = await pe.rsRegistry.flush(
    pe.base_url + "/krl/io.picolabs.subscription.krl"
  );
  await thing.install(subRs.ruleset, { url: subRs.url, config: {} });
  await comm.install(subRs.ruleset, { url: subRs.url, config: {} });

  const subId = "community-thing-sub";
  await thing.putEnt("io.picolabs.subscription", "established", [
    {
      Id: subId,
      name: "Trail Ride:Gravel Bike",
      Rx_role: "thing",
      Tx_role: "community",
      Tx: commCh.id,
      Tx_host: pe.base_url,
      Rx: thingCh.id,
      layer2: false,
    },
  ]);
  await comm.putEnt("io.picolabs.subscription", "established", [
    {
      Id: subId,
      name: "Trail Ride:Gravel Bike",
      Rx_role: "community",
      Tx_role: "thing",
      Tx: thingCh.id,
      Tx_host: pe.base_url,
      Rx: commCh.id,
      picoID: thing.id,
      layer2: false,
    },
  ]);

  const result = await prepareSubtreeRelationshipsForPortableExport(
    {
      store: pe.identity,
      pf: pe.pf,
      identity: pe.identityService,
    },
    thing.id
  );

  t.true(result.upgradedOnSubtree >= 1);
  t.true(result.upgradedOnPeers >= 1);

  const thingEst = (await thing.getEnt(
    "io.picolabs.subscription",
    "established"
  )) as Array<Record<string, unknown>>;
  t.is(thingEst[0].layer2, true);
  t.truthy(thingEst[0].Tx_did);
  t.falsy(thingEst[0].Tx);

  const commEst = (await comm.getEnt(
    "io.picolabs.subscription",
    "established"
  )) as Array<Record<string, unknown>>;
  t.is(commEst[0].layer2, true);
  t.truthy(commEst[0].Tx_did);

  const thingPeer = await pe.identity.getPeerSubscription(thing.id, subId);
  const commPeer = await pe.identity.getPeerSubscription(comm.id, subId);
  t.truthy(thingPeer?.peerDid);
  t.truthy(commPeer?.peerDid);
  t.is(commPeer?.remotePeerDid, thingPeer?.peerDid);
  t.is(thingPeer?.remotePeerDid, commPeer?.peerDid);

  await pe.pf.db.close();
});
