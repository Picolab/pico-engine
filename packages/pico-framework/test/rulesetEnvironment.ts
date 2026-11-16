/**
 * Ruleset environment variables and ent persistence.
 */

import test from "ava";
import { PicoFramework } from "../src";
import { rulesetRegistry } from "./helpers/rulesetRegistry";
import { mkdb } from "./helpers/mkdb";

test("rulesetEnvironment", async function (t) {
  let lastInit: any;
  const environment = { some: "env" };
  const config = { some: "config" };

  const rsReg = rulesetRegistry();
  const pf = new PicoFramework({
    db: mkdb(),
    rulesetLoader: rsReg.loader,
    environment,
  });
  rsReg.add({
    rid: "rid.A",
    init(ctx, env) {
      lastInit = { ctx, env };
      return {};
    },
  });
  await pf.start();
  const pico = await pf.rootPico;

  t.is(lastInit, undefined);

  await pico.install(rsReg.get("rid.A"), config);

  t.is(lastInit.env, environment);
  t.is(lastInit.ctx.ruleset.config, config);
});
