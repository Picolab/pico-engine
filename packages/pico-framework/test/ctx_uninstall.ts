/**
 * Ruleset ctx API: uninstall and entity cleanup.
 */

import * as _ from "lodash";
import test from "ava";
import { mkCtxTestEnv } from "./helpers/mkCtxTestEnv";

test("ctx.uninstall", async function (t) {
  const { pf, eci, event } = await mkCtxTestEnv();

  let resp = await event("uninstall", []);
  t.is(resp, undefined);

  await pf.eventWait({
    eci,
    domain: "ctx",
    name: "uninstall",
    data: { attrs: { args: ["rid.ctx"] } },
    time: Date.now(),
  });

  let err = await t.throwsAsync(
    pf.query({
      eci,
      rid: "rid.ctx",
      name: "_lastResult",
      args: {},
    })
  );
  t.is(err + "", "Error: Pico doesn't have rid.ctx installed.");
});

test("ctx.uninstall - clear ent vars", async function (t) {
  const { pf, eci, event, rsReg } = await mkCtxTestEnv();

  rsReg.add({
    rid: "foo.bar",
    init(ctx) {
      return {
        event(event) {
          ctx.putEnt(event.domain, event.name);
        },
        query: {
          ent(key) {
            return ctx.getEnt(key.args.key);
          },
        },
      };
    },
  });

  function putEnt(key: string, value: string) {
    return pf.eventWait({
      eci,
      domain: key,
      name: value,
      data: { attrs: {} },
      time: Date.now(),
    });
  }

  function getEnt(key: string) {
    return pf.query({
      eci,
      rid: "foo.bar",
      name: "ent",
      args: { key },
    });
  }

  await pf.rootPico.install(rsReg.get("foo.bar"));

  await putEnt("aaaa", "one");
  await putEnt("bbbb", "two");
  await putEnt("cccc", "three");

  t.is(await getEnt("aaaa"), "one");
  t.is(await getEnt("bbbb"), "two");
  t.is(await getEnt("cccc"), "three");

  await pf.eventWait({
    eci,
    domain: "ctx",
    name: "uninstall",
    data: { attrs: { args: ["foo.bar"] } },
    time: Date.now(),
  });

  let err = await t.throwsAsync(() => getEnt("aaaa"));
  t.is(err + "", "Error: Pico doesn't have foo.bar installed.");

  await pf.rootPico.install(rsReg.get("foo.bar"));

  t.is(await getEnt("aaaa"), null);
  t.is(await getEnt("bbbb"), null);
  t.is(await getEnt("cccc"), null);
});
