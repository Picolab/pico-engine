import { Ruleset } from "pico-framework";
import { CachedRuleset, RulesetRegistryLoader } from "./RulesetRegistry";
const krlCompiler = require("krl-compiler");
const krlCompilerVersion = require("krl-compiler/package.json").version;

interface DbPicoRuleset {
  picoId: string;
  rid: string;
  version: string;
  url: string;
}

export function RulesetRegistryLoaderMem(
  fetchKrl: (url: string) => Promise<string>
): RulesetRegistryLoader {
  async function compileAndLoad(
    url: string,
    krl: string,
    hash: string
  ): Promise<{
    ruleset: Ruleset;
    compiler: { version: string; warnings: any[] };
  }> {
    const out = krlCompiler(krl);
    if (typeof out.rid !== "string") {
      throw new Error("Compile failed, missing rid");
    }

    const ruleset: Ruleset = eval(out.code);
    ruleset.version =
      typeof ruleset.version === "string" ? ruleset.version : "draft";

    return {
      ruleset,
      compiler: { version: krlCompilerVersion, warnings: out.warnings }
    };
  }

  const urlData: { [url: string]: CachedRuleset } = {};
  const perPicoRidV: { [pico_rid_at_v: string]: DbPicoRuleset } = {};
  const perPicoUrl: { [pico_url: string]: DbPicoRuleset } = {};

  return {
    fetchKrl,

    async save(data) {
      urlData[data.url] = data;
    },

    async getAllUsed() {
      return [];
    },

    async getPicoUrl(picoId, rid, version) {
      const key = `${picoId}-${rid}@${version}`;
      if (perPicoRidV[key]) {
        return perPicoRidV[key].url;
      }
      throw new Error(`Not found ${key}`);
    },

    compileAndLoad,

    async hasPicoUrl(picoId, url) {
      return !!perPicoUrl[`${picoId}-${url}`];
    },

    async addPicoUrl(picoId, url, rid, version) {
      const data = { picoId, url, rid, version };
      perPicoRidV[`${picoId}-${rid}@${version}`] = data;
      perPicoUrl[`${picoId}-${url}`] = data;
    },

    async delPicoUrl(picoId, url) {
      let data: DbPicoRuleset | null = perPicoUrl[`${picoId}-${url}`] || null;
      if (data) {
        delete perPicoRidV[`${picoId}-${data.rid}@${data.version}`];
        delete perPicoUrl[`${picoId}-${url}`];
      }
    },

    async getPicoURLs(picoId) {
      const urls: string[] = [];
      for (const val of Object.values(perPicoUrl)) {
        if (val.picoId === picoId) {
          urls.push(val.url);
        }
      }
      return urls;
    }
  };
}
