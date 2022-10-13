import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("error.krl", async t => {
  const { signal, mkQuery } = await startTestEngine(["error.krl"]);

  const query = mkQuery("io.picolabs.error");

  t.deepEqual(await query("getErrors"), null);

  t.deepEqual(await signal("error", "continue_on_error"), [
    { name: "continue_on_errorA", options: {} },
    { name: "continue_on_errorB", options: {} }
  ]);

  t.deepEqual(await signal("error", "stop_on_error"), [
    { name: "stop_on_errorA", options: {} }
    // NOTE stop_on_errorB should not execute
    // b/c stop_on_errorA raised an "error" that should stop it
  ]);

  t.deepEqual(
    await query("getErrors"),
    [
      null,
      ["debug", "continue_on_errorA", "continue_on_errorA debug"],
      ["info", "continue_on_errorA", "continue_on_errorA info"],
      ["warn", "continue_on_errorA", "continue_on_errorA warn"],
      ["debug", "continue_on_errorB", "continue_on_errorB debug"],
      ["info", "continue_on_errorB", "continue_on_errorB info"],
      ["warn", "continue_on_errorB", "continue_on_errorB warn"],
      ["error", "stop_on_errorA", "stop_on_errorA 1"]
    ].map(function(pair) {
      if (pair) {
        return {
          level: pair[0],
          data: pair[2],
          rid: "io.picolabs.error",
          rule_name: pair[1],
          genus: "user"
        };
      }
      return pair;
    })
  );
});
