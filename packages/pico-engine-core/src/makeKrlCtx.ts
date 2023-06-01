import {
  CurrentPicoEvent,
  CurrentPicoQuery,
  Directive,
  krl,
  KrlCtx,
} from "krl-stdlib";
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
  let currentRuleName: string | null = null;

  let directives: Directive[] = [];

  const krlCtx: KrlCtx = {
    rsCtx, // the basic pico+ruleset context from pico-framework

    ///////////////////////////////////////////////////////////////////////////
    // logging
    log,
    getPicoLogs() {
      return core.getPicoLogs(picoId);
    },

    ///////////////////////////////////////////////////////////////////////////
    // current event/query
    getEvent() {
      return currentEvent;
    },
    setEvent(event) {
      krlCtx.log = log = core.log.child(
        event ? { ...logCtxBase, txnId: event.eid } : logCtxBase
      );
      currentEvent = event;
    },
    getCurrentRuleName() {
      return currentRuleName;
    },
    setCurrentRuleName(ruleName) {
      currentRuleName = ruleName;
    },
    getQuery() {
      return currentQuery;
    },
    setQuery(query) {
      krlCtx.log = log = core.log.child(
        query ? { ...logCtxBase, txnId: query.qid } : logCtxBase
      );
      currentQuery = query;
    },

    ///////////////////////////////////////////////////////////////////////////
    // modules
    module(domain) {
      return corePico.getModule(rsCtx.ruleset.rid, domain);
    },
    configure(name, dflt) {
      return corePico.configure(rsCtx, name, dflt);
    },
    async useModule(rid, alias, configure) {
      await corePico.use(krlCtx, rid, alias, configure);
    },

    ///////////////////////////////////////////////////////////////////////////
    // directives
    addDirective(name, options) {
      const directive: Directive = {
        type: "directive",
        name,
        options: options || {},
        meta: {
          rid: rsCtx.ruleset.rid,
          rule_name: currentRuleName,
          txnId: currentEvent?.eid || null,
        },
      };
      directives.push(directive);
      return directive;
    },
    drainDirectives() {
      const tmp = directives;
      directives = [];
      return tmp;
    },

    ///////////////////////////////////////////////////////////////////////////
    // compiler lib
    krl,
  };
  return krlCtx;
}
