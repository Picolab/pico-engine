import { Ruleset } from "pico-framework";
import { CachedRuleset, RulesetRegistryLoader } from "./RulesetRegistry";
const krlCompiler = require("krl-compiler");
const krlCompilerVersion = require("krl-compiler/package.json").version;

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

  return {
    fetchKrl,

    async save(data) {
      urlData[data.url] = data;
    },

    compileAndLoad
  };
}
