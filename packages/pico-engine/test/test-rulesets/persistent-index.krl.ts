import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("persistent-index.krl", async t => {
  const { signal, mkQuery } = await startTestEngine(["persistent-index.krl"]);
  const query = mkQuery("io.picolabs.persistent-index");

  t.deepEqual(await query("getFoo"), null);
  t.deepEqual(await signal("pindex", "setfoo", { aaa: "blah" }), []);
  t.deepEqual(await query("getFoo"), { aaa: "blah" });

  t.deepEqual(
    await signal("pindex", "putfoo", { key: "bbb", value: "wat" }),
    []
  );
  t.deepEqual(await query("getFoo"), { aaa: "blah", bbb: "wat" });

  t.deepEqual(await query("getFooKey", { key: "aaa" }), "blah");
  t.deepEqual(await query("getFooKey", { key: "404" }), null);
  t.deepEqual(await query("getFooKey", {}), null);

  t.deepEqual(await signal("pindex", "delfoo", { key: "aaa" }), []);
  t.deepEqual(await query("getFoo"), { bbb: "wat" });
  t.deepEqual(await query("getFooKey", { key: "aaa" }), null);
  t.deepEqual(await query("getFooKey", { key: "bbb" }), "wat");

  t.deepEqual(await signal("pindex", "nukefoo"), []);
  t.deepEqual(await query("getFoo"), null);
  t.deepEqual(await query("getFooKey", { key: "bbb" }), null);

  // Test reading a map that was only set with a deep key path
  t.deepEqual(await query("getBaz"), null);
  t.deepEqual(await signal("pindex", "putbaz"), []);
  t.deepEqual(await query("getBaz"), { one: { two: "three" } });

  t.deepEqual(await query("getMaplist"), null);
  t.deepEqual(await signal("pindex", "setmaplist"), []);
  t.deepEqual(await query("getMaplist"), [
    { id: "one" },
    { id: "two" },
    { id: "three" }
  ]);
  t.deepEqual(await signal("pindex", "putmaplist"), []);
  t.deepEqual(await query("getMaplist"), [
    { id: "one" },
    { id: "two", other: "thing" },
    { id: "three" }
  ]);
});
