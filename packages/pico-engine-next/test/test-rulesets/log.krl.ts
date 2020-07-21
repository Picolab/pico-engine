import test from "ava";
import { PassThrough } from "stream";
import { KrlLogger } from "../../src/KrlLogger";
import { startTestEngine } from "../helpers/startTestEngine";

test("log.krl", async t => {
  const logStream = new PassThrough();
  const log = new KrlLogger(logStream, "");

  const lines: any[] = [];
  logStream.on("data", data => {
    const json = JSON.parse(data.toString().trim());
    if (json.rid === "io.picolabs.log") {
      lines.push({ level: json.level, msg: json.msg });
    }
  });

  const { pe, eci } = await startTestEngine(["log.krl"], {
    log
  });

  await pe.pf.eventWait({
    eci,
    domain: "log",
    name: "levels",
    data: { attrs: {} },
    time: 0
  });

  t.deepEqual(lines, [
    { level: 50, msg: "event added to schedule" },
    { level: 50, msg: "rule selected" },
    { level: 50, msg: "fired" },
    { level: 30, msg: "hello default" },
    { level: 10, msg: "hello error" },
    { level: 20, msg: "hello warn" },
    { level: 30, msg: "hello info" },
    { level: 50, msg: "hello debug" }
  ]);
});
