import test from "ava";
import * as fs from "fs";
import { stageKrlContent } from "../src/stageKrl";

test("stageKrlContent writes ruleset and returns file URL", (t) => {
  const url = stageKrlContent(
    'ruleset io.test.stage {\n  meta { shares x }\n  global { x = function() { 1 } }\n}\n',
    "io.test.stage.krl"
  );
  t.true(url.startsWith("file://"));
  const path = decodeURI(url.replace(/^file:\/\//, ""));
  t.true(fs.existsSync(path));
  t.true(fs.readFileSync(path, "utf8").includes("ruleset io.test.stage"));
});

test("stageKrlContent rejects non-ruleset", (t) => {
  t.throws(() => stageKrlContent("not krl", "x.krl"));
});
