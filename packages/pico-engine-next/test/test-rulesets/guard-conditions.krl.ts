import test from "ava";
import { cleanDirectives } from "../../src/KrlCtx";
import { startTestEngine } from "../helpers/startTestEngine";

test("guard-conditions.krl", async t => {
  const { pe, eci } = await startTestEngine(["guard-conditions.krl"]);

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
      rid: "io.picolabs.guard-conditions",
      name,
      args
    });
  }

  t.is(await query("getB"), null);

  t.deepEqual(await signal("foo", "a", { b: "foo" }), [
    { name: "foo", options: { b: "foo" } }
  ]);
  t.is(await query("getB"), "foo");

  t.deepEqual(await signal("foo", "a", { b: "bar" }), [
    { name: "foo", options: { b: "bar" } }
  ]);
  t.is(await query("getB"), "foo");

  t.deepEqual(await signal("foo", "a", { b: "foo bar" }), [
    { name: "foo", options: { b: "foo bar" } }
  ]);
  t.is(await query("getB"), "foo bar");

  t.deepEqual(await signal("bar", "a"), [
    { name: "bar", options: { x: 1, b: "foo bar" } },
    { name: "bar", options: { x: 2, b: "foo bar" } },
    { name: "bar", options: { x: 3, b: "foo bar" } }
  ]);
  t.is(await query("getB"), 3);

  t.deepEqual(await signal("on_final_no_foreach", "a", { x: 42 }), [
    { name: "on_final_no_foreach", options: { x: 42 } }
  ]);
  t.is(await query("getB"), 42);
});
