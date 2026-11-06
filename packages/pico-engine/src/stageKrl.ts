import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { toFileUrl } from "./utils/toFileUrl";

const STAGE_DIR = path.join(os.tmpdir(), "pico-engine-staged-krl");

/** Write KRL source to a temp file and return a file:// URL the registry can load. */
export function stageKrlContent(content: string, filename: string): string {
  if (typeof content !== "string" || !/^ruleset\s+/m.test(content)) {
    throw new Error("File must contain a KRL ruleset (starting with ruleset …)");
  }
  let base = path.basename(filename || "staged.krl");
  if (!base.toLowerCase().endsWith(".krl")) {
    base = base + ".krl";
  }
  base = base.replace(/[^\w.-]+/g, "_");
  if (base === ".krl" || base === "") {
    base = "staged.krl";
  }

  fs.mkdirSync(STAGE_DIR, { recursive: true });
  const dest = path.join(STAGE_DIR, `${Date.now()}-${base}`);
  fs.writeFileSync(dest, content, { encoding: "utf8", flag: "wx" });
  return toFileUrl(dest);
}
