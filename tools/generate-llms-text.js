#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const docsDir = path.join(repoRoot, "packages/pico-engine/public/docs");

const overviewSrc = path.join(repoRoot, "docs/design/pico-overview.md");
const overviewDest = path.join(docsDir, "pico-overview.md");
if (fs.existsSync(overviewSrc)) {
  fs.copyFileSync(overviewSrc, overviewDest);
} else {
  console.warn("warn: missing docs/design/pico-overview.md — skip sync");
}

const samplesDir = path.join(repoRoot, "tools/krl-schema/samples");
const rulesetsDocsDir = path.join(docsDir, "rulesets");
const bundledSampleMd = [
  "io.picolabs.wrangler.md",
  "io.picolabs.pds.md",
  "io.picolabs.subscription.md",
  "io.picolabs.pico-engine-ui.md",
  "io.picolabs.oauth.md",
  "io.picolabs.portable_subtree.md",
];
fs.mkdirSync(rulesetsDocsDir, { recursive: true });
for (const name of bundledSampleMd) {
  const src = path.join(samplesDir, name);
  const dest = path.join(rulesetsDocsDir, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`warn: missing krl-schema sample ${name}`);
  }
}

const indexPaths = [
  { title: "Pico overview", file: "pico-overview.md" },
  { title: "Pico engine operator guide", file: "pico-engine.md" },
  { title: "Bundled rulesets", file: "rulesets/README.md" },
  { title: "KRL manual", file: "krl/README.md" },
  { title: "Contributing", file: "contributing.md" },
];

function read(rel) {
  const p = path.join(docsDir, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

const llmsLines = [
  "# Pico Engine docs (llms.txt)",
  "",
  "Machine-readable index for agents working with picos and KRL.",
  "",
  "## Start here",
  "",
  "- Local dev: `npm install -g pico-engine` then `pico-engine` (or repo `npm start`)",
  "- Agent loop: repo `CLAUDE.md` + `pico-engine mcp --stdio` (see packages/pico-engine/README.md)",
  "- Validate KRL: `krl-check` / `npm run krl-check`",
  "",
  "## Docs",
  "",
];

for (const entry of indexPaths) {
  llmsLines.push(`- ${entry.title}: ${entry.file}`);
}

llmsLines.push("", "## Bundled ruleset API (generated from KRL)", "");
for (const name of bundledSampleMd) {
  llmsLines.push(`- ${name.replace(/\.md$/, "")}: rulesets/${name}`);
}

llmsLines.push(
  "",
  "## Manifold (mesh framework — separate repo)",
  "",
  "Application layer on wrangler (owner, thing, community). Not shipped inside pico-engine.",
  "- Index: https://github.com/Picolab/manifold-api/blob/main/docs/llms.txt",
  "- Generated ruleset APIs: https://github.com/Picolab/manifold-api/tree/main/docs/rulesets",
  "",
);

llmsLines.push("", "## OpenAPI", "", "- Sky and channel HTTP: public/docs/openapi.yaml", "");

const fullParts = [];
for (const entry of indexPaths) {
  const body = read(entry.file);
  if (!body) continue;
  fullParts.push(`\n\n---\n\n# ${entry.title}\n\n${body}`);
}

fs.writeFileSync(path.join(docsDir, "llms.txt"), llmsLines.join("\n"));
fs.writeFileSync(
  path.join(docsDir, "llms-full.txt"),
  `# Pico Engine — full text bundle\n${fullParts.join("")}\n`
);

console.log("Wrote public/docs/llms.txt and llms-full.txt");
