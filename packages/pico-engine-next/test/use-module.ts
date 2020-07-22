import test from "ava";
import { makeKrlLogger } from "krl-stdlib";
import { PicoEngineCoreConfiguration, startPicoEngineCore } from "../src/core";
import { RulesetRegistryLoaderMem } from "../src/RulesetRegistryLoaderMem";
import { allowAllChannelConf, mkSignalBase } from "./helpers/startTestEngine";
const memdown = require("memdown");

test("use-module install order", async (t) => {
  const krlUrls: { [url: string]: string } = {
    "mem://main": `ruleset main {
      rule install {
        select when main:install
        every {
          ctx:install(event:attrs{"url"})
        }
        
      }
    }`,
    "mem://aaa": `ruleset aaa{meta{use module bbb}}`,
    "mem://bbb": `ruleset bbb{}`,
    "mem://ccc": `ruleset ccc{meta{use module bbb}}`,
  };
  const conf: PicoEngineCoreConfiguration = {
    leveldown: memdown(),
    rsRegLoader: RulesetRegistryLoaderMem(async (url) => krlUrls[url]),
    log: makeKrlLogger((line: string) => null),
    async getPicoLogs(picoId) {
      return [];
    },
  };

  let pe = await startPicoEngineCore(conf);
  const chann = await pe.pf.rootPico.newChannel(allowAllChannelConf);
  const { ruleset } = await pe.rsRegistry.flush("mem://main");
  await pe.pf.rootPico.install(ruleset, { url: "mem://main", config: {} });
  const eci = chann.id;
  let signal = mkSignalBase(pe.pf)(eci);

  let err = await t.throwsAsync(
    signal("main", "install", { url: "mem://aaa" })
  );
  t.is("" + err, "Error: Module not found: bbb");
  err = await t.throwsAsync(signal("main", "install", { url: "mem://ccc" }));
  t.is("" + err, "Error: Module not found: bbb");
  t.deepEqual(await signal("main", "install", { url: "mem://bbb" }), []);
  t.deepEqual(await signal("main", "install", { url: "mem://aaa" }), []);
  t.deepEqual(await signal("main", "install", { url: "mem://ccc" }), []);

  pe = await startPicoEngineCore(conf);
});
