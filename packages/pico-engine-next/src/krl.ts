import * as _ from "lodash";
import { KrlCtx } from "./KrlCtx";

export interface KrlModule {
  [name: string]: (ctx: KrlCtx, args?: any) => any;
}

function krlNamedArgs(paramOrder: string[]) {
  return function(args: any) {
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
        }
      }
    }
    return params;
  };
}

function krlFunctionMaker(krlTypeName: string) {
  return function(
    paramOrder: string[],
    fn: (this: KrlCtx, ...args: any[]) => any
  ) {
    const fixArgs = krlNamedArgs(paramOrder);
    const wrapped = function(ctx: KrlCtx, args: any) {
      return fn.apply(ctx, fixArgs(args));
    };

    // add this for the compiler to know the type
    (wrapped as any)["$krl_" + krlTypeName] = true;

    return wrapped;
  };
}

function krlProperty(fn: (this: KrlCtx) => any) {
  const wrapped = function(ctx: KrlCtx) {
    return fn.apply(ctx);
  };

  // add this for the compiler to know the type
  (wrapped as any)["$krl_property"] = true;

  return wrapped;
}

export default {
  function: krlFunctionMaker("function"),
  action: krlFunctionMaker("action"),
  postlude: krlFunctionMaker("postlude"),
  property: krlProperty
};

export function isNull(val: any): boolean {
  return val === null || val === void 0;
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

export function isAction(val: any): boolean {
  return _.isFunction(val) && (val as any)["$krl_action"] === true;
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
  } else if (isFunction(val)) {
    return "Function";
  } else if (isAction(val)) {
    return "Action";
  } else if (isMap(val)) {
    return "Map";
  }
  return "JSObject";
}

export function toString(val: any) {
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
