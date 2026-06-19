import test from "ava";
import { makeKrlLogger } from "krl-stdlib";
import {
  PicoEngineCore,
  PicoEngineCoreConfiguration,
  RulesetRegistryLoaderMem,
} from "../src";
import { getModuleUses } from "../src/moduleDependencies";
import { allowAllChannelConf } from "./helpers/allowAllChannelConf";
import { mkdb } from "./helpers/mkdb";

function mkConf(krlUrls: { [url: string]: string }) {
  return {
    db: mkdb(),
    rsRegLoader: RulesetRegistryLoaderMem(async (url) => krlUrls[url]),
    log: makeKrlLogger(() => null),
    async getPicoLogs() {
      return [];
    },
  } satisfies PicoEngineCoreConfiguration;
}

async function installUrl(pe: PicoEngineCore, url: string) {
  const { ruleset } = await pe.rsRegistry.flush(url);
  await pe.picoFramework.rootPico.install(ruleset, { url, config: {} });
}

test("module dependency - reject self cycle on flush", async (t) => {
  const krlUrls = {
    "mem://A": `ruleset A { meta { use module A } }`,
  };
  const pe = new PicoEngineCore(mkConf(krlUrls));
  await pe.start();

  const err = await t.throwsAsync(pe.rsRegistry.flush("mem://A"));
  t.is("" + err, "Error: Dependency Cycle Found: A -> A");
});

test("module dependency - reject missing module on flush", async (t) => {
  const krlUrls = {
    "mem://A": `ruleset A { meta { use module C } }`,
  };
  const pe = new PicoEngineCore(mkConf(krlUrls));
  await pe.start();

  const err = await t.throwsAsync(pe.rsRegistry.flush("mem://A"));
  t.is("" + err, "Error: Dependant module not loaded: C");
});

test("module dependency - reject cycle introduced by flush (#577)", async (t) => {
  const krlUrls: { [url: string]: string } = {
    "mem://one": `ruleset one {}`,
    "mem://two": `ruleset two { meta { use module one } }`,
  };
  const pe = new PicoEngineCore(mkConf(krlUrls));
  await pe.start();

  await installUrl(pe, "mem://one");
  await installUrl(pe, "mem://two");

  const goodHash = pe.rsRegistry.getCached("mem://one")!.hash;

  krlUrls["mem://one"] = `ruleset one { meta { use module two } }`;
  await new Promise((res) => setTimeout(res, 120));

  const err = await t.throwsAsync(pe.rsRegistry.flush("mem://one"));
  t.is("" + err, "Error: Dependency Cycle Found: one -> two -> one");

  const cached = pe.rsRegistry.getCached("mem://one")!;
  t.is(cached.hash, goodHash);
  t.deepEqual(getModuleUses(cached.ruleset), []);

  // Same engine instance should still restart cleanly.
  await pe.start();
  const chann = await pe.picoFramework.rootPico.newChannel(allowAllChannelConf);
  t.truthy(chann.id);
});

test("module dependency - reject A -> B -> A on flush", async (t) => {
  const krlUrls: { [url: string]: string } = {
    "mem://A": `ruleset A {}`,
    "mem://B": `ruleset B { meta { use module A } }`,
  };
  const pe = new PicoEngineCore(mkConf(krlUrls));
  await pe.start();

  await installUrl(pe, "mem://A");
  await installUrl(pe, "mem://B");

  krlUrls["mem://A"] = `ruleset A { meta { use module B } }`;
  await new Promise((res) => setTimeout(res, 120));

  const err = await t.throwsAsync(pe.rsRegistry.flush("mem://A"));
  t.is("" + err, "Error: Dependency Cycle Found: A -> B -> A");
});
