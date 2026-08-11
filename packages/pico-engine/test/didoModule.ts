/**
 * dido KRL module wiring (wrangler myDid) and did-o ruleset deprecation.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

test("engine wires dido module (wrangler myDid)", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];

  const chann = await root.newChannel({
    tags: ["allow-all"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  const myDid = await pe.pf.query({
    eci: chann.id,
    rid: "io.picolabs.wrangler",
    name: "myDid",
    args: {},
  });
  t.truthy(myDid);
  t.true(String(myDid).startsWith("did:webvh:"));

  await pe.pf.db.close();
});

test("provisioned root does not install io.picolabs.did-o", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rids = root.toReadOnly().rulesets.map((r) => r.rid);
  t.true(rids.includes("io.picolabs.wrangler"));
  t.true(rids.includes("io.picolabs.subscription"));
  t.false(rids.includes("io.picolabs.did-o"));
  await pe.pf.db.close();
});
