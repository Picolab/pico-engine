import * as cuid from "cuid";
import { krl } from "krl-stdlib";
import * as _ from "lodash";

const randomWords = require("random-words");

var fixLowerUpperArgs = function (
  upper: any,
  lower: any,
  round: boolean = false
) {
  var lowerNum = krl.toNumberOrNull(lower);
  if (round && lowerNum !== null) {
    lowerNum = _.round(lowerNum);
  }

  var upperNum = krl.toNumberOrNull(upper);
  if (round && upperNum !== null) {
    upperNum = _.round(upperNum);
  }

  var upper;

  if (upperNum === null) {
    upper = lowerNum === null ? 1 : 0;
  } else {
    upper = upperNum;
  }

  return {
    lower: lowerNum === null ? 0 : lowerNum,
    upper: upper,
  };
};

const random: krl.Module = {
  uuid: krl.Function([], function () {
    return cuid();
  }),

  word: krl.Function([], function () {
    return randomWords();
  }),

  integer: krl.Function(["upper", "lower"], function (upper, lower) {
    var args = fixLowerUpperArgs(upper, lower, true);

    return _.random(args.lower, args.upper);
  }),

  number: krl.Function(["upper", "lower"], function (upper, lower) {
    var args = fixLowerUpperArgs(upper, lower);

    return _.random(args.lower, args.upper, true);
  }),
};

export default random;
