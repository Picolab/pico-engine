import test from "ava";
import { cleanDirectives } from "../../src/KrlCtx";
import { readTestKrl } from "../helpers/readTestKrl";
import { startTestEngine } from "../helpers/startTestEngine";

test("execution-order.krl", async t => {
  const { pe, eci } = await startTestEngine(["execution-order.krl"]);

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
      rid: "io.picolabs.execution-order",
      name,
      args
    });
  }

  function query2(name: string, args: any = {}) {
    return pe.pf.query({
      eci,
      rid: "io.picolabs.execution-order2",
      name,
      args
    });
  }

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
