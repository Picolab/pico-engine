import * as _ from "lodash";
import { PicoEvent, RulesetContext } from "pico-framework";
import * as SelectWhen from "select-when";
import krl, { KrlModule } from "./krl";
import * as modules from "./modules";
import { KrlLogger } from "./KrlLogger";

export class RulesetEnvironment {
  // TODO logger

  krl = krl;

  SelectWhen = SelectWhen;

  modules: { [domain: string]: KrlModule } = modules;

  constructor(public log: KrlLogger) {}

  mkCtx(rsCtx: RulesetContext) {
    return MakeCtx(rsCtx, this);
  }
}

export interface KrlCtx {
  rsCtx: RulesetContext;
  log: KrlLogger;
  module(domain: string): KrlModule | null;
}

/**
 *
 * @param ctx
 *
 * NOTE: not using `class` so we can guarantee privacy.
 */
export function MakeCtx(
  rsCtx: RulesetContext,
  environment: RulesetEnvironment
): KrlCtx {
  const log = environment.log.child({
    picoId: rsCtx.pico().id,
    rid: rsCtx.ruleset.rid
    // TODO more
  });

  return {
    rsCtx,
    log,
    module(domain: string) {
      return environment.modules[domain] || null;
    }
  };
}
