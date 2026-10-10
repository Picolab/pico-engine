/**
 * Identity snapshots in portable subtree export/import.
 */

import test from "ava";
import { openPortableBlob } from "pico-engine-core/dist/rulesetStateCrypto";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { allowAll, createChild } from "./helpers/portableMoveDemo";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";
import type { PortableIdentityExport } from "../src/identity/identityPortable";
import type { SubtreeExportPayload } from "pico-engine-core";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

test("exportPortableSubtree includes identity snapshot on root pico", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const secret = "identity-export-test";

  const blob = await pe.identityService.exportPortableSubtree(
    root.id,
    root.id,
    secret
  );
  const payload = openPortableBlob(blob, secret) as SubtreeExportPayload;
  const identity = payload.root.identity as PortableIdentityExport;

  t.truthy(identity);
  t.true(identity.webvhDid.startsWith("did:webvh:"));
  t.true(identity.webvhLog.length >= 1);
  t.truthy(identity.webvhKeys);

  await pe.pf.db.close();
});

test("importPortableSubtree provisions webvh when export has no identity snapshot", async (t) => {
  const pe1 = await startIsolatedEngine({ autoCreateRootPico: true });
  const pe2 = await startIsolatedEngine({ autoCreateRootPico: true });
  const root1 = pe1.pf.rootPicos()[0];
  const root2 = pe2.pf.rootPicos()[0];

  const childEci = await root1.newPico();
  const child = pe1.pf.lookupChannel(childEci).pico;
  t.falsy(await pe1.identity.getWebvhDid(child.id));

  const secret = "no-webvh-import";
  const blob = await pe1.identityService.exportPortableSubtree(
    root1.id,
    child.id,
    secret
  );
  const root2Ch = await root2.newChannel(allowAll);
  const result = await pe2.identityService.importPortableSubtree(
    root2.id,
    blob,
    secret,
    undefined,
    { parentChannelEci: root2Ch.id }
  );

  t.is(result.newRootPicoId, result.picoIdMap[child.id]);
  t.not(result.relocation.skipped, true);
  const importedDid = await pe2.identity.getWebvhDid(result.newRootPicoId);
  t.truthy(importedDid);
  t.true(importedDid!.startsWith("did:webvh:"));

  await pe1.pf.db.close();
  await pe2.pf.db.close();
});

test("importPortableSubtree hydrates nested child (Manifold bike + computer path)", async (t) => {
  const pe1 = await startIsolatedEngine({ autoCreateRootPico: true });
  const pe2 = await startIsolatedEngine({ autoCreateRootPico: true });
  const root1 = pe1.pf.rootPicos()[0];
  const root2 = pe2.pf.rootPicos()[0];
  const ch1 = await root1.newChannel(allowAll);
  const ch2 = await root2.newChannel(allowAll);

  const bike = await createChild(pe1, root1, ch1, "Gravel Bike #7");
  const bikeCh = await bike.newChannel(allowAll);
  await createChild(pe1, bike, bikeCh, "Bike #7 Computer");

  const secret = "demo-move";
  const blob = await pe1.identityService.exportPortableSubtree(
    root1.id,
    bike.id,
    secret
  );
  const summary = pe1.identityService.summarizePortableSubtreeExport(
    blob,
    secret
  );
  t.is(summary.wranglerName, "Gravel Bike #7");
  t.is(summary.childCount, 1);

  const result = await pe2.identityService.importPortableSubtree(
    root2.id,
    blob,
    secret,
    { renewIngress: false },
    {
      parentChannelEci: ch2.id,
      bootstrapDisplayName: "Gravel Bike #7",
    }
  );

  t.is(Object.keys(result.picoIdMap).length, 2);
  const importedBike = pe2.pf.getPico(result.newRootPicoId)!;
  t.is(importedBike.toReadOnly().children.length, 1);
  const uiMap = (await importedBike.getEnt(
    "io.picolabs.pico-engine-ui",
    "child_ui_ecis"
  )) as Record<string, string> | null;
  t.truthy(uiMap);
  t.is(Object.keys(uiMap || {}).length, 1);

  await pe1.pf.db.close();
  await pe2.pf.db.close();
});
