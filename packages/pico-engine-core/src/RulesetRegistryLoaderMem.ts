import { Ruleset } from "pico-framework";
import { CachedRuleset, RulesetRegistryLoader } from "./RulesetRegistry";
const krlCompiler = require("krl-compiler");
const krlCompilerVersion = require("krl-compiler/package.json").version;
const rulesetCompileGeneration = require("krl-compiler/src/rulesetCompileGeneration");

export function RulesetRegistryLoaderMem(
  fetchKrl: (url: string) => Promise<string>
): RulesetRegistryLoader {
  const urlData: { [url: string]: CachedRuleset } = {};

  return {
    fetchKrl,

    getCompileGeneration() {
      return rulesetCompileGeneration();
    },

    async save(data) {
      urlData[data.url] = data;
    },

    async compileAndLoad(
      url: string,
      krl: string,
      hash: string
    ): Promise<{
      ruleset: Ruleset;
      compiler: CachedRuleset["compiler"];
    }> {
      const out = krlCompiler(krl);
      if (typeof out.rid !== "string") {
        throw new Error("Compile failed, missing rid");
      }

      const ruleset: Ruleset & { rulesetSchema?: unknown } = eval(out.code);
      if (out.rulesetSchema && !ruleset.rulesetSchema) {
        ruleset.rulesetSchema = out.rulesetSchema;
      }

      return {
        ruleset,
        compiler: {
          version: krlCompilerVersion,
          warnings: out.warnings,
          compileGeneration: rulesetCompileGeneration(),
        },
      };
    },

    async attemptLoad(url: string) {
      return urlData[url] || null;
    },
  };
}
