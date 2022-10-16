import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("schedule.krl", async t => {
  const { signal, mkQuery } = await startTestEngine(["schedule.krl"]);
  const query = mkQuery("io.picolabs.schedule");

  t.deepEqual(await signal("schedule", "clear_log"), [
    { name: "clear_log", options: {} }
  ]);

  t.deepEqual(await query("getLog"), []);
  t.deepEqual(await query("listScheduled"), []);

  t.deepEqual(await signal("schedule", "in_5min", { name: "foo" }), [
    { name: "in_5min", options: {} }
  ]);
  let scheduled = await query("listScheduled");
  t.is(scheduled.length, 1);
  let in5min = scheduled[0];
  t.is(in5min.type, "at");

  t.deepEqual(await signal("schedule", "every_1min", { name: "bar" }), [
    { name: "every_1min", options: {} }
  ]);
  scheduled = await query("listScheduled");
  t.is(scheduled.length, 2);
  let every1min = scheduled[1];
  t.is(every1min.type, "repeat");

  t.deepEqual(await query("listScheduled"), [in5min, every1min]);
  t.deepEqual(await query("getLog"), [
    { "scheduled in_5min": in5min },
    { "scheduled every_1min": every1min }
  ]);
});
