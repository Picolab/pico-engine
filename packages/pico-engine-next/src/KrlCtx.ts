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

export type Runtime = RuntimeGlobal | RuntimeEvent | RuntimeQuery;

interface RuntimeGlobal {
  type: "global";
}

interface RuntimeEvent {
  type: "event";
  event: PicoEvent;
  rule: string | null;
}

interface RuntimeQuery {
  type: "query";
  name: string;
  args: { [key: string]: any };
}

export interface KrlCtx {
  rsCtx: RulesetContext;

  startQuery(
    name: string,
    args: {
      [key: string]: any;
    }
  ): void;
  startEvent(event: PicoEvent): void;
  startRule(rule_name: string): void;
  getCurrentRuntime(): Runtime;

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
  let current: Runtime = { type: "global" };

  const log = environment.log.child({
    rid: rsCtx.ruleset.rid
    // TODO more
  });

  const ctx: KrlCtx = {
    rsCtx,

    startQuery(name: string, args: { [key: string]: any }) {
      current = Object.freeze({
        type: "query",
        name,
        args: _.cloneDeep(args)
      });
    },
    startEvent(event: PicoEvent) {
      current = Object.freeze({
        type: "event",
        event: _.cloneDeep(event),
        rule: null
      });
    },
    startRule(rule_name: string) {
      if (current.type === "event") {
        current = Object.freeze({
          type: "event",
          event: _.cloneDeep(current.event),
          rule: rule_name
        });
      }
    },
    getCurrentRuntime() {
      return current;
    },

    log,

    module(domain: string) {
      return environment.modules[domain] || null;
    }
  };
  return ctx;
}
