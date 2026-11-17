/**
 * Many picos loading one ruleset share a single compile of its cache file.
 */

import test from "ava";
import * as fs from "fs";
import * as path from "path";
import { createRulesetRegistryLoaderFs } from "../src/RulesetRegistryLoaderFs";
import { tmpHome } from "./helpers/tmpHome";

const KRL = `ruleset rid.once { meta { version "1" } }`;
const HASH = "ab" + "cd" + "0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab";

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: fs.Dirent[] = [];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (err: any) {
    if (err && err.code === "ENOENT") return out;
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

test("concurrent compiles of one ruleset write one cache file", async (t) => {
  const dir = tmpHome();
  const { loader, close } = await createRulesetRegistryLoaderFs(dir);
  try {
    const loads = await Promise.all(
      Array.from({ length: 24 }, () =>
        loader.compileAndLoad("file:///rid.once.krl", KRL, HASH)
      )
    );
    t.is(loads.length, 24);
    for (const loaded of loads) {
      t.is(loaded.ruleset.rid, "rid.once");
      t.is(typeof loaded.ruleset.init, "function");
    }
    const files = await walk(path.join(dir, "rulesets"));
    t.deepEqual(
      files.filter((file) => file.endsWith(".tmp")),
      []
    );
    t.deepEqual(
      files.filter((file) => file.endsWith(".js")).map((file) => path.basename(file)),
      [`${HASH}.js`]
    );
    const again = await loader.compileAndLoad("file:///rid.once.krl", KRL, HASH);
    t.is(again.ruleset.rid, "rid.once");
  } finally {
    await close();
  }
});
