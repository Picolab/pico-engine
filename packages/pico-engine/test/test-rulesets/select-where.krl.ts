import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("select-where.krl", async t => {
  const { signal } = await startTestEngine(["select-where.krl"]);

  t.deepEqual(await signal("something", "random"), [
    {
      name: "all",
      options: {
        domain: "something",
        name: "random",
        attrs: {}
      }
    }
  ]);

  t.deepEqual(await signal("foo", "bar"), [
    {
      name: "all",
      options: {
        domain: "foo",
        name: "bar",
        attrs: {}
      }
    }
  ]);

  t.deepEqual(await signal("set", "watcher", { domain: "foo" }), [
    {
      name: "all",
      options: {
        domain: "set",
        name: "watcher",
        attrs: { domain: "foo" }
      }
    }
  ]);

  // try foo:bar again
  t.deepEqual(await signal("foo", "bar"), [
    {
      name: "all",
      options: {
        domain: "foo",
        name: "bar",
        attrs: {}
      }
    },
    {
      name: "watcher matched!",
      options: {}
    }
  ]);
});
