import * as _ from "lodash";
import mkKrl, * as krl from "../krl";

function ltEqGt(left: any, right: any): 0 | 1 | -1 {
  let a: any = krl.toNumberOrNull(left);
  let b: any = krl.toNumberOrNull(right);
  if (a === null || b === null) {
    // fall back on string comparison
    a = krl.toString(left);
    b = krl.toString(right);
  }
  // at this point a and b are both numbers or both strings
  return a === b ? 0 : a > b ? 1 : -1;
}

const stdlib: krl.KrlModule = {
  /////////////////////////////////////////////////////////////////////////////
  // Infix operators
  "+": mkKrl.function(["left", "right"], function(left, right) {
    if (arguments.length < 2) {
      return left;
    }
    // if we have two "numbers" then do plus
    if (krl.isNumber(left) && krl.isNumber(right)) {
      return left + right;
    }
    // else do concat
    return krl.toString(left) + krl.toString(right);
  }),

  "-": mkKrl.function(["left", "right"], function(left, right) {
    const leftNumber = krl.toNumberOrNull(left);
    if (arguments.length < 2) {
      if (leftNumber === null) {
        throw new TypeError("Cannot negate " + krl.toString(left));
      }
      return -leftNumber;
    }
    const rightNumber = krl.toNumberOrNull(right);
    if (leftNumber === null || rightNumber === null) {
      throw new TypeError(
        krl.toString(right) + " cannot be subtracted from " + krl.toString(left)
      );
    }
    return leftNumber - rightNumber;
  }),

  "*": mkKrl.function(["left", "right"], function(left, right) {
    var leftNumber = krl.toNumberOrNull(left);
    var rightNumber = krl.toNumberOrNull(right);
    if (leftNumber === null || rightNumber === null) {
      throw new TypeError(
        krl.toString(left) + " cannot be multiplied by " + krl.toString(right)
      );
    }
    return leftNumber * rightNumber;
  }),

  "/": mkKrl.function(["left", "right"], function(left, right) {
    var leftNumber = krl.toNumberOrNull(left);
    var rightNumber = krl.toNumberOrNull(right);
    if (leftNumber === null || rightNumber === null) {
      throw new TypeError(
        krl.toString(left) + " cannot be divided by " + krl.toString(right)
      );
    }
    if (rightNumber === 0) {
      this.log.debug("[DIVISION BY ZERO] " + leftNumber + " / 0");
      return 0;
    }
    return leftNumber / rightNumber;
  }),

  "%": mkKrl.function(["left", "right"], function(left, right) {
    var leftNumber = krl.toNumberOrNull(left);
    var rightNumber = krl.toNumberOrNull(right);
    if (leftNumber === null || rightNumber === null) {
      throw new TypeError(
        "Cannot calculate " +
          krl.toString(left) +
          " modulo " +
          krl.toString(right)
      );
    }
    if (rightNumber === 0) {
      return 0;
    }
    return leftNumber % rightNumber;
  }),

  "==": mkKrl.function(["left", "right"], function(left, right) {
    return krl.isEqual(left, right);
  }),
  "!=": mkKrl.function(["left", "right"], function(left, right) {
    return !krl.isEqual(left, right);
  }),

  "<=>": mkKrl.function(["left", "right"], function(left, right) {
    return ltEqGt(left, right);
  }),
  "<": mkKrl.function(["left", "right"], function(left, right) {
    return ltEqGt(left, right) < 0;
  }),
  ">": mkKrl.function(["left", "right"], function(left, right) {
    return ltEqGt(left, right) > 0;
  }),
  "<=": mkKrl.function(["left", "right"], function(left, right) {
    return ltEqGt(left, right) <= 0;
  }),
  ">=": mkKrl.function(["left", "right"], function(left, right) {
    return ltEqGt(left, right) >= 0;
  }),

  "><": mkKrl.function(["left", "right"], function(left, right): boolean {
    if (krl.isArray(left)) {
      return _.findIndex(left, _.partial(krl.isEqual, right)) >= 0;
    } else if (krl.isMap(left)) {
      return _.has(left, right);
    }
    throw new TypeError(">< only works with Array or Map");
  }),

  like: mkKrl.function(["val", "regex"], function(val, regex): boolean {
    if (!krl.isRegExp(regex)) {
      regex = new RegExp(krl.toString(regex));
    }
    return regex.test(krl.toString(val));
  }),

  cmp: mkKrl.function(["left", "right"], function(left, right): -1 | 0 | 1 {
    left = krl.toString(left);
    right = krl.toString(right);
    return left === right ? 0 : left > right ? 1 : -1;
  }),

  /////////////////////////////////////////////////////////////////////////////

  as: mkKrl.function(["val", "type"], function(val, type) {
    if (arguments.length < 2) {
      return val;
    }
    var valType = krl.typeOf(val);
    if (valType === type) {
      return val;
    }
    if (type === "Boolean") {
      if (val === "false") {
        return false;
      }
      if (valType === "Number") {
        return val !== 0;
      }
      return !!val;
    }
    if (type === "String") {
      return krl.toString(val);
    }
    if (type === "Number") {
      return krl.toNumberOrNull(val);
    }
    if (type === "RegExp") {
      var regexSrc = krl.toString(val);
      if (valType !== "String" && /^\[[a-z]+\]$/i.test(regexSrc)) {
        regexSrc = regexSrc.replace(/^\[/, "\\[").replace(/\]$/, "\\]");
      }
      return new RegExp(regexSrc);
    }
    throw new TypeError(
      'Cannot use the .as("' +
        type +
        '") operator with ' +
        krl.toString(val) +
        " (type " +
        valType +
        ")"
    );
  }),

  isnull: mkKrl.function(["val"], function(val) {
    return krl.isNull(val);
  }),
  typeof: mkKrl.function(["val"], function(val) {
    return krl.typeOf(val);
  }),

  get: mkKrl.function(["obj", "path"], function(obj, path) {
    return _.get(obj, path, null);
  })
};

export default stdlib;
