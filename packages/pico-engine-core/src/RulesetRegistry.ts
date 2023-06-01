import * as crypto from "crypto";
import * as pMemoize from "p-memoize";
import { Ruleset, RulesetLoader } from "pico-framework";

export interface CachedRuleset {
  url: string;
  krl: string;
  hash: string;
  flushed: Date;
  rid: string;
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

  attemptLoad(url: string): Promise<CachedRuleset | null>;
}

export class RulesetRegistry {
  private rulesetCache: {
    [url: string]: CachedRuleset;
  } = {};

  public load: (url: string) => Promise<CachedRuleset>;
  public flush: (url: string) => Promise<CachedRuleset>;

  constructor(
    private regLoader: RulesetRegistryLoader,
    public onRulesetLoaded?: (crs: CachedRuleset) => void
  ) {
    this.load = pMemoize((url: string) => this.loadBase(url), {
      maxAge: 100,
    });
    this.flush = pMemoize((url: string) => this.flushBase(url), {
      maxAge: 100,
    });
  }

  loader: RulesetLoader = async (picoId, rid, config) => {
    const url = config && config["url"];
    if (typeof url !== "string") {
      throw new Error(`Unable to get url for pico ruleset ${picoId}-${rid}`);
    }
    const rs = await this.load(url);
    return rs.ruleset;
  };

  getCached(url: string): CachedRuleset | null {
    return this.rulesetCache[url] || null;
  }

  private setCachedRuleset(rs: CachedRuleset) {
    this.rulesetCache[rs.url] = rs;
    if (this.onRulesetLoaded) {
      this.onRulesetLoaded(rs);
    }
  }

  private async loadBase(url: string): Promise<CachedRuleset> {
    if (this.rulesetCache[url]) {
      return this.rulesetCache[url];
    }
    const data = await this.regLoader.attemptLoad(url);
    if (data) {
      this.setCachedRuleset(data);
      return this.rulesetCache[url];
    }
    return this.flush(url);
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
      compiler,
      ruleset,
    };

    await this.regLoader.save(toSave);
    this.setCachedRuleset(toSave);
    return toSave;
  }
}
