import * as _ from "lodash";
import { PicoEvent, RulesetContext } from "pico-framework";
import * as SelectWhen from "select-when";
import * as krl from "./krl";
import { KrlLogger } from "./KrlLogger";
import * as modules from "./modules";

export interface CurrentPicoEvent extends PicoEvent {
  eid: string;
}

export interface Directive {
  name: string;
  options: { [name: string]: any };
}

export function cleanDirectives(responses: any[]): Directive[] {
  return _.compact(_.flattenDeep(responses));
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

    let directives: Directive[] = [];

    return {
      rsCtx,
      log,
      module(domain) {
        return environment.modules[domain] || null;
      },
      getEvent() {
        return currentEvent;
      },
      setEvent(event) {
        currentEvent = event;
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
  addDirective(name: string, options: { [name: string]: any }): Directive;
  drainDirectives(): Directive[];
}
