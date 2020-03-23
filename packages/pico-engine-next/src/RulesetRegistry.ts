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

interface CachedRuleset {
  krl: string;
  hash: string;
  flushed: Date;
  ruleset: Ruleset;
  compiler: {
    version: string;
    warnings: any[];
  };
}

export class RulesetRegistry {
  public readonly rulesetDir: string;

  private db: LevelUp;

  private rulesetCache: {
    [url: string]: CachedRuleset;
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

  loader: RulesetLoader = async (picoId, rid, version) => {
    const data = await this.db.get(["pico-rid-version", picoId, rid, version]);
    const rs = await this.load(data.url);
    return rs.ruleset;
  };

  async subscribe(picoId: string, url: string) {
    // TODO
  }
  async unsubscribe(picoId: string, url: string) {
    // TODO
  }

  async load(url: string): Promise<CachedRuleset> {
    if (this.rulesetCache[url]) {
      return this.rulesetCache[url];
    }
    return this.flush(url);
  }

  async flush(url: string): Promise<CachedRuleset> {
    const krl = await fetchKrl(url);

    const shasum = crypto.createHash("sha256");
    shasum.update(krl);
    const hash = shasum.digest("hex");

    if (this.rulesetCache[url]?.hash === hash) {
      return this.rulesetCache[url];
    }

    const out = krlCompiler(krl);
    if (typeof out.rid !== "string") {
      throw new Error("Compile failed, missing rid");
    }

    const jsFile = path.resolve(
      this.rulesetDir,
      krlCompilerVersion,
      hash.substr(0, 2),
      hash.substr(2, 2),
      hash + ".js"
    );

    await makeDir(path.dirname(jsFile));
    await new Promise((resolve, reject) => {
      fs.writeFile(jsFile, out.code, { encoding: "utf8" }, err =>
        err ? reject(err) : resolve()
      );
    });
    const ruleset: Ruleset = require(jsFile);
    ruleset.version =
      typeof ruleset.version === "string" ? ruleset.version : "draft";

    const toSave: CachedRuleset = {
      krl,
      hash: hash,
      flushed: new Date(),
      ruleset,
      compiler: {
        version: krlCompilerVersion,
        warnings: out.warnings
      }
    };

    this.rulesetCache[url] = toSave;

    return this.rulesetCache[url];
  }
}
