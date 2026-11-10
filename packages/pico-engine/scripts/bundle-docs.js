#!/usr/bin/env node
// prepack: copy the repo-root docs the dev MCP server serves into the package,
// so npm-installed engines still have them. Output (mcp/docs/) is gitignored.
"use strict";
const fs = require("fs");
const path = require("path");

const pkgDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(pkgDir, "..", "..");
const outDir = path.join(pkgDir, "mcp", "docs");

const files = [
  ["docs/pico-overview.md", "pico-overview.md"],
  ["docs/pico-engine.md", "pico-engine.md"],
  ["CLAUDE.md", "CLAUDE.md"],
];

fs.mkdirSync(outDir, { recursive: true });
for (const [src, dest] of files) {
  const from = path.join(repoRoot, src);
  if (!fs.existsSync(from)) {
    console.error(`bundle-docs: missing ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(outDir, dest));
}
console.log(`bundle-docs: copied ${files.length} files to mcp/docs/`);
