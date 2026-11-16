/**
 * Ruleset re-initialization after code changes.
 */

import test from "ava";
import { PicoFramework, Ruleset } from "../src";
import { rulesetRegistry } from "./helpers/rulesetRegistry";
import { mkdb } from "./helpers/mkdb";

test("reInitRuleset", async function (t) {
  const rsReg = rulesetRegistry();
  const pf = new PicoFramework({ db: mkdb(), rulesetLoader: rsReg.loader });
  await pf.start();
  const pico = await pf.rootPico;
  const eci = (await pico.newChannel()).id;

  rsReg.add({
    rid: "rid.A",
    init() {
      return { query: { foo: () => "one" } };
    },
  });
  await pico.install(rsReg.get("rid.A"));
  const daQuery = {
    eci,
    rid: "rid.A",
    name: "foo",
    args: {},
  };

  let res = await pf.query(daQuery);
  t.is(res, "one");

  const newDraft: Ruleset = {
    rid: "rid.A",
    init() {
      return { query: { foo: () => "two" } };
    },
  };

  rsReg.add(newDraft);

  res = await pf.query(daQuery);
  t.is(res, "one", "We get same response b/c it hasn't yet been reloaded");

  await pico.reInitRuleset(newDraft);

  res = await pf.query(daQuery);
  t.is(res, "two");
});
