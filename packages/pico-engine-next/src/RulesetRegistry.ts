import leveldown from "leveldown";
import { default as level, LevelUp } from "levelup";
import * as path from "path";
import * as fs from "fs";
import * as makeDir from "make-dir";
const krlCompiler = require("krl-compiler");
const krlCompilerVersion = require("krl-compiler/package.json").version;
const charwise = require("charwise");
const encode = require("encoding-down");
const safeJsonCodec = require("level-json-coerce-null");

function normalizeVersion(version: string) {
  if (typeof version !== "string") {
    version = "";
  }
  version = version.trim().toLowerCase();
  if (version === "") {
    version = "draft";
  }
  if (version === "draft") {
    return version;
  }
  const isDraft = /draft$/.test(version);
  const m = /^([0-9]+)\.([0-9]+)\.([0-9]+)(-draft)?$/.exec(version);
  if (!m) {
    throw new Error("Invalid version number.");
  }
  const major = parseInt(m[1], 10) || 0;
  const minnor = parseInt(m[2], 10) || 0;
  const patch = parseInt(m[3], 10) || 0;
  version = `${major}.${minnor}.${patch}`;
  if (isDraft) {
    version += "-draft";
  }
  return version;
}

export class RulesetRegistry {
  public readonly rulesetDir: string;

  private db: LevelUp;

  constructor(engineHomeDir: string) {
    this.rulesetDir = path.resolve(engineHomeDir, "rulesets");
    this.db = level(
      encode(leveldown(path.resolve(engineHomeDir, "rulesets-db")), {
        keyEncoding: charwise,
        valueEncoding: safeJsonCodec
      })
    );
  }

  async publish(krl: string) {
    const out = krlCompiler(krl);
    if (typeof out.rid !== "string") {
      throw new Error("Compile failed, missing rid");
    }

    out.version = normalizeVersion(out.version);
    const isDraft = /draft$/.test(out.version);

    const toSave = {
      krl,
      rid: out.rid,
      version: out.version,
      published: new Date().toISOString(),
      compiler: {
        version: krlCompilerVersion,
        warnings: out.warnings
      }
    };

    const key = ["ruleset", out.rid, out.version];

    if (!isDraft) {
      let isFound = false;
      try {
        await this.db.get(key);
        isFound = true;
      } catch (err) {
        if (err.notFound) {
          // good
        } else {
          throw err;
        }
      }
      if (isFound) {
        throw new Error("Cannot overwrite a published version.");
      }
    }

    await this.db.put(key, toSave);

    const rsDir = path.resolve(this.rulesetDir, out.rid, out.version);
    await makeDir(rsDir);
    const jsFile = path.resolve(rsDir, "compiled.js");

    await new Promise((resolve, reject) => {
      fs.writeFile(jsFile, out.code, { encoding: "utf8" }, err =>
        err ? reject(err) : resolve()
      );
    });
    const rs = require(jsFile);

    return Object.assign({ rs }, toSave);
  }

  list(): Promise<{ [rid: string]: string[] }> {
    return new Promise((resolve, reject) => {
      const rulesets: { [rid: string]: string[] } = {};

      const s = this.db.createReadStream({
        keys: true,
        values: false,
        gte: ["ruleset"],
        lte: ["ruleset", undefined] // charwise sorts with null at bottom and undefined at top
      });
      s.on("error", reject);
      s.on("end", function() {
        resolve(rulesets);
      });
      s.on("data", function(key) {
        if (key.length === 3) {
          const rid = key[1];
          const version = key[2];
          if (!rulesets[rid]) {
            rulesets[rid] = [];
          }
          rulesets[rid].push(version);
        }
      });
    });
  }

  get(rid: string, version: string) {
    return this.db.get(["ruleset", rid, version]);
  }
}
