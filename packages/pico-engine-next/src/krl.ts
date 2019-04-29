import * as _ from "lodash";
import { PicoEvent, RulesetContext } from "pico-framework";
import * as SelectWhen from "select-when";

function krlNamedArgs(paramOrder: string[]) {
  return function(args: any) {
    const params: any[] = [];
    for (let i = 0; i < paramOrder.length; i++) {
      const paramName = paramOrder[i];
      params.push(_.has(args, paramName) ? args[paramName] : args[i]);
    }
    return params;
  };
}

export function wrapFunctionForKrl(
  paramOrder: string[],
  fn: (...args: any[]) => Promise<any>
) {
  const fixArgs = krlNamedArgs(paramOrder);
  const wrapped = function(ctx: KrlCtx, args: any) {
    return fn.apply(ctx, fixArgs(args));
  };
  wrapped.name = fn.name;
  return wrapped;
}

type Runtime = RuntimeGlobal | RuntimeEvent | RuntimeQuery;

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

type KrlLogLevels = "klog" | "debug" | "info" | "warn" | "error";

interface KrlCtx {
  SelectWhen: typeof SelectWhen;
  function: typeof wrapFunctionForKrl;

  startQuery(name: string, args: { [key: string]: any }): void;
  startEvent(event: PicoEvent): void;
  startRule(rule_name: string): void;
  getCurrentRuntime(): Runtime;

  log(level: KrlLogLevels, message: string): void;

  module(domain: string, name: string): any;
}

/**
 *
 * @param ctx
 *
 * NOTE: not using `class` so we can guarantee privacy.
 */
export function MakeCtx(
  rsCtx: RulesetContext,
  rsGlobals: RulesetGlobals
): KrlCtx {
  let current: Runtime = { type: "global" };

  const ctx: KrlCtx = {
    SelectWhen,
    function: wrapFunctionForKrl,

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
      // TODO use rsGlobals
    },

    module(domain: string, name: string) {
      // TODO lookup the module
      // TODO use rsGlobals
    }
  };
  return ctx;
}

export interface RulesetGlobals {
  // TODO module table
  // TODO logger
}
