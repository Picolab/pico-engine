import { RulesetContext } from "pico-framework";
import * as SelectWhen from "select-when";
import krl, { KrlModule } from "./krl";
import { KrlLogger } from "./KrlLogger";
import * as modules from "./modules";

export class RulesetEnvironment {
  krl = krl;

  SelectWhen = SelectWhen;

  modules: { [domain: string]: KrlModule } = modules;

  constructor(public log: KrlLogger) {}

  mkCtx(rsCtx: RulesetContext): KrlCtx {
    const log = this.log.child({
      picoId: rsCtx.pico().id,
      rid: rsCtx.ruleset.rid
    });

    const environment = this;

    return {
      rsCtx,
      log,
      module(domain: string) {
        return environment.modules[domain] || null;
      }
    };
  }
}

export interface KrlCtx {
  rsCtx: RulesetContext;
  log: KrlLogger;
  module(domain: string): KrlModule | null;
}
