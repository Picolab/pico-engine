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
        shares talk
      }
      global{
        talk = function(){return "${v}"}
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
});
