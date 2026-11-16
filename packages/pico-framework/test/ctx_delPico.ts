/**
 * Ruleset ctx API: delPico.
 */

import * as _ from "lodash";
import test from "ava";
import { mkCtxTestEnv } from "./helpers/mkCtxTestEnv";
import { getAllECIsFromDB } from "./helpers/inspect";

test("ctx.delPico", async function (t) {
  const { pf, event, query, rsReg, genID } = await mkCtxTestEnv();

  genID();
  await pf.getPico("id1").newPico({ rulesets: [{ rs: rsReg.get("rid.ctx") }] });

  let me = await query("pico");
  t.deepEqual(me.children, ["id5"]);

  // grand children
  await event("event", [{ eci: "id5", domain: "ctx", name: "newPico" }]);
  await event("event", [{ eci: "id5", domain: "ctx", name: "newPico" }]);

  let err = await t.throwsAsync(event("delPico"));
  t.is(err + "", "Error: delPico(undefined) - not found in children ECIs");

  err = await t.throwsAsync(event("delPico", ["one"]));
  t.is(err + "", "Error: delPico(one) - not found in children ECIs");

  for (const eci of await getAllECIsFromDB(pf)) {
    if (eci !== "id5") {
      // id5 is the only one that will delete a pico from the root
      err = await t.throwsAsync(event("delPico", [eci]));
      t.is(err + "", `Error: delPico(${eci}) - not found in children ECIs`);
    }
  }
  t.is(pf.numberOfPicos(), 4, "root -> child -> grandchild,grandchild");
  await event("delPico", ["id5"]);
  t.is(pf.numberOfPicos(), 1, "only root pico now");
});
