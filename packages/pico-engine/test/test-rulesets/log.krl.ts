import test from "ava";
import { makeKrlLogger } from "krl-stdlib";
import { startTestEngine } from "../helpers/startTestEngine";

test("log.krl", async (t) => {
  const lines: any[] = [];
  const log = makeKrlLogger((line) => {
    const json = JSON.parse(line.trim());
    if (json.rid === "io.picolabs.log") {
      lines.push({ level: json.level, msg: json.msg });
    }
  });

  const { pe, eci } = await startTestEngine(["log.krl"], {
    log,
  });

  await pe.pf.eventWait({
    eci,
    domain: "log",
    name: "levels",
    data: { attrs: {} },
    time: 0,
  });

  t.deepEqual(lines, [
    { level: 50, msg: "event added to schedule" },
    { level: 50, msg: "rule selected" },
    { level: 50, msg: "fired" },
    { level: 30, msg: "hello default" },
    { level: 10, msg: "hello error" },
    { level: 20, msg: "hello warn" },
    { level: 30, msg: "hello info" },
    { level: 50, msg: "hello debug" },
  ]);
});
