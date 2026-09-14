/**
 * Ruleset registry: load, cache, and resolve rulesets from URLs.
 */

import test from "ava";
import * as fs from "fs";
import * as makeDir from "make-dir";
import * as path from "path";
import { RulesetRegistry } from "pico-engine-core";
import { createRulesetRegistryLoaderFs } from "../src/RulesetRegistryLoaderFs";
import { toFileUrl } from "../src/utils/toFileUrl";
import { tmpHome } from "./helpers/tmpHome";

test("RulesetRegistry", async (t) => {
  const dir = tmpHome();
  await makeDir(dir);

  await fs.promises.writeFile(
    path.resolve(dir, "krl0.krl"),
    `ruleset rid.hello { meta { version "0.0.0" } }`
  );

  const file0 = path.resolve(dir, "krl0.krl");
  const url0 = toFileUrl(file0);

  const { loader } = await createRulesetRegistryLoaderFs(dir);
  const rsReg = new RulesetRegistry(loader);

  let rs = await rsReg.load(url0);
  t.is(rs.ruleset.rid, "rid.hello");
  t.is((rs.ruleset as any).meta.version, "0.0.0");

  await fs.promises.writeFile(
    file0,
    `ruleset rid.hello { meta { version "1.0.0" } }`
  );
  await sleep(200);
  t.is(((await rsReg.load(url0)).ruleset as any).meta.version, "0.0.0");
  await sleep(200);
  t.is(((await rsReg.flush(url0)).ruleset as any).meta.version, "1.0.0");
  await sleep(200);
  t.is(((await rsReg.load(url0)).ruleset as any).meta.version, "1.0.0");
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
