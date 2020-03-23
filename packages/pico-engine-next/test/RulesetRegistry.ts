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

  const krl0 = `ruleset rid.hello { }`;
  const krl1 = `ruleset rid.hello { version "1.0.0" }`;
  await fs.promises.writeFile(path.resolve(dir, "krl0.krl"), krl0);
  await fs.promises.writeFile(path.resolve(dir, "krl1.krl"), krl1);

  const url0 = fileUrl(path.resolve(dir, "krl0.krl"));
  const url1 = fileUrl(path.resolve(dir, "krl1.krl"));

  console.log(url0);
  console.log(url1);

  const rsReg = new RulesetRegistry(dir);

  const rs = await rsReg.load(url0);
  t.is(rs.ruleset.rid, "rid.hello");
  t.is(rs.ruleset.version, "draft");

  t.is(1, 1);
});

function fileUrl(str: string) {
  var pathName = path.resolve(str).replace(/\\/g, "/");
  if (pathName[0] !== "/") {
    pathName = "/" + pathName; // for windows
  }
  return encodeURI("file://" + pathName);
}
