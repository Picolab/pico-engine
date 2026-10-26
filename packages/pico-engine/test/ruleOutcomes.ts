/**
 * Rule outcome reporting on event-wait HTTP-style core path.
 */

import test from "ava";
import {
  annotatedRuleOutcomesForEvent,
  collectRuntimeRuleOutcomes,
} from "pico-engine-core/dist/ruleOutcomes";
import { ChannelConfig } from "pico-framework";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

const allowAllChannelConf: ChannelConfig = {
  tags: ["test"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};
import { toTestKrlURL } from "./helpers/toTestKrlURL";

test("eventWait includes annotated rule outcomes", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ch = await root.newChannel(allowAllChannelConf);
  const eci = ch.id;

  const url = toTestKrlURL("io.picolabs.test.rule_outcomes.krl");
  await pe.pf.rootPicos()[0].install(
    (await pe.rsRegistry.load(url)).ruleset,
    { url }
  );

  async function outcomesFor(domain: string, name: string, attrs: object) {
    const resp = await pe.pf.eventWait({
      eci,
      domain,
      name,
      data: { attrs },
      time: 0,
    });
    const pico = pe.pf.getPico(eci);
    return annotatedRuleOutcomesForEvent(
      pico,
      pe.rsRegistry,
      domain,
      name,
      collectRuntimeRuleOutcomes(resp.responses)
    );
  }

  const empty = await outcomesFor("test", "probe", {});
  t.is(empty.find((o) => o.rule === "gate")?.status, "not_fired");
  t.is(empty.find((o) => o.rule === "narrow")?.status, "not_selected");

  const hit = await outcomesFor("test", "probe", { mode: "x" });
  t.is(hit.find((o) => o.rule === "narrow")?.status, "fired");

  await pe.pf.db.close();
});
