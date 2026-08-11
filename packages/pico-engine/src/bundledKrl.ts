import * as fs from "fs";
import * as path from "path";
import { toFileUrl } from "./utils/toFileUrl";

/**
 * OS-layer rulesets shipped inside the pico-engine package. On flush, these
 * always reload from the running engine's krl/ directory so dev edits apply
 * even when the pico was provisioned from a different absolute file:// path.
 */
export const BUNDLED_KRL_FILES = [
  "io.picolabs.pico-engine-ui.krl",
  "io.picolabs.wrangler.krl",
  "io.picolabs.subscription.krl",
  "io.picolabs.pds.krl",
];

export function bundledKrlDir(): string {
  return path.resolve(__dirname, "..", "krl");
}

export function resolveBundledKrlUrl(url: string): string {
  let filename: string | null = null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "file:") {
      filename = path.basename(parsed.pathname);
    }
  } catch {
    return url;
  }

  if (!filename || !BUNDLED_KRL_FILES.includes(filename)) {
    return url;
  }

  const localPath = path.join(bundledKrlDir(), filename);
  if (fs.existsSync(localPath)) {
    return toFileUrl(localPath);
  }

  return url;
}
