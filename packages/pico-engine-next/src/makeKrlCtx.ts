import {
  CurrentPicoEvent,
  CurrentPicoQuery,
  Directive,
  krl,
  KrlCtx,
} from "krl-stdlib";
import * as _ from "lodash";
import { RulesetContext } from "pico-framework";
import { PicoEngineCore } from "./PicoEngineCore";

export function makeKrlCtx(
  core: PicoEngineCore,
  rsCtx: RulesetContext
): KrlCtx {
  const pico = rsCtx.pico();
  const picoId = pico.id;
  const logCtxBase = { picoId, rid: rsCtx.ruleset.rid };
  let log = core.log.child(logCtxBase);

  let corePico = core.addPico(picoId);

  let currentEvent: CurrentPicoEvent | null = null;
  let currentQuery: CurrentPicoQuery | null = null;

  let directives: Directive[] = [];

  const krlCtx: KrlCtx = {
    log,
    rsCtx,
    module(domain) {
      const module = corePico.getModule(rsCtx.ruleset.rid, domain);
      if (module) {
        return module;
      }
      return core.modules[domain] || null;
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
      return core.getPicoLogs(picoId);
    },

    configure(name, dflt) {
      const config = rsCtx.ruleset.config;
      if (_.has(config, ["_krl_module_config", name])) {
        return config._krl_module_config[name];
      }
      return dflt;
    },

    async useModule(rid, alias, configure) {
      await corePico.use(krlCtx, rid, alias, configure);
    },

    krl,
  };
  return krlCtx;
}
