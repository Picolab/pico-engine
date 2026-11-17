import * as crypto from "crypto";
import fetch from "cross-fetch";
import * as fs from "fs";
import { ClassicLevel } from "classic-level";
import * as makeDir from "make-dir";
import * as path from "path";
import { RulesetRegistryLoader } from "pico-engine-core";
import { PicoDbKey, Ruleset } from "pico-framework";
import type { KrlLogger } from "krl-stdlib";
import * as urlLib from "url";
import { resolveBundledKrlUrl } from "./bundledKrl";
import { openClassicLevelWithRecovery } from "./levelDb";
const krlCompiler = require("krl-compiler");
const krlCompilerVersion = require("krl-compiler/package.json").version;
const rulesetCompileGeneration = require("krl-compiler/src/rulesetCompileGeneration");
const charwise = require("charwise");
const safeJsonCodec = require("level-json-coerce-null");

function getUrlFilename(url: string): string | null {
  try {
    const parsed = urlLib.parse(url);
    if (parsed.pathname) {
      return path.basename(parsed.pathname);
    }
  } catch (err) {}
  return null;
}

interface DbUrlRuleset {
  url: string;
  krl: string;
  hash: string;
  flushed: Date;
  rid: string;
  compiler: {
    version: string;
    warnings: any[];
    compileGeneration?: string;
  };
}

function compileGenerationDir(): string {
  return rulesetCompileGeneration().replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export interface RulesetRegistryLoaderFsHandle {
  loader: RulesetRegistryLoader;
  close: () => Promise<void>;
}

export async function createRulesetRegistryLoaderFs(
  engineHomeDir: string,
  log?: KrlLogger
): Promise<RulesetRegistryLoaderFsHandle> {
  const rulesetDir = path.resolve(engineHomeDir, "rulesets");
  // One compile per cache file. Every pico that needs the same ruleset waits.
  const compiling = new Map<
    string,
    Promise<{ ruleset: Ruleset; compiler: DbUrlRuleset["compiler"] }>
  >();

  const db = await openClassicLevelWithRecovery<PicoDbKey, any>(
    path.resolve(engineHomeDir, "rulesets-db"),
    {
      keyEncoding: charwise,
      valueEncoding: safeJsonCodec,
    },
    log
  );

  function compileAndLoad(
    url: string,
    krl: string,
    hash: string
  ): Promise<{
    ruleset: Ruleset;
    compiler: DbUrlRuleset["compiler"];
  }> {
    const jsFile = path.resolve(
      rulesetDir,
      compileGenerationDir(),
      hash.substr(0, 2),
      hash.substr(2, 2),
      hash + ".js"
    );
    const inflight = compiling.get(jsFile);
    if (inflight) {
      return inflight;
    }
    const pending = compileOne(url, krl, jsFile);
    compiling.set(jsFile, pending);
    pending.finally(() => {
      if (compiling.get(jsFile) === pending) {
        compiling.delete(jsFile);
      }
    });
    return pending;
  }

  async function compileOne(
    url: string,
    krl: string,
    jsFile: string
  ): Promise<{
    ruleset: Ruleset;
    compiler: DbUrlRuleset["compiler"];
  }> {
    let compileWarnings: any[] = [];
    let cached = (await fsExist(jsFile)) ? requireRulesetModule(jsFile) : null;
    if (!cached) {
      const out = krlCompiler(krl, {
        parser_options: {
          filename: getUrlFilename(url),
        },
        inline_source_map: true,
      });
      if (typeof out.rid !== "string") {
        throw new Error("Compile failed, missing rid");
      }
      compileWarnings = out.warnings;
      await writeCompiledRuleset(jsFile, out.code);
      cached = requireRulesetModule(jsFile);
    }
    if (!cached) {
      throw new Error(
        `Compiled ruleset is missing init (corrupt cache file). Delete ${jsFile} and flush again: ${url}`
      );
    }
    return {
      ruleset: cached,
      compiler: {
        version: krlCompilerVersion,
        warnings: compileWarnings,
        compileGeneration: rulesetCompileGeneration(),
      },
    };
  }

  const loader: RulesetRegistryLoader = {
    fetchKrl,

    getCompileGeneration() {
      return rulesetCompileGeneration();
    },

    async save({ ruleset, ...rest }) {
      let toWrite: DbUrlRuleset = rest;
      await db.put(["url", toWrite.url], toWrite);
    },

    compileAndLoad,

    async attemptLoad(url: string) {
      let fromDb: DbUrlRuleset;
      try {
        fromDb = (await db.get(["url", url])) as DbUrlRuleset;
      } catch (err: any) {
        if (err.notFound) {
          return null;
        }
        throw err;
      }

      const { ruleset, compiler } = await compileAndLoad(
        fromDb.url,
        fromDb.krl,
        fromDb.hash
      );

      return {
        ...fromDb,
        ruleset,
        compiler,
      };
    },
  };

  return {
    loader,
    close: () => db.close(),
  };
}

async function fetchKrl(url: string): Promise<string> {
  url = resolveBundledKrlUrl(url);
  const urlParsed = urlLib.parse(url);
  if (urlParsed.protocol === "file:") {
    return new Promise((resolve, reject) => {
      fs.readFile(
        decodeURI(urlParsed.path || "").replace(/^\/([a-z]:\/)/i, "$1"),
        { flag: "rs", encoding: "utf8" },
        function (err, data) {
          if (err) reject(err);
          else resolve(data.toString());
        }
      );
    });
  }

  const res = await fetch(url);
  if (res.status < 200 || res.status >= 300) {
    throw new Error("Got a statusCode=" + res.status + " for: " + url);
  }
  const krl = await res.text();
  return krl;
}

function requireRulesetModule(jsFile: string): Ruleset | null {
  try {
    delete require.cache[require.resolve(jsFile)];
  } catch {
    return null;
  }
  let ruleset: Ruleset;
  try {
    ruleset = require(jsFile) as Ruleset;
  } catch {
    return null;
  }
  if (typeof ruleset?.init !== "function") {
    try {
      delete require.cache[require.resolve(jsFile)];
      fs.unlinkSync(jsFile);
    } catch {
      /* best effort */
    }
    return null;
  }
  return ruleset;
}

async function writeCompiledRuleset(jsFile: string, code: string): Promise<void> {
  await makeDir(path.dirname(jsFile));
  const tmpFile = `${jsFile}.${crypto.randomBytes(8).toString("hex")}.tmp`;
  try {
    await fs.promises.writeFile(tmpFile, code, "utf8");
    await fs.promises.rename(tmpFile, jsFile);
  } catch (err) {
    await fs.promises.unlink(tmpFile).catch(() => undefined);
    throw err;
  }
}

function fsExist(filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, function (err, stats) {
      if (err) {
        if (err.code === "ENOENT") {
          return resolve(false);
        } else {
          return reject(err);
        }
      }
      resolve(true);
    });
  });
}
