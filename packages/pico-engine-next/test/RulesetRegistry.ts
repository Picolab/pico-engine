import test from "ava";
import * as cuid from "cuid";
import * as fs from "fs";
import * as makeDir from "make-dir";
import * as path from "path";
import * as tempDir from "temp-dir";
import { RulesetRegistry } from "../src/RulesetRegistry";

test("RulesetRegistry", async t => {
  const dir = path.resolve(tempDir, "pico-engine", cuid());
  await makeDir(dir);

  await fs.promises.writeFile(
    path.resolve(dir, "krl0.krl"),
    `ruleset rid.hello { }`
  );

  const file0 = path.resolve(dir, "krl0.krl");
  const url0 = fileUrl(file0);

  const rsReg = new RulesetRegistry(dir);

  let rs = await rsReg.load(url0);
  t.is(rs.ruleset.rid, "rid.hello");
  t.is(rs.ruleset.version, "draft");

  await fs.promises.writeFile(file0, `ruleset rid.hello { version "1.0.0" }`);
  t.is((await rsReg.load(url0)).ruleset.version, "draft");
  t.is((await rsReg.flush(url0)).ruleset.version, "1.0.0");
  t.is((await rsReg.load(url0)).ruleset.version, "1.0.0");

  t.deepEqual(await rsReg.picoRulesetUrls("p0"), []);
  await rsReg.subscribe("p0", url0);
  t.deepEqual(await rsReg.picoRulesetUrls("p0"), [url0]);
  t.deepEqual(await rsReg.picoRulesetUrls("p1"), []);
  await rsReg.unsubscribe("p0", url0);
  t.deepEqual(await rsReg.picoRulesetUrls("p0"), []);
});

function fileUrl(str: string) {
  var pathName = path.resolve(str).replace(/\\/g, "/");
  if (pathName[0] !== "/") {
    pathName = "/" + pathName; // for windows
  }
  return encodeURI("file://" + pathName);
}
