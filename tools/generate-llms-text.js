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
  { title: "Developing with Picos", file: "developing/README.md" },
  { title: "Developing: Programming Workflow", file: "developing/workflow.md" },
  { title: "Developing: Event Loop Introduction", file: "developing/event-loop.md" },
  { title: "Developing: Tips", file: "developing/tips.md" },
  { title: "Developing: Event and Query URLs with Postman", file: "developing/postman.md" },
  { title: "Developing: KRL misconceptions and common errors", file: "developing/misconceptions.md" },
  { title: "Tip: initializing entity variables", file: "developing/initializing-entity-variables.md" },
  { title: "Tip: arrays and maps", file: "developing/arrays-and-maps.md" },
  { title: "Tip: decoding form-encoded data", file: "developing/decoding-form-data.md" },
  { title: "Tip: importing tables and CSV", file: "developing/tabular-data.md" },
  { title: "Tip: converting time formats", file: "developing/converting-time-formats.md" },
  { title: "Tip: what's in a name", file: "developing/names-and-scope.md" },
  { title: "Tip: cookies and redirects", file: "developing/cookies-and-redirects.md" },
  { title: "Tip: events from email", file: "developing/events-from-email.md" },
  { title: "Tip: reading the engine's log files", file: "developing/engine-log-files.md" },
  { title: "Tip: querying another pico", file: "developing/querying-another-pico.md" },
  { title: "Tip: accepting relationship requests", file: "developing/accepting-relationship-requests.md" },
  { title: "Tip: one pico per resource", file: "developing/singleton-picos.md" },
  { title: "Pico engine operator guide", file: "pico-engine.md" },
  { title: "Pico views", file: "pico-views.md" },
  { title: "Programming lessons", file: "lessons/README.md" },
  { title: "Lesson: Quickstart", file: "lessons/quickstart.md" },
  { title: "Lesson: Events and Queries", file: "lessons/events-and-queries.md" },
  { title: "Lesson: Pico State", file: "lessons/pico-state.md" },
  { title: "Lesson: Modules and External APIs", file: "lessons/modules-and-apis.md" },
  { title: "Lesson: Pico views", file: "lessons/pico-views.md" },
  { title: "Lesson: Pico-Based Systems", file: "lessons/pico-based-systems.md" },
  { title: "Lesson: Relationships", file: "lessons/relationships.md" },
  { title: "Lesson: Scatter-Gather", file: "lessons/scatter-gather.md" },
  { title: "Lesson: Gossip Lab", file: "lessons/gossip.md" },
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
  { title: "Cookbook: querying JSON", file: "cookbook/json_query/README.md" },
  { title: "Cookbook: querying JSON instructions", file: "cookbook/json_query/instructions.md" },
  { title: "Wrangler: the pico operating system", file: "wrangler/README.md" },
  { title: "Wrangler: the wrangler ruleset", file: "wrangler/wrangler.md" },
  { title: "Wrangler: managing channels", file: "wrangler/channels.md" },
  { title: "Wrangler: relationships", file: "wrangler/relationships.md" },
  { title: "Wrangler: pico data store", file: "wrangler/pds.md" },
  { title: "Wrangler: pico views (io.picolabs.xmlui)", file: "wrangler/xmlui.md" },
  { title: "Wrangler: OAuth (io.picolabs.oauth)", file: "wrangler/oauth.md" },
  { title: "Wrangler: portable subtrees (io.picolabs.portable_subtree)", file: "wrangler/portable-subtree.md" },
  { title: "Event Exchange Protocol", file: "exp/README.md" },
  { title: "EXP: Event API (Sky)", file: "exp/event.md" },
  { title: "EXP: Query API (Sky)", file: "exp/query.md" },
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

llmsLines.push("", "## OpenAPI", "", "- Event Exchange Protocol (Sky) HTTP: docs/openapi.yaml", "");

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
