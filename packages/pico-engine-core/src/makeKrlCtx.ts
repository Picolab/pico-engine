import {
  CurrentPicoEvent,
  CurrentPicoQuery,
  Directive,
  krl,
  KrlCtx,
  RuleOutcome,
} from "krl-stdlib";
import { RulesetContext } from "pico-framework";
import { PicoEngineCore } from "./PicoEngineCore";

/** Keep one entity value from dominating the log. */
const ENT_LOG_LIMIT = 2048;

function valueForEntLog(value: unknown): unknown {
  if (value === undefined) return null;
  let text: string;
  try {
    const encoded = JSON.stringify(value);
    if (typeof encoded !== "string") return null;
    text = encoded;
  } catch {
    return { _unloggable: true };
  }
  if (text.length <= ENT_LOG_LIMIT) return value;
  return {
    _truncated: true,
    bytes: text.length,
    preview: text.slice(0, ENT_LOG_LIMIT),
  };
}

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
  let ruleOutcomes: RuleOutcome[] = [];

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
      corePico.setActiveHostKrlCtx(
        picoId,
        rsCtx.ruleset.rid,
        event ? krlCtx : null
      );
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
      corePico.setActiveHostKrlCtx(
        picoId,
        rsCtx.ruleset.rid,
        query ? krlCtx : null
      );
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

    recordRuleOutcome(rule: string, fired: boolean) {
      ruleOutcomes.push({
        rid: rsCtx.ruleset.rid,
        rule,
        status: fired ? "fired" : "not_fired",
      });
    },
    drainRuleOutcomes() {
      const tmp = ruleOutcomes;
      ruleOutcomes = [];
      return tmp;
    },

    ///////////////////////////////////////////////////////////////////////////
    // compiler lib
    krl,

    compileEvalExpression: require("krl-compiler").compileEvalExpression,
  };

  const putEnt = rsCtx.putEnt.bind(rsCtx);
  const delEnt = rsCtx.delEnt.bind(rsCtx);
  rsCtx.putEnt = async (name, value) => {
    const before = await rsCtx.getEnt(name);
    await putEnt(name, value);
    const deleted = value === null || value === undefined;
    log.debug("ent write", {
      name,
      before: valueForEntLog(before),
      after: deleted ? null : valueForEntLog(value),
      deleted: deleted || undefined,
      rule_name: currentRuleName || undefined,
    });
  };
  rsCtx.delEnt = async (name) => {
    const before = await rsCtx.getEnt(name);
    await delEnt(name);
    log.debug("ent write", {
      name,
      before: valueForEntLog(before),
      after: null,
      deleted: true,
      rule_name: currentRuleName || undefined,
    });
  };

  return krlCtx;
}
