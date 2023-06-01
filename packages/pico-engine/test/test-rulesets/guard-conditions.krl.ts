import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("guard-conditions.krl", async t => {
  const { signal, mkQuery } = await startTestEngine(["guard-conditions.krl"]);

  const query = mkQuery("io.picolabs.guard-conditions");

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
