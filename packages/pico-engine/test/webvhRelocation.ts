/**
 * Phase D — did:webvh relocation keeps SCID, updates log.
 */

import test from "ava";
import fetch from "cross-fetch";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import {
  assertWebvhScidUnchanged,
  webvhScidFromStore,
} from "../src/identity/webvhRelocation";
import { resolveLocalWebvhLog } from "../src/identity/webvh";
import { IdentityError } from "../src/identity/errors";

test("relocateWebvhAfterMove keeps SCID and grows log", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const priorDid = (await pe.identity.getWebvhDid(root.id))!;
  const priorScid = (await webvhScidFromStore(pe.identity, root.id))!;
  const priorLog = (await pe.identity.getWebvhLog(root.id))!;

  const relocation = await pe.identityService.relocateWebvhAfterMove(root.id, {
    renewIngress: true,
  });

  t.is(relocation.priorDid, priorDid);
  t.is(relocation.scid, priorScid);
  t.is(relocation.newDid, priorDid);

  const log = (await pe.identity.getWebvhLog(root.id))!;
  t.is(log.length, priorLog.length + 1);
  await assertWebvhScidUnchanged(pe.identity, root.id, priorScid);

  const resolved = await resolveLocalWebvhLog(log);
  t.true(resolved.doc.service?.[0]?.serviceEndpoint?.includes("/sky/event/"));
  t.is(resolved.doc.service?.[0]?.serviceEndpoint, relocation.didcommEndpoint);

  await pe.pf.db.close();
});

test("relocateWebvhAfterMove rejects pico without did:webvh", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });

  await t.throwsAsync(
    pe.identityService.relocateWebvhAfterMove("missing-pico-id"),
    { instanceOf: IdentityError, message: /has no did:webvh to relocate/ }
  );

  await pe.pf.db.close();
});

test("relocateWebvhAfterMove with new baseUrl changes DID but keeps SCID", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const priorDid = (await pe.identity.getWebvhDid(root.id))!;
  const priorScid = (await webvhScidFromStore(pe.identity, root.id))!;

  const relocation = await pe.identityService.relocateWebvhAfterMove(root.id, {
    baseUrl: "http://localhost:55555",
    renewIngress: true,
  });

  t.not(relocation.priorDid, relocation.newDid);
  t.is(relocation.priorDid, priorDid);
  t.is(relocation.scid, priorScid);
  await assertWebvhScidUnchanged(pe.identity, root.id, priorScid);

  await pe.pf.db.close();
});

test("relocateWebvhAfterMove appends to HTTP did.jsonl", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];

  const beforeRes = await fetch(`${pe.base_url}/picos/${root.id}/did.jsonl`);
  t.is(beforeRes.status, 200);
  const beforeLines = (await beforeRes.text()).trim().split("\n").length;

  await pe.identityService.relocateWebvhAfterMove(root.id, { renewIngress: true });

  const afterRes = await fetch(`${pe.base_url}/picos/${root.id}/did.jsonl`);
  t.is(afterRes.status, 200);
  const afterLines = (await afterRes.text()).trim().split("\n").length;
  t.is(afterLines, beforeLines + 1);

  await pe.pf.db.close();
});

test("notifyPeersOfWebvhRotation returns zero when no peer subscriptions", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];

  const relocation = await pe.identityService.relocateWebvhAfterMove(root.id, {
    renewIngress: true,
  });
  const notified = await pe.identityService.notifyPeersOfWebvhRotation(
    root.id,
    relocation
  );
  t.is(notified, 0);

  await pe.pf.db.close();
});
