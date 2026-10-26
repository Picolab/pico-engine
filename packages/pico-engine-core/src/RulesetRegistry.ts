import * as crypto from "crypto";
import * as pMemoize from "p-memoize";
import { Ruleset, RulesetLoader } from "pico-framework";
import { getModuleUses, validateModuleDependencies } from "./moduleDependencies";

export interface CachedRuleset {
  url: string;
  krl: string;
  hash: string;
  flushed: Date;
  rid: string;
  compiler: {
    version: string;
    warnings: any[];
    /** When set, must match loader generation or flush recompiles (see krl-compiler). */
    compileGeneration?: string;
  };
  ruleset: Ruleset;
}

export interface RulesetRegistryLoader {
  fetchKrl(url: string): Promise<string>;

  /** Compiler/parser generation for ruleset cache invalidation. */
  getCompileGeneration(): string;

  compileAndLoad(
    url: string,
    krl: string,
    hash: string
  ): Promise<{
    ruleset: Ruleset;
    compiler: CachedRuleset["compiler"];
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
    public onRulesetLoaded?: (crs: CachedRuleset) => void,
    /** Before cache is updated for a flush / registerInline (hash changed). */
    public onBeforeRulesetContentUpdate?: (url: string) => void,
    /** KRL content at url changed (flush / registerInline), not initial cache load. */
    public onRulesetContentUpdated?: (
      crs: CachedRuleset,
      oldHash: string | null
    ) => void | Promise<void>
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

  /** Register KRL under url without fetching (portable import packs). */
  async registerInline(url: string, krl: string): Promise<CachedRuleset> {
    const shasum = crypto.createHash("sha256");
    shasum.update(krl);
    const hash = shasum.digest("hex");

    const oldHash = this.rulesetCache[url]?.hash ?? null;

    if (this.isCachedContentCurrent(url, hash)) {
      return this.rulesetCache[url];
    }

    const { ruleset, compiler } = await this.regLoader.compileAndLoad(
      url,
      krl,
      hash
    );

    validateModuleDependencies(Object.values(this.rulesetCache), {
      url,
      rid: ruleset.rid,
      deps: getModuleUses(ruleset),
    });

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
    if (this.onBeforeRulesetContentUpdate) {
      this.onBeforeRulesetContentUpdate(url);
    }
    this.setCachedRuleset(toSave, true, oldHash);
    return toSave;
  }

  /** Same KRL hash but compiler/parser generation changed → recompile on flush. */
  private isCachedContentCurrent(url: string, hash: string): boolean {
    const cached = this.rulesetCache[url];
    if (!cached || cached.hash !== hash) {
      return false;
    }
    return (
      cached.compiler.compileGeneration ===
      this.regLoader.getCompileGeneration()
    );
  }

  private setCachedRuleset(
    rs: CachedRuleset,
    contentUpdated?: boolean,
    oldHash?: string | null
  ) {
    this.rulesetCache[rs.url] = rs;
    if (this.onRulesetLoaded) {
      this.onRulesetLoaded(rs);
    }
    if (contentUpdated && this.onRulesetContentUpdated) {
      const crs = rs;
      const prevHash = oldHash ?? null;
      const notify = this.onRulesetContentUpdated;
      setImmediate(() => {
        void notify(crs, prevHash);
      });
    }
  }

  private async loadBase(url: string): Promise<CachedRuleset> {
    const cached = this.rulesetCache[url];
    if (cached && this.isCachedContentCurrent(url, cached.hash)) {
      return cached;
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

    const oldHash = this.rulesetCache[url]?.hash ?? null;

    if (this.isCachedContentCurrent(url, hash)) {
      return this.rulesetCache[url];
    }

    const { ruleset, compiler } = await this.regLoader.compileAndLoad(
      url,
      krl,
      hash
    );

    validateModuleDependencies(Object.values(this.rulesetCache), {
      url,
      rid: ruleset.rid,
      deps: getModuleUses(ruleset),
    });

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
    if (this.onBeforeRulesetContentUpdate) {
      this.onBeforeRulesetContentUpdate(url);
    }
    this.setCachedRuleset(toSave, true, oldHash);
    return toSave;
  }
}
