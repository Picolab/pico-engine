import * as crypto from "crypto";
import * as fs from "fs";
import leveldown from "leveldown";
import { default as level, LevelUp } from "levelup";
import * as makeDir from "make-dir";
import * as path from "path";
import { Ruleset, RulesetLoader } from "pico-framework";
import * as urlLib from "url";
import { dbRange } from "./dbRange";
const krlCompiler = require("krl-compiler");
const krlCompilerVersion = require("krl-compiler/package.json").version;
const charwise = require("charwise");
const encode = require("encoding-down");
const safeJsonCodec = require("level-json-coerce-null");
const request = require("request");

interface DbPicoRuleset {
  picoId: string;
  rid: string;
  version: string;
  url: string;
}

interface DbUrlRuleset {
  url: string;
  krl: string;
  hash: string;
  flushed: Date;
  rid: string;
  version: string;
  compiler: {
    version: string;
    warnings: any[];
  };
}

interface CachedRuleset extends DbUrlRuleset {
  ruleset: Ruleset;
}

export class RulesetRegistry {
  public readonly rulesetDir: string;

  private db: LevelUp;

  private rulesetCache: {
    [url: string]: CachedRuleset;
  } = {};

  private startupP: Promise<{ url: string; error: string }[]>;

  constructor(engineHomeDir: string) {
    this.rulesetDir = path.resolve(engineHomeDir, "rulesets");
    this.db = level(
      encode(leveldown(path.resolve(engineHomeDir, "rulesets-db")), {
        keyEncoding: charwise,
        valueEncoding: safeJsonCodec
      })
    );
    this.startupP = this.startup();
  }

  async startup() {
    if (this.startupP) return this.startupP;

    const urls = new Set<string>();
    await dbRange(
      this.db,
      {
        prefix: ["pico"]
      },
      (data, stop) => {
        if ("url" === data.key[2]) {
          urls.add(data.key[3]);
        }
      }
    );
    const toLoad: DbUrlRuleset[] = [];
    await dbRange(
      this.db,
      {
        prefix: ["url"]
      },
      async (data, stop) => {
        const val: DbUrlRuleset = data.value;
        if (urls.has(val.url)) {
        }
      }
    );
    const errors: { url: string; error: string }[] = [];
    await Promise.all(
      toLoad.map(async val => {
        try {
          const { ruleset } = await this.compileAndLoad(val.krl, val.hash);
          this.rulesetCache[val.url] = { ...val, ruleset };
        } catch (error) {
          errors.push({ url: val.url, error });
        }
      })
    );
    return errors;
  }

  loader: RulesetLoader = async (picoId, rid, version) => {
    const data: DbPicoRuleset = await this.db.get([
      "pico",
      picoId,
      "rid-version",
      rid,
      version
    ]);
    const rs = await this.load(data.url);
    return rs.ruleset;
  };

  async subscribe(picoId: string, url: string) {
    try {
      await this.db.get(["pico", picoId, "url", url]);
      return;
    } catch (err) {
      if (!err.notFound) {
        throw err;
      }
    }
    const rs = await this.load(url);

    const toSave: DbPicoRuleset = {
      picoId,
      rid: rs.ruleset.rid,
      version: rs.ruleset.version,
      url
    };
    await this.db.batch([
      {
        type: "put",
        key: [
          "pico",
          picoId,
          "rid-version",
          rs.ruleset.rid,
          rs.ruleset.version
        ],
        value: toSave
      },
      {
        type: "put",
        key: ["pico", picoId, "url", url],
        value: toSave
      }
    ]);
  }

  async unsubscribe(picoId: string, url: string) {
    let data: DbPicoRuleset;
    try {
      data = await this.db.get(["pico", picoId, "url", url]);
    } catch (err) {
      if (err.notFound) {
        return;
      }
      throw err;
    }
    await this.db.batch([
      {
        type: "del",
        key: ["pico", picoId, "rid-version", data.rid, data.version]
      },
      {
        type: "del",
        key: ["pico", picoId, "url", url]
      }
    ]);
  }

  async picoRulesetUrls(picoId: string): Promise<string[]> {
    const urls: string[] = [];
    await dbRange(
      this.db,
      {
        prefix: ["pico", picoId]
      },
      (data, stop) => {
        if ("url" === data.key[2]) {
          urls.push(data.key[3]);
        }
      }
    );
    return urls;
  }

  async load(url: string): Promise<CachedRuleset> {
    await this.startupP; // make sure the cached is warmed up

    if (this.rulesetCache[url]) {
      return this.rulesetCache[url];
    }
    return this.flush(url);
  }

  // To batch flushes for the same url within the same time window
  private flushers: {
    [url: string]: {
      finished: boolean;
      p: Promise<CachedRuleset>;
    };
  } = {};

  async flush(url: string): Promise<CachedRuleset> {
    await this.startupP; // make sure the cached is warmed up

    if (this.flushers[url] && !this.flushers[url].finished) {
      return this.flushers[url].p;
    }
    const flushP = this.flushBase(url);
    this.flushers[url] = { finished: false, p: flushP };
    flushP.finally(() => {
      this.flushers[url].finished = true;
    });
    return flushP;
  }

  private async flushBase(url: string): Promise<CachedRuleset> {
    const krl = await fetchKrl(url);

    const shasum = crypto.createHash("sha256");
    shasum.update(krl);
    const hash = shasum.digest("hex");

    if (this.rulesetCache[url]?.hash === hash) {
      return this.rulesetCache[url];
    }

    const { ruleset, compiler } = await this.compileAndLoad(krl, hash);

    const toSave: DbUrlRuleset = {
      url,
      krl,
      hash,
      flushed: new Date(),
      rid: ruleset.rid,
      version: ruleset.version,
      compiler
    };
    await this.db.put(["url", url], toSave);

    return (this.rulesetCache[url] = {
      ...toSave,
      ruleset
    });
  }

  private async compileAndLoad(
    krl: string,
    hash: string
  ): Promise<{
    ruleset: Ruleset;
    compiler: { version: string; warnings: any[] };
  }> {
    const jsFile = path.resolve(
      this.rulesetDir,
      krlCompilerVersion,
      hash.substr(0, 2),
      hash.substr(2, 2),
      hash + ".js"
    );

    let compileWarnings: any[] = [];

    if (await fsExist(jsFile)) {
      // already compiled
    } else {
      const out = krlCompiler(krl);
      if (typeof out.rid !== "string") {
        throw new Error("Compile failed, missing rid");
      }
      compileWarnings = out.warnings;
      await makeDir(path.dirname(jsFile));
      await new Promise((resolve, reject) => {
        fs.writeFile(jsFile, out.code, { encoding: "utf8" }, err =>
          err ? reject(err) : resolve()
        );
      });
    }

    const ruleset: Ruleset = require(jsFile);
    ruleset.version =
      typeof ruleset.version === "string" ? ruleset.version : "draft";

    return {
      ruleset,
      compiler: { version: krlCompilerVersion, warnings: compileWarnings }
    };
  }
}

function fetchKrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlParsed = urlLib.parse(url);
    if (urlParsed.protocol === "file:") {
      fs.readFile(decodeURI(urlParsed.path || ""), function(err, data) {
        if (err) reject(err);
        else resolve(data.toString());
      });
    } else {
      request(url, function(err: any, resp: any, body: any) {
        if (err) {
          return reject(err);
        }
        if (resp.statusCode !== 200) {
          return reject(
            new Error("Got a statusCode=" + resp.statusCode + " for: " + url)
          );
        }
        resolve(body);
      });
    }
  });
}

function fsExist(filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, function(err, stats) {
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
