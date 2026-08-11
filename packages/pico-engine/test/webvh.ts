/**
 * did:webvh provisioning, HTTP did.jsonl, wrangler myDid, and publicIntro.
 */

import test from "ava";
import fetch from "cross-fetch";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { resolveLocalWebvhLog, portableWebvhLogHttpUrl } from "../src/identity/webvh";

test("portableWebvhLogHttpUrl uses http for localhost engines", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const did = (await pe.identity.getWebvhDid(root.id))!;

  const url = portableWebvhLogHttpUrl(did);
  t.truthy(url);
  t.true(url!.startsWith("http://localhost:"));
  t.true(url!.endsWith(`/picos/${root.id}/did.jsonl`));

  const res = await fetch(url!);
  t.is(res.status, 200);

  await pe.pf.db.close();
});

test("root pico gets did:webvh at engine start", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];

  const did = await pe.identity.getWebvhDid(root.id);
  t.truthy(did);
  t.true(did!.startsWith("did:webvh:"));

  const log = await pe.identity.getWebvhLog(root.id);
  t.truthy(log);
  t.is(log!.length, 1);
  t.is(log![0].parameters?.portable, true);

  const resolved = await resolveLocalWebvhLog(log!);
  t.is(resolved.did, did);

  t.true(await pe.identity.getPublicIntro(root.id));

  await pe.pf.db.close();
});

test("wrangler myDid returns did:webvh for root", async (t) => {
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

test("did.jsonl is served over HTTP and verifies", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const did = await pe.identity.getWebvhDid(root.id);
  t.truthy(did);

  const res = await fetch(`${pe.base_url}/picos/${root.id}/did.jsonl`);
  t.is(res.status, 200);
  const body = await res.text();
  t.true(body.includes('"portable":true'));

  const log = body
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const resolved = await resolveLocalWebvhLog(log);
  t.is(resolved.did, did);

  await pe.pf.db.close();
});

test("child pico gets did:webvh with publicIntro false by default", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel({
    tags: ["allow-all"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name: "webvh-child" } },
    time: 0,
  });

  const children = root.toReadOnly().children;
  t.is(children.length, 1);
  const childPico = pe.pf.getPico(children[0]);
  const childDid = await pe.identity.getWebvhDid(childPico.id);
  t.truthy(childDid);
  t.false(await pe.identity.getPublicIntro(childPico.id));

  await pe.pf.db.close();
});

test("wrangler publicIntro and setPublicIntro", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const chann = await root.newChannel({
    tags: ["allow-all"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  t.true(
    await pe.pf.query({
      eci: chann.id,
      rid: "io.picolabs.wrangler",
      name: "publicIntro",
      args: {},
    })
  );

  await pe.pf.eventWait({
    eci: chann.id,
    domain: "wrangler",
    name: "set_public_intro",
    data: { attrs: { enabled: false } },
    time: 0,
  });
  t.false(await pe.identity.getPublicIntro(root.id));

  await pe.pf.db.close();
});
