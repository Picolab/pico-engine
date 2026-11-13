#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const docsDir = path.join(repoRoot, "docs");

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
  { title: "Pico views", file: "pico-views.md" },
  { title: "Cookbook", file: "cookbook/README.md" },
  { title: "Cookbook: pico views", file: "cookbook/xmlui/README.md" },
  { title: "Cookbook: pico views instructions", file: "cookbook/xmlui/instructions.md" },
  { title: "Cookbook: moving picos", file: "cookbook/moving_picos/README.md" },
  { title: "Cookbook: moving picos instructions", file: "cookbook/moving_picos/instructions.md" },
  { title: "Cookbook: echo", file: "cookbook/echo/README.md" },
  { title: "Cookbook: echo instructions", file: "cookbook/echo/instructions.md" },
  { title: "Cookbook: score tracker", file: "cookbook/score_tracker/README.md" },
  { title: "Cookbook: score tracker instructions", file: "cookbook/score_tracker/instructions.md" },
  { title: "Cookbook: child pico tasks", file: "cookbook/child_tasks/README.md" },
  { title: "Cookbook: child pico tasks instructions", file: "cookbook/child_tasks/instructions.md" },
  { title: "Cookbook: two picos talking", file: "cookbook/two_picos/README.md" },
  { title: "Cookbook: two picos talking instructions", file: "cookbook/two_picos/instructions.md" },
  { title: "Cookbook: guard rules", file: "cookbook/guard_rules/README.md" },
  { title: "Cookbook: guard rules instructions", file: "cookbook/guard_rules/instructions.md" },
  { title: "Cookbook: layered rulesets", file: "cookbook/layered_rulesets/README.md" },
  { title: "Cookbook: layered rulesets instructions", file: "cookbook/layered_rulesets/instructions.md" },
  { title: "Cookbook: collection", file: "cookbook/collection/README.md" },
  { title: "Cookbook: collection instructions", file: "cookbook/collection/instructions.md" },
  { title: "Cookbook: configuration and secrets", file: "cookbook/secrets/README.md" },
  { title: "Cookbook: configuration and secrets instructions", file: "cookbook/secrets/instructions.md" },
  { title: "Cookbook: bootstrap and channels", file: "cookbook/bootstrap/README.md" },
  { title: "Cookbook: bootstrap and channels instructions", file: "cookbook/bootstrap/instructions.md" },
  { title: "Cookbook: KBlog", file: "cookbook/kblog/README.md" },
  { title: "Cookbook: KBlog instructions", file: "cookbook/kblog/instructions.md" },
  { title: "Patterns and tips", file: "patterns_and_tips/README.md" },
  { title: "Tip: initializing entity variables", file: "patterns_and_tips/initializing-entity-variables.md" },
  { title: "Tip: arrays and maps", file: "patterns_and_tips/arrays-and-maps.md" },
  { title: "Tip: decoding form-encoded data", file: "patterns_and_tips/decoding-form-data.md" },
  { title: "Tip: importing tables and CSV", file: "patterns_and_tips/tabular-data.md" },
  { title: "Tip: converting time formats", file: "patterns_and_tips/converting-time-formats.md" },
  { title: "Tip: what's in a name", file: "patterns_and_tips/names-and-scope.md" },
  { title: "Tip: events and queries over HTTP", file: "patterns_and_tips/events-and-queries-over-http.md" },
  { title: "Tip: cookies and redirects", file: "patterns_and_tips/cookies-and-redirects.md" },
  { title: "Tip: events from email", file: "patterns_and_tips/events-from-email.md" },
  { title: "Tip: reading the engine's log files", file: "patterns_and_tips/engine-log-files.md" },
  { title: "Tip: querying another pico", file: "patterns_and_tips/querying-another-pico.md" },
  { title: "Tip: accepting relationship requests", file: "patterns_and_tips/accepting-relationship-requests.md" },
  { title: "Tip: one pico per resource", file: "patterns_and_tips/singleton-picos.md" },
  { title: "Tip: hosting and checking rulesets", file: "patterns_and_tips/hosting-and-checking-rulesets.md" },
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

llmsLines.push("", "## OpenAPI", "", "- Sky and channel HTTP: docs/openapi.yaml", "");

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

console.log("Wrote docs/llms.txt and llms-full.txt");
