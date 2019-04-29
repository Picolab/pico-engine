import * as fs from "fs";
import leveldown from "leveldown";
import { default as level, LevelUp } from "levelup";
import * as makeDir from "make-dir";
import * as path from "path";
import { Ruleset } from "pico-framework";
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

  private rsCache: {
    [rid: string]: { [version: string]: Promise<Ruleset | null> };
  } = {};

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

    if (isDraft) {
      // clear the cached draft
      if (this.rsCache[out.rid]) {
        delete this.rsCache[out.rid][out.version];
      }
      const jsFile = this.getJsOutputFile(out.rid, out.version);
      await new Promise((resolve, reject) => {
        fs.unlink(jsFile, err => {
          if (err && err.code !== "ENOENT") {
            reject(err);
            return;
          }
          resolve();
        });
      });
      try {
        delete require.cache[require.resolve(jsFile)];
      } catch (err) {
        // don't care b/c it must not be loaded
      }
    } else {
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

    return toSave;
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

  load(rid: string, version: string): Promise<Ruleset | null> {
    if (!this.rsCache[rid]) {
      this.rsCache[rid] = {};
    }
    if (this.rsCache[rid][version]) {
      return this.rsCache[rid][version];
    }

    this.rsCache[rid][version] = this.compileAndLoadRuleset(rid, version);

    return this.rsCache[rid][version];
  }

  private async compileAndLoadRuleset(
    rid: string,
    version: string
  ): Promise<Ruleset | null> {
    let data;
    try {
      data = await this.db.get(["ruleset", rid, version]);
    } catch (err) {
      if (err.notFound) {
        if (this.rsCache[rid]) {
          // remove this so next time it will check the db again
          delete this.rsCache[rid][version];
        }
        return null;
      }
    }

    const jsFile = this.getJsOutputFile(rid, version);

    // if the compiler version hasn't changed, load the cached version
    if (data.compiler && data.compiler.version === krlCompilerVersion) {
      try {
        // try and load the cached version
        return require(jsFile);
      } catch (err) {
        // no worries, let's continue and compile it
      }
    }

    const out = krlCompiler(data.krl);
    out.version = normalizeVersion(out.version);
    if (out.rid !== rid || out.version !== version) {
      throw new Error(
        `Compiled krl rid+version miss-match. Wanted ${rid}@${version} but got ${
          out.rid
        }@${out.version}`
      );
    }

    await makeDir(path.dirname(jsFile));
    await new Promise((resolve, reject) => {
      fs.writeFile(jsFile, out.code, { encoding: "utf8" }, err =>
        err ? reject(err) : resolve()
      );
    });
    return require(jsFile);
  }

  private getJsOutputFile(rid: string, version: string) {
    return path.resolve(this.rulesetDir, rid, version + ".js");
  }
}
