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
  getAllUsed(): Promise<CachedRuleset[]>;

  getPicoUrl(picoId: string, rid: string, version: string): Promise<string>;
  hasPicoUrl(picoId: string, url: string): Promise<boolean>;
  addPicoUrl(
    picoId: string,
    url: string,
    rid: string, // rid and version so it can setup indexes
    version: string
  ): Promise<void>;
  delPicoUrl(picoId: string, url: string): Promise<void>;
  getPicoURLs(picoId: string): Promise<string[]>;
}

export class RulesetRegistry {
  private rulesetCache: {
    [url: string]: CachedRuleset;
  } = {};

  private startupP: Promise<void>;

  constructor(private regLoader: RulesetRegistryLoader) {
    this.startupP = this.startup();
  }

  async startup() {
    if (this.startupP) return this.startupP;

    const toLoad = await this.regLoader.getAllUsed();

    for (const val of toLoad) {
      this.rulesetCache[val.url] = val;
    }
  }

  loader: RulesetLoader = async (picoId, rid, version) => {
    const url = await this.regLoader.getPicoUrl(picoId, rid, version);
    const rs = await this.load(url);
    return rs.ruleset;
  };

  async subscribe(picoId: string, url: string) {
    if (await this.regLoader.hasPicoUrl(picoId, url)) {
      return;
    }

    const rs = await this.load(url);

    await this.regLoader.addPicoUrl(
      picoId,
      url,
      rs.ruleset.rid,
      rs.ruleset.version
    );
  }

  unsubscribe(picoId: string, url: string) {
    return this.regLoader.delPicoUrl(picoId, url);
  }

  picoRulesetUrls(picoId: string): Promise<string[]> {
    return this.regLoader.getPicoURLs(picoId);
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
