/**
 * pico-framework is the runtime under KRL. It must not import the engine,
 * the compiler, or the standard library.
 */
import * as fs from "fs";
import * as path from "path";
import test from "ava";

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const MONOREPO_PACKAGES = [
  "pico-engine",
  "pico-engine-core",
  "pico-engine-ui",
  "krl-compiler",
  "krl-parser",
  "krl-generator",
  "krl-stdlib",
];

export function forbiddenImport(spec: string, fromFile: string): string | null {
  for (const name of MONOREPO_PACKAGES) {
    if (spec === name || spec.startsWith(name + "/")) {
      return spec;
    }
  }
  if (spec.startsWith(".")) {
    const abs = path.resolve(path.dirname(fromFile), spec);
    const rel = path.relative(PACKAGE_ROOT, abs);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      return spec;
    }
  }
  return null;
}

function specifiers(source: string): string[] {
  const found: string[] = [];
  const re =
    /(?:import\s+(?:[^"'`]*?\s+from\s+)?|require\s*\(\s*|import\s*\(\s*)["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    found.push(match[1]);
  }
  return found;
}

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...tsFiles(full));
    } else if (entry.name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

test("a monorepo import is rejected", (t) => {
  t.is(
    forbiddenImport("pico-engine-core", path.join(PACKAGE_ROOT, "src/Channel.ts")),
    "pico-engine-core"
  );
  t.is(
    forbiddenImport("../../pico-engine/src/index", path.join(PACKAGE_ROOT, "src/Channel.ts")),
    "../../pico-engine/src/index"
  );
  t.is(forbiddenImport("lodash", path.join(PACKAGE_ROOT, "src/Channel.ts")), null);
});

test("framework source stays inside this package", (t) => {
  const hits: string[] = [];
  for (const file of tsFiles(path.join(PACKAGE_ROOT, "src"))) {
    const source = fs.readFileSync(file, "utf8");
    for (const spec of specifiers(source)) {
      const bad = forbiddenImport(spec, file);
      if (bad) {
        hits.push(`${path.relative(PACKAGE_ROOT, file)}: ${bad}`);
      }
    }
  }
  t.deepEqual(hits, []);
});
