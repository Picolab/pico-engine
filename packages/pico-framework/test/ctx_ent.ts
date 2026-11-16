/**
 * Ruleset ctx API: entity get/put/delete.
 */

import test from "ava";
import { mkCtxTestEnv } from "./helpers/mkCtxTestEnv";

test("ctx.getEnt, ctx.putEnt, ctx.delEnt", async function (t) {
  const { pf, event, rsReg } = await mkCtxTestEnv();

  t.is(await event("getEnt", ["foo"]), null);
  t.is(await event("putEnt", ["foo", "bar"]), undefined);
  t.is(await event("getEnt", ["foo"]), "bar");
  t.is(await event("delEnt", ["foo"]), undefined);
  t.is(await event("delEnt", ["foo"]), undefined, "ok to delete again");
  t.is(await event("getEnt", ["foo"]), null);

  rsReg.add({
    rid: "rid.other",
    init: () => ({}),
  });

  const pico = await pf.rootPico;
  pico.install(rsReg.get("rid.other"));
  const eciToChild = await pico.newPico({
    rulesets: [{ rs: rsReg.get("rid.ctx") }, { rs: rsReg.get("rid.other") }],
  });
  const subPico = pf.getPico(eciToChild);

  let err = await t.throwsAsync(pico.getEnt("rid.404", "var"));
  t.is(err + "", "Error: Not installed rid.404");

  t.is(await pico.getEnt("rid.ctx", "some"), null);
  t.is(await pico.getEnt("rid.other", "some"), null);
  t.is(await subPico.getEnt("rid.ctx", "some"), null);
  t.is(await subPico.getEnt("rid.other", "some"), null);

  await pico.putEnt("rid.other", "some", "thing");

  t.is(await pico.getEnt("rid.ctx", "some"), null);
  t.is(await pico.getEnt("rid.other", "some"), "thing");
  t.is(await subPico.getEnt("rid.ctx", "some"), null);
  t.is(await subPico.getEnt("rid.other", "some"), null);

  await subPico.putEnt("rid.ctx", "some", { other: "thing" });
  await subPico.putEnt("rid.other", "some", ["one", 2]);

  t.is(await pico.getEnt("rid.ctx", "some"), null);
  t.is(await pico.getEnt("rid.other", "some"), "thing");
  t.deepEqual(await subPico.getEnt("rid.ctx", "some"), { other: "thing" });
  t.deepEqual(await subPico.getEnt("rid.other", "some"), ["one", 2]);

  await subPico.delEnt("rid.ctx", "some");

  t.is(await pico.getEnt("rid.ctx", "some"), null);
  t.is(await pico.getEnt("rid.other", "some"), "thing");
  t.is(await subPico.getEnt("rid.ctx", "some"), null);
  t.deepEqual(await subPico.getEnt("rid.other", "some"), ["one", 2]);

  await pico.delEnt("rid.other", "some");

  t.is(await pico.getEnt("rid.ctx", "some"), null);
  t.is(await pico.getEnt("rid.other", "some"), null);
  t.is(await subPico.getEnt("rid.ctx", "some"), null);
  t.deepEqual(await subPico.getEnt("rid.other", "some"), ["one", 2]);
});

test.only("ent:foo := null", async function (t) {
  const { pf, event, rsReg } = await mkCtxTestEnv();

  t.is(await event("getEnt", ["foo"]), null);
  t.is(await event("putEnt", ["foo", 1]), undefined);
  t.is(await event("getEnt", ["foo"]), 1);
  t.is(await event("putEnt", ["foo", null]), undefined);
  t.is(await event("getEnt", ["foo"]), null);
});
