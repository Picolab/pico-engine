/**
 * This krl module is all the core utilities for working with the KRL language at runtime
 */

import * as _ from "lodash";
import * as SelectWhenModule from "select-when";
import { aggregateEvent as aggregateEventFn } from "./aggregateEvent";
import { KrlCtx } from "./KrlCtx";

export const SelectWhen = SelectWhenModule; // exposed for the krl-compiler

export const aggregateEvent = aggregateEventFn; // exposed for the krl-compiler

export interface Module {
  [name: string]: (ctx: KrlCtx, args?: any) => any;
}

function krlNamedArgs(paramOrder: string[]) {
  return function (args: any) {
    const params: any[] = [];
    if (_.isArray(args)) {
      for (let i = 0; i < Math.min(paramOrder.length, args.length); i++) {
        params.push(args[i]);
      }
    } else {
      for (let i = 0; i < paramOrder.length; i++) {
        const paramName = paramOrder[i];
        if (_.has(args, paramName)) {
          while (params.length < i) {
            params.push(void 0);
          }
          params.push(args[paramName]);
        } else if (_.has(args, i)) {
          while (params.length < i) {
            params.push(void 0);
          }
          params.push(args[i]);
        }
      }
    }
    return params;
  };
}

function krlFunctionMaker(krlTypeName: string) {
  return function (
    paramOrder: string[],
    fn: (this: KrlCtx, ...args: any[]) => any
  ) {
    const fixArgs = krlNamedArgs(paramOrder);
    const wrapped = function (ctx: KrlCtx, args: any) {
      return fn.apply(ctx, fixArgs(args));
    };

    // add this for the compiler to know the type
    (wrapped as any)["$krl_" + krlTypeName] = true;

    return wrapped;
  };
}

export const Function = krlFunctionMaker("function");
export const Action = krlFunctionMaker("action");
export const Postlude = krlFunctionMaker("postlude");

export function ActionFunction(
  paramOrder: string[],
  fn: (this: KrlCtx, ...args: any[]) => any
) {
  const act = Action(paramOrder, fn);
  (act as any)["$krl_function"] = true;
  return act;
}

export function Property(fn: (this: KrlCtx) => any) {
  const wrapped = function (ctx: KrlCtx) {
    return fn.apply(ctx);
  };

  // add this for the compiler to know the type
  (wrapped as any)["$krl_property"] = true;

  return wrapped;
}

/**
 * used by `foreach` in krl
 * Array's use index numbers, maps use key strings
 */
export function toPairs(v: any) {
  if (isArray(v)) {
    var pairs = [];
    var i;
    for (i = 0; i < v.length; i++) {
      pairs.push([i, v[i]]);
    }
    return pairs;
  }
  return _.toPairs(v);
}

export function isNull(val: any): boolean {
  return val === null || val === void 0 || _.isNaN(val);
}

export function isNumber(val: any): boolean {
  return _.isFinite(val);
}

export function isString(val: any): boolean {
  return typeof val === "string";
}

export function isBoolean(val: any): boolean {
  return val === true || val === false;
}

export function isRegExp(val: any): boolean {
  return _.isRegExp(val);
}

export function isArray(val: any): boolean {
  return _.isArray(val);
}

export function isMap(val: any): boolean {
  // Can't use _.isPlainObject b/c it's to restrictive on what is a "plain" object
  // especially when accepting values from other libraries outside of KRL
  return isArrayOrMap(val) && !_.isArray(val);
}

export function isArrayOrMap(val: any): boolean {
  return (
    _.isObject(val) &&
    !_.isFunction(val) &&
    !_.isRegExp(val) &&
    !_.isString(val) &&
    !_.isNumber(val)
  );
}

export function isFunction(val: any): boolean {
  return _.isFunction(val) && (val as any)["$krl_function"] === true;
}

export function assertFunction(val: any) {
  if (isFunction(val)) {
    return val;
  }
  throw new TypeError(toString(val) + " is not a function");
}

export function isAction(val: any): boolean {
  return _.isFunction(val) && (val as any)["$krl_action"] === true;
}

export function assertAction(val: any) {
  if (isAction(val)) {
    return val;
  }
  throw new TypeError(toString(val) + " is not an action");
}

export function isPostlude(val: any): boolean {
  return _.isFunction(val) && (val as any)["$krl_postlude"] === true;
}

export function typeOf(val: any): string {
  if (isNull(val)) {
    return "Null";
  } else if (isBoolean(val)) {
    return "Boolean";
  } else if (isString(val)) {
    return "String";
  } else if (isNumber(val)) {
    return "Number";
  } else if (isRegExp(val)) {
    return "RegExp";
  } else if (isArray(val)) {
    return "Array";
  } else if (isAction(val) && isFunction(val)) {
    return "ActionFunction";
  } else if (isFunction(val)) {
    return "Function";
  } else if (isAction(val)) {
    return "Action";
  } else if (isMap(val)) {
    return "Map";
  }
  return "JSObject";
}

export function toString(val: any): string {
  var valType = typeOf(val);
  switch (typeOf(val)) {
    case "String":
      return val;
    case "Null":
      return "null";
    case "Boolean":
      return val ? "true" : "false";
    case "Number":
      return val + "";
    case "RegExp":
      // NOTE: val.flags doesn't work on old versions of JS
      var flags = "";
      if (val.global) {
        flags += "g";
      }
      if (val.ignoreCase) {
        flags += "i";
      }
      return "re#" + val.source + "#" + flags;
  }
  return "[" + valType + "]";
}

export function toNumberOrNull(val: any): number | null {
  switch (typeOf(val)) {
    case "Null":
      return 0;
    case "Boolean":
      return val ? 1 : 0;
    case "String":
      var n = _.toNumber(val);
      return isNumber(n) ? n : null;
    case "Number":
      return val;
    case "Array":
    case "Map":
      return _.size(val);
    case "RegExp":
    case "Function":
    case "Action":
  }
  return null;
}

export function isEqual(left: any, right: any): boolean {
  left = cleanNulls(left);
  right = cleanNulls(right);
  return _.isEqual(left, right);
}

// returns a clone of val with void 0 and NaN values converted to null
export function cleanNulls(val: any) {
  if (isNull(val)) {
    return null;
  }
  if (isArray(val)) {
    return deepClean(val, _.map);
  }
  if (isMap(val)) {
    return deepClean(val, _.mapValues);
  }
  return val;
}

function deepClean(val: any, mapFn: any) {
  return mapFn(val, function (v: any) {
    return cleanNulls(v);
  });
}

export function decode(val: any) {
  if (!isString(val)) {
    return val;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}

export function encode(val: any, indent?: any) {
  indent = _.parseInt(indent, 10) || 0; // default to 0 (no indent)
  return JSON.stringify(
    val,
    function (k, v) {
      switch (typeOf(v)) {
        case "Null":
          return null;
        case "JSObject":
        case "RegExp":
        case "Function":
        case "Action":
          return toString(v);
      }
      return v;
    },
    indent
  );
}
