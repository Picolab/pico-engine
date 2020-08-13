import test from "ava";
import { makeKrlLogger } from "krl-stdlib";
import {
  PicoEngineCore,
  PicoEngineCoreConfiguration,
  RulesetRegistryLoaderMem,
} from "pico-engine-core";
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

  let pe = new PicoEngineCore(conf);
  await pe.start();

  const chann = await pe.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const { ruleset } = await pe.rsRegistry.flush("mem://main");
  await pe.picoFramework.rootPico.install(ruleset, {
    url: "mem://main",
    config: {},
  });
  const eci = chann.id;
  let signal = mkSignalBase(pe.picoFramework)(eci);

  let err = await t.throwsAsync(
    signal("main", "install", { url: "mem://aaa" })
  );
  t.is("" + err, "Error: Module not found: bbb");
  err = await t.throwsAsync(signal("main", "install", { url: "mem://ccc" }));
  t.is("" + err, "Error: Module not found: bbb");
  t.deepEqual(await signal("main", "install", { url: "mem://bbb" }), []);
  t.deepEqual(await signal("main", "install", { url: "mem://aaa" }), []);
  t.deepEqual(await signal("main", "install", { url: "mem://ccc" }), []);

  pe = new PicoEngineCore(conf);
  await pe.start();
});

test("use-module startup dependency", async (t) => {
  const krlUrls: { [url: string]: string } = {
    "mem://aaa": `ruleset aaa {
      meta {
        use module bbb
        shares out
      }
      global {
        out = function(){ bbb:sayHello() }
      }
    }`,
    "mem://bbb": `ruleset bbb {
      meta {
        provides sayHello
      }
      global {
        sayHello = function(){
          return "Hello from: bbb"
        }
      }
    }`,
  };
  const conf: PicoEngineCoreConfiguration = {
    leveldown: memdown(),
    rsRegLoader: RulesetRegistryLoaderMem(async (url) => krlUrls[url]),
    log: makeKrlLogger((line: string) => null),
    async getPicoLogs(picoId) {
      return [];
    },
  };

  let pe = new PicoEngineCore(conf);
  await pe.start();
  const chann = await pe.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const eci = chann.id;
  function query(rid: string, name: string) {
    return pe.picoFramework.query({ eci, rid, name, args: {} });
  }

  async function installUrl(url: string) {
    const { ruleset } = await pe.rsRegistry.flush(url);
    await pe.picoFramework.rootPico.install(ruleset, { url, config: {} });
  }
  await installUrl("mem://bbb");
  await installUrl("mem://aaa");

  t.is(await query("aaa", "out"), "Hello from: bbb");

  // stop and startup
  pe = new PicoEngineCore(conf);
  await pe.start();
  t.is(await query("aaa", "out"), "Hello from: bbb");
});

test("use-module get dependency updates", async (t) => {
  const krlUrls: { [url: string]: string } = {
    "mem://main": `ruleset main {
      rule install {
        select when main:install
        ctx:install(event:attrs{"url"})
      }
      rule flush {
        select when main:flush
        ctx:flush(event:attrs{"url"})
      }
    }`,
    "mem://aaa": `ruleset aaa {
      meta {
        use module bbb with configured_name = "Alice"
        shares out
      }
      global {
        out = function(){ bbb:sayHello() }
      }
    }`,
    "mem://bbb": `ruleset bbb {
      meta {
        configure using configured_name = "Bob"
        provides sayHello
        shares sayHello
      }
      global {
        sayHello = function(){
          return "Hello " + configured_name
        }
      }
    }`,
  };

  const conf: PicoEngineCoreConfiguration = {
    leveldown: memdown(),
    rsRegLoader: RulesetRegistryLoaderMem(async (url) => krlUrls[url]),
    log: makeKrlLogger((line: string) => null),
    async getPicoLogs(picoId) {
      return [];
    },
  };

  let pe = new PicoEngineCore(conf);
  await pe.start();
  const chann = await pe.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const { ruleset } = await pe.rsRegistry.flush("mem://main");
  await pe.picoFramework.rootPico.install(ruleset, {
    url: "mem://main",
    config: {},
  });
  const eci = chann.id;
  let signal = mkSignalBase(pe.picoFramework)(eci);
  function query(rid: string, name: string) {
    return pe.picoFramework.query({ eci, rid, name, args: {} });
  }
  t.deepEqual(await signal("main", "install", { url: "mem://bbb" }), []);
  t.deepEqual(await signal("main", "install", { url: "mem://aaa" }), []);

  // All setup now

  t.is(await query("aaa", "out"), "Hello Alice");
  t.is(await query("bbb", "sayHello"), "Hello Bob");

  // Make a new version and flush it
  krlUrls["mem://bbb"] = `ruleset bbb {
      meta {
        configure using configured_name = "Bob"
        provides sayHello
        shares sayHello
      }
      global {
        sayHello = function(){
          return "v2!!! hi " + configured_name
        }
      }
    }`;
  await new Promise((res) => setTimeout(res, 120)); // need to wait until the flush memoize clears
  t.deepEqual(await signal("main", "flush", { url: "mem://bbb" }), []);

  // Now we should see new version
  t.is(await query("bbb", "sayHello"), "v2!!! hi Bob");
  t.is(await query("aaa", "out"), "v2!!! hi Alice");
});
