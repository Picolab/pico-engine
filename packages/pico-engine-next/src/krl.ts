import * as _ from "lodash";
import { KrlCtx } from "./KrlCtx";

export interface KrlModule {
  [name: string]: (ctx: KrlCtx, args?: any) => any;
}

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
