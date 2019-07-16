import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("last.krl", async t => {
  const { signal } = await startTestEngine(["last.krl", "last2.krl"]);

  t.deepEqual(await signal("last", "all", {}), [
    { name: "foo", options: {} },
    { name: "bar", options: {} },
    { name: "baz", options: {} },
    // qux doesn't run b/c baz stopped it
    { name: "last2 foo", options: {} } // still runs b/c it's a different rid
  ]);

  t.deepEqual(await signal("last", "all", { stop: "bar" }), [
    { name: "foo", options: {} },
    { name: "bar", options: {} },
    { name: "last2 foo", options: {} }
  ]);

  t.deepEqual(await signal("last", "all", { stop: "foo" }), [
    { name: "foo", options: {} },
    { name: "last2 foo", options: {} }
  ]);
});
