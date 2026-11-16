/**
 * Ruleset startup hooks and initialization order.
 */

import test from "ava";
import { PicoFramework, Ruleset } from "../src";
import { rulesetRegistry } from "./helpers/rulesetRegistry";
import { mkdb } from "./helpers/mkdb";

test("rulesetStartup", async function (t) {
  let errorOnInit = false;

  const rs: Ruleset = {
    rid: "rid.A",
    init(ctx) {
      if (errorOnInit) {
        throw new Error("errorOnInit = true");
      }
      return {};
    },
  };

  const down = mkdb();
  const rsReg = rulesetRegistry();
  let pf = new PicoFramework({ rulesetLoader: rsReg.loader, db: down });
  rsReg.add(rs);
  await pf.start();
  const pico = await pf.rootPico;
  await pico.install(rsReg.get("rid.A"));

  // Restart - this time fail to startup the ruleset
  errorOnInit = true;
  let swallowedErrors: string[] = [];
  pf = new PicoFramework({
    rulesetLoader: rsReg.loader,
    db: down,
    onFrameworkEvent: (e) => {
      switch (e.type) {
        case "startupRulesetInitError":
          swallowedErrors.push(e.rid + JSON.stringify(e.config) + e.error);
          break;
      }
    },
  });
  rsReg.add(rs);

  t.deepEqual(swallowedErrors, []);
  await pf.start();

  t.is(swallowedErrors.length, 1);
  t.is(swallowedErrors[0], "rid.A{}Error: errorOnInit = true");
});
