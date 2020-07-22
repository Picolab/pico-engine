import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("defaction.krl", async (t) => {
  const { signal, mkQuery } = await startTestEngine(["defaction.krl"]);

  const query = mkQuery("io.picolabs.defaction");

  t.deepEqual(await signal("defa", "foo", {}), [
    { name: "foo", options: { a: "bar", b: 5 } },
  ]);

  t.deepEqual(await signal("defa", "bar", {}), [
    { name: "bar", options: { a: "baz", b: "qux", c: "quux" } },
  ]);

  t.deepEqual(await query("getSettingVal"), null);

  t.deepEqual(await signal("defa", "bar_setting", {}), [
    { name: "bar", options: { a: "baz", b: "qux", c: "quux" } },
  ]);

  t.deepEqual(await query("getSettingVal"), {
    name: "bar",
    options: { a: "baz", b: "qux", c: "quux" },
  });

  t.deepEqual(await signal("defa", "chooser", { val: "asdf" }), [
    { name: "foo", options: { a: "asdf", b: 5 } },
  ]);

  t.deepEqual(await signal("defa", "chooser", { val: "fdsa" }), [
    { name: "bar", options: { a: "fdsa", b: "ok", c: "done" } },
  ]);

  t.deepEqual(await signal("defa", "chooser", {}), []);

  t.deepEqual(await signal("defa", "ifAnotB", { a: "true", b: "false" }), [
    { name: "yes a", options: {} },
    { name: "not b", options: {} },
  ]);

  t.deepEqual(await signal("defa", "ifAnotB", { a: "true", b: "true" }), []);

  t.deepEqual(
    await query("add", { a: 1, b: 2 }), // try and fake an action
    { type: "directive", name: "add", options: { resp: 3 } }
  );

  t.deepEqual(await signal("defa", "returns"), [
    { name: "wat:whereinthe", options: { b: 333 } },
  ]);
  t.deepEqual(await query("getSettingVal"), [
    "where",
    "in",
    "the",
    "wat:whereinthe 433",
  ]);

  t.deepEqual(await signal("defa", "scope"), []);

  t.deepEqual(await query("getSettingVal"), [
    "aint",
    "no",
    "echo",
    "did something!",
    "send wat? noop returned: null",
  ]);

  let err = await t.throwsAsync(query("echoAction"));
  t.is(
    err + "",
    'Error: Ruleset io.picolabs.defaction does not have query function "echoAction"'
  );
});
