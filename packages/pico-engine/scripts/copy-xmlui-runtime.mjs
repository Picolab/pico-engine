import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");
const version = "0.12.7";
const src = path.join(
  pkgRoot,
  "node_modules",
  "xmlui",
  "dist",
  "standalone",
  "xmlui-standalone.umd.js"
);
const destDir = path.join(pkgRoot, "public", "xmlui");
const dest = path.join(destDir, `${version}.js`);

if (!fs.existsSync(src)) {
  console.warn(
    "copy-xmlui-runtime: install the xmlui package first (npm install xmlui)"
  );
  process.exit(0);
}

/** Patches for pico-engine /ui/:eci/:rid/ hosting (S0 spike). */
function patchXmluiStandaloneForPicoEngine(js) {
  const outerRouter =
    /g\.jsx\(Je,\{children:g\.jsx\(nst,\{runtime:e,extensionManager:r\}\)\}\)/g;
  const replacement =
    'g.jsx(Je,{basename:window.__PUBLIC_PATH||"",children:g.jsx(nst,{runtime:e,extensionManager:r})})';
  if (!outerRouter.test(js)) {
    throw new Error(
      "copy-xmlui-runtime: expected startApp router wrapper not found (upgrade xmlui?)"
    );
  }
  return js.replace(outerRouter, replacement);
}

let js = fs.readFileSync(src, "utf8");
js = patchXmluiStandaloneForPicoEngine(js);

fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(dest, js);
console.log(`copy-xmlui-runtime: wrote patched ${dest}`);
