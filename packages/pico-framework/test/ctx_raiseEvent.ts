/**
 * Ruleset raiseEvent: delivery, cleanEvent, and forRid routing.
 */

import test from "ava";
import { PicoFramework } from "../src";
import { rulesetRegistry } from "./helpers/rulesetRegistry";
import { mkdb } from "./helpers/mkdb";

test("raiseEvent", async function (t) {
  const rsReg = rulesetRegistry();
  const pf = new PicoFramework({ db: mkdb(), rulesetLoader: rsReg.loader });
  await pf.start();

  rsReg.add({
    rid: "rid.raise",
    init(ctx) {
      const history: string[] = [];
      return {
        event(event) {
          switch (`${event.domain}:${event.name}`) {
            case "do:raise":
              history.push("doing raise");
              ctx.raiseEvent("got", "raise", { attrs: {} });
              break;
            case "got:raise":
              history.push("got the raise");
              break;
          }
        },
        query: {
          history: () => history,
        },
      };
    },
  });

  const pico = pf.rootPico;
  const eci = (await pico.newChannel()).id;
  await pico.install(rsReg.get("rid.raise"));

  let history = await pf.query({
    eci,
    rid: "rid.raise",
    name: "history",
    args: {},
  });
  t.is(history.join("|"), "");

  history = await pf.eventQuery(
    {
      eci,
      domain: "do",
      name: "raise",
      data: { attrs: {} },
      time: Date.now(),
    },
    {
      eci,
      rid: "rid.raise",
      name: "history",
      args: {},
    },
  );

  t.is(history.join("|"), "doing raise|got the raise");
});

test("raiseEvent should use cleanEvent", async function (t) {
  const history: any[] = [];
  let ctx: any;
  const rsReg = rulesetRegistry();
  const pf = new PicoFramework({ db: mkdb(), rulesetLoader: rsReg.loader });
  await pf.start();
  rsReg.add({
    rid: "rid.raise",
    init($ctx) {
      ctx = $ctx;
      return {
        event(event) {
          switch (`${event.domain}:${event.name}`) {
            case "no:domain":
              history.push("" + t.throws(() => ctx.raiseEvent()));
              break;
            case "no:name":
              history.push("" + t.throws(() => ctx.raiseEvent("foo")));
              break;
            case "no:attrs":
              ctx.raiseEvent("foo", "bar");
              break;
            default:
              history.push(
                `${event.eci}/${event.domain}:${event.name}?${JSON.stringify(
                  event.data.attrs,
                )}`,
              );
          }
        },
      };
    },
  });
  const pico = pf.rootPico;
  const eci = (await pico.newChannel()).id;
  await pico.install(rsReg.get("rid.raise"));

  function signal(domain: string, name: string) {
    return pf.eventWait({ eci, domain, name } as any);
  }

  t.deepEqual(history, []);
  await signal("no", "domain");
  t.deepEqual(history, ["Error: missing event.domain"]);
  await signal("no", "name");
  t.deepEqual(history, [
    "Error: missing event.domain",
    "Error: missing event.name",
  ]);
  await signal("no", "attrs");
  t.deepEqual(history, [
    "Error: missing event.domain",
    "Error: missing event.name",
    eci + "/foo:bar?{}",
  ]);
});

test("raiseEvent - forRid", async function (t) {
  let history: string[] = [];

  const rsReg = rulesetRegistry();
  const pf = new PicoFramework({ db: mkdb(), rulesetLoader: rsReg.loader });
  await pf.start();
  rsReg.add({
    rid: "rid.A",
    init(ctx) {
      return {
        event(event) {
          const dt = `${event.domain}:${event.name}`;
          switch (dt) {
            case "do:raise":
              history.push("doing raise");
              ctx.raiseEvent("got", "raise", {}, event.data.attrs.forRid);
              break;
            default:
              history.push("rid.A - " + dt);
              break;
          }
        },
      };
    },
  });
  rsReg.add({
    rid: "rid.A",
    init(ctx) {
      return {
        event(event) {
          history.push(`rid.A - ${event.domain}:${event.name}`);
          switch (`${event.domain}:${event.name}`) {
            case "do:raise":
              ctx.raiseEvent("got", "raise", {}, event.data.attrs.forRid);
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
          history.push(`rid.B - ${event.domain}:${event.name}`);
        },
      };
    },
  });
  const pico = pf.rootPico;
  await pico.install(rsReg.get("rid.A"));
  await pico.install(rsReg.get("rid.B"));
  const eci = (await pico.newChannel()).id;

  await pf.eventWait({ eci, domain: "aaa", name: "aaa" } as any);
  t.deepEqual(history, ["rid.A - aaa:aaa", "rid.B - aaa:aaa"]);
  history = [];

  await pf.eventWait({ eci, domain: "do", name: "raise" } as any);
  t.deepEqual(history, [
    "rid.A - do:raise",
    "rid.B - do:raise",
    "rid.A - got:raise",
    "rid.B - got:raise",
  ]);
  history = [];

  await pf.eventWait({
    eci,
    domain: "do",
    name: "raise",
    data: { attrs: { forRid: "rid.A" } },
  } as any);
  t.deepEqual(history, [
    "rid.A - do:raise",
    "rid.B - do:raise",
    "rid.A - got:raise",
  ]);
  history = [];

  await pf.eventWait({
    eci,
    domain: "do",
    name: "raise",
    data: { attrs: { forRid: "rid.B" } },
  } as any);
  t.deepEqual(history, [
    "rid.A - do:raise",
    "rid.B - do:raise",
    "rid.B - got:raise",
  ]);
  history = [];

  await pf.eventWait({
    eci,
    domain: "do",
    name: "raise",
    data: { attrs: { forRid: "404" } },
  } as any);
  t.deepEqual(history, ["rid.A - do:raise", "rid.B - do:raise"]);
});
