import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");
// Keep in step with XMLUI_RUNTIME_VERSION (src/xmluiRuntime.ts),
// xmluiRuntimeVersion (krl/io.picolabs.xmlui.krl), and pico-view-boot.js.
const version = "0.14.28";
const standalone = "package/dist/standalone/xmlui-standalone.umd.js";
const destDir = path.join(pkgRoot, "public", "xmlui");
const dest = path.join(destDir, `${version}.js`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "xmlui-runtime-"));
try {
  const tarball = execFileSync(
    "npm",
    ["pack", `xmlui@${version}`, "--silent", "--pack-destination", tmp],
    { encoding: "utf8" }
  ).trim();
  execFileSync("tar", ["xzf", path.join(tmp, tarball), "-C", tmp, standalone]);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(path.join(tmp, standalone), dest);
  console.log(`copy-xmlui-runtime: wrote ${dest}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
