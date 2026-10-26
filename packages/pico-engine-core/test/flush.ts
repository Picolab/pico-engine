/**
 * Ruleset flush behavior and module dependency validation.
 */

import test from "ava";
import { makeKrlLogger } from "krl-stdlib";
import { PicoEngineCore } from "../src/PicoEngineCore";
import { RulesetRegistryLoaderMem } from "../src/RulesetRegistryLoaderMem";
import { allowAllChannelConf } from "./helpers/allowAllChannelConf";
import { mkSignalBase } from "./helpers/mkSignalBase";
import { sleep } from "./helpers/sleep";
import { mkdb } from "./helpers/mkdb";

test("ruleset flush", async (t) => {
  function mkKrlVersion(v: string): string {
    return `ruleset main{
      meta {
        shares talk, lastRulesetSetAction
      }
      global{
        talk = function(){return "${v}"}
        lastRulesetSetAction = function(){ ent:lastRulesetSetAction }
      }
      /**
       * Surface v${v}.
       * @attr x String
       */
      rule ping {
        select when main ping
        if true then every { noop() }
      }
      rule on_ruleset_set_changed {
        select when engine ruleset_set_changed
        fired { ent:lastRulesetSetAction := event:attr("action") }
      }
      rule flush {
        select when main:flush
        ctx:flush("mem://main")
      }
    }`;
  }

  const krlUrls: { [url: string]: string } = {
    "mem://main": mkKrlVersion("v0"),
  };

  const core = new PicoEngineCore({
    db: mkdb(),
    rsRegLoader: RulesetRegistryLoaderMem(async (url) => krlUrls[url]),
    log: makeKrlLogger((line: string) => null),
    async getPicoLogs(picoId) {
      return [];
    },
  });
  await core.start();

  const chann =
    await core.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const eci = chann.id;
  const mkSignal = mkSignalBase(core.picoFramework);
  const signal = mkSignal(eci);
  function mkQuery(rid: string) {
    return function (name: string, args: any = {}) {
      return core.picoFramework.query({
        eci,
        rid,
        name,
        args,
      });
    };
  }

  const rs = await core.rsRegistry.load("mem://main");
  await core.picoFramework.rootPico.install(rs.ruleset, { url: "mem://main" });

  const query = mkQuery("main");

  t.deepEqual(await query("talk"), "v0");

  await sleep(120); // need to wait until the flush memoize clears before we can test
  krlUrls["mem://main"] = mkKrlVersion("v1");
  await signal("main", "flush");

  t.deepEqual(await query("talk"), "v1");

  await sleep(200);
  t.is(await query("lastRulesetSetAction"), "flush");
});
