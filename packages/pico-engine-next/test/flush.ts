import test from "ava";
import { startTestEngine } from "./helpers/startTestEngine";

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

  const { signal, mkQuery } = await startTestEngine([], {
    async __test__memFetchKrl(url) {
      if (/io.picolabs.next.krl/.test(url)) {
        return krlUrls["mem://main"];
      }
      return krlUrls[url];
    },
  });
  const query = mkQuery("main");

  t.deepEqual(await query("talk"), "v0");

  krlUrls["mem://main"] = mkKrlVersion("v1");
  await signal("main", "flush");

  t.deepEqual(await query("talk"), "v1");
});
