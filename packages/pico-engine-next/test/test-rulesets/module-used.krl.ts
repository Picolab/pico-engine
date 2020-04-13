import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("module-used.krl", async (t) => {
  const { signal, mkQuery, pe, installTestFile } = await startTestEngine();

  await installTestFile(pe.pf.rootPico, "module-defined.krl");
  await installTestFile(pe.pf.rootPico, "module-used.krl");

  const query = mkQuery("io.picolabs.module-defined");
  const queryUsed = mkQuery("io.picolabs.module-used");

  // Test overriding module configurations
  t.deepEqual(await signal("module_used", "dflt_name"), [
    { name: "dflt_name", options: { name: "Bob" } },
  ]);
  t.deepEqual(await signal("module_used", "conf_name"), [
    { name: "conf_name", options: { name: "Jim" } },
  ]);

  // Test using a module in the global block
  t.deepEqual(await queryUsed("dfltName"), "Bob");

  // Test using provided functions that use `ent` vars
  // NOTE: the dependent ruleset is NOT the same instance
  t.deepEqual(await signal("module_used", "dflt_info"), [
    {
      name: "dflt_info",
      options: {
        info: {
          name: "Bob",
          memo: null, // there is nothing stored in that `ent` var on this pico
          privateFn: "privateFn = name: Bob memo: null",
        },
      },
    },
  ]);
  t.deepEqual(await signal("module_used", "conf_info"), [
    {
      name: "conf_info",
      options: {
        info: {
          name: "Jim",
          memo: null, // there is nothing stored in that `ent` var on this pico
          privateFn: "privateFn = name: Jim memo: null",
        },
      },
    },
  ]);

  t.deepEqual(await signal("module_defined", "store_memo", { memo: "foo" }), [
    {
      name: "store_memo",
      options: {
        name: "Bob", // the default is used when a module is added to a pico
        memo_to_store: "foo",
      },
    },
  ]);
  t.deepEqual(await query("getInfo"), {
    name: "Bob",
    memo: '["foo" by Bob]',
    privateFn: 'privateFn = name: Bob memo: ["foo" by Bob]',
  });

  t.deepEqual(await signal("module_used", "dflt_info"), [
    {
      name: "dflt_info",
      options: {
        info: {
          name: "Bob",
          memo: '["foo" by Bob]',
          privateFn: 'privateFn = name: Bob memo: ["foo" by Bob]',
        },
      },
    },
  ]);

  t.deepEqual(await signal("module_used", "conf_info"), [
    {
      name: "conf_info",
      options: {
        info: {
          name: "Jim", // the overrided config is used here
          memo: '["foo" by Bob]', // the memo was stored on the pico ruleset with default config
          privateFn: 'privateFn = name: Jim memo: ["foo" by Bob]',
        },
      },
    },
  ]);

  // Test using defaction provided by the module
  t.deepEqual(await signal("module_used", "dflt_getInfoAction"), [
    {
      name: "getInfoAction",
      options: {
        name: "Bob",
        memo: '["foo" by Bob]',
        privateFn: 'privateFn = name: Bob memo: ["foo" by Bob]',
      },
    },
  ]);
  t.deepEqual(await queryUsed("getEntVal"), { name: "Bob" });

  t.deepEqual(await signal("module_used", "conf_getInfoAction"), [
    {
      name: "getInfoAction",
      options: {
        name: "Jim", // the overrided config is used here
        memo: '["foo" by Bob]', // the memo was stored on the pico ruleset with default config
        privateFn: 'privateFn = name: Jim memo: ["foo" by Bob]',
      },
    },
  ]);
  t.deepEqual(await queryUsed("getEntVal"), { name: "Jim" });

  // Test unregisterRuleset checks
  // TODO
});
