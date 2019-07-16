import { RulesetContext, PicoEvent } from "pico-framework";
import * as SelectWhen from "select-when";
import * as krl from "./krl";
import { KrlLogger } from "./KrlLogger";
import * as modules from "./modules";

export interface CurrentPicoEvent extends PicoEvent {
  eid: string;
}

export class RulesetEnvironment {
  krl = krl;

  SelectWhen = SelectWhen;

  modules: { [domain: string]: krl.Module } = modules;

  constructor(public log: KrlLogger) {}

  mkCtx(rsCtx: RulesetContext): KrlCtx {
    const log = this.log.child({
      picoId: rsCtx.pico().id,
      rid: rsCtx.ruleset.rid
    });

    const environment = this;

    let currentEvent: CurrentPicoEvent | null = null;

    return {
      rsCtx,
      log,
      module(domain: string) {
        return environment.modules[domain] || null;
      },
      getEvent() {
        return currentEvent;
      },
      setEvent(event: CurrentPicoEvent | null) {
        currentEvent = event;
      }
    };
  }
}

export interface KrlCtx {
  rsCtx: RulesetContext;
  log: KrlLogger;
  module(domain: string): krl.Module | null;
  getEvent(): CurrentPicoEvent | null;
  setEvent(event: CurrentPicoEvent | null): void;
}
