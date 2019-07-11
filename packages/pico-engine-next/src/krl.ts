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
  property: krlProperty,

  /**
   * used by `foreach` in krl
   * Array's use index numbers, maps use key strings
   */
  toPairs: function toPairs(v: any) {
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
};

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
  return mapFn(val, function(v: any) {
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
    function(k, v) {
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
