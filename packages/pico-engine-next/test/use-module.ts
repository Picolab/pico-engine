import test from "ava";
import * as cuid from "cuid";
import * as path from "path";
import * as tempDir from "temp-dir";
import { PicoEngineConfiguration } from "../src";
import { startTestEngine } from "./helpers/startTestEngine";

test("use-module install order", async (t) => {
  const krlUrls: { [url: string]: string } = {
    "mem://main": `ruleset main {
      rule install {
        select when main:install
        ctx:install(event:attrs{"url"})
      }
    }`,
    "mem://aaa": `ruleset aaa{meta{use module bbb}}`,
    "mem://bbb": `ruleset bbb{}`,
    "mem://ccc": `ruleset ccc{meta{use module bbb}}`,
  };
  const peConf: PicoEngineConfiguration = {
    home: path.resolve(tempDir, "pico-engine", cuid()),
    async __test__memFetchKrl(url) {
      if (/io.picolabs.next.krl/.test(url)) {
        return krlUrls["mem://main"];
      }
      return krlUrls[url];
    },
  };

  const pe0 = await startTestEngine([], peConf);

  let err = await t.throwsAsync(
    pe0.signal("main", "install", { url: "mem://aaa" })
  );
  t.is("" + err, "Error: Module not found: bbb");
  err = await t.throwsAsync(
    pe0.signal("main", "install", { url: "mem://ccc" })
  );
  t.is("" + err, "Error: Module not found: bbb");
  t.deepEqual(await pe0.signal("main", "install", { url: "mem://bbb" }), []);
  t.deepEqual(await pe0.signal("main", "install", { url: "mem://aaa" }), []);
  t.deepEqual(await pe0.signal("main", "install", { url: "mem://ccc" }), []);

  // TODO re-start the engine to test load order
});
