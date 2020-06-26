import test from "ava";
import * as cuid from "cuid";
import * as fs from "fs";
import * as makeDir from "make-dir";
import * as path from "path";
import * as tempDir from "temp-dir";
import { RulesetRegistry } from "../src/RulesetRegistry";
import { RulesetRegistryLoaderFs } from "../src/RulesetRegistryLoaderFs";
import { toFileUrl } from "../src/utils/toFileUrl";

test("RulesetRegistry", async t => {
  const dir = path.resolve(tempDir, "pico-engine", cuid());
  await makeDir(dir);

  await fs.promises.writeFile(
    path.resolve(dir, "krl0.krl"),
    `ruleset rid.hello { }`
  );

  const file0 = path.resolve(dir, "krl0.krl");
  const url0 = toFileUrl(file0);

  const rsReg = new RulesetRegistry(RulesetRegistryLoaderFs(dir));

  let rs = await rsReg.load(url0);
  t.is(rs.ruleset.rid, "rid.hello");
  t.is(rs.ruleset.version, "draft");

  await fs.promises.writeFile(file0, `ruleset rid.hello { version "1.0.0" }`);
  await sleep(200);
  t.is((await rsReg.load(url0)).ruleset.version, "draft");
  await sleep(200);
  t.is((await rsReg.flush(url0)).ruleset.version, "1.0.0");
  await sleep(200);
  t.is((await rsReg.load(url0)).ruleset.version, "1.0.0");
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}