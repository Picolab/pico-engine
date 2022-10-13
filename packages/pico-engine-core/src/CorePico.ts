import { krl, KrlCtx } from "krl-stdlib";
import * as _ from "lodash";
import { createRulesetContext, Pico, RulesetContext } from "pico-framework";
import { makeKrlCtxKrlModule } from "./makeKrlCtxKrlModule";
import { PicoEngineCore } from "./PicoEngineCore";
import { CachedRuleset } from "./RulesetRegistry";

export class CorePico {
  dependencies: {
    [rid: string]: {
      krlCtx: KrlCtx;
      uses: {
        [usesRid: string]: {
          [alias: string]: {
            configure?: {
              [name: string]: any;
            };

            url: string;
            hash: string;
            module: krl.Module;
          };
        };
      };
    };
  } = {};

  constructor(private core: PicoEngineCore) {}

  async use(
    krlCtx: KrlCtx,
    usesRid: string,
    alias?: string | null,
    configure?: {
      [name: string]: any;
    }
  ) {
    const rsCtx = krlCtx.rsCtx;
    const picoId = rsCtx.pico().id;
    let pfPico: Pico;
    try {
      pfPico = this.core.picoFramework.getPico(picoId);
    } catch (err) {
      throw new Error("PicoFramework not yet setup");
    }
    const usesRidConfig = pfPico.rulesets[usesRid]?.config || {};
    const ruleset = this.core.rsRegistry.getCached(usesRidConfig.url || "");
    if (!ruleset) {
      throw new Error(`Module not found: ${usesRid}`);
    }

    const rsI = await ruleset.ruleset.init(
      createRulesetContext(this.core.picoFramework, pfPico, {
        rid: ruleset.rid,
        config: {
          ...usesRidConfig,
          _krl_module_config: configure,
        },
      }),
      (rsCtx2: RulesetContext) => makeKrlCtxKrlModule(this.core, krlCtx, rsCtx2)
    );
    const module: krl.Module = (rsI as any).provides || {};
    if (!alias) {
      alias = usesRid;
    }

    if (!this.dependencies[rsCtx.ruleset.rid]) {
      this.dependencies[rsCtx.ruleset.rid] = {
        krlCtx,
        uses: {},
      };
    }
    if (!this.dependencies[rsCtx.ruleset.rid].uses[usesRid]) {
      this.dependencies[rsCtx.ruleset.rid].uses[usesRid] = {};
    }
    this.dependencies[rsCtx.ruleset.rid].uses[usesRid][alias] = {
      configure,
      url: ruleset.url,
      hash: ruleset.hash,
      module,
    };
  }

  configure(rsCtx: RulesetContext, name: string, dflt: any): any {
    const config = rsCtx.ruleset.config;
    if (_.has(config, ["_krl_module_config", name])) {
      return config._krl_module_config[name];
    }
    return dflt;
  }

  getModule(userRid: string, domain: string): krl.Module | null {
    if (this.dependencies[userRid]) {
      for (const rm of Object.values(this.dependencies[userRid].uses)) {
        if (rm[domain]) {
          return rm[domain].module;
        }
      }
    }
    return this.core.modules[domain] || null;
  }

  whoUses(rid: string): string[] {
    const userRids: string[] = [];
    for (const userRid of Object.keys(this.dependencies)) {
      if (this.dependencies[userRid].uses[rid]) {
        userRids.push(userRid);
      }
    }
    return userRids;
  }

  unUse(rid: string) {
    delete this.dependencies[rid];
  }

  onRulesetLoaded(crs: CachedRuleset) {
    const rid = crs.ruleset.rid;
    for (const userRid of Object.keys(this.dependencies)) {
      const { uses, krlCtx } = this.dependencies[userRid];
      if (uses[rid]) {
        for (const alias of Object.keys(uses[rid])) {
          const rsm = uses[rid][alias];
          if (rsm.url === crs.url && rsm.hash !== crs.hash) {
            this.use(krlCtx, rid, alias, rsm.configure).catch((error) => {
              krlCtx.log.error("Failed to update dependent ruleset", {
                userRid,
                url: crs.url,
                hash: crs.hash,
                error,
              });
            });
          }
        }
      }
    }
  }
}
