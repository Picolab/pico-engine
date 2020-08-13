import {
  CurrentPicoEvent,
  CurrentPicoQuery,
  Directive,
  krl,
  KrlCtx,
  KrlLogger,
  PicoLogEntry,
} from "krl-stdlib";
import * as _ from "lodash";
import { PicoFramework, RulesetContext } from "pico-framework";
import { Pico } from "pico-framework/dist/src/Pico";
import { createRulesetContext } from "pico-framework/dist/src/RulesetContext";
import { PicoRidDependencies } from "./PicoRidDependencies";
import { RulesetRegistry } from "./RulesetRegistry";

export interface KrlCtxMakerConfig {
  log: KrlLogger;
  rsRegistry: RulesetRegistry;
  getPicoLogs: (picoId: string) => Promise<PicoLogEntry[]>;
  modules: { [domain: string]: krl.Module };
  picoRidDependencies: PicoRidDependencies;
  picoFramework?: PicoFramework;
}

export function makeKrlCtx(
  environment: KrlCtxMakerConfig,
  rsCtx: RulesetContext
): KrlCtx {
  const pico = rsCtx.pico();
  const picoId = pico.id;
  const logCtxBase = { picoId, rid: rsCtx.ruleset.rid };
  let log = environment.log.child(logCtxBase);

  const rsRegistry = environment.rsRegistry;

  let currentEvent: CurrentPicoEvent | null = null;
  let currentQuery: CurrentPicoQuery | null = null;

  let directives: Directive[] = [];

  const myModules: { [domain: string]: krl.Module } = {};

  const krlCtx: KrlCtx = {
    log,
    rsCtx,
    module(domain) {
      if (myModules[domain]) {
        return myModules[domain];
      }
      return environment.modules[domain] || null;
    },
    getEvent() {
      return currentEvent;
    },
    setEvent(event) {
      krlCtx.log = log = this.log.child(
        event ? { ...logCtxBase, txnId: event.eid } : logCtxBase
      );
      currentEvent = event;
    },
    getQuery() {
      return currentQuery;
    },
    setQuery(query) {
      krlCtx.log = log = this.log.child(
        query ? { ...logCtxBase, txnId: query.qid } : logCtxBase
      );
      currentQuery = query;
    },
    addDirective(name, options) {
      const directive: Directive = { name, options: options || {} };
      directives.push(directive);
      return directive;
    },
    drainDirectives() {
      const tmp = directives;
      directives = [];
      return tmp;
    },

    getPicoLogs() {
      return environment.getPicoLogs(picoId);
    },

    configure(name, dflt) {
      const config = rsCtx.ruleset.config;
      if (_.has(config, ["_krl_module_config", name])) {
        return config._krl_module_config[name];
      }
      return dflt;
    },

    async useModule(rid, alias, configure) {
      let pfPico: Pico;
      const picoFramework = environment.picoFramework;
      if (!picoFramework) {
        throw new Error("PicoFramework not yet setup");
      }
      try {
        pfPico = picoFramework.getPico(picoId);
      } catch (err) {
        throw new Error("PicoFramework not yet setup");
      }
      const ruleset = rsRegistry.getCached(
        pfPico.rulesets[rid]?.config?.url || ""
      );
      if (!ruleset) {
        throw new Error(`Module not found: ${rid}`);
      }
      const rsI = await ruleset.ruleset.init(
        createRulesetContext(picoFramework, pfPico, {
          rid: ruleset.rid,
          config: {
            ...rsCtx.ruleset.config,
            _krl_module_config: configure,
          },
        }),
        (rsCtx2: RulesetContext) => makeKrlCtx(environment, rsCtx2)
      );
      const module: krl.Module = (rsI as any).provides || {};
      if (!alias) {
        alias = rid;
      }
      myModules[alias] = module;
      environment.picoRidDependencies.use(pico.id, rsCtx.ruleset.rid, rid);
    },

    krl,
  };
  return krlCtx;
}
