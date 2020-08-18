import { krl, KrlCtx } from "krl-stdlib";
import * as _ from "lodash";
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
    // current event/query is not applicable for krl modules
    getEvent: () => null,
    setEvent(event) {},
    getQuery: () => null,
    setQuery(query) {},

    ///////////////////////////////////////////////////////////////////////////
    // modules
    module(domain) {
      return corePico.getModule(rsCtx.ruleset.rid, domain);
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

    ///////////////////////////////////////////////////////////////////////////
    // directives
    addDirective(name, options) {
      return host.addDirective(name, options);
    },
    drainDirectives: () => [], // not used since krl modules are not installed

    ///////////////////////////////////////////////////////////////////////////
    // compiler lib
    krl,
  };
  return krlCtx;
}
