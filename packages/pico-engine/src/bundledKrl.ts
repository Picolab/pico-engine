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

/** Rulesets that only function when installed on the mesh root pico. */
export const ROOT_ONLY_RULESET_RIDS = new Set(["io.picolabs.oauth"]);

export interface EngineKrlSource {
  rid: string;
  filename: string;
  relativePath: string;
  url: string;
  name?: string;
  description?: string;
  rootOnly?: boolean;
}

export function bundledKrlDir(): string {
  return path.resolve(__dirname, "..", "krl");
}

function walkKrlFiles(dir: string, baseDir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkKrlFiles(fullPath, baseDir, out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".krl")) {
      out.push(path.relative(baseDir, fullPath).split(path.sep).join("/"));
    }
  }
}

/** All `.krl` files under the engine's shipped `krl/` directory. */
export function listEngineKrlRelativePaths(): string[] {
  const root = bundledKrlDir();
  if (!fs.existsSync(root)) {
    return [];
  }
  const paths: string[] = [];
  walkKrlFiles(root, root, paths);
  return paths.sort();
}

function ridFromRelativePath(relativePath: string): string {
  const basename = path.basename(relativePath, ".krl");
  return basename;
}

function readKrlMeta(
  filePath: string
): Pick<EngineKrlSource, "rid" | "name" | "description"> {
  const text = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" }).slice(0, 4000);
  const ridMatch = text.match(/^ruleset\s+(\S+)/m);
  const nameMatch = text.match(/\bname\s+"([^"]+)"/);
  let description: string | undefined;
  const descQuoted = text.match(/\bdescription\s+"([^"]+)"/);
  if (descQuoted) {
    description = descQuoted[1];
  } else {
    const descHere = text.match(/\bdescription\s+<<\s*([\s\S]*?)\s*>>/);
    if (descHere) {
      description = descHere[1].replace(/\s+/g, " ").trim();
    }
  }
  return {
    rid: ridMatch ? ridMatch[1] : ridFromRelativePath(path.basename(filePath)),
    name: nameMatch ? nameMatch[1] : undefined,
    description,
  };
}

export function engineKrlHttpPath(relativePath: string): string {
  return `/krl/${relativePath.split(path.sep).join("/")}`;
}

export function engineKrlFileUrl(
  relativePath: string,
  baseUrl?: string
): string {
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, "")}${engineKrlHttpPath(relativePath)}`;
  }
  return toFileUrl(path.join(bundledKrlDir(), relativePath));
}

export function listEngineKrlSources(baseUrl?: string): EngineKrlSource[] {
  const root = bundledKrlDir();
  return listEngineKrlRelativePaths().map((relativePath) => {
    const filePath = path.join(root, relativePath);
    const meta = readKrlMeta(filePath);
    const filename = path.basename(relativePath);
    return {
      rid: meta.rid,
      filename,
      relativePath,
      url: engineKrlFileUrl(relativePath, baseUrl),
      name: meta.name,
      description: meta.description,
      rootOnly: ROOT_ONLY_RULESET_RIDS.has(meta.rid),
    };
  });
}

/** Map a URL to a relative path under `krl/`, if it refers to an engine-shipped ruleset. */
export function engineKrlRelativeFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol === "file:") {
    const filePath = decodeURI(parsed.pathname).replace(/^\/([a-z]:\/)/i, "$1");
    const normalized = path.normalize(filePath);
    const root = bundledKrlDir();
    if (normalized.startsWith(root + path.sep) || normalized === root) {
      return path.relative(root, normalized).split(path.sep).join("/");
    }
    const basename = path.basename(normalized);
    const candidate = path.join(root, basename);
    if (basename.endsWith(".krl") && fs.existsSync(candidate)) {
      return basename;
    }
    return null;
  }

  if (parsed.protocol === "http:" || parsed.protocol === "https:") {
    const match = parsed.pathname.match(/^\/krl\/(.+\.krl)$/);
    if (match) {
      const relativePath = match[1].split("/").join(path.sep);
      const candidate = path.join(bundledKrlDir(), relativePath);
      if (fs.existsSync(candidate)) {
        return match[1];
      }
    }
  }

  return null;
}

export function resolveEngineKrlFile(relativePath: string): string | null {
  const normalized = relativePath.split("/").join(path.sep);
  const candidate = path.resolve(bundledKrlDir(), normalized);
  const root = bundledKrlDir();
  if (
    candidate.startsWith(root + path.sep) &&
    fs.existsSync(candidate) &&
    candidate.endsWith(".krl")
  ) {
    return candidate;
  }
  return null;
}

export function resolveBundledKrlUrl(url: string): string {
  const relativePath = engineKrlRelativeFromUrl(url);
  if (!relativePath) {
    return url;
  }
  const localPath = resolveEngineKrlFile(relativePath);
  if (localPath) {
    return toFileUrl(localPath);
  }
  return url;
}
