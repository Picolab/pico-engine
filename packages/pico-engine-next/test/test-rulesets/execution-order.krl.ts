import test from "ava";
import { readTestKrl } from "../helpers/readTestKrl";
import { startTestEngine } from "../helpers/startTestEngine";

test("execution-order.krl", async t => {
  const { pe, signal, mkQuery } = await startTestEngine([
    "execution-order.krl"
  ]);

  const query = mkQuery("io.picolabs.execution-order");
  const query2 = mkQuery("io.picolabs.execution-order2");

  t.deepEqual(await query("getOrder"), null);

  t.deepEqual(await signal("execution_order", "all"), [
    { name: "first", options: {} },
    { name: "second", options: {} }
  ]);

  t.deepEqual(await query("getOrder"), [
    null,
    "first-fired",
    "first-finally",
    "second-fired",
    "second-finally"
  ]);

  t.deepEqual(await signal("execution_order", "reset_order"), [
    { name: "reset_order", options: {} }
  ]);

  t.deepEqual(await query("getOrder"), []);

  t.deepEqual(await signal("execution_order", "foo"), [
    { name: "foo_or_bar", options: {} },
    { name: "foo", options: {} }
  ]);

  t.deepEqual(await signal("execution_order", "bar"), [
    { name: "foo_or_bar", options: {} },
    { name: "bar", options: {} }
  ]);

  t.deepEqual(await query("getOrder"), [
    "foo_or_bar",
    "foo",
    "foo_or_bar",
    "bar"
  ]);

  t.deepEqual(await signal("execution_order", "reset_order"), [
    { name: "reset_order", options: {} }
  ]);

  const { rid, version } = await pe.rsRegistry.publish(
    await readTestKrl("execution-order2.krl")
  );
  await pe.pf.rootPico.install(rid, version);

  t.deepEqual(await signal("execution_order", "reset_order"), [
    { name: "reset_order", options: {} },
    { name: "2 - reset_order", options: {} }
  ]);

  t.deepEqual(await signal("execution_order", "bar"), [
    { name: "foo_or_bar", options: {} },
    { name: "bar", options: {} },
    { name: "2 - foo_or_bar", options: {} },
    { name: "2 - bar", options: {} }
  ]);

  t.deepEqual(await query("getOrder"), ["foo_or_bar", "bar"]);
  t.deepEqual(await query2("getOrder"), ["2 - foo_or_bar", "2 - bar"]);
});
