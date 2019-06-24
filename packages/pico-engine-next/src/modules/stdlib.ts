import * as _ from "lodash";
import mkKrl, * as krl from "../krl";

const stdlib: krl.KrlModule = {
  "+": mkKrl.function(["left", "right"], function(left: any, right: any) {
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

  get: mkKrl.function(["obj", "path"], function(obj, path) {
    return _.get(obj, path, null);
  })
};

export default stdlib;
