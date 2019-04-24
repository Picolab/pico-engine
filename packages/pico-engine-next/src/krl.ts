import { SelectWhen, e } from "select-when";
import * as _ from "lodash";
const krlStdlib = require("krl-stdlib");

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

export const $krl = {
  stdlib(fName: string, args: any[]) {
    return krlStdlib[fName].apply(
      null,
      [
        {
          emit: function() {
            console.log("TODO emit");
          }
        }
      ].concat(args)
    );
  },
  function(paramOrder: string[], fn: (...args: any[]) => Promise<any>) {
    const fixArgs = krlNamedArgs(paramOrder);
    return function(args: any) {
      return fn.apply(null, fixArgs(args));
    };
  },
  log: {
    debug(...args: any[]) {
      console.debug("TODO logging:", ...args);
    }
  },
  // TODO action
  // TODO postlude
  // TODO built-in modules

  SelectWhen: SelectWhen,
  e: e
};
