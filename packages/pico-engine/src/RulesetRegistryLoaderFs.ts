import fetch from "cross-fetch";
import * as fs from "fs";
import leveldown from "leveldown";
import { default as level } from "levelup";
import * as makeDir from "make-dir";
import * as path from "path";
import { RulesetRegistryLoader } from "pico-engine-core";
import { Ruleset } from "pico-framework";
import * as urlLib from "url";
const krlCompiler = require("krl-compiler");
const krlCompilerVersion = require("krl-compiler/package.json").version;
const charwise = require("charwise");
const encode = require("encoding-down");
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
  };
}

export function RulesetRegistryLoaderFs(
  engineHomeDir: string
): RulesetRegistryLoader {
  const rulesetDir = path.resolve(engineHomeDir, "rulesets");

  const db = level(
    encode(leveldown(path.resolve(engineHomeDir, "rulesets-db")), {
      keyEncoding: charwise,
      valueEncoding: safeJsonCodec,
    })
  );

  async function compileAndLoad(
    url: string,
    krl: string,
    hash: string
  ): Promise<{
    ruleset: Ruleset;
    compiler: { version: string; warnings: any[] };
  }> {
    const jsFile = path.resolve(
      rulesetDir,
      krlCompilerVersion,
      hash.substr(0, 2),
      hash.substr(2, 2),
      hash + ".js"
    );

    let compileWarnings: any[] = [];

    if (await fsExist(jsFile)) {
      // already compiled
    } else {
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
      await makeDir(path.dirname(jsFile));
      await new Promise((resolve, reject) => {
        fs.writeFile(jsFile, out.code, { encoding: "utf8" }, (err) =>
          err ? reject(err) : resolve()
        );
      });
    }

    const ruleset: Ruleset = require(jsFile);

    return {
      ruleset,
      compiler: { version: krlCompilerVersion, warnings: compileWarnings },
    };
  }

  return {
    fetchKrl,

    async save({ ruleset, ...rest }) {
      let toWrite: DbUrlRuleset = rest;
      await db.put(["url", toWrite.url], toWrite);
    },

    compileAndLoad,

    async attemptLoad(url: string) {
      let fromDb: DbUrlRuleset;
      try {
        fromDb = (await db.get(["url", url])) as DbUrlRuleset;
      } catch (err) {
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
}

async function fetchKrl(url: string): Promise<string> {
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
