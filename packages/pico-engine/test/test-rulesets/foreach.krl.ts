import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("foreach.krl", async t => {
  const { signal } = await startTestEngine(["foreach.krl"]);

  t.deepEqual(await signal("foreach", "basic"), [
    { name: "basic", options: { x: 1 } },
    { name: "basic", options: { x: 2 } },
    { name: "basic", options: { x: 3 } }
  ]);

  t.deepEqual(await signal("foreach", "map"), [
    { name: "map", options: { k: "a", v: 1 } },
    { name: "map", options: { k: "b", v: 2 } },
    { name: "map", options: { k: "c", v: 3 } }
  ]);

  t.deepEqual(await signal("foreach", "nested"), [
    { name: "nested", options: { x: 1, y: "a" } },
    { name: "nested", options: { x: 1, y: "b" } },
    { name: "nested", options: { x: 1, y: "c" } },
    { name: "nested", options: { x: 2, y: "a" } },
    { name: "nested", options: { x: 2, y: "b" } },
    { name: "nested", options: { x: 2, y: "c" } },
    { name: "nested", options: { x: 3, y: "a" } },
    { name: "nested", options: { x: 3, y: "b" } },
    { name: "nested", options: { x: 3, y: "c" } }
  ]);

  t.deepEqual(await signal("foreach", "scope"), [
    { name: "scope", options: { foo: 1, bar: 0, baz: 0 } },
    { name: "scope", options: { foo: 1, bar: 1, baz: 1 } },

    { name: "scope", options: { foo: 2, bar: 0, baz: 0 } },
    { name: "scope", options: { foo: 2, bar: 1, baz: 2 } },
    { name: "scope", options: { foo: 2, bar: 2, baz: 4 } },

    { name: "scope", options: { foo: 3, bar: 0, baz: 0 } },
    { name: "scope", options: { foo: 3, bar: 1, baz: 3 } },
    { name: "scope", options: { foo: 3, bar: 2, baz: 6 } },
    { name: "scope", options: { foo: 3, bar: 3, baz: 9 } },

    { name: "scope", options: { foo: 1, bar: 0, baz: 0 } },
    { name: "scope", options: { foo: 1, bar: 1, baz: 1 } },

    { name: "scope", options: { foo: 2, bar: 0, baz: 0 } },
    { name: "scope", options: { foo: 2, bar: 1, baz: 2 } },
    { name: "scope", options: { foo: 2, bar: 2, baz: 4 } },

    { name: "scope", options: { foo: 3, bar: 0, baz: 0 } },
    { name: "scope", options: { foo: 3, bar: 1, baz: 3 } },
    { name: "scope", options: { foo: 3, bar: 2, baz: 6 } },
    { name: "scope", options: { foo: 3, bar: 3, baz: 9 } }
  ]);

  t.deepEqual(await signal("foreach", "final", { x: "a", y: "0" }), [
    { name: "final", options: { x: "a", y: "0" } },
    { name: "final_raised", options: { x: "a", y: "0" } }
  ]);

  t.deepEqual(await signal("foreach", "final", { x: "a", y: "0,1" }), [
    { name: "final", options: { x: "a", y: "0" } },
    { name: "final", options: { x: "a", y: "1" } },
    { name: "final_raised", options: { x: "a", y: "1" } }
  ]);

  t.deepEqual(await signal("foreach", "final", { x: "a,b", y: "0,1" }), [
    { name: "final", options: { x: "a", y: "0" } },
    { name: "final", options: { x: "a", y: "1" } },
    { name: "final", options: { x: "b", y: "0" } },
    { name: "final", options: { x: "b", y: "1" } },
    { name: "final_raised", options: { x: "b", y: "1" } }
  ]);

  t.deepEqual(await signal("foreach", "key_vs_index"), [
    { name: "key_vs_index", options: { a: "bar", k: "foo", b: "one", i: 0 } },
    { name: "key_vs_index", options: { a: "bar", k: "foo", b: "two", i: 1 } },
    { name: "key_vs_index", options: { a: "bar", k: "foo", b: "three", i: 2 } },
    { name: "key_vs_index", options: { a: "qux", k: "baz", b: "one", i: 0 } },
    { name: "key_vs_index", options: { a: "qux", k: "baz", b: "two", i: 1 } },
    { name: "key_vs_index", options: { a: "qux", k: "baz", b: "three", i: 2 } }
  ]);
});
