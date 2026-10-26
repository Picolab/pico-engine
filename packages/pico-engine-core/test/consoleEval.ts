/**
 * Owner KRL console (__consoleEval / compileEvalExpression).
 */

import test from "ava";
import { makeKrlLogger } from "krl-stdlib";
import { PicoEngineCore } from "../src/PicoEngineCore";
import { evalInRulesetDirect } from "../src/evalInRuleset";
import { RulesetRegistryLoaderMem } from "../src/RulesetRegistryLoaderMem";
import { allowAllChannelConf } from "./helpers/allowAllChannelConf";
import { mkdb } from "./helpers/mkdb";

const KRL = `ruleset console_test {
  meta { shares getN }
  global {
    n = 17
    getN = function() { n }
    getMap = function() { {"a": 1, "b": 2} }
  }
  rule noop {
    select when console_test noop
    if true then noop()
  }
}`;

test("console eval reads globals and ent", async (t) => {
  const krlUrls: { [url: string]: string } = {
    "mem://console_test": KRL,
  };

  const core = new PicoEngineCore({
    db: mkdb(),
    rsRegLoader: RulesetRegistryLoaderMem(async (url) => krlUrls[url]),
    log: makeKrlLogger(() => null),
    async getPicoLogs() {
      return [];
    },
  });
  await core.start();

  const chann =
    await core.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const eci = chann.id;

  const { ruleset } = await core.rsRegistry.load("mem://console_test");
  await core.picoFramework.rootPico.install(ruleset, {
    url: "mem://console_test",
  });

  const picoId = core.picoFramework.rootPicos()[0].id;

  let r = await evalInRulesetDirect(picoId, "console_test", "getN()");
  t.true(r.ok);
  t.is(r.value, 17);

  r = await evalInRulesetDirect(picoId, "console_test", "n + 1");
  t.true(r.ok);
  t.is(r.value, 18);

  r = await evalInRulesetDirect(picoId, "console_test", 'getMap(){"a"}');
  t.true(r.ok);
  t.is(r.value, 1);

  r = await evalInRulesetDirect(
    picoId,
    "console_test",
    'getMap().get(["a"])'
  );
  t.true(r.ok);
  t.is(r.value, 1);

  r = await evalInRulesetDirect(
    picoId,
    "console_test",
    'flip = "a"; getMap().get(["a", flip])'
  );
  t.true(r.ok);
  t.is(r.value, 1);

  const rootPico = core.picoFramework.getPico(picoId);
  await rootPico.putEnt("console_test", "flag", true);
  r = await evalInRulesetDirect(picoId, "console_test", "ent:flag");
  t.true(r.ok);
  t.is(r.value, true);

  r = await evalInRulesetDirect(
    picoId,
    "console_test",
    "ent:missing := 1"
  );
  t.false(r.ok);
  t.regex(r.error || "", /not allowed/i);

  const viaQuery = await core.picoFramework.query({
    eci,
    rid: "console_test",
    name: "__consoleEval",
    args: { expr: "getN()" },
  });
  t.is(viaQuery, 17);

  await core.picoFramework.db.close();
});
