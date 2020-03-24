import * as crypto from "crypto";
import { Ruleset, RulesetLoader } from "pico-framework";

export interface CachedRuleset {
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
  ruleset: Ruleset;
}

export interface RulesetRegistryLoader {
  fetchKrl(url: string): Promise<string>;

  compileAndLoad(
    url: string,
    krl: string,
    hash: string
  ): Promise<{
    ruleset: Ruleset;
    compiler: { version: string; warnings: any[] };
  }>;

  save(data: CachedRuleset): Promise<void>;
}

export class RulesetRegistry {
  private rulesetCache: {
    [url: string]: CachedRuleset;
  } = {};

  constructor(private regLoader: RulesetRegistryLoader) {}

  loader: RulesetLoader = async (picoId, rid, version, config) => {
    const url = config && config["url"];
    if (typeof url !== "string") {
      throw new Error(
        `Unable to get url for pico ruleset ${picoId}-${rid}@${version}`
      );
    }
    const rs = await this.load(url);
    return rs.ruleset;
  };

  getCached(url: string): CachedRuleset | null {
    return this.rulesetCache[url] || null;
  }

  async load(url: string): Promise<CachedRuleset> {
    if (this.rulesetCache[url]) {
      return this.rulesetCache[url];
    }
    // TODO db cache first, then fallback on flush
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
    const krl = await this.regLoader.fetchKrl(url);

    const shasum = crypto.createHash("sha256");
    shasum.update(krl);
    const hash = shasum.digest("hex");

    if (this.rulesetCache[url]?.hash === hash) {
      return this.rulesetCache[url];
    }

    const { ruleset, compiler } = await this.regLoader.compileAndLoad(
      url,
      krl,
      hash
    );

    const toSave: CachedRuleset = {
      url,
      krl,
      hash,
      flushed: new Date(),
      rid: ruleset.rid,
      version: ruleset.version,
      compiler,
      ruleset
    };

    await this.regLoader.save(toSave);

    return (this.rulesetCache[url] = toSave);
  }
}
