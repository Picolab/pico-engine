import * as _ from "lodash";
import { PicoEvent, RulesetContext } from "pico-framework";
import { KrlModule } from "./krl";

export interface RulesetEnvironment {
  // TODO logger

  modules: { [domain: string]: KrlModule };
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

  log(level: KrlLogLevels, message: string): void;
  module(domain: string, name: string): KrlModule | null;
}

export type KrlLogLevels = "klog" | "debug" | "info" | "warn" | "error";

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

    log(level: KrlLogLevels, message: string) {
      // TODO append to engine json log
      // TODO use environment.log
    },

    module(domain: string) {
      return environment.modules[domain] || null;
    }
  };
  return ctx;
}
