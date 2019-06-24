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

  get: mkKrl.function(["obj", "path"], function(obj, path) {
    return _.get(obj, path, null);
  })
};

export default stdlib;
