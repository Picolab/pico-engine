/**
 * Scheduled job clearing when picos or rulesets change.
 */

import test from "ava";
import { PicoFramework } from "../src";
import { rulesetRegistry } from "./helpers/rulesetRegistry";
import { mkdb } from "./helpers/mkdb";

test("clearSchedule", async function (t) {
  let log: string[] = [];

  const rsReg = rulesetRegistry();

  const pf = new PicoFramework({ db: mkdb(), rulesetLoader: rsReg.loader });
  rsReg.add({
    rid: "rid.A",
    init(ctx) {
      return {
        event(event) {
          log.push(`rid.A - ${event.domain}:${event.name}`);
          if (event.name === "clear") {
            ctx.clearSchedule();
          }
        },
      };
    },
  });
  rsReg.add({
    rid: "rid.B",
    init(ctx) {
      return {
        event(event) {
          log.push(`rid.B - ${event.domain}:${event.name}`);
        },
      };
    },
  });
  await pf.start();
  const pico = pf.rootPico;
  await pico.install(rsReg.get("rid.A"), {});
  await pico.install(rsReg.get("rid.B"), {});
  const eci = (await pico.newChannel()).id;

  t.deepEqual(log, []);

  await pf.eventWait({ eci, domain: "a", name: "a" } as any);
  t.deepEqual(log, ["rid.A - a:a", "rid.B - a:a"]);
  log = [];

  await pf.eventWait({ eci, domain: "a", name: "clear" } as any);
  t.deepEqual(log, [
    "rid.A - a:clear",
    // NOTE: rid.B does not run
  ]);
});
