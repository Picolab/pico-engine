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

  let currentEvent: CurrentPicoEvent | null = null;
  let currentQuery: CurrentPicoQuery | null = null;

  let directives: Directive[] = [];

  const krlCtx: KrlCtx = {
    log,
    rsCtx,
    module(domain) {
      const module = environment.picoRidDependencies.getModule(picoId, domain);
      if (module) {
        return module;
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
      await environment.picoRidDependencies.use(
        environment,
        rsCtx,
        rid,
        alias,
        configure
      );
    },

    krl,
  };
  return krlCtx;
}
