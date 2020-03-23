import * as fs from "fs";
import leveldown from "leveldown";
import { default as level } from "levelup";
import * as makeDir from "make-dir";
import * as path from "path";
import { Ruleset } from "pico-framework";
import * as urlLib from "url";
import { dbRange } from "./dbRange";
import {
  RulesetRegistryLoader,
  DbUrlRuleset,
  DbPicoRuleset
} from "./RulesetRegistry";
const krlCompiler = require("krl-compiler");
const krlCompilerVersion = require("krl-compiler/package.json").version;
const charwise = require("charwise");
const encode = require("encoding-down");
const safeJsonCodec = require("level-json-coerce-null");
const request = require("request");

export function RulesetRegistryLoaderFs(
  engineHomeDir: string
): RulesetRegistryLoader {
  const rulesetDir = path.resolve(engineHomeDir, "rulesets");

  const db = level(
    encode(leveldown(path.resolve(engineHomeDir, "rulesets-db")), {
      keyEncoding: charwise,
      valueEncoding: safeJsonCodec
    })
  );

  return {
    fetchKrl,

    async save(data) {
      await db.put(["url", data.url], data);
    },

    async getAllUsed() {
      const urls = new Set<string>();
      await dbRange(
        db,
        {
          prefix: ["pico"]
        },
        (data, stop) => {
          if ("url" === data.key[2]) {
            urls.add(data.key[3]);
          }
        }
      );
      const rulesets: DbUrlRuleset[] = [];
      await dbRange(
        db,
        {
          prefix: ["url"]
        },
        async (data, stop) => {
          const val: DbUrlRuleset = data.value;
          if (urls.has(val.url)) {
            rulesets.push(val);
          }
        }
      );
      return rulesets;
    },

    async getPicoUrl(picoId, rid, version) {
      const data: DbPicoRuleset = (await db.get([
        "pico",
        picoId,
        "rid-version",
        rid,
        version
      ])) as DbPicoRuleset;
      return data;
    },

    async compileAndLoad(url, krl, hash) {
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
            // TODO filename: urlLib.parse(url).path
          },
          inline_source_map: true
        });
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
    },

    async hasPicoUrl(picoId, url) {
      try {
        await db.get(["pico", picoId, "url", url]);
        return true;
      } catch (err) {
        if (err.notFound) {
          return false;
        }
        throw err;
      }
    },

    async addPicoUrl(picoId, value) {
      await db.batch([
        {
          type: "put",
          key: ["pico", picoId, "rid-version", value.rid, value.version],
          value
        },
        {
          type: "put",
          key: ["pico", picoId, "url", value.url],
          value
        }
      ]);
    },

    async delPicoUrl(picoId, url) {
      let data: DbPicoRuleset;
      try {
        data = (await db.get(["pico", picoId, "url", url])) as DbPicoRuleset;
      } catch (err) {
        if (err.notFound) {
          return;
        }
        throw err;
      }
      await db.batch([
        {
          type: "del",
          key: ["pico", picoId, "rid-version", data.rid, data.version]
        },
        {
          type: "del",
          key: ["pico", picoId, "url", url]
        }
      ]);
    },

    async getPicoURLs(picoId) {
      const urls: string[] = [];
      await dbRange(
        db,
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
  };
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
