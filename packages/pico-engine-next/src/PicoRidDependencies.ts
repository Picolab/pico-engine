import { krl } from "krl-stdlib";
import { Pico } from "pico-framework/dist/src/Pico";
import {
  createRulesetContext,
  RulesetContext,
} from "pico-framework/dist/src/RulesetContext";
import { KrlCtxMakerConfig, makeKrlCtx } from "./makeKrlCtx";

export class RulesetDependencies {
  dependencies: {
    [rid: string]: {
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
  } = {};

  constructor(private environment: KrlCtxMakerConfig) {}

  async use(
    rsCtx: RulesetContext,
    usesRid: string,
    alias?: string | null,
    configure?: {
      [name: string]: any;
    }
  ) {
    const picoId = rsCtx.pico().id;
    let pfPico: Pico;
    const picoFramework = this.environment.picoFramework;
    if (!picoFramework) {
      throw new Error("PicoFramework not yet setup");
    }
    try {
      pfPico = picoFramework.getPico(picoId);
    } catch (err) {
      throw new Error("PicoFramework not yet setup");
    }
    const ruleset = this.environment.rsRegistry.getCached(
      pfPico.rulesets[usesRid]?.config?.url || ""
    );
    if (!ruleset) {
      throw new Error(`Module not found: ${usesRid}`);
    }
    const rsI = await ruleset.ruleset.init(
      createRulesetContext(picoFramework, pfPico, {
        rid: ruleset.rid,
        config: {
          ...rsCtx.ruleset.config,
          _krl_module_config: configure,
        },
      }),
      (rsCtx2: RulesetContext) => makeKrlCtx(this.environment, rsCtx2)
    );
    const module: krl.Module = (rsI as any).provides || {};
    if (!alias) {
      alias = usesRid;
    }

    if (!this.dependencies[rsCtx.ruleset.rid]) {
      this.dependencies[rsCtx.ruleset.rid] = {};
    }
    if (!this.dependencies[rsCtx.ruleset.rid][usesRid]) {
      this.dependencies[rsCtx.ruleset.rid][usesRid] = {};
    }
    this.dependencies[rsCtx.ruleset.rid][usesRid][alias] = {
      configure,
      url: ruleset.url,
      hash: ruleset.hash,
      module,
    };
  }

  getModule(alias: string): krl.Module | null {
    for (const userRid of Object.keys(this.dependencies)) {
      for (const rm of Object.values(this.dependencies[userRid])) {
        if (rm[alias]) {
          return rm[alias].module;
        }
      }
    }
    return null;
  }

  whoUses(rid: string): string[] {
    const userRids: string[] = [];
    for (const userRid of Object.keys(this.dependencies)) {
      if (this.dependencies[userRid][rid]) {
        userRids.push(userRid);
      }
    }
    return userRids;
  }

  unUse(rid: string) {
    delete this.dependencies[rid];
  }
}

export class PicoRidDependencies {
  private picos: { [picoId: string]: RulesetDependencies } = {};

  async use(
    environment: KrlCtxMakerConfig,
    rsCtx: RulesetContext,
    rid: string,
    alias?: string | null,
    configure?: {
      [name: string]: any;
    }
  ) {
    const picoId = rsCtx.pico().id;
    if (!this.picos[picoId]) {
      this.picos[picoId] = new RulesetDependencies(environment);
    }
    await this.picos[picoId].use(rsCtx, rid, alias, configure);
  }

  getModule(picoId: string, alias: string): krl.Module | null {
    if (this.picos[picoId]) {
      return this.picos[picoId].getModule(alias);
    }
    return null;
  }

  whoUses(picoId: string, rid: string): string[] {
    return this.picos[picoId]?.whoUses(rid) || [];
  }

  unUse(picoId: string, rid: string) {
    if (this.picos[picoId]) {
      this.picos[picoId].unUse(rid);
    }
  }
}
