#!/usr/bin/env node
// prepack: copy the repo-root demos/ into the package so npm-installed engines
// serve them at /krl/demos/ (the "Try It!" tab). postpack removes the copy,
// because in a checkout the engine reads the repo-root demos/ only when the
// package has none.
"use strict";
const fs = require("fs");
const path = require("path");

const pkgDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(pkgDir, "..", "..");
const src = path.join(repoRoot, "demos");
const dest = path.join(pkgDir, "demos");

if (process.argv[2] === "--clean") {
  fs.rmSync(dest, { recursive: true, force: true });
  console.log("bundle-demos: removed demos/");
  process.exit(0);
}

if (!fs.existsSync(src)) {
  console.error("bundle-demos: missing repo-root demos/");
  process.exit(1);
}
fs.rmSync(dest, { recursive: true, force: true });
let count = 0;
fs.cpSync(src, dest, {
  recursive: true,
  filter: (from) => {
    if (path.basename(from).startsWith(".")) return false;
    if (fs.statSync(from).isFile()) count++;
    return true;
  },
});
console.log(`bundle-demos: copied ${count} files to demos/`);
