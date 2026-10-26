#!/usr/bin/env node
/**
 * Regenerate tools/krl-schema/samples/*.md from bundled engine KRL and fail on diff (U8).
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../..");
const cli = path.join(__dirname, "cli.js");
const samplesDir = path.join(__dirname, "samples");

const bundled = [
  "packages/pico-engine/krl/io.picolabs.wrangler.krl",
  "packages/pico-engine/krl/io.picolabs.pds.krl",
  "packages/pico-engine/krl/io.picolabs.oauth.krl",
  "packages/pico-engine/krl/io.picolabs.subscription.krl",
  "packages/pico-engine/krl/io.picolabs.pico-engine-ui.krl",
  "packages/pico-engine/krl/io.picolabs.portable_subtree.krl",
];

let failed = false;

for (const rel of bundled) {
  const krlPath = path.join(repoRoot, rel);
  const base = path.basename(rel, ".krl");
  const samplePath = path.join(samplesDir, `${base}.md`);
  if (!fs.existsSync(krlPath)) {
    console.error(`Missing KRL: ${rel}`);
    failed = true;
    continue;
  }
  const generated = execSync(
    `node "${cli}" -q -f markdown "${krlPath}"`,
    { encoding: "utf8", cwd: repoRoot },
  );
  if (!fs.existsSync(samplePath)) {
    console.error(`Missing sample (create it): ${path.relative(repoRoot, samplePath)}`);
    failed = true;
    continue;
  }
  const expected = fs.readFileSync(samplePath, "utf8");
  if (generated !== expected) {
    console.error(`Schema doc drift: ${base}.md`);
    console.error(`  Update: node tools/krl-schema/cli.js -f markdown -o ${path.relative(repoRoot, samplePath)} ${rel}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log(`krl-schema samples OK (${bundled.length} bundled rulesets)`);
