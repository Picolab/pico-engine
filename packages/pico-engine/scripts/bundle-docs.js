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
// Copied with their folder structure, as mcp/docs/<dir>/...
const dirs = [
  "docs/cookbook",
  "docs/patterns_and_tips",
  "docs/wrangler",
  "docs/exp",
  "docs/lessons",
  "docs/developing",
];

function copyMarkdown(fromDir, toDir) {
  let count = 0;
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) count += copyMarkdown(from, to);
    else if (entry.name.endsWith(".md")) {
      fs.copyFileSync(from, to);
      count++;
    }
  }
  return count;
}

fs.mkdirSync(outDir, { recursive: true });
for (const [src, dest] of files) {
  const from = path.join(repoRoot, src);
  if (!fs.existsSync(from)) {
    console.error(`bundle-docs: missing ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(outDir, dest));
}
let copied = files.length;
for (const dir of dirs) {
  const from = path.join(repoRoot, dir);
  if (!fs.existsSync(from)) {
    console.error(`bundle-docs: missing ${dir}`);
    process.exit(1);
  }
  copied += copyMarkdown(from, path.join(outDir, path.basename(dir)));
}
console.log(`bundle-docs: copied ${copied} files to mcp/docs/`);
