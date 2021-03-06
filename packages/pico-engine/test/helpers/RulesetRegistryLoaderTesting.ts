import { CachedRuleset, RulesetRegistryLoader } from "pico-engine-core";
import { Ruleset } from "pico-framework";

export function RulesetRegistryLoaderTesting(rulesets: {
  [url: string]: Ruleset;
}): RulesetRegistryLoader {
  const urlData: { [url: string]: CachedRuleset } = {};

  return {
    async fetchKrl(url) {
      return "fake";
    },

    async save(data) {
      urlData[data.url] = data;
    },

    async compileAndLoad(url: string, krl: string, hash: string) {
      return {
        ruleset: rulesets[url],
        compiler: { version: "fake", warnings: [] },
      };
    },

    async attemptLoad(url: string) {
      return urlData[url] || null;
    },
  };
}
