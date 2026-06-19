import test from "ava";
import {
  allowAllChannelConf,
  startTestEngine,
} from "../helpers/startTestEngine";
import { toTestKrlURL } from "../helpers/toTestKrlURL";

test("deleting a pico with scheduled tasks does not break the engine (Fixes #578)", async t => {
  const { pe, mkQuery } = await startTestEngine(["schedule.krl"]);

  const rs = await pe.rsRegistry.load(toTestKrlURL("schedule.krl"));
  const familyEci = await pe.pf.rootPico.newPico({
    rulesets: [{ rs: rs.ruleset }],
  });
  const child = pe.pf.getPico(familyEci);
  const childChannel = await child.newChannel(allowAllChannelConf);
  const childEci = childChannel.id;

  const signal = (domain: string, name: string, attrs: any = {}) =>
    pe.pf.eventWait({
      eci: childEci,
      domain,
      name,
      data: { attrs },
      time: 0,
    });

  const query = (name: string, args: any = {}) =>
    pe.pf.query({
      eci: childEci,
      rid: "io.picolabs.schedule",
      name,
      args,
    });

  await signal("schedule", "every_1min", { name: "orphan" });
  const scheduled = await query("listScheduled");
  t.is(scheduled.length, 1);
  t.is(scheduled[0].type, "repeat");

  await pe.pf.rootPico.delPico(familyEci);

  t.throws(() => pe.pf.getPico(childEci), { message: /ECI not found/ });

  // Engine still serves queries on surviving picos after proactive cleanup.
  const rootBox = await mkQuery("io.picolabs.pico-engine-ui")("box");
  t.truthy(rootBox.eci);
  t.is(pe.pf.numberOfPicos(), 1);
});
