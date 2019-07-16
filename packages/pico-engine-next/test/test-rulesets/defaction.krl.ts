import test from "ava";
import { cleanDirectives } from "../../src/KrlCtx";
import { startTestEngine } from "../helpers/startTestEngine";

test("defaction.krl", async t => {
  const { pe, eci } = await startTestEngine(["defaction.krl"]);

  async function signal(domain: string, name: string, attrs: any = {}) {
    const resp = await pe.pf.eventWait({
      eci,
      domain,
      name,
      data: { attrs },
      time: 0
    });
    return cleanDirectives(resp.responses);
  }

  function query(name: string, args: any = {}) {
    return pe.pf.query({
      eci,
      rid: "io.picolabs.defaction",
      name,
      args
    });
  }

  t.deepEqual(await signal("defa", "foo", {}), [
    { name: "foo", options: { a: "bar", b: 5 } }
  ]);

  t.deepEqual(await signal("defa", "bar", {}), [
    { name: "bar", options: { a: "baz", b: "qux", c: "quux" } }
  ]);

  t.deepEqual(await query("getSettingVal"), null);

  t.deepEqual(await signal("defa", "bar_setting", {}), [
    { name: "bar", options: { a: "baz", b: "qux", c: "quux" } }
  ]);

  t.deepEqual(await query("getSettingVal"), {
    name: "bar",
    options: { a: "baz", b: "qux", c: "quux" }
  });

  t.deepEqual(await signal("defa", "chooser", { val: "asdf" }), [
    { name: "foo", options: { a: "asdf", b: 5 } }
  ]);

  t.deepEqual(await signal("defa", "chooser", { val: "fdsa" }), [
    { name: "bar", options: { a: "fdsa", b: "ok", c: "done" } }
  ]);

  t.deepEqual(await signal("defa", "chooser", {}), []);

  t.deepEqual(await signal("defa", "ifAnotB", { a: "true", b: "false" }), [
    { name: "yes a", options: {} },
    { name: "not b", options: {} }
  ]);

  t.deepEqual(await signal("defa", "ifAnotB", { a: "true", b: "true" }), []);

  t.deepEqual(
    await query("add", { a: 1, b: 2 }), // try and fake an action
    { type: "directive", name: "add", options: { resp: 3 } }
  );

  let err = await t.throwsAsync(signal("defa", "add"));
  t.is(err + "", "TypeError: [Function] is not an action");

  t.deepEqual(await signal("defa", "returns"), [
    { name: "wat:whereinthe", options: { b: 333 } }
  ]);
  t.deepEqual(await query("getSettingVal"), [
    "where",
    "in",
    "the",
    "wat:whereinthe 433"
  ]);

  t.deepEqual(await signal("defa", "scope"), []);

  t.deepEqual(await query("getSettingVal"), [
    "aint",
    "no",
    "echo",
    "did something!",
    "send wat? noop returned: null"
  ]);

  err = await t.throwsAsync(signal("defa", "trying_to_use_action_as_fn"));
  t.is(err + "", "TypeError: [Action] is not a function");

  err = await t.throwsAsync(query("echoAction"));
  t.is(
    err + "",
    'Error: Ruleset io.picolabs.defaction does not have query function "echoAction"'
  );
});
