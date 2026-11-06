import { krl, KrlCtx } from "krl-stdlib";
import { RulesetContext } from "pico-framework";
import { PicoEngineCore } from "./PicoEngineCore";

export function makeKrlCtxKrlModule(
  core: PicoEngineCore,
  host: KrlCtx,
  rsCtx: RulesetContext
): KrlCtx {
  const pico = rsCtx.pico();
  const picoId = pico.id;

  let corePico = core.addPico(picoId);
  const hostUserRid = host.rsCtx.ruleset.rid;

  function activeHost(): KrlCtx {
    return corePico.getActiveHostKrlCtx(picoId, hostUserRid) || host;
  }

  const krlCtx: KrlCtx = {
    rsCtx, // the basic pico+ruleset context from pico-framework

    ///////////////////////////////////////////////////////////////////////////
    // logging
    get log() {
      return host.log.child({ rid: rsCtx.ruleset.rid });
    },
    getPicoLogs() {
      return host.getPicoLogs();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Module code runs in the module ruleset ctx; meta:eci / meta:rid for the
    // host app still come from the host's active query or event.
    getEvent() {
      return activeHost().getEvent();
    },
    setEvent(event) {},
    getCurrentRuleName() {
      return activeHost().getCurrentRuleName();
    },
    setCurrentRuleName(ruleName) {},
    getQuery() {
      return activeHost().getQuery();
    },
    setQuery(query) {},

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
      // if the module provides a defaction that uses send_directive, append to the host's directives
      return host.addDirective(name, options);
    },
    drainDirectives: () => [], // not used since krl modules are not installed
    recordRuleOutcome(rule, fired) {
      host.recordRuleOutcome(rule, fired);
    },
    drainRuleOutcomes: () => [],

    ///////////////////////////////////////////////////////////////////////////
    // compiler lib
    krl,
  };
  return krlCtx;
}
